import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'info';
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

  const typeStyles = {
    success: {
      bgColor: 'bg-emerald-500',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      focusRing: 'focus:ring-offset-emerald-500',
    },
    info: {
      bgColor: 'bg-blue-500',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      focusRing: 'focus:ring-offset-blue-500',
    },
  };

  const currentStyle = typeStyles[type];

  return (
    <div
      role="alert"
      className={`fixed top-5 right-5 z-50 flex items-center p-4 rounded-lg shadow-lg text-white animate-fade-in-right ${currentStyle.bgColor}`}
    >
      <div className="flex-shrink-0">
        {currentStyle.icon}
      </div>
      <div className="ml-3 text-sm font-medium">
        {message}
      </div>
      <button
        type="button"
        className={`ml-4 -mr-1.5 -my-1.5 bg-white bg-opacity-20 rounded-full p-1.5 inline-flex items-center justify-center text-white hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white ${currentStyle.focusRing}`}
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
