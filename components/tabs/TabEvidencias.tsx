import React from 'react';
import type { OccurrenceReport, ReportImage, FormErrors } from '../../types';
import SectionHeader from '../SectionHeader';
import TextAreaField from '../TextAreaField';
import ImageUpload from '../ImageUpload';

interface TabEvidenciasProps {
  formData: OccurrenceReport;
  handleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onImagesChange: (images: ReportImage[]) => void;
  errors: FormErrors;
}

const TabEvidencias: React.FC<TabEvidenciasProps> = ({ formData, handleChange, onImagesChange, errors }) => {
  return (
    <div className="animate-fade-in-up space-y-4">
      <SectionHeader title="5. EVIDÊNCIAS (IMAGENS)" />
      <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200">
        <ImageUpload images={formData.images} onImagesChange={onImagesChange} />
      </div>

      <SectionHeader title="6. PESSOAS ENVOLVIDAS" />
      <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200">
        <TextAreaField id="peopleInvolved" name="peopleInvolved" label="" subtitle="Alunos, funcionários, terceiros – incluir nome, cargo/função e vínculo." value={formData.peopleInvolved} onChange={handleChange} />
      </div>

      <SectionHeader title="7. PROVIDÊNCIAS IMEDIATAS ADOTADAS" />
      <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200">
        <TextAreaField id="immediateActions" name="immediateActions" label="" value={formData.immediateActions} onChange={handleChange} />
      </div>

      <SectionHeader title="8. ENCAMINHAMENTOS REALIZADOS" />
      <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200">
        <TextAreaField id="referralsMade" name="referralsMade" label="" subtitle="Órgãos da rede, familiares, equipe interna." value={formData.referralsMade} onChange={handleChange} />
      </div>

      <SectionHeader title="9. AVALIAÇÃO E OBSERVAÇÕES DO SERVIÇO SOCIAL" />
      <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200">
        <TextAreaField id="socialServiceObservation" name="socialServiceObservation" label="" subtitle="(se houver)" value={formData.socialServiceObservation} onChange={handleChange} />
      </div>
    </div>
  );
};

export default TabEvidencias;
