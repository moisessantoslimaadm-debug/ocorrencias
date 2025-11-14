import React from 'react';

interface InputFieldProps {
  id: string;
  name: string;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  error?: string;
  description?: string;
  ariaLabel?: string;
  tooltip?: React.ReactNode;
}

const formatPhoneNumber = (value: string): string => {
  if (!value) return value;

  const digitsOnly = value.replace(/\D/g, '');
  const phoneNumber = digitsOnly.slice(0, 11);
  const numberLength = phoneNumber.length;

  if (numberLength <= 2) {
    return `(${phoneNumber}`;
  }
  if (numberLength <= 6) {
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
  }
  if (numberLength <= 10) {
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 6)}-${phoneNumber.slice(6)}`;
  }
  return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7)}`;
};


const InputField: React.FC<InputFieldProps> = ({ id, name, label, type, value, onChange, onBlur, placeholder, className = '', readOnly = false, error, description, ariaLabel, tooltip }) => {
  const validationClasses = error
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500';
  
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (name === 'guardianPhone') {
      const formattedValue = formatPhoneNumber(e.target.value);
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: formattedValue,
        },
      };
      onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
    } else {
      onChange(e);
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
        <div className="flex items-center gap-1.5">
          <label htmlFor={id} className="mb-1 text-sm font-medium text-gray-700">{label}</label>
          {tooltip}
        </div>
      {description && <p id={descriptionId} className="mb-1 text-xs text-gray-500">{description}</p>}
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={handleInputChange}
        onBlur={onBlur}
        placeholder={placeholder || (type === 'date' ? 'AAAA-MM-DD' : undefined)}
        readOnly={readOnly}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''} ${validationClasses}`}
        aria-invalid={!!error}
        aria-describedby={describedBy || undefined}
        aria-label={ariaLabel || label}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 flex items-center gap-1 text-xs text-red-600 animate-fade-in-up-fast" role="alert">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

export default InputField;