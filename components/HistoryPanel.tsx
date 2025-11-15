

import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { SavedReport, ReportStatus, TrendInsight } from '../types';
import OccurrenceChart from './OccurrenceChart';
import SeverityDonutChart from './SeverityDonutChart';
import Accordion from './Accordion';
import { RECENT_SEARCHES_KEY, severityOptions, statusOptions } from '../constants';
import MonthlyChart from './MonthlyChart';
import { GoogleGenAI, Type } from "@google/genai";
import TrendAnalysisModal from './TrendAnalysisModal';


interface HistoryPanelProps {
  reports: SavedReport[];
  onLoadReport: (id: string) => void;
  onDeleteReport: (id: string) => void;
  onImportReports: (importedReports: SavedReport[]) => void;
  onStatusChange: (id: string, newStatus: ReportStatus) => void;
  onClose: () => void;
  currentReportId?: string;
  onSetToast: (toast: { message: string; type: 'success' | 'info' | 'error' } | null) => void;
}

const occurrenceTypeLabelsMap: Record<string, string> = {
    physicalAssault: 'Agressão física',
    verbalAssault: 'Agressão verbal',
    bullying: 'Bullying',
    propertyDamage: 'Dano ao patrimônio',
    truancy: 'Fuga/abandono',
    socialRisk: 'Risco social',
    prohibitedSubstances: 'Substâncias proibidas',
    other: 'Outros',
};

const getOccurrenceSummary = (types: SavedReport['occurrenceTypes']) => {
    if (!types) return 'Não especificado';
    const checked = Object.entries(types)
        .filter(([, isChecked]) => isChecked)
        .map(([key]) => occurrenceTypeLabelsMap[key] || key);
    
    if (checked.length === 0) return 'Não especificado';
    const summary = checked.slice(0, 2).join(', ');
    return checked.length > 2 ? `${summary}...` : summary;
};

const isReportIncomplete = (report: SavedReport): boolean => {
    return !report.detailedDescription || !report.occurrenceLocation || !report.reporterName;
};

const HistoryPanel: React.FC<HistoryPanelProps> = ({ reports, onLoadReport, onDeleteReport, onImportReports, onStatusChange, currentReportId, onSetToast, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [justLoadedReportId, setJustLoadedReportId] = useState<string | null>(null);

  // Sorting State
  const [sortField, setSortField] = useState<'occurrenceDateTime' | 'schoolUnit' | 'status'>('occurrenceDateTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // AI Search State
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiFilteredIds, setAiFilteredIds] = useState<string[] | null>(null);

  // AI Trend Analysis State
  const [isTrendModalOpen, setIsTrendModalOpen] = useState(false);
  const [isAnalyzingTrends, setIsAnalyzingTrends] = useState(false);
  const [trendAnalysisResult, setTrendAnalysisResult] = useState<TrendInsight[] | null>(null);
  const [trendAnalysisError, setTrendAnalysisError] = useState<string | null>(null);


  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
        const storedSearches = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (storedSearches) {
            setRecentSearches(JSON.parse(storedSearches));
        }
    } catch (e) {
        console.error("Failed to parse recent searches:", e);
        localStorage.removeItem(RECENT_SEARCHES_KEY);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    // If user clears the input, also clear AI filters
    if (value === '') {
        setAiFilteredIds(null);
    }
  };
  
  const handleSearchSubmit = async (term: string) => {
    const trimmedTerm = term.trim();
    if (!trimmedTerm) {
        setAiFilteredIds(null);
        return;
    }

    const newSearches = [trimmedTerm, ...recentSearches.filter(s => s !== trimmedTerm)].slice(0, 5);
    setRecentSearches(newSearches);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newSearches));
    
    setIsAiSearching(true);
    setAiFilteredIds(null);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const simplifiedReports = reports.map(r => ({
            id: r.id,
            studentName: r.studentName,
            studentGrade: r.studentGrade,
            date: r.occurrenceDateTime,
            description: r.detailedDescription,
            types: Object.entries(r.occurrenceTypes)
                         .filter(([, checked]) => checked)
                         .map(([key]) => occurrenceTypeLabelsMap[key] || key),
            severity: r.occurrenceSeverity,
            status: r.status,
        }));

        const prompt = `
            Você é um assistente de busca inteligente para um sistema de relatórios de ocorrências escolares.
            Analise a consulta do usuário e a lista de relatórios JSON fornecida.
            Sua tarefa é retornar APENAS um array de strings contendo os IDs dos relatórios que correspondem precisamente à consulta.
            Interprete a linguagem natural do usuário, incluindo datas relativas (ex: "última semana"), tipos de ocorrência, gravidade, nomes, turmas, etc.
            Se nenhum relatório corresponder, retorne uma lista vazia.

            Consulta do usuário: "${trimmedTerm}"

            Data e hora atual para referência (ISO 8601): ${new Date().toISOString()}

            Lista de Relatórios:
            ${JSON.stringify(simplifiedReports)}
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        matchingReportIds: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Uma lista contendo apenas os IDs dos relatórios que correspondem à consulta.",
                        },
                    },
                    required: ['matchingReportIds'],
                },
            },
        });
        
        const text = response.text.trim();
        const result = JSON.parse(text) as { matchingReportIds?: string[] };
        
        setAiFilteredIds(result.matchingReportIds || []);

    } catch (error) {
        console.error("Erro na busca com IA:", error);
        let errorMessage = "A busca com IA falhou. Tente novamente.";
        if (error instanceof Error && error.message.includes('API key not valid')) {
            errorMessage = "A chave de API configurada no ambiente não é válida.";
        }
        onSetToast({ message: errorMessage, type: 'error' });
        setAiFilteredIds([]);
    } finally {
        setIsAiSearching(false);
    }
  };

  const handleAnalyzeTrends = async () => {
    if (reports.length === 0) {
        onSetToast({ message: 'Não há relatórios suficientes para analisar tendências.', type: 'info' });
        return;
    }

    setIsAnalyzingTrends(true);
    setTrendAnalysisResult(null);
    setTrendAnalysisError(null);
    setIsTrendModalOpen(true);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const simplifiedReports = reports.map(r => ({
            date: r.occurrenceDateTime,
            grade: r.studentGrade,
            location: r.occurrenceLocation,
            severity: r.occurrenceSeverity,
            types: Object.entries(r.occurrenceTypes)
                .filter(([, checked]) => checked)
                .map(([key]) => occurrenceTypeLabelsMap[key] || key),
        }));
        
        const prompt = `
            Você é um analista de dados educacionais e psicopedagogo experiente. Sua tarefa é analisar o seguinte conjunto de relatórios de ocorrências escolares para identificar tendências, padrões, correlações e anomalias.
            Os dados fornecidos são um JSON de relatórios simplificados. A data atual é ${new Date().toISOString()}.

            Identifique de 3 a 5 insights acionáveis. Concentre-se em:
            - Aumentos ou diminuições em tipos específicos de ocorrência.
            - Padrões relacionados a dias da semana, horários ou locais.
            - Correlações entre tipos de ocorrência e séries/turmas.
            - Quaisquer outras tendências significativas que possam ajudar a gestão escolar a tomar medidas proativas.

            Responda com um objeto JSON. O objeto deve ter uma chave 'insights' que é um array de objetos. Cada objeto no array deve ter duas chaves: 'title' (um título curto e impactante para o insight) e 'suggestion' (uma descrição detalhada do insight e uma sugestão de ação clara e prática).

            Dados dos Relatórios:
            ${JSON.stringify(simplifiedReports)}
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        insights: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    suggestion: { type: Type.STRING },
                                },
                                required: ['title', 'suggestion'],
                            },
                        },
                    },
                    required: ['insights'],
                },
            },
        });

        const text = response.text.trim();
        const result = JSON.parse(text) as { insights: TrendInsight[] };
        setTrendAnalysisResult(result.insights);

    } catch (error) {
        console.error("Erro na análise de tendências com IA:", error);
        let errorMessage = "Não foi possível obter a análise da IA. Verifique sua conexão e tente novamente.";
        if (error instanceof Error && error.message.includes('API key not valid')) {
            errorMessage = "A chave de API configurada no ambiente não é válida.";
        }
        setTrendAnalysisError(errorMessage);
    } finally {
        setIsAnalyzingTrends(false);
    }
  };
  
  const handleRecentSearchClick = (term: string) => {
    setSearchTerm(term);
    handleSearchSubmit(term);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setSeverityFilter('');
    setStatusFilter('');
    setAiFilteredIds(null);
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'occurrenceDateTime' ? 'desc' : 'asc');
    }
  };

  const sortedAndFilteredReports = useMemo(() => {
    const baseReports = aiFilteredIds !== null
      ? reports.filter(r => aiFilteredIds.includes(r.id))
      : reports;

    const filtered = baseReports
      .filter(report => {
        const occurrenceDatePart = report.occurrenceDateTime ? report.occurrenceDateTime.split('T')[0] : '';
        if (startDate && occurrenceDatePart && occurrenceDatePart < startDate) return false;
        if (endDate && occurrenceDatePart && occurrenceDatePart > endDate) return false;
        if (severityFilter && report.occurrenceSeverity !== severityFilter) return false;
        if (statusFilter && report.status !== statusFilter) return false;

        if (searchTerm && aiFilteredIds === null) {
          const lowerCaseSearch = searchTerm.toLowerCase();
          return report.studentName?.toLowerCase().includes(lowerCaseSearch);
        }
        return true;
      });
      
    return filtered.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            comparison = aValue.localeCompare(bValue, 'pt-BR');
        } else {
            if (aValue < bValue) comparison = -1;
            else if (aValue > bValue) comparison = 1;
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
    });

  }, [reports, startDate, endDate, searchTerm, severityFilter, statusFilter, aiFilteredIds, sortField, sortDirection]);
  
  const handleLoadAndHighlight = (id: string) => {
    onLoadReport(id);
    setJustLoadedReportId(id);
    setTimeout(() => setJustLoadedReportId(null), 1500); // Highlight for 1.5 seconds
  };
  
  const createExcelExport = (dataToExport: SavedReport[], filename: string) => {
    if (dataToExport.length === 0) return;
    if (!window.XLSX) {
        onSetToast({ message: 'A biblioteca de exportação ainda não carregou. Tente novamente em um instante.', type: 'error' });
        return;
    }

    const headers = [
      "ID", "Status", "Data Salvo", "Unidade Escolar", "Município", "UF",
      "Nome Aluno", "Data Nasc. Aluno", "Matrícula Aluno",
      "E-mail Responsável", "Data e Hora Ocorrência", "Local Ocorrência", "Gravidade",
      "Descrição Detalhada", "Tipos de Ocorrência"
    ];

    const data = dataToExport.map(r => {
        const checkedTypes = Object.entries(r.occurrenceTypes)
            .filter(([, isChecked]) => isChecked)
            .map(([key]) => occurrenceTypeLabelsMap[key] || key)
            .join('; ');

        return [
            r.id, r.status, new Date(r.savedAt).toLocaleString('pt-BR'),
            r.schoolUnit, r.municipality, r.uf,
            r.studentName, r.studentDob, r.studentRegistration,
            r.guardianEmail, r.occurrenceDateTime.replace('T', ' '), r.occurrenceLocation,
            r.occurrenceSeverity, r.detailedDescription, checkedTypes
        ];
    });

    const worksheetData = [headers, ...data];
    const worksheet = window.XLSX.utils.aoa_to_sheet(worksheetData);

    const colWidths = headers.map((_, i) => {
        const maxLength = Math.max(...worksheetData.map(row => (row[i] ? String(row[i]).length : 0)));
        return { wch: Math.min(maxLength + 2, 60) };
    });
    worksheet['!cols'] = colWidths;

    const headerStyle = { font: { bold: true } };
    headers.forEach((_, i) => {
        const cellRef = window.XLSX.utils.encode_cell({c: i, r: 0});
        if (worksheet[cellRef]) {
            worksheet[cellRef].s = headerStyle;
        }
    });

    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Histórico de Ocorrências');
    window.XLSX.writeFile(workbook, `${filename}.xlsx`);
  }

  const handleExportFilteredExcel = () => {
    createExcelExport(sortedAndFilteredReports, 'historico_filtrado_ocorrencias');
  };

  const handleExportAllExcel = () => {
    createExcelExport(reports, 'historico_completo_ocorrencias');
  };
  
  const handleExportJson = () => {
    if (reports.length === 0) return;

    const jsonContent = JSON.stringify(reports, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.download = `backup_ocorrencias_${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const validateImportedData = (data: any[]): { isValid: boolean; error: string | null } => {
    if (!Array.isArray(data)) {
        return { isValid: false, error: "O arquivo não contém uma lista de relatórios." };
    }
    if (data.length === 0) {
        return { isValid: true, error: null }; // Empty array is valid
    }
    const essentialKeys: (keyof SavedReport)[] = ['id', 'studentName', 'savedAt', 'detailedDescription'];
    
    for (let i = 0; i < data.length; i++) {
        const report = data[i];
        if (typeof report !== 'object' || report === null) {
            return { isValid: false, error: `O item ${i+1} no backup não é um objeto válido.` };
        }
        for (const key of essentialKeys) {
            if (!(key in report)) {
                return { isValid: false, error: `Importação falhou: O relatório ${i+1} não contém o campo essencial '${key}'. Verifique o arquivo de backup.` };
            }
        }
    }
    return { isValid: true, error: null };
};


  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') throw new Error("Tipo de arquivo inválido.");
        
        const importedData = JSON.parse(result);
        const { isValid, error } = validateImportedData(importedData);
        
        if (!isValid) throw new Error(error || "Formato de backup inválido.");

        onImportReports(importedData as SavedReport[]);

      } catch (error) {
        alert(`Erro ao importar o backup: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
        case 'Grave': return 'bg-red-100 text-red-800';
        case 'Moderada': return 'bg-yellow-100 text-yellow-800';
        case 'Leve': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'Novo': return 'bg-blue-100 text-blue-800';
        case 'Em Análise': return 'bg-purple-100 text-purple-800';
        case 'Resolvido': return 'bg-green-100 text-green-800';
        case 'Arquivado': return 'bg-gray-200 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  const hasActiveFilters = searchTerm || startDate || endDate || severityFilter || statusFilter || aiFilteredIds !== null;

  return (
    <>
      <div className="w-full bg-gray-50 p-4 h-full flex flex-col">
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".json" className="hidden" aria-hidden="true" />
        
        <div className="flex justify-between items-center border-b pb-2 mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">Histórico</h2>
           <div className="flex items-center gap-2">
              <span className="text-sm font-medium bg-emerald-100 text-emerald-800 py-1 px-2.5 rounded-full">{reports.length}</span>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-200" aria-label="Fechar histórico">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-grow space-y-4 -mr-2 pr-2">
          <Accordion title="Estatísticas" defaultOpen>
            <div className="space-y-4">
                <button
                    onClick={handleAnalyzeTrends}
                    disabled={isAnalyzingTrends}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isAnalyzingTrends ? (
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5a1.5 1.5 0 01.52 2.915l.385.21a2.5 2.5 0 002.185.022l.385-.21a1.5 1.5 0 011.96.615l.298.518a1.5 1.5 0 01-.065 1.701l-.21.385a2.5 2.5 0 000 2.186l.21.385a1.5 1.5 0 01.065 1.701l-.298.518a1.5 1.5 0 01-1.96.615l-.385-.21a2.5 2.5 0 00-2.185.022l-.385.21A1.5 1.5 0 0110 16.5a1.5 1.5 0 01-1.52-2.915l-.385-.21a2.5 2.5 0 00-2.185-.022l-.385.21a1.5 1.5 0 01-1.96-.615l-.298-.518a1.5 1.5 0 01.065-1.701l.21-.385a2.5 2.5 0 000-2.186l-.21-.385a1.5 1.5 0 01-.065-1.701l.298.518a1.5 1.5 0 011.96-.615l.385.21a2.5 2.5 0 002.185.022l.385-.21A1.5 1.5 0 0110 3.5zM6 10a4 4 0 118 0 4 4 0 01-8 0z" /></svg>
                    )}
                    <span>Analisar Tendências com IA</span>
                </button>
                <OccurrenceChart reports={reports} />
                <SeverityDonutChart reports={reports} />
                <MonthlyChart reports={reports} />
            </div>
          </Accordion>
          
          <Accordion title="Filtros e Busca" defaultOpen>
            <div>
              <div className="relative">
                <input
                  type="search"
                  placeholder='Busca com IA (ex: "bullying em maio")'
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(searchTerm)}
                  className="w-full p-2 pl-8 border border-gray-300 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                </div>
                <button 
                    onClick={() => handleSearchSubmit(searchTerm)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 bg-emerald-600 text-white text-xs font-bold rounded-r-md hover:bg-emerald-700"
                >
                    BUSCAR
                </button>
              </div>
               {recentSearches.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="text-xs text-gray-500 self-center">Recentes:</span>
                  {recentSearches.map(term => (
                    <button key={term} onClick={() => handleRecentSearchClick(term)} className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300">
                      {term}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              <div>
                <label htmlFor="start-date" className="text-xs text-gray-600">De:</label>
                <input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-1.5 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label htmlFor="end-date" className="text-xs text-gray-600">Até:</label>
                <input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-1.5 border border-gray-300 rounded-md text-sm" />
              </div>
               <div>
                  <label htmlFor="severity-filter" className="text-xs text-gray-600">Gravidade:</label>
                  <select id="severity-filter" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="w-full p-1.5 border border-gray-300 rounded-md text-sm">
                      <option value="">Todas</option>
                      {severityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
              </div>
              <div>
                  <label htmlFor="status-filter" className="text-xs text-gray-600">Status:</label>
                  <select id="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full p-1.5 border border-gray-300 rounded-md text-sm">
                      <option value="">Todos</option>
                      {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
              </div>
            </div>
            
            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por:</label>
                <div className="flex flex-wrap gap-2">
                    {([
                        { field: 'occurrenceDateTime', label: 'Data' },
                        { field: 'schoolUnit', label: 'Unidade' },
                        { field: 'status', label: 'Status' },
                    ] as const).map(({ field, label }) => (
                        <button
                            key={field}
                            onClick={() => handleSort(field)}
                            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                                sortField === field
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            {label}
                            {sortField === field && (
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-2 text-right">
                <button onClick={handleClearFilters} className="px-3 py-1 text-xs font-medium text-white bg-gray-500 rounded-md hover:bg-gray-600">Limpar Filtros</button>
              </div>
            )}
          </Accordion>

          {isAiSearching ? (
            <div className="text-center p-4">
              <svg className="animate-spin h-6 w-6 text-emerald-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </div>
          ) : sortedAndFilteredReports.length > 0 ? (
            <ul className="space-y-2">
              {sortedAndFilteredReports.map((report) => (
                <li
                  key={report.id}
                  className={`border rounded-lg shadow-sm transition-all duration-300 
                    ${currentReportId === report.id ? 'bg-emerald-100 border-emerald-400' : 'bg-white border-gray-200'}
                    ${justLoadedReportId === report.id ? 'animate-pulse-bg' : ''}
                  `}
                  style={{
                    animation: justLoadedReportId === report.id ? 'pulse-bg 1.5s ease-out' : 'none'
                  }}
                >
                  <div className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{report.studentName}</p>
                        <p className="text-xs text-gray-500">{new Date(report.savedAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                       <select
                          value={report.status}
                          onChange={(e) => onStatusChange(report.id, e.target.value as ReportStatus)}
                          className={`text-xs font-medium pl-2 pr-7 py-0.5 rounded-full border-0 focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 focus:outline-none transition-colors ${getStatusBadge(report.status)}`}
                          aria-label={`Status do relatório de ${report.studentName}`}
                        >
                            {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                    <p className="text-xs text-gray-600 mt-1.5">{getOccurrenceSummary(report.occurrenceTypes)}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getSeverityBadge(report.occurrenceSeverity)}`}>
                        {report.occurrenceSeverity || 'N/D'}
                      </span>
                      <div className="flex gap-1.5">
                        <button onClick={() => handleLoadAndHighlight(report.id)} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-full" aria-label={`Carregar relatório de ${report.studentName}`}>
                            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                        </button>
                        <button onClick={() => onDeleteReport(report.id)} className="p-1.5 text-gray-500 hover:bg-red-100 hover:text-red-600 rounded-full" aria-label={`Excluir relatório de ${report.studentName}`}>
                            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                        </button>
                      </div>
                    </div>
                    {isReportIncomplete(report) && (
                        <div className="mt-2 text-xs text-yellow-700 bg-yellow-50 p-1.5 rounded-md flex items-center gap-1">
                             <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.636-1.21 2.852-1.21 3.488 0l6.233 11.916c.64 1.22-.464 2.735-1.744 2.735H3.768c-1.28 0-2.384-1.515-1.744-2.735L8.257 3.099zM9 13a1 1 0 112 0 1 1 0 01-2 0zm0-5a1 1 0 011-1h.008a1 1 0 011 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1V8z" clipRule="evenodd" /></svg>
                            <span>Incompleto</span>
                        </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center p-6 bg-white rounded-lg border">
              <p className="font-semibold text-gray-700">Nenhum relatório encontrado</p>
              <p className="text-sm text-gray-500">Ajuste os filtros ou limpe a busca para ver mais resultados.</p>
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0 pt-4 border-t space-y-2">
            <h3 className="text-sm font-semibold text-gray-600">Exportar e Importar</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
                <button onClick={handleExportFilteredExcel} disabled={sortedAndFilteredReports.length === 0} className="p-2 bg-white border rounded-md hover:bg-gray-100 disabled:opacity-50">Exportar Filtrados (XLSX)</button>
                <button onClick={handleExportAllExcel} disabled={reports.length === 0} className="p-2 bg-white border rounded-md hover:bg-gray-100 disabled:opacity-50">Exportar Todos (XLSX)</button>
                <button onClick={handleExportJson} disabled={reports.length === 0} className="p-2 bg-white border rounded-md hover:bg-gray-100 disabled:opacity-50">Backup (JSON)</button>
                <button onClick={handleImportClick} className="p-2 bg-white border rounded-md hover:bg-gray-100">Importar Backup (JSON)</button>
            </div>
        </div>
      </div>
       <TrendAnalysisModal
        isOpen={isTrendModalOpen}
        onClose={() => setIsTrendModalOpen(false)}
        analysisResult={trendAnalysisResult}
        isLoading={isAnalyzingTrends}
        error={trendAnalysisError}
       />
    </>
  );
};

export default HistoryPanel;