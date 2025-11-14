

import React, { useState } from 'react';
import type { OccurrenceReport, ReportImage, FormErrors } from '../../types';
import SectionHeader from '../SectionHeader';
import TextAreaField from '../TextAreaField';
import ImageUpload from '../ImageUpload';
import Tooltip from '../Tooltip';

interface TabEvidenciasProps {
  formData: OccurrenceReport;
  handleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onImagesChange: (images: ReportImage[]) => void;
  errors: FormErrors;
}

const TabEvidencias: React.FC<TabEvidenciasProps> = ({ formData, handleChange, onImagesChange, errors }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!formData.immediateActions) return;
    navigator.clipboard.writeText(formData.immediateActions).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Falha ao copiar o texto:', err);
      alert('Não foi possível copiar o texto.');
    });
  };

  return (
    <div className="animate-fade-in-up space-y-4">
      <SectionHeader title="5. EVIDÊNCIAS (IMAGENS)" />
      <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200">
        <ImageUpload images={formData.images} onImagesChange={onImagesChange} />
      </div>

      <SectionHeader title="6. PESSOAS ENVOLVIDAS" />
      <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200">
        <TextAreaField id="peopleInvolved" name="peopleInvolved" label="" subtitle="Alunos, funcionários, terceiros – incluir nome, cargo/função e vínculo." value={formData.peopleInvolved} onChange={handleChange} tooltip={<Tooltip text="Liste todas as pessoas envolvidas, incluindo alunos, professores, funcionários e testemunhas. Especifique nome e turma/cargo." />} />
      </div>

      <SectionHeader title="7. PROVIDÊNCIAS IMEDIATAS ADOTADAS" />
      <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200">
        <TextAreaField id="immediateActions" name="immediateActions" label="" value={formData.immediateActions} onChange={handleChange} tooltip={<Tooltip text="Descreva as primeiras ações tomadas pela escola assim que tomou conhecimento do fato. Ex: separar os envolvidos, contatar os responsáveis, etc." />} />
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!formData.immediateActions || copied}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copiar Texto</span>
              </>
            )}
          </button>
        </div>
      </div>

      <SectionHeader title="8. ENCAMINHAMENTOS REALIZADOS" />
      <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200">
        <TextAreaField id="referralsMade" name="referralsMade" label="" subtitle="Órgãos da rede, familiares, equipe interna." value={formData.referralsMade} onChange={handleChange} tooltip={<Tooltip text="Liste para onde o caso foi encaminhado. Ex: Coordenação Pedagógica, Conselho Tutelar, Psicólogo Escolar." />} />
      </div>

      <SectionHeader title="9. AVALIAÇÃO E OBSERVAÇÕES DO SERVIÇO SOCIAL" />
      <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200">
        <TextAreaField id="socialServiceObservation" name="socialServiceObservation" label="" subtitle="(se houver)" value={formData.socialServiceObservation} onChange={handleChange} tooltip={<Tooltip text="Espaço reservado para anotações e parecer do profissional de Serviço Social, se aplicável." />} />
      </div>
    </div>
  );
};

export default TabEvidencias;