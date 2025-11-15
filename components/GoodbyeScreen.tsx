import React from 'react';

interface GoodbyeScreenProps {
  onReturnToLogin: () => void;
}

const GoodbyeScreen: React.FC<GoodbyeScreenProps> = ({ onReturnToLogin }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md p-8 text-center bg-white rounded-lg shadow-2xl animate-fade-in-up">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-6">
            <svg className="h-10 w-10 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Obrigado por utilizar a plataforma!
        </h1>
        <p className="text-gray-600 mb-8">
          Sua sessão foi encerrada com segurança. Até a próxima!
        </p>
        <button
          onClick={onReturnToLogin}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
        >
          Voltar para o Login
        </button>
         <p className="mt-8 text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Plataforma Inteligente de Registro de Ocorrências.
        </p>
      </div>
    </div>
  );
};

export default GoodbyeScreen;