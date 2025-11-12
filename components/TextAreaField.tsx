
import React from 'react';

interface TextAreaFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  subtitle?: string;
  error?: string;
  maxLength?: number;
}

const TextAreaField: React.FC<TextAreaFieldProps> = ({ id, name, label, value, onChange, placeholder, rows = 4, subtitle, error, maxLength }) => {
  const validationClasses = error
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500';

  const errorId = error ? `${id}-error` : undefined;
  const currentLength = value?.length || 0;

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between items-baseline">
        <div>
            <label htmlFor={id} className="mb-1 text-sm font-medium text-gray-700">{label}</label>
            {subtitle && <p className="text-xs text-gray-500 mb-1">{subtitle}</p>}
        </div>
        {maxLength && (
            <p className="text-xs text-gray-500 mb-1">
                {currentLength}/{maxLength}
            </p>
        )}
      </div>
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition ${validationClasses}`}
        aria-invalid={!!error}
        aria-describedby={errorId}
      />
      {error && <p id={errorId} className="mt-1 text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
};

export default TextAreaField;