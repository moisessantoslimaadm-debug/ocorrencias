import React from 'react';

interface AppHeaderProps {
  onLogout: () => void;
  onApiKeyClick: () => void;
  onNavigateToDashboard: () => void;
  onToggleHistory: () => void;
  currentView: 'dashboard' | 'form';
}

const AppHeader: React.FC<AppHeaderProps> = ({ onLogout, onApiKeyClick, onNavigateToDashboard, onToggleHistory, currentView }) => {
  return (
    <header className="bg-emerald-700 p-4 sm:p-6 text-white flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 bg-white/20 p-2 rounded-lg">
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
          <p className="text-emerald-200 mt-1 text-sm sm:text-base">Plataforma Inteligente para Gestão</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {currentView === 'form' && (
             <button
                onClick={onNavigateToDashboard}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-emerald-700 focus:ring-white transition-colors"
                aria-label="Voltar para o Painel"
                title="Voltar para o Painel"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L10 4.414l5.293 5.293a1 1 0 001.414-1.414l-7-7z" /><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm0 2A10 10 0 1010 0a10 10 0 000 20z" /></svg>
                <span className="hidden md:inline">Painel</span>
            </button>
        )}
         <button
            onClick={onToggleHistory}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-emerald-700 focus:ring-white transition-colors"
            aria-label="Ver Histórico"
            title="Ver Histórico"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            <span className="hidden md:inline">Histórico</span>
        </button>
        <button
            onClick={onApiKeyClick}
            className="p-2 text-white bg-emerald-600 rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-emerald-700 focus:ring-white transition-colors"
            aria-label="Configurar Chave de API"
            title="Configurar Chave de API"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
        </button>
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-emerald-700 focus:ring-white transition-colors"
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