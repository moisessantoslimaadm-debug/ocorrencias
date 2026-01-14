
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
  isOpen: boolean;
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

const HistoryPanel: React.FC<HistoryPanelProps> = ({ reports, onLoadReport, onDeleteReport, onImportReports, onStatusChange, currentReportId, onSetToast, onClose, isOpen }) => {
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
    // Note: We do NOT clear aiFilteredIds here immediately to allow user to edit their query
    // without losing the current view, but we will reset if they manually clear the box.
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

    // Clear manual filters to prioritize AI Search results and avoid confusion
    setStartDate('');
    setEndDate('');
    setSeverityFilter('');
    setStatusFilter('');

    const newSearches = [trimmedTerm, ...recentSearches.filter(s => s !== trimmedTerm)].slice(0, 5);
    setRecentSearches(newSearches);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newSearches));
    
    setIsAiSearching(true);
    setAiFilteredIds(null); // Reset current filter while searching

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Pass lighter objects to save tokens and improve latency
        const simplifiedReports = reports.map(r => ({
            id: r.id,
            studentName: r.studentName,
            school: r.schoolUnit,
            date: r.occurrenceDateTime,
            description: r.detailedDescription,
            types: Object.entries(r.occurrenceTypes)
                         .filter(([, checked]) => checked)
                         .map(([key]) => occurrenceTypeLabelsMap[key] || key),
            severity: r.occurrenceSeverity,
            status: r.status,
        }));

        const prompt = `
            Você é um motor de busca semântica para um sistema de ocorrências escolares.
            O usuário fará uma consulta em linguagem natural (pode incluir datas relativas como "semana passada", tipos de problema, gravidade ou nomes).
            
            Consulta: "${trimmedTerm}"
            Data de referência (Hoje): ${new Date().toISOString()}

            Analise a lista de relatórios JSON abaixo e retorne um objeto JSON contendo um array 'matchingReportIds' com os IDs dos relatórios que melhor atendem à consulta.
            Se a consulta for genérica, tente encontrar correspondências por palavra-chave ou semântica na descrição.
            
            Lista:
            ${JSON.stringify(simplifiedReports)}
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        matchingReportIds: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "IDs dos relatórios relevantes.",
                        },
                    },
                    required: ['matchingReportIds'],
                },
            },
        });
        
        const text = response.text.trim();
        const result = JSON.parse(text) as { matchingReportIds?: string[] };
        
        if (result.matchingReportIds && result.matchingReportIds.length > 0) {
             setAiFilteredIds(result.matchingReportIds);
             onSetToast({ message: `${result.matchingReportIds.length} resultados encontrados pela IA.`, type: 'success' });
        } else {
             setAiFilteredIds([]); // Empty array means "search active but no results"
             onSetToast({ message: "A IA não encontrou ocorrências correspondentes.", type: 'info' });
        }

    } catch (error) {
        console.error("Erro na busca com IA:", error);
        let errorMessage = "A busca com IA falhou. Tentando filtro local...";
        if (error instanceof Error && error.message.includes('API key not valid')) {
            errorMessage = "Chave de API inválida.";
        }
        onSetToast({ message: errorMessage, type: 'error' });
        setAiFilteredIds(null); // Fallback to local filtering behavior
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
            Você é um analista de dados educacionais. Analise os relatórios de ocorrências escolares abaixo.
            Data atual: ${new Date().toISOString()}.

            Identifique 3-5 insights acionáveis (tendências, aumentos em tipos específicos, padrões de horário/local).
            
            Dados:
            ${JSON.stringify(simplifiedReports)}
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
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
        console.error("Erro na análise de tendências:", error);
        setTrendAnalysisError("Não foi possível gerar a análise. Verifique a conexão.");
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
    // If AI filtering is active (array exists), strictly filter by IDs
    if (aiFilteredIds !== null) {
        return reports
            .filter(r => aiFilteredIds.includes(r.id))
            .sort((a, b) => {
                 // Preserve AI relevance order if possible, or fallback to date
                 return new Date(b.occurrenceDateTime).getTime() - new Date(a.occurrenceDateTime).getTime();
            });
    }

    // Otherwise, apply manual local filters
    const filtered = reports.filter(report => {
        const occurrenceDatePart = report.occurrenceDateTime ? report.occurrenceDateTime.split('T')[0] : '';
        if (startDate && occurrenceDatePart && occurrenceDatePart < startDate) return false;
        if (endDate && occurrenceDatePart && occurrenceDatePart > endDate) return false;
        if (severityFilter && report.occurrenceSeverity !== severityFilter) return false;
        if (statusFilter && report.status !== statusFilter) return false;

        if (searchTerm) {
          const lowerCaseSearch = searchTerm.toLowerCase();
          return (
            report.studentName?.toLowerCase().includes(lowerCaseSearch) ||
            report.schoolUnit?.toLowerCase().includes(lowerCaseSearch) ||
            report.id.includes(lowerCaseSearch)
          );
        }
        return true;
      });

    return filtered.sort((a, b) => {
      let fieldA: any = a[sortField] || '';
      let fieldB: any = b[sortField] || '';
      
      if (typeof fieldA === 'string') fieldA = fieldA.toLowerCase();
      if (typeof fieldB === 'string') fieldB = fieldB.toLowerCase();

      if (sortDirection === 'asc') {
        return fieldA > fieldB ? 1 : -1;
      } else {
        return fieldA < fieldB ? 1 : -1;
      }
    });
  }, [reports, searchTerm, startDate, endDate, severityFilter, statusFilter, sortField, sortDirection, aiFilteredIds]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const content = e.target?.result as string;
              const imported = JSON.parse(content);
              if (Array.isArray(imported)) {
                  onImportReports(imported);
              } else {
                  onSetToast({ message: 'Arquivo inválido.', type: 'error' });
              }
          } catch (error) {
              onSetToast({ message: 'Erro ao ler JSON.', type: 'error' });
          }
      };
      reader.readAsText(file);
      event.target.value = '';
  };

  const triggerFileUpload = () => {
      fileInputRef.current?.click();
  };
  
  const handleExportBackup = () => {
      const dataStr = JSON.stringify(reports, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `backup_ocorrencias_${new Date().toISOString().split('T')[0]}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
  };

  const hasActiveAiFilter = aiFilteredIds !== null;

  return (
    <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-30 ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        <div className="bg-[#90EE90] p-4 flex justify-between items-center shadow-sm z-10">
            <h2 className="text-xl font-bold text-gray-800">Histórico</h2>
            <div className="flex items-center gap-2">
                 <button 
                    onClick={handleExportBackup} 
                    className="group p-2 text-emerald-900 bg-white/30 hover:bg-white/60 border border-white/20 backdrop-blur-sm rounded-lg transition-all shadow-sm hover:shadow-md" 
                    title="Exportar Backup (Download)"
                 >
                    {/* Cloud with Arrow Down (Download) */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 transition-transform duration-300 group-hover:translate-y-0.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75v6.75m0 0-3-3m3 3 3-3m-8.25 6a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                    </svg>
                </button>
                <button 
                    onClick={triggerFileUpload} 
                    className="group p-2 text-emerald-900 bg-white/30 hover:bg-white/60 border border-white/20 backdrop-blur-sm rounded-lg transition-all shadow-sm hover:shadow-md" 
                    title="Importar Backup (Upload)"
                >
                     {/* Cloud with Arrow Up (Upload) */}
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-0.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                     </svg>
                </button>
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json"/>
                <div className="h-6 w-px bg-emerald-700/30 mx-1"></div>
                <button onClick={onClose} className="p-1.5 text-gray-600 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
           
            <Accordion title="Análise e Estatísticas" defaultOpen={false}>
                 <div className="space-y-4">
                     <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                        <div className="flex justify-between items-center mb-2">
                             <h4 className="font-semibold text-indigo-900 text-sm">IA Insights</h4>
                             <button onClick={handleAnalyzeTrends} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 transition">Analisar Tendências</button>
                        </div>
                        <p className="text-xs text-indigo-700">Identifique padrões e receba sugestões de gestão.</p>
                     </div>
                     <OccurrenceChart reports={reports} />
                     <SeverityDonutChart reports={reports} />
                     <MonthlyChart reports={reports} />
                 </div>
            </Accordion>
            
            {/* AI Search Area */}
            <div className={`space-y-3 p-3 rounded-lg shadow-sm border transition-colors ${hasActiveAiFilter ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200'}`}>
                <div className="flex justify-between items-center mb-1">
                    <label className={`text-xs font-semibold uppercase tracking-wider ${hasActiveAiFilter ? 'text-indigo-600' : 'text-gray-500'}`}>
                        {hasActiveAiFilter ? 'Busca Inteligente Ativa' : 'Busca Inteligente'}
                    </label>
                    {hasActiveAiFilter && (
                        <button onClick={handleClearFilters} className="text-xs text-indigo-600 hover:text-indigo-800 underline">
                            Limpar Busca IA
                        </button>
                    )}
                </div>
                
                <div className="relative flex gap-2">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Ex: 'Casos graves de bullying em maio'..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(searchTerm)}
                            className="w-full pl-3 pr-8 py-2 border rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => { setSearchTerm(''); setAiFilteredIds(null); }}
                                className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => handleSearchSubmit(searchTerm)}
                        disabled={isAiSearching || !searchTerm}
                        className="flex-shrink-0 bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed shadow-sm transition-colors"
                        title="Pesquisar com IA"
                    >
                        {isAiSearching ? (
                             <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                             </svg>
                        )}
                    </button>
                </div>
                
                {recentSearches.length > 0 && !searchTerm && !hasActiveAiFilter && (
                    <div className="flex flex-wrap gap-2 pt-1">
                        {recentSearches.map((term, index) => (
                             <button
                                key={index}
                                onClick={() => handleRecentSearchClick(term)}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 border border-gray-200"
                             >
                                 {term}
                             </button>
                        ))}
                    </div>
                )}

                {/* Manual Filters Collapsible - Hide when AI search is active to reduce clutter */}
                {!hasActiveAiFilter && (
                    <div className="pt-2 border-t border-gray-100">
                        <p className="text-[10px] text-gray-400 mb-2 font-medium uppercase">Filtros Manuais</p>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-2 py-1.5 border rounded text-xs text-gray-600 bg-gray-50" aria-label="Data inicial" />
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-2 py-1.5 border rounded text-xs text-gray-600 bg-gray-50" aria-label="Data final" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="w-full px-2 py-1.5 border rounded text-xs text-gray-600 bg-gray-50">
                                <option value="">Gravidade...</option>
                                {severityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-2 py-1.5 border rounded text-xs text-gray-600 bg-gray-50">
                                <option value="">Status...</option>
                                {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                         {(startDate || endDate || severityFilter || statusFilter) && (
                            <button onClick={handleClearFilters} className="w-full text-xs text-gray-500 hover:text-gray-700 underline text-center pt-2">
                                Limpar filtros manuais
                            </button>
                         )}
                    </div>
                )}
            </div>
            
            <div className="flex justify-between items-center px-1">
                <span className="text-xs font-medium text-gray-500">
                    {hasActiveAiFilter ? 'Resultados relevantes' : 'Todos os registros'} ({sortedAndFilteredReports.length})
                </span>
                 <div className="flex gap-2">
                     <button onClick={() => handleSort('occurrenceDateTime')} className={`text-xs px-2 py-1 rounded ${sortField === 'occurrenceDateTime' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>Data</button>
                     <button onClick={() => handleSort('schoolUnit')} className={`text-xs px-2 py-1 rounded ${sortField === 'schoolUnit' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>Escola</button>
                 </div>
            </div>

            <div className="space-y-3 pb-8">
                {sortedAndFilteredReports.map((report) => (
                    <div key={report.id} className={`bg-white p-3 rounded-lg shadow-sm border-l-4 hover:shadow-md transition-shadow cursor-pointer relative ${currentReportId === report.id ? 'ring-2 ring-emerald-500' : ''}`} style={{ borderLeftColor: report.occurrenceSeverity === 'Grave' ? '#ef4444' : report.occurrenceSeverity === 'Moderada' ? '#f59e0b' : '#10b981' }}>
                        <div onClick={() => { onLoadReport(report.id); setJustLoadedReportId(report.id); setTimeout(() => setJustLoadedReportId(null), 2000); }}>
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-gray-800 text-sm">{report.studentName || 'Nome não informado'}</h3>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                    report.status === 'Novo' ? 'bg-blue-100 text-blue-800' :
                                    report.status === 'Em Análise' ? 'bg-purple-100 text-purple-800' :
                                    report.status === 'Resolvido' ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>{report.status}</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-1">{report.schoolUnit}</p>
                            <p className="text-xs text-gray-500 mb-2">
                                {report.occurrenceDateTime ? new Date(report.occurrenceDateTime).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'}) : 'Data não inf.'}
                            </p>
                            <p className="text-xs text-gray-600 line-clamp-2 italic mb-2">
                                "{report.detailedDescription || 'Sem descrição.'}"
                            </p>
                            <div className="flex flex-wrap gap-1 mb-2">
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                    {getOccurrenceSummary(report.occurrenceTypes)}
                                </span>
                            </div>
                             {isReportIncomplete(report) && (
                                <p className="text-[10px] text-orange-600 flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    Preenchimento incompleto
                                </p>
                             )}
                        </div>
                        
                        <div className="flex justify-between items-center mt-2 border-t pt-2">
                            <select 
                                value={report.status}
                                onChange={(e) => onStatusChange(report.id, e.target.value as ReportStatus)}
                                className="text-[10px] border-none bg-transparent text-gray-500 focus:ring-0 cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDeleteReport(report.id); }}
                                className="text-red-400 hover:text-red-600 transition-colors p-1"
                                title="Excluir Relatório"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </div>
                ))}
                
                {sortedAndFilteredReports.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        <p>{hasActiveAiFilter ? 'A IA não encontrou correspondências.' : 'Nenhum relatório encontrado.'}</p>
                        {hasActiveAiFilter && (
                            <button onClick={handleClearFilters} className="text-indigo-600 hover:underline mt-2 text-xs">
                                Ver todos os registros
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>

        <TrendAnalysisModal 
            isOpen={isTrendModalOpen} 
            onClose={() => setIsTrendModalOpen(false)} 
            analysisResult={trendAnalysisResult} 
            isLoading={isAnalyzingTrends}
            error={trendAnalysisError}
        />

    </div>
  );
};

export default HistoryPanel;
