import React from 'react';
import type { SavedReport } from '../types';
import SeverityDonutChart from './SeverityDonutChart';

interface DashboardProps {
  reports: SavedReport[];
  onLoadReport: (id: string) => void;
  onNewReport: () => void;
}

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
  <div className="bg-white p-5 rounded-lg shadow-md flex items-center gap-4 border-l-4" style={{ borderColor: color }}>
    <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20`}}>
      <div style={{ color: color }}>{icon}</div>
    </div>
    <div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'Novo': return 'bg-blue-100 text-blue-800';
        case 'Em Análise': return 'bg-purple-100 text-purple-800';
        case 'Resolvido': return 'bg-green-100 text-green-800';
        case 'Arquivado': return 'bg-gray-200 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const Dashboard: React.FC<DashboardProps> = ({ reports, onLoadReport, onNewReport }) => {
  const totalReports = reports.length;
  const inAnalysis = reports.filter(r => r.status === 'Em Análise').length;
  const highSeverity = reports.filter(r => r.status !== 'Arquivado' && r.occurrenceSeverity === 'Grave').length;

  const recentReports = [...reports]
    .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
    .slice(0, 5);

  return (
    <div className="animate-fade-in-up p-1">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Painel de Controle</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <button onClick={onNewReport} className="md:col-span-1 lg:row-span-2 bg-emerald-600 text-white p-6 rounded-lg shadow-lg hover:bg-emerald-700 transition-transform transform hover:scale-105 flex flex-col items-center justify-center text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="text-xl font-semibold">Registrar Nova Ocorrência</span>
            <span className="text-sm mt-1 opacity-90">Comece um novo formulário do zero.</span>
        </button>
        <StatCard title="Total de Relatórios" value={totalReports} color="#10b981" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>} />
        <StatCard title="Em Análise" value={inAnalysis} color="#8b5cf6" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>} />
        <StatCard title="Casos Graves Ativos" value={highSeverity} color="#ef4444" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
           <h2 className="text-xl font-bold text-gray-800 mb-4">Relatórios Recentes</h2>
           {recentReports.length > 0 ? (
               <ul className="space-y-3">
                   {recentReports.map(report => (
                       <li key={report.id}>
                           <button onClick={() => onLoadReport(report.id)} className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400">
                               <div className="flex justify-between items-center">
                                   <div>
                                       <p className="font-semibold text-gray-800">{report.studentName}</p>
                                       <p className="text-sm text-gray-500">
                                           {new Date(report.savedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} &middot; Gravidade: {report.occurrenceSeverity || 'N/D'}
                                       </p>
                                   </div>
                                   <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusBadge(report.status)}`}>
                                       {report.status}
                                   </span>
                               </div>
                           </button>
                       </li>
                   ))}
               </ul>
           ) : (
               <p className="text-gray-500 text-center py-8">Nenhum relatório foi registrado ainda.</p>
           )}
        </div>
        <div className="lg:col-span-1">
          <SeverityDonutChart reports={reports} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;