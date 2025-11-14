import React, { useEffect, useRef, useState } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  currentApiKey: string | null;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, currentApiKey }) => {
  const [key, setKey] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
        setKey(currentApiKey || '');
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      
      const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements?.[0];
      setTimeout(() => firstElement?.focus(), 100);

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
        if (event.key === 'Tab' && focusableElements) {
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            if (event.shiftKey) {
                if (document.activeElement === firstElement) { lastElement.focus(); event.preventDefault(); }
            } else {
                if (document.activeElement === lastElement) { firstElement.focus(); event.preventDefault(); }
            }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        previouslyFocusedElement.current?.focus();
      };
    }
  }, [isOpen, onClose, currentApiKey]);

  const handleSave = () => {
    onSave(key);
  };
  
  const handleClear = () => {
    setKey('');
    onSave('');
  };


  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="non-printable fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 animate-backdrop-fade-in"
      aria-labelledby="api-key-modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div ref={modalRef} className="bg-white rounded-lg shadow-xl max-w-lg w-full m-4 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex justify-between items-start">
            <div className="flex items-center gap-3">
                 <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100">
                    <svg className="h-7 w-7 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                    </svg>
                 </div>
                 <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="api-key-modal-title">
                        Configurar Chave de API do Gemini
                    </h3>
                    <p className="text-sm text-gray-500">Sua chave é salva localmente no seu navegador.</p>
                 </div>
            </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 rounded-full p-1" aria-label="Fechar">
            <span className="sr-only">Fechar</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
            <div>
                <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-700 mb-1">
                    Sua Chave de API
                </label>
                <input
                    type="password"
                    id="api-key-input"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Cole sua chave de API aqui"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                />
            </div>
            <p className="text-xs text-gray-500">
                Para usar os recursos de IA, você precisa de uma chave de API do Google Gemini. 
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline ml-1">
                    Obtenha uma chave aqui.
                </a>
            </p>
        </div>
        <div className="bg-gray-50 px-6 py-3 flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-3 rounded-b-lg">
          {currentApiKey && (
            <button
                type="button"
                className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={handleClear}
            >
                Remover Chave
            </button>
          )}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 w-full sm:w-auto">
            <button
                type="button"
                className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:text-sm"
                onClick={onClose}
            >
                Cancelar
            </button>
            <button
                type="button"
                className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:text-sm"
                onClick={handleSave}
            >
                Salvar Chave
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;