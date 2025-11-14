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
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9.622 3.203a.75.75 0 01.756 0l1.25 1.25a.75.75 0 010 1.06l-1.25 1.25a.75.75 0 01-1.06 0l-1.25-1.25a.75.75 0 010-1.06l1.25-1.25zM12.5 6.5a.75.75 0 00-1.06 0l-1.25 1.25a.75.75 0 000 1.06l1.25 1.25a.75.75 0 001.06 0l1.25-1.25a.75.75 0 000-1.06L12.5 6.5zM5.378 8.203a.75.75 0 01.756 0l1.25 1.25a.75.75 0 010 1.06l-1.25 1.25a.75.75 0 01-1.06 0L4.122 10.51a.75.75 0 010-1.06l1.25-1.25zM10 11.25a.75.75 0 00-1.06 0l-1.25 1.25a.75.75 0 000 1.06l1.25 1.25a.75.75 0 001.06 0l1.25-1.25a.75.75 0 000-1.06L10 11.25z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                    </div>
                  </form>
                  <p className="text-xs text-gray-500 mt-1">Pressione Enter para busca inteligente com IA (ex: "casos graves de bullying").</p>
                   {aiFilteredIds !== null && !isAiSearching && (
                    <div className="mt-2 text-xs text-center text-emerald-700 bg-emerald-50 p-1.5 rounded-md">
                        {aiFilteredIds.length > 0 ? `Exibindo ${aiFilteredIds.length} resultado(s) da busca inteligente.` : 'Nenhum resultado encontrado pela IA.'}
                    </div>
                    )}
                  {recentSearches.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {recentSearches.map(term => (
                            <button key={term} onClick={() => handleRecentSearchClick(term)} className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300">
                                {term}
                            </button>
                        ))}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                     <div>
                        <label htmlFor="status-filter" className="text-sm font-medium text-gray-600 mb-1 block">Status:</label>
                        <select id="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-emerald-500 focus:border-emerald-500">
                            <option value="">Todos</option>
                            {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="severity-filter" className="text-sm font-medium text-gray-600 mb-1 block">Gravidade:</label>
                        <select id="severity-filter" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-emerald-500 focus:border-emerald-500">
                            <option value="">Todas</option>
                            {severityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Filtrar por data da ocorrência:</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1"><input type="date" id="start-date" title="Data de início" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-emerald-500 focus:border-emerald-500" /></div>
                    <span className="text-gray-500">-</span>
                    <div className="flex-1"><input type="date" id="end-date" title="Data de fim" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-emerald-500 focus:border-emerald-500" /></div>
                  </div>
                </div>
                 {hasActiveFilters && (
                  <>
                    <p className="text-xs text-center text-gray-600 pt-1">
                        Exibindo {filteredReports.length} de {reports.length} relatórios.
                    </p>
                    <button onClick={handleClearFilters} className="w-full px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors">Limpar Filtros</button>
                  </>
                )}
              </div>
          </Accordion>
          
          <Accordion title="Gerenciamento de Dados">
              <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleExportExcel} disabled={filteredReports.length === 0} className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-md hover:bg-emerald-200 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors" title="Exportar visão atual para Excel"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>Exportar Excel</button>
                  <button onClick={handleExportJson} disabled={reports.length === 0} className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors" title="Exportar todos os relatórios para um arquivo de backup"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" /><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" /></svg>Backup</button>
                  <button onClick={handleImportClick} className="col-span-2 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors" title="Importar relatórios. Isso substituirá os dados atuais."><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9.25 3.75a.75.75 0 00-1.5 0v8.614L4.795 9.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V3.75z" /><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" /></svg>Importar</button>
                </div>
          </Accordion>
          
          <div className="space-y-2">
            {reports.length === 0 ? (
                <div className="text-center text-gray-500 mt-8 p-4 border-2 border-dashed rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum relatório salvo</h3>
                <p className="mt-1 text-sm text-gray-500">Comece a preencher o formulário para criar um novo registro.</p>
                </div>
            ) : filteredReports.length === 0 ? (
                <div className="text-center text-gray-500 mt-8 p-4">
                <h3 className="text-sm font-medium text-gray-900">Nenhum relatório encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">Tente ajustar ou limpar os filtros.</p>
                </div>
            ) : (
                <ul className="space-y-2">
                {filteredReports.map((report) => (
                        <li
                            key={report.id}
                            className={`rounded-md transition-all duration-300 ${
                            report.id === currentReportId ? 'bg-emerald-100 ring-2 ring-emerald-400' 
                            : 'bg-white border border-gray-200 hover:shadow-md hover:border-emerald-300'}
                            ${justLoadedReportId === report.id ? 'animate-pulse-bg' : ''}
                            `}
                        >
                            <div className="p-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center border-2 border-gray-300">
                                        {report.studentPhoto ? (
                                        <img src={report.studentPhoto.dataUrl} alt={report.studentName || 'Foto do Aluno'} className="w-full h-full object-cover" />
                                        ) : (
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                        )}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="font-semibold text-gray-900 truncate" title={report.studentName || 'Aluno não identificado'}>{report.studentName || 'Aluno não identificado'}</p>
                                        <div className="text-sm text-gray-500 mt-1">
                                            <p className="truncate" title={`${getOccurrenceSummary(report.occurrenceTypes)} em ${report.occurrenceLocation}`}>{new Date(report.occurrenceDateTime).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})} &middot; {report.occurrenceLocation || 'Local n/d'}</p>
                                        </div>
                                    </div>
                                    {isReportIncomplete(report) && (
                                         <div className="flex-shrink-0" title="Relatório com campos importantes em branco"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.636-1.21 2.852-1.21 3.488 0l6.096 11.623c.664 1.269-.263 2.778-1.744 2.778H3.905c-1.48 0-2.408-1.509-1.744-2.778L8.257 3.099zM9 13a1 1 0 112 0 1 1 0 01-2 0zm1-5a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1z" clipRule="evenodd" /></svg></div>
                                    )}
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusBadge(report.status)}`}>{report.status}</span>
                                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getSeverityBadge(report.occurrenceSeverity)}`}>{report.occurrenceSeverity || 'N/D'}</span>
                                    </div>
                                    <div>
                                        <select 
                                            value={report.status} 
                                            onChange={(e) => onStatusChange(report.id, e.target.value as ReportStatus)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-xs border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                                            aria-label={`Mudar status do relatório de ${report.studentName}`}
                                        >
                                            {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-end space-x-2">
                                    <button onClick={(e) => { e.stopPropagation(); onDeleteReport(report.id); }} className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors" aria-label={`Excluir relatório de ${report.studentName}`}>Excluir</button>
                                    <button onClick={(e) => { e.stopPropagation(); handleLoadAndHighlight(report.id); }} className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors" aria-label={`Carregar relatório de ${report.studentName}`}>{report.id === currentReportId ? 'Editando' : 'Carregar'}</button>
                                </div>
                            </div>
                        </li>
                ))}
                </ul>
            )}
          </div>
        </div>
        <style>{`
          @keyframes pulse-bg {
            0%, 100% { background-color: white; }
            50% { background-color: #d1fae5; } /* emerald-100 */
          }
          .animate-pulse-bg {
            animation: pulse-bg 1.5s ease-in-out;
          }
        `}</style>
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