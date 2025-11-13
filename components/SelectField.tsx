import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  error?: string;
  className?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({ id, name, label, value, onChange, options, error, className = '' }) => {
  const validationClasses = error
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500';
  
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={`flex flex-col ${className}`}>
      <label htmlFor={id} className="mb-1 text-sm font-medium text-gray-700">{label}</label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition ${validationClasses}`}
        aria-invalid={!!error}
        aria-describedby={errorId}
      >
        <option value="" disabled>Selecione...</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p id={errorId} className="mt-1 text-xs text-red-600 animate-fade-in-up-fast" role="alert">{error}</p>}
    </div>
  );
};

export default SelectField;