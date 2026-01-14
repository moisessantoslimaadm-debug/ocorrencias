
import React from 'react';
import type { OccurrenceReport, FormErrors } from '../../types';
import SectionHeader from '../SectionHeader';
import InputField from '../InputField';
import TextAreaField from '../TextAreaField';
import SelectField from '../SelectField';
import { occurrenceTypeLabels, severityOptions } from '../../constants';
import Tooltip from '../Tooltip';

interface TabOcorrenciaProps {
  formData: OccurrenceReport;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  errors: FormErrors;
}

const TabOcorrencia: React.FC<TabOcorrenciaProps> = ({ formData, handleChange, onCheckboxChange, onAnalyze, isAnalyzing, errors }) => {
  
  const handleAnalyzeClick = () => {
    if (!formData.detailedDescription || formData.detailedDescription.trim() === '') {
      const textarea = document.getElementById('detailedDescription');
      if (textarea) {
        textarea.focus();
        textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      onAnalyze();
    }
  };

  return (
    <div className="animate-fade-in-up space-y-4">
        <SectionHeader title="3. CARACTERIZAÇÃO DA OCORRÊNCIA" />
        <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200 space-y-6">
          
          {/* Contexto: Data e Local */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField 
                id="occurrenceDateTime" 
                name="occurrenceDateTime" 
                label="Data e hora da ocorrência" 
                type="datetime-local" 
                value={formData.occurrenceDateTime} 
                onChange={handleChange} 
                error={errors.occurrenceDateTime} 
                tooltip={<Tooltip text="Selecione a data e a hora exatas em que o fato ocorreu." />} 
            />
            <InputField 
                id="occurrenceLocation" 
                name="occurrenceLocation" 
                label="Local onde ocorreu" 
                type="text" 
                value={formData.occurrenceLocation} 
                onChange={handleChange} 
                error={errors.occurrenceLocation} 
                tooltip={<Tooltip text="Local específico onde a ocorrência aconteceu. Ex: Pátio, Sala 10, Banheiro masculino." />} 
            />
          </div>

          <div className="border-t border-gray-100"></div>

          {/* Classificação: Gravidade e Tipos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-1">
                <SelectField 
                  id="occurrenceSeverity" 
                  name="occurrenceSeverity" 
                  label="Gravidade da ocorrência" 
                  value={formData.occurrenceSeverity} 
                  onChange={handleChange} 
                  options={severityOptions} 
                  error={errors.occurrenceSeverity}
                  tooltip={<Tooltip text="Classificação do impacto da ocorrência." />}
                />
             </div>
             
             <div className="lg:col-span-2 bg-gray-50 p-4 rounded-md border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">Classificação do Tipo de Ocorrência:</label>
                {errors.occurrenceTypes && <p className="text-xs text-red-600 mb-2" role="alert">{errors.occurrenceTypes}</p>}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                  {occurrenceTypeLabels.map(({ key, label }) => (
                    <div key={key} className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id={key}
                          name={key}
                          type="checkbox"
                          checked={!!formData.occurrenceTypes[key]}
                          onChange={onCheckboxChange}
                          className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                        />
                      </div>
                      <div className="ml-2 text-sm">
                        <label htmlFor={key} className="text-gray-700 cursor-pointer select-none">{label}</label>
                      </div>
                    </div>
                  ))}
                </div>
                
                {formData.occurrenceTypes.other && (
                  <div className="mt-3 animate-fade-in-up-fast">
                    <InputField 
                      id="occurrenceOtherDescription" 
                      name="occurrenceOtherDescription" 
                      label="Especifique o tipo 'Outros'" 
                      type="text" 
                      value={formData.occurrenceOtherDescription} 
                      onChange={handleChange} 
                      error={errors.occurrenceOtherDescription} 
                      maxLength={200}
                      placeholder="Descreva o tipo de ocorrência..."
                      className="bg-white"
                    />
                  </div>
                )}
             </div>
          </div>
        </div>

        <SectionHeader title="4. DESCRIÇÃO DETALHADA DO FATO" />
        <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200">
          <div className="flex justify-between items-center mb-2">
             <div className="flex items-center gap-2">
                <label htmlFor="detailedDescription" className="text-sm font-medium text-gray-700">Relato do Ocorrido</label>
                <Tooltip text="Descreva o fato com o máximo de detalhes possível, de forma objetiva e imparcial. O que aconteceu? Quem estava envolvido? Como começou? Qual foi o desfecho?" />
             </div>
            <button 
              type="button" 
              onClick={handleAnalyzeClick} 
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-md hover:bg-emerald-200 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
            >
               {isAnalyzing ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.622 3.203a.75.75 0 01.756 0l1.25 1.25a.75.75 0 010 1.06l-1.25 1.25a.75.75 0 01-1.06 0l-1.25-1.25a.75.75 0 010-1.06l1.25-1.25zM12.5 6.5a.75.75 0 00-1.06 0l-1.25 1.25a.75.75 0 000 1.06l1.25 1.25a.75.75 0 001.06 0l1.25-1.25a.75.75 0 000-1.06L12.5 6.5zM5.378 8.203a.75.75 0 01.756 0l1.25 1.25a.75.75 0 010 1.06l-1.25 1.25a.75.75 0 01-1.06 0L4.122 10.51a.75.75 0 010-1.06l1.25-1.25zM10 11.25a.75.75 0 00-1.06 0l-1.25 1.25a.75.75 0 000 1.06l1.25 1.25a.75.75 0 001.06 0l1.25-1.25a.75.75 0 000-1.06L10 11.25z" clipRule="evenodd" />
                  </svg>
                )}
              <span>{isAnalyzing ? 'Analisando...' : 'Analisar com IA'}</span>
            </button>
          </div>
          <TextAreaField 
            id="detailedDescription" 
            name="detailedDescription" 
            label="" 
            subtitle="Relatar de forma objetiva, com sequência cronológica dos acontecimentos." 
            value={formData.detailedDescription} 
            onChange={handleChange} 
            rows={8} 
            error={errors.detailedDescription} 
            maxLength={2000} 
          />
        </div>
    </div>
  );
};

export default TabOcorrencia;
