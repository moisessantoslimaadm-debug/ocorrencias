import React from 'react';
import type { OccurrenceReport, ReportStatus } from '../types';

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

const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
        case 'Novo': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'Em Análise': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'Resolvido': return 'bg-green-100 text-green-800 border-green-200';
        case 'Arquivado': return 'bg-gray-200 text-gray-800 border-gray-300';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-4 break-inside-avoid">
    <h3 className="text-sm font-bold text-emerald-800 bg-gray-100 p-2 rounded-t-md border-l-4 border-emerald-600">
      {title}
    </h3>
    <div className="border border-t-0 border-gray-200 rounded-b-md px-3 py-2">
        {children}
    </div>
  </section>
);

const DataPair: React.FC<{ label: string; value: string | undefined | null; colSpan?: boolean; }> = ({ label, value, colSpan = false }) => (
  <div className={`flex border-t border-gray-200 py-1.5 text-[9pt] ${colSpan ? 'flex-col sm:flex-row' : ''}`}>
    <dt className={`font-semibold text-gray-600 pr-2 ${colSpan ? 'sm:w-1/3' : 'w-1/3'}`}>{label}</dt>
    <dd className={`text-gray-800 break-words ${colSpan ? 'sm:w-2/3' : 'w-2/3'}`}>{value || <span className="text-gray-400">—</span>}</dd>
  </div>
);

const TextBlock: React.FC<{ title: string; value: string | undefined | null }> = ({ title, value }) => (
    <div className="pt-2 break-inside-avoid">
        <h4 className="text-[9pt] font-semibold text-gray-700 mb-1">{title}</h4>
        <div className="p-2 border border-gray-200 bg-white rounded-md min-h-[50px] whitespace-pre-wrap text-[9pt] text-gray-800">
            {value || <p className="text-gray-400 italic">Não preenchido</p>}
        </div>
    </div>
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
      <div className="p-8 bg-white text-gray-800 font-sans text-[10pt] min-h-[29.7cm] w-[21cm] mx-auto">
        <header className="flex justify-between items-center pb-4 border-b-2 border-emerald-700">
            <div className="flex items-center gap-4">
                <div className="flex-shrink-0 text-emerald-700">
                     <svg className="h-14 w-14" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 2M12 4.2L18 6.5V11C18 15.45 15.44 19.54 12 20.9C8.56 19.54 6 15.45 6 11V6.5L12 4.2M12 7A2 2 0 0 0 10 9A2 2 0 0 0 12 11A2 2 0 0 0 14 9A2 2 0 0 0 12 7M12 13C10.67 13 8 13.67 8 15V16H16V15C16 13.67 13.33 13 12 13Z" /></svg>
                </div>
                <div>
                    <p className="font-semibold text-gray-700">Prefeitura Municipal de Itaberaba</p>
                    <p className="text-sm text-gray-600">Secretaria Municipal de Educação – SMED</p>
                </div>
            </div>
            <div className="text-right">
                <h1 className="text-xl font-bold text-gray-800">FICHA DE REGISTRO</h1>
                <h2 className="text-lg font-semibold text-emerald-700">DE OCORRÊNCIA ESCOLAR</h2>
            </div>
        </header>

        <main className="mt-4">
            <div className="border border-gray-200 rounded-lg p-2 mb-4">
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-700">DADOS GERAIS DO REGISTRO</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(status)}`}>
                        Status: {status}
                    </span>
                </div>
                <dl className="mt-1">
                    <DataPair label="Unidade Escolar" value={schoolUnit} />
                    <DataPair label="Município / UF" value={`${municipality} / ${uf}`} />
                    <DataPair label="Data e Hora do Registro" value={`${formatDate(fillDate)} às ${fillTime}`} />
                </dl>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4">
                <Section title="1. IDENTIFICAÇÃO DO ALUNO">
                    <div className="flex items-start gap-3">
                         <div className="w-20 h-24 border border-gray-200 rounded-sm flex items-center justify-center bg-gray-50 flex-shrink-0">
                            {studentPhoto ? (
                                <img src={studentPhoto.dataUrl} alt="Foto do Aluno" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[8pt] text-gray-400 text-center p-1">Sem foto</span>
                            )}
                        </div>
                        <dl className="flex-grow">
                            <DataPair label="Nome" value={studentName} />
                            <DataPair label="Nascimento" value={formatDate(studentDob)} />
                            <DataPair label="Idade" value={studentAge ? `${studentAge} anos` : ''} />
                            <DataPair label="Matrícula" value={studentRegistration} />
                            <DataPair label="Ano/Série" value={studentGrade} />
                            <DataPair label="Turno" value={studentShift} />
                        </dl>
                    </div>
                </Section>
                
                <Section title="2. RESPONSÁVEL LEGAL">
                    <dl>
                        <DataPair label="Nome" value={guardianName} />
                        <DataPair label="Parentesco" value={guardianRelationship} />
                        <DataPair label="Telefone" value={guardianPhone} />
                        <DataPair label="E-mail" value={guardianEmail} />
                        <DataPair label="Endereço" value={guardianAddress} colSpan />
                    </dl>
                </Section>
            </div>

            <Section title="3. CARACTERIZAÇÃO DA OCORRÊNCIA">
                <dl>
                    <DataPair label="Data e Hora" value={formattedOccurrenceDateTime} />
                    <DataPair label="Local" value={occurrenceLocation} />
                    <DataPair label="Gravidade" value={occurrenceSeverity} />
                    <DataPair label="Tipo(s)" value={checkedOccurrenceTypes} colSpan />
                    {occurrenceTypes.other && <DataPair label="Descrição 'Outros'" value={occurrenceOtherDescription} colSpan />}
                </dl>
            </Section>

             <Section title="4. DESCRIÇÃO DO FATO E AÇÕES TOMADAS">
                <div className="space-y-2">
                    <TextBlock title="Descrição Detalhada do Fato:" value={detailedDescription} />
                    <TextBlock title="Pessoas Envolvidas (Testemunhas, etc.):" value={peopleInvolved} />
                    <TextBlock title="Providências Imediatas Adotadas pela Escola:" value={immediateActions} />
                    <TextBlock title="Encaminhamentos Realizados (Conselho Tutelar, etc.):" value={referralsMade} />
                    <TextBlock title="Avaliação e Observações do Serviço Social:" value={socialServiceObservation} />
                </div>
            </Section>

            <Section title="5. EVIDÊNCIAS (IMAGENS)">
                {images && images.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 p-1">
                        {images.map((image, index) => (
                            <div key={index} className="break-inside-avoid text-center">
                              <div className="border border-gray-200 p-0.5 rounded-sm flex justify-center items-center bg-gray-50 h-32">
                                <img
                                  src={image.dataUrl}
                                  alt={`Evidência ${index + 1}`}
                                  className="max-w-full max-h-full object-contain"
                                />
                              </div>
                              <p className="text-[8pt] mt-0.5 text-gray-600 break-all truncate" title={image.name}>{image.name}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic p-2">Nenhuma imagem anexada.</p>
                )}
            </Section>

            {modificationHistory && modificationHistory.length > 0 && (
                <Section title="6. HISTÓRICO DE MODIFICAÇÕES">
                    <ul className="list-disc pl-4 space-y-1 text-[9pt] text-gray-700 py-1">
                        {modificationHistory.map((mod, index) => (
                            <li key={index}>
                                Relatório atualizado em: {new Date(mod.date).toLocaleString('pt-BR')}
                            </li>
                        ))}
                    </ul>
                </Section>
            )}
            
            <Section title={`${finalSectionNumber}. ASSINATURAS`}>
                <div className="grid grid-cols-2 gap-x-8 gap-y-16 mt-12 text-xs text-center p-2">
                    <div className="pt-2 border-t border-gray-400">
                        <p className="font-semibold h-4">{reporterName || '\u00A0'}</p>
                        <p className="text-gray-600">Responsável pelo registro (Data: {formatDate(reporterDate) || '__/__/____'})</p>
                    </div>
                    <div className="pt-2 border-t border-gray-400">
                        <p className="font-semibold h-4">{guardianSignatureName || '\u00A0'}</p>
                        <p className="text-gray-600">Responsável legal do aluno (Data: {formatDate(guardianSignatureDate) || '__/__/____'})</p>
                    </div>
                    <div className="col-span-2 pt-8 mx-auto w-1/2">
                       <div className="pt-2 border-t border-gray-400">
                           <p className="font-semibold h-4">{socialWorkerSignatureName || '\u00A0'}</p>
                           <p className="text-gray-600">Assistente Social (Data: {formatDate(socialWorkerSignatureDate) || '__/__/____'})</p>
                       </div>
                    </div>
                </div>
            </Section>
        </main>

        <footer className="text-center text-gray-500 text-[8pt] mt-6 pt-2 border-t border-gray-200">
          <p>Plataforma Inteligente de Registro de Ocorrências &copy; {new Date().getFullYear()} - Prefeitura Municipal de Itaberaba/BA</p>
        </footer>
      </div>
    </div>
  );
};

export default PrintableReport;
