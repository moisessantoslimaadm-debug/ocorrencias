
import React, { useEffect, useState } from 'react';
import type { OccurrenceReport, ReportImage, FormErrors } from '../../types';
import SectionHeader from '../SectionHeader';
import InputField from '../InputField';
import StudentPhotoUpload from '../StudentPhotoUpload';
import Tooltip from '../Tooltip';
import AutocompleteField from '../AutocompleteField';
import SelectField from '../SelectField';
import { schoolSuggestions, municipalitySuggestions, schoolsData } from '../../data/autocompleteData';
import { VALID_ZONES } from '../../constants';

interface TabIdentificacaoProps {
  formData: OccurrenceReport;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onPhotoChange: (photo: ReportImage | null) => void;
  onAutocompleteChange: (name: keyof OccurrenceReport, value: string) => void;
  setFormData: React.Dispatch<React.SetStateAction<OccurrenceReport & { id?: string }>>;
  errors: FormErrors;
}

const TabIdentificacao: React.FC<TabIdentificacaoProps> = ({ formData, handleChange, handleBlur, onPhotoChange, onAutocompleteChange, setFormData, errors }) => {
  const [isMapOpen, setIsMapOpen] = useState(false);
  
  // Efeito para preencher automaticamente os dados da escola quando selecionada
  useEffect(() => {
    const selectedSchool = schoolsData.find(s => s.name === formData.schoolUnit);
    if (selectedSchool) {
        setFormData(prev => ({
            ...prev,
            schoolAddress: selectedSchool.address,
            schoolInep: selectedSchool.inep,
            schoolDirector: selectedSchool.director,
            schoolPhone: selectedSchool.phone,
            schoolZone: selectedSchool.zone, // Preenche a Zona automaticamente se disponível
            // Gera um e-mail fictício baseado no INEP para funcionalidade de demonstração
            schoolEmail: `escola.${selectedSchool.inep}@smed.itaberaba.ba.gov.br`,
            municipality: "Itaberaba",
            uf: "BA"
        }));
    }
  }, [formData.schoolUnit, setFormData]);

  // Efeito para simular preenchimento automático do ID do aluno
  useEffect(() => {
    if (formData.studentName && !formData.studentId) {
       // Gera um ID hash simples baseado no nome para simular um ID de banco de dados
       const simpleHash = formData.studentName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
       const mockId = `STD-${new Date().getFullYear()}-${simpleHash}`;
       setFormData(prev => ({ ...prev, studentId: mockId }));
    } else if (!formData.studentName) {
       setFormData(prev => ({ ...prev, studentId: '' }));
    }
  }, [formData.studentName, formData.studentId, setFormData]);

  const zoneOptions = VALID_ZONES.map(zone => ({ value: zone, label: zone }));

  // Handler específico para restrição de caracteres na Matrícula
  const handleRegistrationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Permite apenas letras, números e hífens
    if (/^[a-zA-Z0-9-]*$/.test(value)) {
        handleChange(e);
    }
  };

  // Construct the map query URL
  const fullAddress = `${formData.guardianAddress}, ${formData.municipality} - ${formData.uf}`;
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="animate-fade-in-up space-y-4">
      <SectionHeader title="DADOS DA UNIDADE ESCOLAR" />
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
            tooltip={<Tooltip text="Comece a digitar o nome da escola para ver sugestões. Os dados de endereço e direção serão preenchidos automaticamente." />}
          />
          
          {/* Campos preenchidos automaticamente com base na escola selecionada */}
          <InputField 
            id="schoolAddress" 
            name="schoolAddress" 
            label="Endereço da Escola" 
            type="text" 
            value={formData.schoolAddress} 
            onChange={handleChange} 
            className="lg:col-span-4" 
            readOnly 
            description="Preenchido automaticamente."
          />
          <SelectField 
            id="schoolZone" 
            name="schoolZone" 
            label="Zona *" 
            value={formData.schoolZone} 
            onChange={handleChange} 
            onBlur={handleBlur}
            options={zoneOptions}
            error={errors.schoolZone}
            required={true}
            tooltip={<Tooltip text="Classificação da região: Zonas Urbanas (A-F), Escolas Nucleadas ou Rural de Pequeno Porte." />}
          />
          <InputField 
            id="schoolInep" 
            name="schoolInep" 
            label="INEP" 
            type="text" 
            value={formData.schoolInep} 
            onChange={handleChange}
            readOnly
            description="Automático"
          />
           <InputField 
            id="schoolDirector" 
            name="schoolDirector" 
            label="Diretor(a)" 
            type="text" 
            value={formData.schoolDirector} 
            onChange={handleChange} 
             className="lg:col-span-2"
             readOnly
             description="Preenchido automaticamente."
          />
           
           {/* Telefone e Botão de E-mail */}
           <div className="flex items-end gap-2">
                <InputField 
                    id="schoolPhone" 
                    name="schoolPhone" 
                    label="Telefone da Escola" 
                    type="text" 
                    value={formData.schoolPhone} 
                    onChange={handleChange}
                    readOnly
                    description="Automático"
                    className="flex-grow"
                />
                <a
                    href={`mailto:${formData.schoolEmail}`}
                    className={`mb-[1px] px-3 py-2.5 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center justify-center h-[42px] w-[42px] ${!formData.schoolEmail ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                    title={`Enviar e-mail para ${formData.schoolEmail || 'indisponível'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                </a>
           </div>
          
          <div className="lg:col-span-4 border-t border-gray-300 my-2"></div>

          <AutocompleteField
            id="municipality"
            name="municipality"
            label="Município"
            value={formData.municipality}
            onChange={(value) => onAutocompleteChange('municipality', value)}
            suggestions={municipalitySuggestions}
            className="lg:col-span-2"
            error={errors.municipality}
            tooltip={<Tooltip text="Comece a digitar o nome do município para ver sugestões." />}
          />
          <InputField 
            id="uf" 
            name="uf" 
            label="UF" 
            type="text" 
            value={formData.uf} 
            onChange={handleChange} 
            error={errors.uf} 
            maxLength={2}
            // HTML5 validation pattern for exactly 2 uppercase letters
            tooltip={<Tooltip text="Sigla do Estado com 2 letras maiúsculas. Ex: BA, SP, RJ." />} 
          />
          <InputField id="fillDate" name="fillDate" label="Data de Preenchimento" type="date" value={formData.fillDate} onChange={handleChange}  error={errors.fillDate} readOnly/>
          <InputField id="fillTime" name="fillTime" label="Horário" type="time" value={formData.fillTime} onChange={handleChange}  error={errors.fillTime} readOnly />
      </div>

      <SectionHeader title="1. IDENTIFICAÇÃO DO ALUNO ENVOLVIDO" />
      <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 flex justify-center items-start pt-4">
              <StudentPhotoUpload photo={formData.studentPhoto} onPhotoChange={onPhotoChange} />
          </div>
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField id="studentName" name="studentName" label="Nome completo" type="text" value={formData.studentName} onChange={handleChange} className="sm:col-span-2" error={errors.studentName} tooltip={<Tooltip text="Nome completo do aluno, sem abreviações (Ex: João Silva Santos)." />} />
              <InputField id="studentDob" name="studentDob" label="Data de nascimento" type="date" value={formData.studentDob} onChange={handleChange} error={errors.studentDob} tooltip={<Tooltip text="Data em que o aluno nasceu." />} />
              <InputField id="studentAge" name="studentAge" label="Idade (anos)" type="number" value={formData.studentAge} onChange={handleChange} readOnly tooltip={<Tooltip text="Calculado automaticamente a partir da data de nascimento." />} />
              
              {/* Campo com validação estrita de entrada */}
              <InputField 
                id="studentRegistration" 
                name="studentRegistration" 
                label="Número de Matrícula" 
                type="text" 
                value={formData.studentRegistration} 
                onChange={handleRegistrationChange} 
                error={errors.studentRegistration} 
                maxLength={20}
                tooltip={<Tooltip text="Use apenas letras, números e hífens. Máximo de 20 caracteres." />} 
              />

              {/* Campo ID do Aluno - Somente Leitura */}
              <InputField 
                id="studentId" 
                name="studentId" 
                label="ID do Aluno" 
                type="text" 
                value={formData.studentId} 
                onChange={() => {}} // Read-only
                readOnly
                className="bg-gray-50 text-gray-600"
                tooltip={<Tooltip text="Identificador único do aluno gerado automaticamente pelo sistema." />} 
              />
              
              <InputField id="studentGrade" name="studentGrade" label="Ano/Série" type="text" value={formData.studentGrade} onChange={handleChange} tooltip={<Tooltip text="Ano ou série em que o aluno está matriculado. Ex: 9º Ano, 1º Ano E.M." />} />
              <InputField id="studentShift" name="studentShift" label="Turno" type="text" value={formData.studentShift} onChange={handleChange} tooltip={<Tooltip text="Turno em que o aluno estuda. Ex: Manhã, Tarde, Noite." />} />
          </div>
      </div>
      
      <SectionHeader title="2. RESPONSÁVEL LEGAL" />
      <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField id="guardianName" name="guardianName" label="Nome completo" type="text" value={formData.guardianName} onChange={handleChange} tooltip={<Tooltip text="Nome completo do responsável legal pelo aluno." />} />
          <InputField id="guardianRelationship" name="guardianRelationship" label="Parentesco" type="text" value={formData.guardianRelationship} onChange={handleChange} tooltip={<Tooltip text="Qual a relação de parentesco com o aluno. Ex: Mãe, Pai, Avó, Responsável Legal." />} />
          <InputField id="guardianPhone" name="guardianPhone" label="Contato telefônico" type="tel" value={formData.guardianPhone} onChange={handleChange} onBlur={handleBlur} placeholder="(00) 00000-0000" error={errors.guardianPhone} tooltip={<Tooltip text="Use o formato (XX) XXXXX-XXXX. O número deve ter 10 ou 11 dígitos, incluindo o DDD." />} />
          <InputField id="guardianEmail" name="guardianEmail" label="E-mail de contato" type="email" value={formData.guardianEmail} onChange={handleChange} onBlur={handleBlur} placeholder="exemplo@email.com" error={errors.guardianEmail} tooltip={<Tooltip text="Forneça o principal e-mail para contato com o responsável. Ex: nome.sobrenome@email.com." />} />
          
          <div className="md:col-span-2 flex gap-2 items-end">
            <InputField 
                id="guardianAddress" 
                name="guardianAddress" 
                label="Endereço completo" 
                type="text" 
                value={formData.guardianAddress} 
                onChange={handleChange} 
                onBlur={handleBlur} 
                className="flex-grow" 
                error={errors.guardianAddress} 
                tooltip={<Tooltip text="Exemplo: Rua das Flores, 123, Centro, São Paulo - SP, 01000-000" />}
            />
            <button
                type="button"
                onClick={() => setIsMapOpen(true)}
                disabled={!formData.guardianAddress}
                className="mb-[1px] px-4 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 h-[42px]"
                title="Visualizar Residência no Mapa"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                GEO
            </button>
          </div>
      </div>

      {/* Map Modal */}
      {isMapOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 animate-backdrop-fade-in" onClick={() => setIsMapOpen(false)}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Geolocalização da Residência</h3>
                            <p className="text-xs text-gray-500">{fullAddress}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsMapOpen(false)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="flex-grow relative bg-gray-100">
                    <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        title="Mapa de Localização do Aluno"
                        src={mapSrc}
                        className="absolute inset-0"
                    ></iframe>
                </div>
                <div className="p-3 bg-white border-t border-gray-200 text-right">
                    <button 
                        onClick={() => setIsMapOpen(false)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium text-sm transition-colors"
                    >
                        Fechar Mapa
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TabIdentificacao;
