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

// Re-designed DataPair for better space utilization and readability
const DataPair = ({ label, value, className = '', highlight = false }: { label: string; value: string | undefined | null; className?: string; highlight?: boolean }) => (
  <div className={`grid grid-cols-3 gap-4 py-2 px-3 rounded-md ${highlight ? 'bg-gray-50' : ''} ${className}`}>
    <dt className="text-sm font-medium text-gray-600 col-span-1 break-words">{label}</dt>
    <dd className="text-sm text-gray-800 col-span-2">{value || <span className="text-gray-400 italic">Não preenchido</span>}</dd>
  </div>
);

// Re-designed TextBlock for consistency within sections
const TextBlock = ({ title, value }: { title: string; value: string | undefined | null }) => (
    <div className="px-3 py-2 break-inside-avoid">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
        <div className="p-3 border border-gray-200 bg-white rounded-md min-h-[60px] whitespace-pre-wrap text-sm text-gray-800">
            {value || <p className="text-gray-400 italic">Não preenchido</p>}
        </div>
    </div>
);

// Re-designed Section component for better visual grouping
interface SectionProps {
  title: string;
  children: React.ReactNode;
}
const Section: React.FC<SectionProps> = ({ title, children }) => (
  <section className="mb-6 break-inside-avoid">
    <h3 className="text-base font-bold text-emerald-800 bg-gray-100 p-3 rounded-t-lg border-b-2 border-emerald-600">
      {title}
    </h3>
    <div className="border border-t-0 border-gray-200 rounded-b-lg p-3 bg-gray-50/30">
        {children}
    </div>
  </section>
);


const PrintableReport: React.FC<PrintableReportProps> = ({ reportData }) => {
  if (!reportData) {
    return <div className="printable-area hidden"></div>;
  }
  
  const {
    schoolUnit, municipality, uf, fillDate, fillTime, status,
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
    .join('; ');

  const finalSectionNumber = 6 + (modificationHistory && modificationHistory.length > 0 ? 1 : 0);

  return (
    <div className="printable-area hidden">
      <div className="p-6 bg-white text-black font-sans text-base border-2 border-gray-200 shadow-lg">
        <header className="text-center mb-6 border-b-4 border-emerald-600 pb-4">
            <h1 className="text-2xl font-bold text-gray-800">FICHA DE REGISTRO DE OCORRÊNCIA ESCOLAR</h1>
            <div className="text-sm text-gray-600 mt-2">
                Secretaria Municipal de Educação – Itaberaba/BA
            </div>
        </header>

        <div className="mb-6 bg-emerald-50 p-4 rounded-lg border border-emerald-200 space-y-1">
             <div className="flex justify-between items-baseline mb-2">
                <h3 className="text-base font-bold text-emerald-800">DADOS GERAIS DO REGISTRO</h3>
                <p className="text-sm text-emerald-800">Status: <span className="font-semibold">{status}</span></p>
            </div>
             <DataPair label="Unidade Escolar" value={schoolUnit} highlight />
             <DataPair label="Município / UF" value={`${municipality} / ${uf}`} />
             <DataPair label="Data e Hora do Registro" value={`${formatDate(fillDate)} às ${fillTime}`} highlight />
        </div>
        
        <div className="space-y-4">
            <Section title="1. IDENTIFICAÇÃO DO ALUNO">
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
                    <div className="flex-grow space-y-1">
                        <DataPair label="Nome completo" value={studentName} highlight />
                        <DataPair label="Data de nascimento" value={formatDate(studentDob)} />
                        <DataPair label="Idade" value={studentAge ? `${studentAge} anos` : ''} highlight />
                        <DataPair label="Nº de matrícula" value={studentRegistration} />
                        <DataPair label="Ano/Série" value={studentGrade} highlight />
                        <DataPair label="Turno" value={studentShift} />
                    </div>
                </div>
            </Section>
            
            <Section title="2. RESPONSÁVEL LEGAL">
                <div className="space-y-1">
                    <DataPair label="Nome completo" value={guardianName} highlight />
                    <DataPair label="Parentesco" value={guardianRelationship} />
                    <DataPair label="Contato telefônico" value={guardianPhone} highlight />
                    <DataPair label="E-mail" value={guardianEmail} />
                    <DataPair label="Endereço completo" value={guardianAddress} highlight className="col-span-2" />
                </div>
            </Section>

            <Section title="3. CARACTERIZAÇÃO DA OCORRÊNCIA">
                <div className="space-y-1">
                    <DataPair label="Data e Hora" value={formattedOccurrenceDateTime} highlight />
                    <DataPair label="Local" value={occurrenceLocation} />
                    <DataPair label="Gravidade" value={occurrenceSeverity} highlight />
                    <DataPair label="Tipo(s) de ocorrência" value={checkedOccurrenceTypes} />
                    {occurrenceTypes.other && <DataPair label="Descrição 'Outros'" value={occurrenceOtherDescription} highlight />}
                </div>
            </Section>

             <Section title="4. DESCRIÇÃO DO FATO E AÇÕES TOMADAS">
                <div className="space-y-2">
                    <TextBlock title="Descrição Detalhada do Fato" value={detailedDescription} />
                    <TextBlock title="Pessoas Envolvidas (Testemunhas, etc.)" value={peopleInvolved} />
                    <TextBlock title="Providências Imediatas Adotadas pela Escola" value={immediateActions} />
                    <TextBlock title="Encaminhamentos Realizados (Conselho Tutelar, etc.)" value={referralsMade} />
                    <TextBlock title="Avaliação e Observações do Serviço Social" value={socialServiceObservation} />
                </div>
            </Section>

            <Section title="5. EVIDÊNCIAS (IMAGENS)">
                {images && images.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4 p-3">
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
                    <p className="text-sm text-gray-500 italic p-3">Nenhuma imagem anexada.</p>
                )}
            </Section>

            {modificationHistory && modificationHistory.length > 0 && (
                <Section title="6. HISTÓRICO DE MODIFICAÇÕES">
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 p-3">
                        {modificationHistory.map((mod, index) => (
                            <li key={index}>
                                Relatório atualizado em: {new Date(mod.date).toLocaleString('pt-BR')}
                            </li>
                        ))}
                    </ul>
                </Section>
            )}
            
            <Section title={`${finalSectionNumber}. ASSINATURAS`}>
                <div className="grid grid-cols-2 gap-x-8 gap-y-16 mt-16 text-sm text-center p-4">
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
        </div>

        <footer className="text-center text-gray-500 text-xs mt-12 pt-4 border-t border-gray-300">
          <p>Plataforma Inteligente de Registro de Ocorrências &copy; {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
};

export default PrintableReport;
