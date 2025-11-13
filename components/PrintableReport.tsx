import React from 'react';
import type { OccurrenceReport } from '../types';

interface PrintableReportProps {
  reportData: OccurrenceReport;
}

const occurrenceTypeLabelsMap: Record<keyof OccurrenceReport['occurrenceTypes'], string> = {
    physicalAssault: 'Agressão física',
    verbalAssault: 'Agressão verbal/ofensas',
    bullying: 'Situação de bullying',
    propertyDamage: 'Danos ao patrimônio',
    truancy: 'Fuga/abandono de sala ou unidade escolar',
    socialRisk: 'Situação de risco/vulnerabilidade social',
    prohibitedSubstances: 'Uso/porte de substâncias proibidas',
    other: 'Outros',
};

// FIX: Moved DataField component outside of PrintableReport to prevent re-creation on every render, a React best practice.
const DataField = ({ label, value, className = '' }: {label: string, value: string | undefined | null, className?: string}) => (
  <div className={`flex flex-col mb-2 ${className}`}>
    <span className="text-xs font-semibold text-gray-600 uppercase">{label}</span>
    <span className="text-sm border-b border-dotted border-gray-400 min-h-[20px] pb-1">{value || '\u00A0'}</span>
  </div>
);

// FIX: Moved Section component outside of PrintableReport and refactored to use a typed props interface.
// This is a React best practice for performance and code clarity, and it resolves the 'children' prop error.
interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <div className="mb-4 break-inside-avoid">
    <h3 className="text-base font-bold bg-gray-200 p-2 border border-black">{title}</h3>
    <div className="p-2 border border-t-0 border-black">{children}</div>
  </div>
);

const PrintableReport: React.FC<PrintableReportProps> = ({ reportData }) => {
  const {
    schoolUnit, municipality, uf, fillDate, fillTime,
    studentName, studentPhoto, studentDob, studentAge, studentGrade, studentShift, studentRegistration,
    guardianName, guardianRelationship, guardianPhone, guardianEmail, guardianAddress,
    occurrenceDateTime, occurrenceLocation, occurrenceSeverity, occurrenceTypes, occurrenceOtherDescription,
    detailedDescription, images, peopleInvolved, immediateActions, referralsMade, socialServiceObservation,
    reporterName, reporterDate, guardianSignatureName, guardianSignatureDate, socialWorkerSignatureName, socialWorkerSignatureDate,
    modificationHistory
  } = reportData;

  const formatDateTimeLocal = (isoString: string | undefined | null) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '';
      // Format to DD/MM/YYYY, HH:mm
      return new Intl.DateTimeFormat('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date);
    } catch (e) {
      return '';
    }
  };

  const formattedOccurrenceDateTime = formatDateTimeLocal(occurrenceDateTime);

  const checkedOccurrenceTypes = Object.entries(occurrenceTypes)
    .filter(([, isChecked]) => isChecked)
    .map(([key]) => occurrenceTypeLabelsMap[key as keyof typeof occurrenceTypeLabelsMap])
    .join(', ');

  return (
    <div className="printable-area hidden">
      <div className="p-8 bg-white text-black font-sans">
        <header className="text-center mb-6 border-b-2 border-black pb-2">
          <h1 className="text-xl font-bold">FICHA DE REGISTRO DE OCORRÊNCIA ESCOLAR</h1>
        </header>

        <section className="mb-4 border border-black p-2">
            <div className="grid grid-cols-4 gap-x-4">
                <DataField label="Unidade Escolar" value={schoolUnit} className="col-span-4" />
                <DataField label="Município" value={municipality} className="col-span-3" />
                <DataField label="UF" value={uf} />
                <DataField label="Data de Preenchimento" value={fillDate} className="col-span-2" />
                <DataField label="Horário" value={fillTime} className="col-span-2" />
            </div>
        </section>
        
        <Section title="1. IDENTIFICAÇÃO DO ALUNO ENVOLVIDO">
            <div className="flex flex-row gap-x-4">
                <div className="w-28 flex-shrink-0">
                    <div className="w-28 h-28 border border-black flex items-center justify-center bg-gray-100">
                        {studentPhoto ? (
                            <img src={studentPhoto.dataUrl} alt="Foto do Aluno" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xs text-gray-500 text-center">Sem foto</span>
                        )}
                    </div>
                </div>
                <div className="flex-grow grid grid-cols-2 gap-x-4">
                    <DataField label="Nome completo" value={studentName} className="col-span-2"/>
                    <DataField label="Data de nascimento" value={studentDob} />
                    <DataField label="Idade (anos)" value={studentAge} />
                    <DataField label="Nº de matrícula" value={studentRegistration} />
                    <DataField label="Ano/Série" value={studentGrade} />
                    <DataField label="Turno" value={studentShift} />
                </div>
            </div>
        </Section>
        
        <Section title="2. RESPONSÁVEL LEGAL">
            <div className="grid grid-cols-2 gap-x-4">
                <DataField label="Nome completo" value={guardianName} />
                <DataField label="Parentesco" value={guardianRelationship} />
                <DataField label="Contato telefônico" value={guardianPhone} />
                <DataField label="E-mail de contato" value={guardianEmail} />
                <DataField label="Endereço completo" value={guardianAddress} className="col-span-2" />
            </div>
        </Section>

        <Section title="3. CARACTERIZAÇÃO DA OCORRÊNCIA">
            <div className="grid grid-cols-4 gap-x-4 mb-2">
                <DataField label="Data e Hora da Ocorrência" value={formattedOccurrenceDateTime} className="col-span-2" />
                <DataField label="Local onde ocorreu" value={occurrenceLocation} />
                <DataField label="Gravidade da Ocorrência" value={occurrenceSeverity} />
            </div>
             <DataField label="Tipo(s) de ocorrência" value={checkedOccurrenceTypes} />
             {occurrenceTypes.other && <DataField label="Especifique 'Outros'" value={occurrenceOtherDescription} />}
        </Section>

        <Section title="4. DESCRIÇÃO DETALHADA DO FATO">
          <p className="text-sm p-2 border border-gray-400 min-h-[60px] whitespace-pre-wrap">{detailedDescription || 'Não preenchido.'}</p>
        </Section>
        
        <Section title="5. EVIDÊNCIAS (IMAGENS)">
            {images && images.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                    {images.map((image, index) => (
                        <div key={index} className="break-inside-avoid">
                          <div className="border border-gray-300 p-1 flex justify-center items-center bg-gray-50 h-48">
                            <img
                              src={image.dataUrl}
                              alt={`Evidência ${index + 1}: ${image.name}`}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <p className="text-xs mt-1 text-gray-700 text-center break-all">{image.name}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500">Nenhuma imagem anexada.</p>
            )}
        </Section>

        <Section title="6. PESSOAS ENVOLVIDAS">
          <p className="text-sm p-2 border border-gray-400 min-h-[60px] whitespace-pre-wrap">{peopleInvolved || 'Não preenchido.'}</p>
        </Section>

        <Section title="7. PROVIDÊNCIAS IMEDIATAS ADOTADAS">
          <p className="text-sm p-2 border border-gray-400 min-h-[60px] whitespace-pre-wrap">{immediateActions || 'Não preenchido.'}</p>
        </Section>

        <Section title="8. ENCAMINHAMENTOS REALIZADOS">
          <p className="text-sm p-2 border border-gray-400 min-h-[60px] whitespace-pre-wrap">{referralsMade || 'Não preenchido.'}</p>
        </Section>

        <Section title="9. AVALIAÇÃO E OBSERVAÇÕES DO SERVIÇO SOCIAL">
          <p className="text-sm p-2 border border-gray-400 min-h-[60px] whitespace-pre-wrap">{socialServiceObservation || 'Não preenchido.'}</p>
        </Section>

        {modificationHistory && modificationHistory.length > 0 && (
            <Section title="10. HISTÓRICO DE MODIFICAÇÕES">
                <ul className="list-disc pl-5 space-y-1 text-sm">
                    {modificationHistory.map((mod, index) => (
                        <li key={index}>
                            Relatório atualizado em: {new Date(mod.date).toLocaleString('pt-BR')}
                        </li>
                    ))}
                </ul>
            </Section>
        )}
        
        <Section title="11. ASSINATURAS">
            <div className="grid grid-cols-2 gap-x-8 gap-y-12 mt-12 text-sm">
                <div className="text-center">
                    <p className="border-t border-black pt-1">{reporterName || '\u00A0'}</p>
                    <p className="text-xs">Responsável pelo registro (Data: {reporterDate || '__/__/____'})</p>
                </div>
                <div className="text-center">
                    <p className="border-t border-black pt-1">{guardianSignatureName || '\u00A0'}</p>
                    <p className="text-xs">Responsável legal do aluno (Data: {guardianSignatureDate || '__/__/____'})</p>
                </div>
                <div className="text-center col-span-2 pt-6">
                    <p className="border-t border-black pt-1">{socialWorkerSignatureName || '\u00A0'}</p>
                    <p className="text-xs">Assistente Social (Data: {socialWorkerSignatureDate || '__/__/____'})</p>
                </div>
            </div>
        </Section>

        <footer className="text-center text-gray-500 text-xs mt-12 pt-4 border-t border-gray-300">
          <p>Plataforma de Registro de Ocorrências &copy; {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
};

export default PrintableReport;