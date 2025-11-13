import React from 'react';

interface InputFieldProps {
  id: string;
  name: string;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  error?: string;
  description?: string;
  ariaLabel?: string;
}

const formatPhoneNumber = (value: string): string => {
  if (!value) return value;

  // Remove all non-digit characters and limit to 11 digits
  const digitsOnly = value.replace(/\D/g, '').slice(0, 11);
  const len = digitsOnly.length;

  if (len <= 2) {
    return `(${digitsOnly}`;
  }
  if (len <= 6) {
    return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2)}`;
  }
  if (len <= 10) { // For 7 to 10 digits (landline)
    return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2, 6)}-${digitsOnly.slice(6)}`;
  }
  // For 11 digits (mobile)
  return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2, 7)}-${digitsOnly.slice(7)}`;
};


const InputField: React.FC<InputFieldProps> = ({ id, name, label, type, value, onChange, placeholder, className = '', readOnly = false, error, description, ariaLabel }) => {
  const validationClasses = error
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500';
  
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (name === 'guardianPhone') {
      const formattedValue = formatPhoneNumber(e.target.value);
      // Create a synthetic event to pass the formatted value to the parent handler
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
      <label htmlFor={id} className="mb-1 text-sm font-medium text-gray-700">{label}</label>
      {description && <p id={descriptionId} className="mb-1 text-xs text-gray-500">{description}</p>}
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder || (type === 'date' ? 'AAAA-MM-DD' : undefined)}
        readOnly={readOnly}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''} ${validationClasses}`}
        aria-invalid={!!error}
        aria-describedby={describedBy || undefined}
        aria-label={ariaLabel}
      />
      {error && <p id={`${id}-error`} className="mt-1 text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
};

export default InputField;