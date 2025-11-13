import React from 'react';
import type { OccurrenceReport } from '../types';

interface PrintableReportProps {
  reportData: OccurrenceReport | null;
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

const DataPair = ({ label, value, className = '' }: {label: string, value: string | undefined | null, className?: string}) => (
  <div className={`py-1.5 break-inside-avoid ${className}`}>
    <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</dt>
    <dd className="text-sm text-gray-800 min-h-[20px]">{value || <span className="text-gray-400 italic">Não preenchido</span>}</dd>
  </div>
);

const TextBlock = ({ value }: { value: string | undefined | null }) => (
    <div className="p-3 border border-gray-200 bg-gray-50/50 rounded-md min-h-[80px] whitespace-pre-wrap text-sm text-gray-800">
        {value || <p className="text-gray-400 italic">Não preenchido</p>}
    </div>
);

interface SectionProps {
  title: string;
  children: React.ReactNode;
  titleNumber: number;
}
const Section: React.FC<SectionProps> = ({ title, children, titleNumber }) => (
  <section className="mb-4 break-inside-avoid">
    <h3 className="text-base font-bold flex items-center gap-3 p-2 border-b-2 border-emerald-600 text-gray-800">
        <span className="flex items-center justify-center w-6 h-6 bg-emerald-600 text-white rounded-full text-sm font-bold">{titleNumber}</span>
        <span>{title}</span>
    </h3>
    <div className="p-3">
        {children}
    </div>
  </section>
);

const PrintableReport: React.FC<PrintableReportProps> = ({ reportData }) => {
  if (!reportData) {
    return <div className="printable-area hidden"></div>;
  }
  
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
      return new Intl.DateTimeFormat('pt-BR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).format(date).replace(',', '');
    } catch (e) { return ''; }
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return '';
    try {
        const date = new Date(`${dateString}T00:00:00`);
        if (isNaN(date.getTime())) return '';
        return new Intl.DateTimeFormat('pt-BR').format(date);
    } catch(e) { return ''; }
  };

  const formattedOccurrenceDateTime = formatDateTimeLocal(occurrenceDateTime);
  const checkedOccurrenceTypes = Object.entries(occurrenceTypes)
    .filter(([, isChecked]) => isChecked)
    .map(([key]) => occurrenceTypeLabelsMap[key as keyof typeof occurrenceTypeLabelsMap])
    .join(', ');

  return (
    <div className="printable-area hidden">
      <div className="p-8 bg-white text-black font-sans text-base">
        <header className="text-center mb-8 border-b-4 border-emerald-600 pb-4">
            <div className="flex items-center justify-center gap-4 text-emerald-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <h1 className="text-2xl font-bold">FICHA DE REGISTRO DE OCORRÊNCIA ESCOLAR</h1>
            </div>
        </header>

        <section className="mb-4 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
             <h3 className="text-sm font-bold text-emerald-800 mb-2">DADOS GERAIS DO REGISTRO</h3>
             <dl className="grid grid-cols-4 gap-x-4">
                <DataPair label="Unidade Escolar" value={schoolUnit} className="col-span-4" />
                <DataPair label="Município" value={municipality} className="col-span-2" />
                <DataPair label="UF" value={uf} className="col-span-2"/>
                <DataPair label="Data de Preenchimento" value={formatDate(fillDate)} className="col-span-2" />
                <DataPair label="Horário" value={fillTime} className="col-span-2" />
            </dl>
        </section>
        
        <Section title="IDENTIFICAÇÃO DO ALUNO" titleNumber={1}>
            <div className="flex flex-row gap-x-6 items-start">
                <div className="w-28 flex-shrink-0">
                    <div className="w-28 h-32 border-2 border-gray-300 rounded-md flex items-center justify-center bg-gray-100">
                        {studentPhoto ? (
                            <img src={studentPhoto.dataUrl} alt="Foto do Aluno" className="w-full h-full object-cover rounded-md" />
                        ) : (
                            <span className="text-xs text-gray-500 text-center p-2">Sem foto</span>
                        )}
                    </div>
                </div>
                <dl className="flex-grow grid grid-cols-2 gap-x-4">
                    <DataPair label="Nome completo" value={studentName} className="col-span-2"/>
                    <DataPair label="Data de nascimento" value={formatDate(studentDob)} />
                    <DataPair label="Idade (anos)" value={studentAge} />
                    <DataPair label="Nº de matrícula" value={studentRegistration} />
                    <DataPair label="Ano/Série" value={studentGrade} />
                    <DataPair label="Turno" value={studentShift} />
                </dl>
            </div>
        </Section>
        
        <Section title="RESPONSÁVEL LEGAL" titleNumber={2}>
            <dl className="grid grid-cols-2 gap-x-4">
                <DataPair label="Nome completo" value={guardianName} />
                <DataPair label="Parentesco" value={guardianRelationship} />
                <DataPair label="Contato telefônico" value={guardianPhone} />
                <DataPair label="E-mail de contato" value={guardianEmail} />
                <DataPair label="Endereço completo" value={guardianAddress} className="col-span-2" />
            </dl>
        </Section>

        <Section title="CARACTERIZAÇÃO DA OCORRÊNCIA" titleNumber={3}>
            <dl className="grid grid-cols-3 gap-x-4 mb-2">
                <DataPair label="Data e Hora" value={formattedOccurrenceDateTime} />
                <DataPair label="Local" value={occurrenceLocation} />
                <DataPair label="Gravidade" value={occurrenceSeverity} className="font-bold" />
            </dl>
             <dl>
                <DataPair label="Tipo(s) de ocorrência" value={checkedOccurrenceTypes} />
                {occurrenceTypes.other && <DataPair label="Especifique 'Outros'" value={occurrenceOtherDescription} />}
             </dl>
        </Section>

        <Section title="DESCRIÇÃO DETALHADA DO FATO" titleNumber={4}>
          <TextBlock value={detailedDescription} />
        </Section>
        
        <Section title="EVIDÊNCIAS (IMAGENS)" titleNumber={5}>
            {images && images.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                    {images.map((image, index) => (
                        <div key={index} className="break-inside-avoid text-center">
                          <div className="border-2 border-gray-300 p-1 rounded-md flex justify-center items-center bg-gray-100 h-40">
                            <img
                              src={image.dataUrl}
                              alt={`Evidência ${index + 1}: ${image.name}`}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <p className="text-xs mt-1 text-gray-600 break-all">{image.name}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500 italic">Nenhuma imagem anexada.</p>
            )}
        </Section>

        <Section title="PESSOAS ENVOLVIDAS" titleNumber={6}>
            <TextBlock value={peopleInvolved} />
        </Section>

        <Section title="PROVIDÊNCIAS IMEDIATAS ADOTADAS" titleNumber={7}>
            <TextBlock value={immediateActions} />
        </Section>

        <Section title="ENCAMINHAMENTOS REALIZADOS" titleNumber={8}>
            <TextBlock value={referralsMade} />
        </Section>

        <Section title="AVALIAÇÃO E OBSERVAÇÕES DO SERVIÇO SOCIAL" titleNumber={9}>
            <TextBlock value={socialServiceObservation} />
        </Section>

        {modificationHistory && modificationHistory.length > 0 && (
            <Section title="HISTÓRICO DE MODIFICAÇÕES" titleNumber={10}>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                    {modificationHistory.map((mod, index) => (
                        <li key={index}>
                            Relatório atualizado em: {new Date(mod.date).toLocaleString('pt-BR')}
                        </li>
                    ))}
                </ul>
            </Section>
        )}
        
        <Section title="ASSINATURAS" titleNumber={11}>
            <div className="grid grid-cols-2 gap-x-8 gap-y-16 mt-16 text-sm text-center">
                <div>
                    <p className="border-t-2 border-gray-400 pt-2">{reporterName || '\u00A0'}</p>
                    <p className="text-xs text-gray-600">Responsável pelo registro (Data: {formatDate(reporterDate) || '__/__/____'})</p>
                </div>
                <div>
                    <p className="border-t-2 border-gray-400 pt-2">{guardianSignatureName || '\u00A0'}</p>
                    <p className="text-xs text-gray-600">Responsável legal do aluno (Data: {formatDate(guardianSignatureDate) || '__/__/____'})</p>
                </div>
                <div className="col-span-2 pt-8 mx-auto w-1/2">
                    <p className="border-t-2 border-gray-400 pt-2">{socialWorkerSignatureName || '\u00A0'}</p>
                    <p className="text-xs text-gray-600">Assistente Social (Data: {formatDate(socialWorkerSignatureDate) || '__/__/____'})</p>
                </div>
            </div>
        </Section>

        <footer className="text-center text-gray-500 text-xs mt-12 pt-4 border-t border-gray-300">
          <p>Plataforma Inteligente de Registro de Ocorrências &copy; {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
};

export default PrintableReport;
