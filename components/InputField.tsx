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
}

const formatPhoneNumber = (value: string): string => {
  if (!value) return value;

  // 1. Remove todos os caracteres não numéricos para obter uma string limpa de dígitos.
  const digitsOnly = value.replace(/\D/g, '');
  
  // 2. Limita a 11 dígitos, o máximo para um número de telefone brasileiro (DDD + 9 dígitos).
  const phoneNumber = digitsOnly.slice(0, 11);
  const numberLength = phoneNumber.length;

  // 3. Formata o número passo a passo, conforme o usuário digita.

  // Adiciona parêntese de abertura para o DDD
  if (numberLength <= 2) {
    return `(${phoneNumber}`;
  }

  // Adiciona parêntese de fechamento e espaço após o DDD
  if (numberLength <= 6) {
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
  }

  // Formata como telefone fixo (até 10 dígitos no total)
  if (numberLength <= 10) {
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 6)}-${phoneNumber.slice(6)}`;
  }

  // Formata como celular (11 dígitos)
  return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7)}`;
};


const InputField: React.FC<InputFieldProps> = ({ id, name, label, type, value, onChange, onBlur, placeholder, className = '', readOnly = false, error, description, ariaLabel }) => {
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
        onBlur={onBlur}
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