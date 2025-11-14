import React from 'react';
import type { OccurrenceReport, ReportImage, FormErrors } from '../../types';
import SectionHeader from '../SectionHeader';
import InputField from '../InputField';
import StudentPhotoUpload from '../StudentPhotoUpload';
import Tooltip from '../Tooltip';

interface TabIdentificacaoProps {
  formData: OccurrenceReport;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  onPhotoChange: (photo: ReportImage | null) => void;
  errors: FormErrors;
}

const TabIdentificacao: React.FC<TabIdentificacaoProps> = ({ formData, handleChange, handleBlur, onPhotoChange, errors }) => {
  return (
    <div className="animate-fade-in-up space-y-4">
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <InputField id="schoolUnit" name="schoolUnit" label="Unidade Escolar" type="text" value={formData.schoolUnit} onChange={handleChange} className="lg:col-span-4" error={errors.schoolUnit} />
          <InputField id="municipality" name="municipality" label="Município" type="text" value={formData.municipality} onChange={handleChange} className="lg:col-span-3" error={errors.municipality} />
          <InputField id="uf" name="uf" label="UF" type="text" value={formData.uf} onChange={handleChange} error={errors.uf} />
          <InputField id="fillDate" name="fillDate" label="Data de Preenchimento" type="date" value={formData.fillDate} onChange={handleChange} className="lg:col-span-2" error={errors.fillDate} readOnly/>
          <InputField id="fillTime" name="fillTime" label="Horário" type="time" value={formData.fillTime} onChange={handleChange} className="lg:col-span-2" error={errors.fillTime} readOnly />
      </div>

      <SectionHeader title="1. IDENTIFICAÇÃO DO ALUNO ENVOLVIDO" />
      <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 flex justify-center items-start pt-4">
              <StudentPhotoUpload photo={formData.studentPhoto} onPhotoChange={onPhotoChange} />
          </div>
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField id="studentName" name="studentName" label="Nome completo" type="text" value={formData.studentName} onChange={handleChange} className="sm:col-span-2" error={errors.studentName} />
              <InputField id="studentDob" name="studentDob" label="Data de nascimento" type="date" value={formData.studentDob} onChange={handleChange} error={errors.studentDob} />
              <InputField id="studentAge" name="studentAge" label="Idade (anos)" type="number" value={formData.studentAge} onChange={handleChange} readOnly />
              <InputField id="studentRegistration" name="studentRegistration" label="Nº de matrícula" type="text" value={formData.studentRegistration} onChange={handleChange} error={errors.studentRegistration} tooltip={<Tooltip text="Use apenas letras, números e hífens. Máximo de 20 caracteres." />} />
              <InputField id="studentGrade" name="studentGrade" label="Ano/Série" type="text" value={formData.studentGrade} onChange={handleChange} />
              <InputField id="studentShift" name="studentShift" label="Turno" type="text" value={formData.studentShift} onChange={handleChange} />
          </div>
      </div>
      
      <SectionHeader title="2. RESPONSÁVEL LEGAL" />
      <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField id="guardianName" name="guardianName" label="Nome completo" type="text" value={formData.guardianName} onChange={handleChange} />
          <InputField id="guardianRelationship" name="guardianRelationship" label="Parentesco" type="text" value={formData.guardianRelationship} onChange={handleChange} />
          <InputField id="guardianPhone" name="guardianPhone" label="Contato telefônico" type="tel" value={formData.guardianPhone} onChange={handleChange} onBlur={handleBlur} placeholder="(00) 00000-0000" error={errors.guardianPhone} tooltip={<Tooltip text="O número deve conter 10 ou 11 dígitos, incluindo o DDD." />} />
          <InputField id="guardianEmail" name="guardianEmail" label="E-mail de contato" type="email" value={formData.guardianEmail} onChange={handleChange} onBlur={handleBlur} placeholder="exemplo@email.com" error={errors.guardianEmail} />
          <InputField id="guardianAddress" name="guardianAddress" label="Endereço completo" type="text" value={formData.guardianAddress} onChange={handleChange} onBlur={handleBlur} className="md:col-span-2" error={errors.guardianAddress}/>
      </div>
    </div>
  );
};

export default TabIdentificacao;