import React, { useState, useMemo } from 'react';
import type { SavedReport } from '../types';

interface HistoryPanelProps {
  reports: SavedReport[];
  onLoadReport: (id: string) => void;
  onDeleteReport: (id: string) => void;
  currentReportId?: string;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ reports, onLoadReport, onDeleteReport, currentReportId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleClearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  const filteredReports = useMemo(() => {
    return reports
      .filter(report => {
        if (startDate && report.occurrenceDate && report.occurrenceDate < startDate) {
          return false;
        }
        if (endDate && report.occurrenceDate && report.occurrenceDate > endDate) {
          return false;
        }
        if (searchTerm) {
          const lowerCaseSearch = searchTerm.toLowerCase();
          const studentNameMatch = report.studentName?.toLowerCase().includes(lowerCaseSearch);
          if (!studentNameMatch) return false;
        }
        return true;
      })
  }, [reports, startDate, endDate, searchTerm]);

  const handleExportCsv = () => {
    if (filteredReports.length === 0) return;

    const headers = [
      "ID", "Data Salvo", "Unidade Escolar", "Município", "UF",
      "Nome Aluno", "Data Nasc. Aluno", "Matrícula Aluno",
      "Data Ocorrência", "Hora Ocorrência", "Local Ocorrência",
      "Descrição Detalhada"
    ];

    const rows = filteredReports.map(r => [
      r.id,
      new Date(r.savedAt).toLocaleString('pt-BR'),
      r.schoolUnit,
      r.municipality,
      r.uf,
      r.studentName,
      r.studentDob,
      r.studentRegistration,
      r.occurrenceDate,
      r.occurrenceTime,
      r.occurrenceLocation,
      `"${r.detailedDescription.replace(/"/g, '""')}"` // Escape double quotes
    ].join(','));

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + '\n' 
      + rows.join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "historico_ocorrencias.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <aside className="non-printable w-full bg-gray-50 p-4 rounded-lg shadow-inner self-start sticky top-8">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-xl font-bold text-gray-800">Histórico</h2>
        <span className="text-sm font-medium bg-emerald-100 text-emerald-800 py-1 px-2.5 rounded-full">{filteredReports.length}</span>
      </div>

      <div className="mb-4 space-y-3">
        <div>
          <label htmlFor="search-report" className="text-sm font-medium text-gray-600 mb-1 block">Pesquisar por aluno:</label>
          <input
            type="text"
            id="search-report"
            placeholder="Nome do aluno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">Filtrar por data da ocorrência:</p>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label htmlFor="start-date" className="sr-only">De:</label>
              <input
                type="date"
                id="start-date"
                title="Data de início"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
             <span className="text-gray-500">-</span>
            <div className="flex-1">
              <label htmlFor="end-date" className="sr-only">Até:</label>
              <input
                type="date"
                id="end-date"
                title="Data de fim"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
            {(startDate || endDate || searchTerm) && (
                <button
                    onClick={handleClearFilters}
                    className="flex-grow px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                  Limpar Filtros
                </button>
            )}
            <button
                onClick={handleExportCsv}
                disabled={filteredReports.length === 0}
                className="flex-grow flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-md hover:bg-emerald-200 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" /></svg>
                Exportar CSV
            </button>
        </div>
      </div>
      
      <div className="max-h-[calc(100vh-360px)] overflow-y-auto pr-2 -mr-2">
        {reports.length === 0 ? (
            <div className="text-center text-gray-500 mt-8 p-4 border-2 border-dashed rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum relatório salvo</h3>
            <p className="mt-1 text-sm text-gray-500">Comece a preencher o formulário para criar um novo registro.</p>
            </div>
        ) : filteredReports.length === 0 ? (
            <div className="text-center text-gray-500 mt-8 p-4">
            <h3 className="text-sm font-medium text-gray-900">Nenhum relatório encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">Tente ajustar ou limpar os filtros.</p>
            </div>
        ) : (
            <ul className="space-y-3">
            {filteredReports.map((report) => (
                <li
                    key={report.id}
                    className={`p-3 rounded-md transition-all duration-200 group ${
                    report.id === currentReportId ? 'bg-emerald-100 border-emerald-400 border-l-4' : 'bg-white border border-gray-200 hover:shadow-md hover:border-emerald-300'
                    }`}
                >
                    <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center border-2 border-gray-300">
                        {report.studentPhoto ? (
                        <img src={report.studentPhoto.dataUrl} alt={report.studentName || 'Foto do Aluno'} className="w-full h-full object-cover" />
                        ) : (
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        )}
                    </div>
                    <div className="flex-grow min-w-0">
                        <p className="font-semibold text-gray-900 truncate" title={report.studentName || 'Aluno não identificado'}>
                        {report.studentName || 'Aluno não identificado'}
                        </p>
                        <p className="text-sm text-gray-600">
                        Ocorrência: {report.occurrenceDate ? new Date(report.occurrenceDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}
                        </p>
                        <p className="text-xs text-gray-400">
                        Salvo em: {new Date(report.savedAt).toLocaleString('pt-BR')}
                        </p>
                    </div>
                    </div>
                    <div className="mt-3 flex items-center justify-end space-x-2">
                    <button
                        onClick={() => onDeleteReport(report.id)}
                        className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label={`Excluir relatório de ${report.studentName}`}
                    >
                        Excluir
                    </button>
                    <button
                        onClick={() => onLoadReport(report.id)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors"
                        aria-label={`Carregar relatório de ${report.studentName}`}
                    >
                        {report.id === currentReportId ? 'Editando' : 'Carregar'}
                    </button>
                    </div>
                </li>
            ))}
            </ul>
        )}
      </div>
    </aside>
  );
};

export default HistoryPanel;