import React, { useEffect, useRef, useState } from 'react';
import type { GeminiAnalysisResult } from '../types';

interface GeminiAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisResult: GeminiAnalysisResult | null;
  onApplyAllSuggestions: (result: GeminiAnalysisResult) => void;
  isLoading: boolean;
  error: string | null;
  currentDescription: string;
  onRewrite: (description: string) => Promise<{ rewrittenText: string | null; error: string | null }>;
  onApplyRewrite: (newDescription: string) => void;
}

const GeminiAnalysisModal: React.FC<GeminiAnalysisModalProps> = ({ 
    isOpen, 
    onClose, 
    analysisResult, 
    onApplyAllSuggestions, 
    isLoading, 
    error,
    currentDescription,
    onRewrite,
    onApplyRewrite
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewrittenText, setRewrittenText] = useState<string | null>(null);
  const [rewriteError, setRewriteError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
        // Reset rewrite state when modal is opened
        setRewrittenText(null);
        setRewriteError(null);
        setIsRewriting(false);

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
  }, [isOpen, onClose]);


  const handleCopyToClipboard = (text: string, fieldName: string) => {
    if (!navigator.clipboard) {
      alert("A função de copiar não é suportada neste navegador.");
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    }).catch(err => {
        console.error("Falha ao copiar texto: ", err);
        alert("Não foi possível copiar o texto.");
    });
  };

  const handleRewriteClick = async () => {
    setIsRewriting(true);
    setRewriteError(null);
    setRewrittenText(null);
    const result = await onRewrite(currentDescription);
    if (result.error) {
        setRewriteError(result.error);
    } else {
        setRewrittenText(result.rewrittenText);
    }
    setIsRewriting(false);
  };

  const handleApplyRewriteClick = () => {
    if (rewrittenText) {
        onApplyRewrite(rewrittenText);
    }
  };


  if (!isOpen) {
    return null;
  }

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'grave':
        return 'bg-red-100 text-red-800';
      case 'moderada':
        return 'bg-yellow-100 text-yellow-800';
      case 'leve':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      className="non-printable fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 animate-backdrop-fade-in"
      aria-labelledby="gemini-modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div ref={modalRef} className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex justify-between items-start">
            <div className="flex items-center gap-3">
                 <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100">
                    <svg className="h-7 w-7 text-emerald-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.622 3.203a.75.75 0 01.756 0l1.25 1.25a.75.75 0 010 1.06l-1.25 1.25a.75.75 0 01-1.06 0l-1.25-1.25a.75.75 0 010-1.06l1.25-1.25zM12.5 6.5a.75.75 0 00-1.06 0l-1.25 1.25a.75.75 0 000 1.06l1.25 1.25a.75.75 0 001.06 0l1.25-1.25a.75.75 0 000-1.06L12.5 6.5zM5.378 8.203a.75.75 0 01.756 0l1.25 1.25a.75.75 0 010 1.06l-1.25 1.25a.75.75 0 01-1.06 0L4.122 10.51a.75.75 0 010-1.06l1.25-1.25zM10 11.25a.75.75 0 00-1.06 0l-1.25 1.25a.75.75 0 000 1.06l1.25 1.25a.75.75 0 001.06 0l1.25-1.25a.75.75 0 000-1.06L10 11.25z" clipRule="evenodd" />
                    </svg>
                 </div>
                 <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="gemini-modal-title">
                        Análise da Ocorrência com IA
                    </h3>
                    <p className="text-sm text-gray-500">Sugestões geradas por Gemini</p>
                 </div>
            </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 rounded-full p-1">
            <span className="sr-only">Fechar</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <svg className="animate-spin h-10 w-10 text-emerald-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600 font-medium">Analisando a ocorrência...</p>
              <p className="text-sm text-gray-500">Isso pode levar alguns segundos.</p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          {analysisResult && (
            <div className="space-y-6">
                <div className="flex justify-end">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getSeverityBadgeClass(analysisResult.severity)}`}>
                        Gravidade: {analysisResult.severity || 'Não classificada'}
                    </span>
                </div>

              <div>
                <h4 className="text-base font-semibold text-gray-800 mb-2">Resumo da IA</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border">{analysisResult.summary}</p>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-base font-semibold text-gray-800">Sugestões de Ações Imediatas</h4>
                   <button 
                        onClick={() => handleCopyToClipboard(analysisResult.immediateActions, 'actions')} 
                        disabled={copiedField === 'actions'}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                            copiedField === 'actions' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {copiedField === 'actions' ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>Copiado!</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span>Copiar</span>
                            </>
                        )}
                    </button>
                </div>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border">{analysisResult.immediateActions}</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-base font-semibold text-gray-800">Sugestões de Encaminhamentos</h4>
                    <button 
                        onClick={() => handleCopyToClipboard(analysisResult.referrals, 'referrals')} 
                        disabled={copiedField === 'referrals'}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                            copiedField === 'referrals' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {copiedField === 'referrals' ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>Copiado!</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span>Copiar</span>
                            </>
                        )}
                    </button>
                </div>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border">{analysisResult.referrals}</p>
              </div>
            </div>
          )}

          {/* New Rewrite Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-base font-semibold text-gray-800 mb-2">Aprimorar Descrição com IA</h4>
            <p className="text-sm text-gray-500 mb-4">Peça para a IA reescrever a descrição do fato de forma mais clara, objetiva e profissional para o relatório.</p>
            
            {!rewrittenText && (
                <button
                    type="button"
                    onClick={handleRewriteClick}
                    disabled={isRewriting || !currentDescription}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isRewriting && <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                    <span>{isRewriting ? 'Gerando...' : 'Gerar nova versão'}</span>
                </button>
            )}

            {rewriteError && (
                <p className="mt-2 text-sm text-red-600">{rewriteError}</p>
            )}
            
            {rewrittenText && (
                <div className="space-y-3 mt-2">
                    <label htmlFor="rewritten-text-area" className="text-sm font-medium text-gray-700">Versão sugerida pela IA (editável):</label>
                    <textarea 
                        id="rewritten-text-area"
                        value={rewrittenText}
                        onChange={(e) => setRewrittenText(e.target.value)}
                        rows={6}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => { setRewrittenText(null); setRewriteError(null); }} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                            Descartar
                        </button>
                        <button type="button" onClick={handleApplyRewriteClick} className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700">
                            Aplicar esta versão
                        </button>
                    </div>
                </div>
            )}
          </div>

        </div>
        <div className="bg-gray-50 px-6 py-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 rounded-b-lg">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:w-auto sm:text-sm transition"
            onClick={onClose}
          >
            Fechar
          </button>
          {!isLoading && !error && analysisResult && (
              <button
                type="button"
                onClick={() => onApplyAllSuggestions(analysisResult)}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:w-auto sm:text-sm transition"
              >
                Aplicar Sugestões
              </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeminiAnalysisModal;