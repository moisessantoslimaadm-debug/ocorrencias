import React, { useState, useEffect, useRef, useCallback } from 'react';

interface AutocompleteFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  error?: string;
}

const AutocompleteField: React.FC<AutocompleteFieldProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  suggestions,
  placeholder,
  className = '',
  error,
}) => {
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const componentRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const userInput = e.currentTarget.value;
    onChange(userInput);

    if (!userInput) {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = suggestions.filter(
      (suggestion) => suggestion.toLowerCase().indexOf(userInput.toLowerCase()) > -1
    );

    setFilteredSuggestions(filtered);
    setShowSuggestions(true);
    setActiveSuggestionIndex(-1);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setFilteredSuggestions([]);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (activeSuggestionIndex > -1 && filteredSuggestions[activeSuggestionIndex]) {
        e.preventDefault();
        handleSuggestionClick(filteredSuggestions[activeSuggestionIndex]);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (activeSuggestionIndex > 0) {
        setActiveSuggestionIndex(activeSuggestionIndex - 1);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (activeSuggestionIndex < filteredSuggestions.length - 1) {
        setActiveSuggestionIndex(activeSuggestionIndex + 1);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };
  
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (componentRef.current && !componentRef.current.contains(event.target as Node)) {
      setShowSuggestions(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);
  
  const validationClasses = error
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500';
    
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={`flex flex-col relative ${className}`} ref={componentRef}>
      <label htmlFor={id} className="mb-1 text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        id={id}
        name={name}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { if(value) setShowSuggestions(true); }}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition ${validationClasses}`}
        autoComplete="off"
        aria-invalid={!!error}
        aria-describedby={errorId}
        aria-autocomplete="list"
        aria-controls={`${id}-suggestions`}
        aria-activedescendant={activeSuggestionIndex > -1 ? `${id}-suggestion-${activeSuggestionIndex}` : ''}
      />
      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul
          id={`${id}-suggestions`}
          className="absolute top-full left-0 right-0 z-10 w-full bg-white border border-gray-200 rounded-b-md shadow-lg max-h-60 overflow-y-auto"
          role="listbox"
        >
          {filteredSuggestions.map((suggestion, index) => {
            const isActive = index === activeSuggestionIndex;
            return (
              <li
                id={`${id}-suggestion-${index}`}
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`px-3 py-2 cursor-pointer text-sm ${isActive ? 'bg-emerald-100' : 'hover:bg-gray-100'}`}
                role="option"
                aria-selected={isActive}
              >
                {suggestion}
              </li>
            );
          })}
        </ul>
      )}
      {error && <p id={errorId} className="mt-1 text-xs text-red-600 animate-fade-in-up-fast" role="alert">{error}</p>}
    </div>
  );
};

export default AutocompleteField;