import React, { useEffect, useRef, useState } from 'react';
import type { TrendInsight } from '../types';

interface TrendAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisResult: TrendInsight[] | null;
  isLoading: boolean;
  error: string | null;
}

const TrendAnalysisModal: React.FC<TrendAnalysisModalProps> = ({ isOpen, onClose, analysisResult, isLoading, error }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
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

  const handleCopyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    }).catch(err => {
        console.error("Falha ao copiar texto: ", err);
    });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="non-printable fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 animate-backdrop-fade-in"
      aria-labelledby="trend-modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div ref={modalRef} className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex justify-between items-start">
            <div className="flex items-center gap-3">
                 <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100">
                    <svg className="h-7 w-7 text-emerald-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 3.5a1.5 1.5 0 01.52 2.915l.385.21a2.5 2.5 0 002.185.022l.385-.21a1.5 1.5 0 011.96.615l.298.518a1.5 1.5 0 01-.065 1.701l-.21.385a2.5 2.5 0 000 2.186l.21.385a1.5 1.5 0 01.065 1.701l-.298.518a1.5 1.5 0 01-1.96.615l-.385-.21a2.5 2.5 0 00-2.185.022l-.385.21A1.5 1.5 0 0110 16.5a1.5 1.5 0 01-1.52-2.915l-.385-.21a2.5 2.5 0 00-2.185-.022l-.385.21a1.5 1.5 0 01-1.96-.615l-.298-.518a1.5 1.5 0 01.065-1.701l.21-.385a2.5 2.5 0 000-2.186l-.21-.385a1.5 1.5 0 01-.065-1.701l.298-.518a1.5 1.5 0 011.96-.615l.385.21a2.5 2.5 0 002.185-.022l.385-.21A1.5 1.5 0 0110 3.5zM6 10a4 4 0 118 0 4 4 0 01-8 0z" />
                    </svg>
                 </div>
                 <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="trend-modal-title">
                        Análise de Tendências com IA
                    </h3>
                    <p className="text-sm text-gray-500">Insights gerados por Gemini com base em todos os relatórios.</p>
                 </div>
            </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 rounded-full p-1" aria-label="Fechar">
            <span className="sr-only">Fechar</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <svg className="animate-spin h-10 w-10 text-emerald-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <p className="text-gray-600 font-medium">Analisando dados...</p>
              <p className="text-sm text-gray-500">Isso pode levar um momento.</p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4"><div className="flex"><div className="flex-shrink-0"><svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></div><div className="ml-3"><p className="text-sm text-red-700">{error}</p></div></div></div>
          )}
          {analysisResult && (
            <div className="space-y-4">
              {analysisResult.map((insight, index) => (
                <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-base font-semibold text-gray-800">{insight.title}</h4>
                    <button onClick={() => handleCopyToClipboard(insight.suggestion, index)} className="flex-shrink-0 px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors">
                      {copiedIndex === index ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{insight.suggestion}</p>
                </div>
              ))}
              {analysisResult.length === 0 && !isLoading && (
                 <div className="text-center text-gray-500 py-8">
                    <p>Nenhuma tendência significativa foi identificada com os dados atuais.</p>
                 </div>
              )}
            </div>
          )}
        </div>
        <div className="bg-gray-50 px-6 py-3 text-right rounded-b-lg">
          <button type="button" className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:w-auto sm:text-sm transition" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysisModal;
