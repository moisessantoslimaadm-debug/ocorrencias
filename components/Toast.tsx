import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-close after 5 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-emerald-500' : 'bg-red-500';
  const icon = type === 'success' ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ) : null;

  return (
    <div
      role="alert"
      className={`fixed top-5 right-5 z-50 flex items-center p-4 rounded-lg shadow-lg text-white animate-fade-in-right ${bgColor}`}
    >
      <div className="flex-shrink-0">
        {icon}
      </div>
      <div className="ml-3 text-sm font-medium">
        {message}
      </div>
      <button
        type="button"
        className="ml-4 -mr-1.5 -my-1.5 bg-white bg-opacity-20 rounded-full p-1.5 inline-flex items-center justify-center text-white hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-emerald-500 focus:ring-white"
        onClick={onClose}
        aria-label="Fechar"
      >
        <span className="sr-only">Fechar</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <style>{`
        @keyframes fade-in-right {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fade-in-right {
          animation: fade-in-right 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Toast;
