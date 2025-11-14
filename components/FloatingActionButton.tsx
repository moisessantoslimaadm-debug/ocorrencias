import React, { useState, useRef, useEffect } from 'react';

interface FloatingActionButtonProps {
  onNewReport: () => void;
  onSaveDraft: () => void;
  onDownloadPdf: () => void;
  onExportExcel: () => void;
  showExportOptions: boolean;
  editingReportId?: string;
}

const FabAction: React.FC<{ onClick: () => void; label: string; children: React.ReactNode; disabled?: boolean }> = ({ onClick, label, children, disabled }) => (
    <div className="flex flex-row-reverse items-center gap-3">
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-100'}`}
            aria-label={label}
        >
            {children}
        </button>
        <span className="bg-gray-700 text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-md whitespace-nowrap">
            {label}
        </span>
    </div>
);


const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onNewReport,
  onSaveDraft,
  onDownloadPdf,
  onExportExcel,
  showExportOptions,
  editingReportId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const toggleMenu = () => {
      setIsOpen(prev => !prev);
  }

  return (
    <div ref={fabRef} className="fixed bottom-8 right-8 z-20 flex flex-col-reverse items-center gap-4">
       {/* Secondary Action Buttons */}
       <div
        className={`transition-all duration-300 ease-in-out flex flex-col-reverse items-center gap-4 ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {showExportOptions && (
            <>
                <FabAction onClick={onExportExcel} label="Exportar Excel">
                    {/* Excel Icon */}
                    <svg className="h-6 w-6 text-green-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21.17 3.25Q21.5 3.25 21.76 3.5 22 3.74 22 4.08V19.92Q22 20.26 21.76 20.5 21.5 20.75 21.17 20.75H7.83Q7.5 20.75 7.24 20.5 7 20.26 7 19.92V17H2.83Q2.5 17 2.24 16.76 2 16.5 2 16.17V7.83Q2 7.5 2.24 7.24 2.5 7 2.83 7H7V4.08Q7 3.74 7.24 3.5 7.5 3.25 7.83 3.25M7 15.5V8.5H3.5V15.5M12.21 6.21 14.53 10.41 16.85 6.21H18.93L15.5 12.04L19 17.79H16.9L14.53 13.5L12.15 17.79H10.1L13.56 12L10.1 6.21Z" /></svg>
                </FabAction>
                 <FabAction onClick={onDownloadPdf} label="Baixar PDF">
                    {/* PDF Icon */}
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H8C6.9 2 6 2.9 6 4V12C6 13.1 6.9 14 8 14H20C21.1 14 22 13.1 22 12V4C22 2.9 21.1 2 20 2M11 11H9V5H11M15.5 11H13V8H14.5C15.05 8 15.5 8.45 15.5 9V10C15.5 10.55 15.05 11 14.5 11M14.5 9.5H14V9.5H14.5M19 10H17V11H16V5H19V6H17.5V7.5H19V8.5H17.5V10H19M4 6H2V20C2 21.1 2.9 22 4 22H18V20H4Z" /></svg>
                </FabAction>
            </>
        )}

        {editingReportId && (
            <FabAction onClick={onSaveDraft} label="Salvar Rascunho">
                {/* Save Icon */}
                <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v12a1 1 0 01-1.293.959l-4.5-2.25a1 1 0 00-.914 0l-4.5 2.25A1 1 0 015 16V4z" /></svg>
            </FabAction>
        )}
        
        <FabAction onClick={onNewReport} label="Novo Relatório">
            {/* New Report Icon */}
            <svg className="h-6 w-6 text-emerald-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm1 4a1 1 0 000 2h8a1 1 0 100-2H5zm0 4a1 1 0 100 2h8a1 1 0 100-2H5z" clipRule="evenodd" /></svg>
        </FabAction>
      </div>

       {/* Main FAB */}
      <button
        type="button"
        onClick={toggleMenu}
        className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xl hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-transform transform hover:scale-110"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Ações rápidas"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};

export default FloatingActionButton;