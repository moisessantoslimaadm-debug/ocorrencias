

import React from 'react';
import type { OccurrenceReport, FormErrors } from '../../types';
import SectionHeader from '../SectionHeader';
import InputField from '../InputField';
import Tooltip from '../Tooltip';

interface TabFinalizacaoProps {
  formData: OccurrenceReport & { id?: string };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors: FormErrors;
}

const TabFinalizacao: React.FC<TabFinalizacaoProps> = ({ formData, handleChange, errors }) => {
  // Determine if the modification history section should be shown
  const showModificationHistory = formData.modificationHistory && formData.modificationHistory.length > 0;
  
  // Dynamically set the section number for "ASSINATURA"
  const signatureSectionNumber = showModificationHistory ? 11 : 10;

  return (
    <div className="animate-fade-in-up space-y-4">
      {showModificationHistory && (
          <>
            <SectionHeader title="10. HISTÓRICO DE MODIFICAÇÕES" />
            <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200">
              <ul className="space-y-2 text-sm text-gray-600">
                {formData.modificationHistory.map((mod, index) => (
                  <li key={index} className="pl-4 border-l-2 border-emerald-200">
                    Relatório atualizado em: <span className="font-semibold">{new Date(mod.date).toLocaleString('pt-BR')}</span>.
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 mt-3 italic">Nota: A data de criação do relatório pode ser vista no painel de histórico lateral.</p>
            </div>
          </>
        )}

        <SectionHeader title={`${signatureSectionNumber}. ASSINATURA`} />
        <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <InputField id="reporterName" name="reporterName" label="Responsável pelo registro" type="text" value={formData.reporterName} onChange={handleChange} error={errors.reporterName} tooltip={<Tooltip text="Nome completo do profissional que está preenchendo este relatório." />} />
          <InputField id="reporterDate" name="reporterDate" label="Data" type="date" value={formData.reporterDate} onChange={handleChange} description="Selecione ou digite a data." ariaLabel="Data do registro" error={errors.reporterDate} readOnly tooltip={<Tooltip text="Data de preenchimento do formulário. Preenchida automaticamente." />} />
          <InputField id="guardianSignatureName" name="guardianSignatureName" label="Responsável legal do aluno" type="text" value={formData.guardianSignatureName} onChange={handleChange} tooltip={<Tooltip text="Nome do responsável que tomará ciência do fato. Deixar em branco se a ciência for dada posteriormente." />} />
          <InputField id="guardianSignatureDate" name="guardianSignatureDate" label="Data" type="date" value={formData.guardianSignatureDate} onChange={handleChange} description="Selecione ou digite a data." ariaLabel="Data da assinatura do responsável legal" tooltip={<Tooltip text="Data em que o responsável tomou ciência. Preencher apenas quando a ciência for confirmada." />} />
          <InputField id="socialWorkerSignatureName" name="socialWorkerSignatureName" label="Assistente Social" type="text" value={formData.socialWorkerSignatureName} onChange={handleChange} tooltip={<Tooltip text="Nome do(a) assistente social que acompanha o caso, se houver." />} />
          <InputField id="socialWorkerSignatureDate" name="socialWorkerSignatureDate" label="Data" type="date" value={formData.socialWorkerSignatureDate} onChange={handleChange} description="Selecione ou digite a data." ariaLabel="Data da assinatura do assistente social" tooltip={<Tooltip text="Data da assinatura ou parecer do(a) assistente social." />} />
        </div>
    </div>
  );
};

export default TabFinalizacao;