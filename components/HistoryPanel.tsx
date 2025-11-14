
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { SavedReport, ReportStatus, TrendInsight } from '../types';
import OccurrenceChart from './OccurrenceChart';
import SeverityDonutChart from './SeverityDonutChart';
import Accordion from './Accordion';
import { API_KEY_STORAGE_KEY, RECENT_SEARCHES_KEY, severityOptions, statusOptions } from '../constants';
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
  onApiKeyCheck: () => boolean;
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

const HistoryPanel: React.FC<HistoryPanelProps> = ({ reports, onLoadReport, onDeleteReport, onImportReports, onStatusChange, currentReportId, onSetToast, onApiKeyCheck, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [justLoadedReportId, setJustLoadedReportId] = useState<string | null>(null);

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
    if (!onApiKeyCheck()) return;

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
        const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (!apiKey) throw new Error("API key not found");
        const ai = new GoogleGenAI({ apiKey });
        
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
            errorMessage = "A chave de API fornecida não é válida.";
        }
        onSetToast({ message: errorMessage, type: 'error' });
        setAiFilteredIds([]);
    } finally {
        setIsAiSearching(false);
    }
  };

  const handleAnalyzeTrends = async () => {
    if (!onApiKeyCheck()) return;

    if (reports.length === 0) {
        onSetToast({ message: 'Não há relatórios suficientes para analisar tendências.', type: 'info' });
        return;
    }

    setIsAnalyzingTrends(true);
    setTrendAnalysisResult(null);
    setTrendAnalysisError(null);
    setIsTrendModalOpen(true);

    try {
        const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (!apiKey) throw new Error("API key not found");
        const ai = new GoogleGenAI({ apiKey });

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
            errorMessage = "A chave de API fornecida não é válida.";
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

  const filteredReports = useMemo(() => {
    const baseReports = aiFilteredIds !== null
      ? reports.filter(r => aiFilteredIds.includes(r.id))
      : reports;

    return baseReports
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
  }, [reports, startDate, endDate, searchTerm, severityFilter, statusFilter, aiFilteredIds]);
  
  const handleLoadAndHighlight = (id: string) => {
    onLoadReport(id);
    setJustLoadedReportId(id);
    setTimeout(() => setJustLoadedReportId(null), 1500); // Highlight for 1.5 seconds
  };

  const handleExportExcel = () => {
    if (filteredReports.length === 0) return;
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

    const data = filteredReports.map(r => {
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
        return { wch: Math.min(maxLength + 2, 60) }; // Add padding, max width 60
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
    window.XLSX.writeFile(workbook, 'historico_ocorrencias.xlsx');
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
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.622 3.203a.75.75 0 01.756 0l1.25 1.25a.75.75 0 010 1.06l-1.25 1.25a.75.75 0 01-1.06 0l-1.25-1.25a.75.75 0 010-1.06l1.25-1.25zM12.5 6.5a.75.75 0 00-1.06 0l-1.25 1.25a.75.75 0 000 1.06l1.25 1.25a.75.75 0 001.06 0l1.25-1.25a.75.75 0 000-1.06L12.5 6.5zM5.378 8.203a.75.75 0 01.756 0l1.25 1.25a.75.75 0 010 1.06l-1.25 1.25a.75.75 0 01-1.06 0L4.122 10.51a.75.75 0 010-1.06l1.25-1.25zM10 11.25a.75.75 0 00-1.06 0l-1.25 1.25a.75.75 0 000 1.06l1.25 1.25a.75.75 0 001.06 0l1.25-1.25a.75.75 0 000-1.06L10 11.25z" clipRule="evenodd" /></svg>
                    )}
                    <span>{isAnalyzingTrends ? 'Analisando...' : 'Analisar Tendências com IA'}</span>
                </button>
                <MonthlyChart reports={reports} />
                <OccurrenceChart reports={reports} />
                <SeverityDonutChart reports={reports} />
            </div>
          </Accordion>

          <Accordion title="Filtrar Relatórios">
              <div className="space-y-3">
                <div>
                  <label htmlFor="search-report" className="text-sm font-medium text-gray-600 mb-1 block">Pesquisar Relatórios:</label>
                  <form onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(searchTerm); }}>
                    <div className="relative">
                        <input
                            type="text"
                            id="search-report"
                            placeholder="Digite o nome do aluno..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full p-2 pl-3 pr-10 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            {isAiSearching ? (
                                <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            )}
                        </div>
                    </div>
                  </form>
                   <p className="text-xs text-gray-500 mt-1">Busca por nome ou <button onClick={() => handleSearchSubmit(searchTerm)} className="text-emerald-600 hover:underline disabled:text-gray-400" disabled={!searchTerm || isAiSearching}>usar IA para busca avançada</button>.</p>
                   {recentSearches.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className="text-xs text-gray-500 mr-1">Recentes:</span>
                            {recentSearches.map(term => (
                                <button key={term} onClick={() => handleRecentSearchClick(term)} className="px-2 py-0.5 text-xs text-emerald-800 bg-emerald-100 rounded-full hover:bg-emerald-200">
                                    {term}
                                </button>
                            ))}
                        </div>
                   )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="start-date" className="text-sm font-medium text-gray-600 mb-1 block">Data de Início:</label>
                    <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-1.5 border border-gray-300 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500" />
                  </div>
                  <div>
                    <label htmlFor="end-date" className="text-sm font-medium text-gray-600 mb-1 block">Data de Fim:</label>
                    <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-1.5 border border-gray-300 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="severity-filter" className="text-sm font-medium text-gray-600 mb-1 block">Gravidade:</label>
                        <select id="severity-filter" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="w-full p-1.5 border border-gray-300 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500">
                            <option value="">Todas</option>
                            {severityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="status-filter" className="text-sm font-medium text-gray-600 mb-1 block">Status:</label>
                        <select id="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full p-1.5 border border-gray-300 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500">
                            <option value="">Todos</option>
                            {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                </div>
                 {hasActiveFilters && (
                    <button onClick={handleClearFilters} className="text-sm text-emerald-600 hover:underline">Limpar filtros</button>
                )}
              </div>
          </Accordion>
          
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="font-semibold text-gray-700">
                {filteredReports.length} de {reports.length} relatórios
            </span>
            <div className="flex gap-2">
                <button onClick={handleExportExcel} title="Exportar para Excel (XLSX)" disabled={filteredReports.length === 0} className="text-gray-500 hover:text-emerald-600 disabled:text-gray-300 disabled:cursor-not-allowed">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21.17 3.25Q21.5 3.25 21.76 3.5 22 3.74 22 4.08V19.92Q22 20.26 21.76 20.5 21.5 20.75 21.17 20.75H7.83Q7.5 20.75 7.24 20.5 7 20.26 7 19.92V17H2.83Q2.5 17 2.24 16.76 2 16.5 2 16.17V7.83Q2 7.5 2.24 7.24 2.5 7 2.83 7H7V4.08Q7 3.74 7.24 3.5 7.5 3.25 7.83 3.25M7 15.5V8.5H3.5V15.5M12.21 6.21 14.53 10.41 16.85 6.21H18.93L15.5 12.04L19 17.79H16.9L14.53 13.5L12.15 17.79H10.1L13.56 12L10.1 6.21Z" /></svg>
                </button>
                 <button onClick={handleExportJson} title="Exportar Backup (JSON)" disabled={reports.length === 0} className="text-gray-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 5a1 1 0 011-1h1a1 1 0 010 2H5a1 1 0 01-1-1zm12 0a1 1 0 00-1 1h-1a1 1 0 100 2h1a1 1 0 001-1zM4.707 8.707a1 1 0 00-1.414 0l-1 1a1 1 0 101.414 1.414l1-1a1 1 0 000-1.414zM16.707 9.707a1 1 0 00-1.414-1.414l-1 1a1 1 0 101.414 1.414l1-1zM10 16a1 1 0 100 2 1 1 0 000-2zM4.293 15.293a1 1 0 10-1.414-1.414l-1 1a1 1 0 101.414 1.414l1-1zM16.707 13.879a1 1 0 10-1.414 1.414l1 1a1 1 0 101.414-1.414l-1-1z" clipRule="evenodd" /></svg>
                </button>
                 <button onClick={handleImportClick} title="Importar Backup (JSON)" className="text-gray-500 hover:text-purple-600">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>
                </button>
            </div>
          </div>
          
          <ul className="space-y-2">
            {filteredReports.length > 0 ? (
                filteredReports.map(report => (
                <li key={report.id}>
                    <div className={`
                        p-3 rounded-lg border 
                        ${currentReportId === report.id ? 'bg-emerald-100 border-emerald-300' : 'bg-white border-gray-200'}
                        ${justLoadedReportId === report.id ? 'animate-pulse-bg-emerald' : ''}
                    `}>
                        <div className="flex justify-between items-start gap-2">
                            <div>
                                <p className="font-semibold text-gray-800">{report.studentName}</p>
                                <p className="text-xs text-gray-500">
                                    {new Date(report.savedAt).toLocaleDateString('pt-BR')} &middot; {getOccurrenceSummary(report.occurrenceTypes)}
                                </p>
                            </div>
                            <div className="flex-shrink-0 flex flex-col items-end gap-1">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getSeverityBadge(report.occurrenceSeverity)}`}>
                                    {report.occurrenceSeverity || 'N/D'}
                                </span>
                                 <select 
                                    value={report.status} 
                                    onChange={(e) => onStatusChange(report.id, e.target.value as ReportStatus)}
                                    className={`text-xs font-medium px-2 py-0.5 rounded-full border-none appearance-none ${getStatusBadge(report.status)}`}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                        </div>

                        {isReportIncomplete(report) && (
                            <p className="mt-2 text-xs text-yellow-700 bg-yellow-100 p-1.5 rounded flex items-center gap-1">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.636-1.21 2.37-1.21 3.006 0l4.33 8.24c.636 1.21-.24 2.66-1.503 2.66H5.43c-1.263 0-2.139-1.45-1.503-2.66l4.33-8.24zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                                <span>Relatório incompleto.</span>
                            </p>
                        )}

                        <div className="mt-3 flex gap-2">
                            <button onClick={() => handleLoadAndHighlight(report.id)} className="px-3 py-1 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-md hover:bg-emerald-200">
                                {currentReportId === report.id ? 'Editando' : 'Carregar'}
                            </button>
                            <button onClick={() => onDeleteReport(report.id)} className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200">
                                Excluir
                            </button>
                        </div>
                    </div>
                </li>
                ))
            ) : (
                <div className="text-center text-gray-500 py-10">
                    <p className="font-semibold">Nenhum relatório encontrado</p>
                    <p className="text-sm mt-1">
                        {aiFilteredIds !== null ? "A busca com IA não retornou resultados." : "Ajuste os filtros ou limpe-os para ver todos os relatórios."}
                    </p>
                </div>
            )}
          </ul>
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
// FIX: Add default export for the component
export default HistoryPanel;
