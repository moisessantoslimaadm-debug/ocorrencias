import React from 'react';

interface TooltipProps {
  text: string;
}

const Tooltip: React.FC<TooltipProps> = ({ text }) => {
  return (
    <div className="group relative flex items-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 text-gray-400 cursor-pointer"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        tabIndex={0}
        aria-label="Informações adicionais"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <div
        className="absolute bottom-full mb-2 w-48 bg-gray-800 text-white text-xs rounded-md p-2 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300 pointer-events-none"
        role="tooltip"
      >
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
      </div>
    </div>
  );
};

export default Tooltip;
