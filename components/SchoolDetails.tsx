
import React from 'react';
import type { SchoolData, SavedReport, ReportStatus } from '../types';
import OccurrenceChart from './OccurrenceChart';
import SeverityDonutChart from './SeverityDonutChart';

interface SchoolDetailsProps {
  school: SchoolData;
  reports: SavedReport[];
  onBack: () => void;
  onNewReportForSchool: (school: SchoolData) => void;
  onLoadReport: (id: string) => void;
}

const SchoolDetails: React.FC<SchoolDetailsProps> = ({ school, reports, onBack, onNewReportForSchool, onLoadReport }) => {
  const sortedReports = [...reports].sort((a, b) => new Date(b.occurrenceDateTime).getTime() - new Date(a.occurrenceDateTime).getTime());

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg shadow-sm border-l-4 border-emerald-500">
        <div>
            <div className="flex items-center gap-2 mb-1">
                <button onClick={onBack} className="text-gray-400 hover:text-emerald-600 transition-colors flex items-center text-sm font-medium">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Voltar para lista
                </button>
                <span className="text-gray-300">|</span>
                <span className="text-emerald-600 font-bold tracking-wide text-xs uppercase">{school.zone}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{school.name}</h1>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-sm text-gray-600">
                <p className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {school.address}
                </p>
                <p className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Diretor(a): {school.director}
                </p>
                <p className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    {school.phone}
                </p>
                <span className="font-mono text-gray-500 bg-gray-100 px-2 rounded">INEP: {school.inep}</span>
            </div>
        </div>
        <div className="flex-shrink-0">
            <button 
                onClick={() => onNewReportForSchool(school)}
                className="bg-emerald-600 text-white px-5 py-3 rounded-lg shadow-lg hover:bg-emerald-700 hover:shadow-emerald-200 transition-all flex items-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                Nova Ocorrência Nesta Escola
            </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
            <SeverityDonutChart reports={reports} />
        </div>
        <div className="lg:col-span-2">
            <OccurrenceChart reports={reports} />
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Histórico de Ocorrências ({reports.length})</h3>
        </div>
        
        {sortedReports.length > 0 ? (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aluno</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gravidade</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedReports.map((report) => (
                            <tr key={report.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onLoadReport(report.id)}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(report.occurrenceDateTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{report.studentName}</div>
                                    <div className="text-xs text-gray-500">{report.studentGrade}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${report.occurrenceSeverity === 'Grave' ? 'bg-red-100 text-red-800' : 
                                          report.occurrenceSeverity === 'Moderada' ? 'bg-yellow-100 text-yellow-800' : 
                                          'bg-green-100 text-green-800'}`}>
                                        {report.occurrenceSeverity}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {report.status}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={(e) => { e.stopPropagation(); onLoadReport(report.id); }} className="text-emerald-600 hover:text-emerald-900">
                                        Ver Detalhes
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <div className="p-8 text-center text-gray-500">
                <p>Nenhuma ocorrência registrada para esta unidade escolar.</p>
                <p className="text-sm mt-2">Clique em "Nova Ocorrência" para começar.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default SchoolDetails;
