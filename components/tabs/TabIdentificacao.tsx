
import React from 'react';
import type { OccurrenceReport, ReportImage, FormErrors } from '../../types';
import SectionHeader from '../SectionHeader';
import InputField from '../InputField';
import StudentPhotoUpload from '../StudentPhotoUpload';
import Tooltip from '../Tooltip';
import AutocompleteField from '../AutocompleteField';
import { schoolSuggestions, municipalitySuggestions } from '../../data/autocompleteData';

interface TabIdentificacaoProps {
  formData: OccurrenceReport;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  onPhotoChange: (photo: ReportImage | null) => void;
  onAutocompleteChange: (name: keyof OccurrenceReport, value: string) => void;
  errors: FormErrors;
}

const TabIdentificacao: React.FC<TabIdentificacaoProps> = ({ formData, handleChange, handleBlur, onPhotoChange, onAutocompleteChange, errors }) => {
  return (
    <div className="animate-fade-in-up space-y-4">
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AutocompleteField
            id="schoolUnit"
            name="schoolUnit"
            label="Unidade Escolar"
            value={formData.schoolUnit}
            onChange={(value) => onAutocompleteChange('schoolUnit', value)}
            suggestions={schoolSuggestions}
            className="lg:col-span-4"
            error={errors.schoolUnit}
            tooltip={<Tooltip text="Comece a digitar o nome da escola para ver sugestões." />}
          />
          <AutocompleteField
            id="municipality"
            name="municipality"
            label="Município"
            value={formData.municipality}
            onChange={(value) => onAutocompleteChange('municipality', value)}
            suggestions={municipalitySuggestions}
            className="lg:col-span-3"
            error={errors.municipality}
            tooltip={<Tooltip text="Comece a digitar o nome do município para ver sugestões." />}
          />
          <InputField id="uf" name="uf" label="UF" type="text" value={formData.uf} onChange={handleChange} error={errors.uf} tooltip={<Tooltip text="Sigla do Estado com 2 letras. Ex: BA, SP, RJ." />} />
          <InputField id="fillDate" name="fillDate" label="Data de Preenchimento" type="date" value={formData.fillDate} onChange={handleChange} className="lg:col-span-2" error={errors.fillDate} readOnly/>
          <InputField id="fillTime" name="fillTime" label="Horário" type="time" value={formData.fillTime} onChange={handleChange} className="lg:col-span-2" error={errors.fillTime} readOnly />
      </div>

      <SectionHeader title="1. IDENTIFICAÇÃO DO ALUNO ENVOLVIDO" />
      <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 flex justify-center items-start pt-4">
              <StudentPhotoUpload photo={formData.studentPhoto} onPhotoChange={onPhotoChange} />
          </div>
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField id="studentName" name="studentName" label="Nome completo" type="text" value={formData.studentName} onChange={handleChange} className="sm:col-span-2" error={errors.studentName} tooltip={<Tooltip text="Nome completo do aluno, sem abreviações." />} />
              <InputField id="studentDob" name="studentDob" label="Data de nascimento" type="date" value={formData.studentDob} onChange={handleChange} error={errors.studentDob} tooltip={<Tooltip text="Data em que o aluno nasceu." />} />
              <InputField id="studentAge" name="studentAge" label="Idade (anos)" type="number" value={formData.studentAge} onChange={handleChange} readOnly tooltip={<Tooltip text="Calculado automaticamente a partir da data de nascimento." />} />
              <InputField id="studentRegistration" name="studentRegistration" label="Nº de matrícula" type="text" value={formData.studentRegistration} onChange={handleChange} error={errors.studentRegistration} tooltip={<Tooltip text="Use apenas letras, números e hífens. Máximo de 20 caracteres." />} />
              <InputField id="studentGrade" name="studentGrade" label="Ano/Série" type="text" value={formData.studentGrade} onChange={handleChange} tooltip={<Tooltip text="Ano ou série em que o aluno está matriculado. Ex: 9º Ano, 1º Ano E.M." />} />
              <InputField id="studentShift" name="studentShift" label="Turno" type="text" value={formData.studentShift} onChange={handleChange} tooltip={<Tooltip text="Turno em que o aluno estuda. Ex: Manhã, Tarde, Noite." />} />
          </div>
      </div>
      
      <SectionHeader title="2. RESPONSÁVEL LEGAL" />
      <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField id="guardianName" name="guardianName" label="Nome completo" type="text" value={formData.guardianName} onChange={handleChange} tooltip={<Tooltip text="Nome completo do responsável legal pelo aluno." />} />
          <InputField id="guardianRelationship" name="guardianRelationship" label="Parentesco" type="text" value={formData.guardianRelationship} onChange={handleChange} tooltip={<Tooltip text="Qual a relação de parentesco com o aluno. Ex: Mãe, Pai, Avó, Responsável Legal." />} />
          <InputField id="guardianPhone" name="guardianPhone" label="Contato telefônico" type="tel" value={formData.guardianPhone} onChange={handleChange} onBlur={handleBlur} placeholder="(00) 00000-0000" error={errors.guardianPhone} tooltip={<Tooltip text="O número deve conter 10 ou 11 dígitos, incluindo o DDD." />} />
          <InputField id="guardianEmail" name="guardianEmail" label="E-mail de contato" type="email" value={formData.guardianEmail} onChange={handleChange} onBlur={handleBlur} placeholder="exemplo@email.com" error={errors.guardianEmail} tooltip={<Tooltip text="E-mail principal para contato com o responsável. Ex: email@exemplo.com." />} />
          <InputField id="guardianAddress" name="guardianAddress" label="Endereço completo" type="text" value={formData.guardianAddress} onChange={handleChange} onBlur={handleBlur} className="md:col-span-2" error={errors.guardianAddress} tooltip={<Tooltip text="Exemplo: Rua das Flores, 123, Centro, São Paulo - SP, 01000-000" />}/>
      </div>
    </div>
  );
};

export default TabIdentificacao;