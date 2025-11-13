import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: () => void;
}

// NOTE: In a real-world application, this would be handled by a backend server.
// The password should never be stored in plaintext in the frontend code.
// This is for demonstration purposes only.
const CORRECT_PASSWORD = 'itaberaba2026';

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate a network request
    setTimeout(() => {
      if (password === CORRECT_PASSWORD) {
        onLogin();
      } else {
        setError('Senha incorreta. Por favor, tente novamente.');
      }
      setIsLoading(false);
      setPassword('');
    }, 500);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-2xl m-4 animate-fade-in-up">
        <div className="text-center">
            <div className="mb-6 border-b pb-4">
                <p className="text-sm font-semibold text-gray-700">Prefeitura Municipal de Itaberaba</p>
                <p className="text-sm text-gray-600">Secretaria Municipal de Educação – SMED</p>
                <p className="text-sm text-gray-600">Coordenação de Gestão do Ensino e de Ações Socioeducativas</p>
            </div>
            <div className="flex items-center justify-center gap-3 text-emerald-700 mx-auto w-fit mb-4">
                <div className="flex-shrink-0 bg-emerald-700 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h1 className="text-2xl font-bold">Acesso Restrito</h1>
            </div>
            <p className="mt-2 text-sm text-gray-600">
            Plataforma Inteligente de Registro de Ocorrências
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password-input" className="sr-only">Senha</label>
              <input
                id="password-input"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`appearance-none rounded-md relative block w-full px-3 py-3 border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm ${error ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Digite a senha de acesso"
              />
            </div>
          </div>

          {error && (
            <p className="text-center text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:bg-emerald-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>Verificando...</span>
                </>
              ) : (
                'Entrar na Plataforma'
              )}
            </button>
          </div>
        </form>
         <p className="mt-6 text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;