
import React from 'react';

interface AppHeaderProps {
  onLogout: () => void;
  onNavigateToDashboard: () => void;
  onNavigateToSchools: () => void;
  onToggleHistory: () => void;
  currentView: 'dashboard' | 'form' | 'schools' | 'school_details';
  onPrint: () => void;
  showPrintButton: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  onLogout, 
  onNavigateToDashboard, 
  onNavigateToSchools, 
  onToggleHistory, 
  currentView, 
  onPrint, 
  showPrintButton 
}) => {
  return (
    <header className="bg-[#90EE90] p-4 sm:p-6 text-gray-800 flex justify-between items-center break-inside-avoid">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 bg-emerald-700/90 p-2 rounded-lg">
          <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-8 w-8 text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth="2"
          >
              <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
          </svg>
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Registro de Ocorrência Escolar</h1>
          <p className="text-emerald-800 mt-1 text-sm sm:text-base">Secretaria Municipal de Educação – Itaberaba/BA</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {currentView !== 'dashboard' && (
             <button
                onClick={onNavigateToDashboard}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-emerald-700 rounded-md hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#90EE90] focus:ring-white transition-colors"
                aria-label="Voltar para o Painel"
                title="Voltar para o Painel"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L10 4.414l5.293 5.293a1 1 0 001.414-1.414l-7-7z" /><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm0 2A10 10 0 1010 0a10 10 0 000 20z" /></svg>
                <span className="hidden md:inline">Painel</span>
            </button>
        )}
        
        <button
            onClick={onNavigateToSchools}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#90EE90] focus:ring-white transition-colors ${currentView === 'schools' || currentView === 'school_details' ? 'bg-emerald-900 shadow-inner' : 'bg-emerald-700 hover:bg-emerald-800'}`}
            aria-label="Ver Escolas"
            title="Ver Escolas"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
            <span className="hidden md:inline">Escolas</span>
        </button>

         {showPrintButton && (
             <button
                onClick={onPrint}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-emerald-700 rounded-md hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#90EE90] focus:ring-white transition-colors"
                aria-label="Imprimir Relatório"
                title="Imprimir Relatório"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v3a2 2 0 002 2h6a2 2 0 002-2v-3h1a2 2 0 002-2v-3a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                </svg>
                <span className="hidden md:inline">Imprimir</span>
            </button>
        )}
         <button
            onClick={onToggleHistory}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-emerald-700 rounded-md hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#90EE90] focus:ring-white transition-colors"
            aria-label="Ver Histórico"
            title="Ver Histórico"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            <span className="hidden md:inline">Histórico</span>
        </button>
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-700 rounded-md hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#90EE90] focus:ring-white transition-colors"
          aria-label="Sair da plataforma"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
