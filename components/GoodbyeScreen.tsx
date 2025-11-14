import React from 'react';

interface GoodbyeScreenProps {
  onReturnToLogin: () => void;
}

const GoodbyeScreen: React.FC<GoodbyeScreenProps> = ({ onReturnToLogin }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md p-8 text-center bg-white rounded-lg shadow-2xl animate-fade-in-up">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Obrigado por utilizar a plataforma!
        </h1>
        <p className="text-gray-600 mb-6">
          Sessão encerrada com sucesso. Até a próxima!
        </p>
        <div className="my-4">
          <img
            src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNW9uNHFhajlqNDYzaDIwcjF1dnNoejVmemV1ZnJ5cnVxcW95OXdlcCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/mbTaFQPK6iqEo/giphy.gif"
            alt="Carlton Banks dançando"
            className="mx-auto rounded-lg shadow-lg"
          />
        </div>
        <p className="text-gray-700 mt-6 font-semibold">
          By Moisés LIma.
        </p>
        <button
          onClick={onReturnToLogin}
          className="mt-8 w-full px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
        >
          Voltar ao Login
        </button>
      </div>
    </div>
  );
};

export default GoodbyeScreen;