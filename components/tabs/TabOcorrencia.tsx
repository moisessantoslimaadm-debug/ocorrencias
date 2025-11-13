import React from 'react';
import type { OccurrenceReport, FormErrors } from '../../types';
import SectionHeader from '../SectionHeader';
import InputField from '../InputField';
import TextAreaField from '../TextAreaField';
import SelectField from '../SelectField';
// FIX: `occurrenceTypeLabels` and `severityOptions` are exported from `constants.ts`.
import { occurrenceTypeLabels, severityOptions } from '../../constants';

interface TabOcorrenciaProps {
  formData: OccurrenceReport;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  errors: FormErrors;
}

const TabOcorrencia: React.FC<TabOcorrenciaProps> = ({ formData, handleChange, onCheckboxChange, onAnalyze, isAnalyzing, errors }) => {
  return (
    <div className="animate-fade-in-up space-y-4">
        <SectionHeader title="3. CARACTERIZAÇÃO DA OCORRÊNCIA" />
        <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField id="occurrenceDateTime" name="occurrenceDateTime" label="Data e hora da ocorrência" type="datetime-local" value={formData.occurrenceDateTime} onChange={handleChange} error={errors.occurrenceDateTime} />
            <InputField id="occurrenceLocation" name="occurrenceLocation" label="Local onde ocorreu" type="text" value={formData.occurrenceLocation} onChange={handleChange} error={errors.occurrenceLocation} />
            <SelectField 
              id="occurrenceSeverity" 
              name="occurrenceSeverity" 
              label="Gravidade da ocorrência" 
              value={formData.occurrenceSeverity} 
              onChange={handleChange} 
              options={severityOptions} 
              error={errors.occurrenceSeverity}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de ocorrência:</label>
            {errors.occurrenceTypes && <p className="text-xs text-red-600 mb-2" role="alert">{errors.occurrenceTypes}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
              {occurrenceTypeLabels.map(({ key, label }) => (
                <div key={key} className="flex items-center">
                  <input
                    id={key}
                    name={key}
                    type="checkbox"
                    checked={!!formData.occurrenceTypes[key]}
                    onChange={onCheckboxChange}
                    className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor={key} className="ml-2 block text-sm text-gray-900">{label}</label>
                </div>
              ))}
            </div>
            {formData.occurrenceTypes.other && (
              <InputField id="occurrenceOtherDescription" name="occurrenceOtherDescription" label="Especifique 'Outros'" type="text" value={formData.occurrenceOtherDescription} onChange={handleChange} className="mt-2" error={errors.occurrenceOtherDescription} />
            )}
          </div>
        </div>

        <SectionHeader title="4. DESCRIÇÃO DETALHADA DO FATO" />
        <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200">
          <div className="flex justify-end mb-2">
            <button 
              type="button" 
              onClick={onAnalyze} 
              disabled={!formData.detailedDescription || isAnalyzing}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-md hover:bg-emerald-200 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
            >
               {isAnalyzing ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.622 3.203a.75.75 0 01.756 0l1.25 1.25a.75.75 0 010 1.06l-1.25 1.25a.75.75 0 01-1.06 0l-1.25-1.25a.75.75 0 010-1.06l1.25-1.25zM12.5 6.5a.75.75 0 00-1.06 0l-1.25 1.25a.75.75 0 000 1.06l1.25 1.25a.75.75 0 001.06 0l1.25-1.25a.75.75 0 000-1.06L12.5 6.5zM5.378 8.203a.75.75 0 01.756 0l1.25 1.25a.75.75 0 010 1.06l-1.25 1.25a.75.75 0 01-1.06 0L4.122 10.51a.75.75 0 010-1.06l1.25-1.25zM10 11.25a.75.75 0 00-1.06 0l-1.25 1.25a.75.75 0 000 1.06l1.25 1.25a.75.75 0 001.06 0l1.25-1.25a.75.75 0 000-1.06L10 11.25z" clipRule="evenodd" />
                  </svg>
                )}
              <span>{isAnalyzing ? 'Analisando...' : 'Analisar com IA'}</span>
            </button>
          </div>
          <TextAreaField id="detailedDescription" name="detailedDescription" label="" subtitle="Relatar de forma objetiva, com sequência cronológica dos acontecimentos." value={formData.detailedDescription} onChange={handleChange} rows={6} error={errors.detailedDescription} maxLength={2000} />
        </div>
    </div>
  );
};

export default TabOcorrencia;