import React from 'react';

interface AppHeaderProps {
  onLogout: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onLogout }) => {
  return (
    <header className="bg-emerald-700 p-6 text-white flex justify-between items-center">
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
          <h1 className="text-2xl md:text-3xl font-bold">Registro de Ocorrência Escolar</h1>
          <p className="text-emerald-200 mt-1">Plataforma Inteligente para Gestão de Situações Críticas</p>
        </div>
      </div>
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
    </header>
  );
};

export default AppHeader;
