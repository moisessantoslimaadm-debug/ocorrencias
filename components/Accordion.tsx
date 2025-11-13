import React, { useState } from 'react';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Accordion: React.FC<AccordionProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <h2>
        <button
          type="button"
          className="flex items-center justify-between w-full p-3 font-medium text-left text-gray-700 hover:bg-gray-100"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls={`accordion-body-${title}`}
        >
          <span>{title}</span>
          <svg
            className={`w-5 h-5 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            ></path>
          </svg>
        </button>
      </h2>
      <div
        id={`accordion-body-${title}`}
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[1000px]' : 'max-h-0'
        }`}
      >
        <div className="p-3 border-t border-gray-200">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Accordion;
