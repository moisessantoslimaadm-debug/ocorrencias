
export interface ReportImage {
  name: string;
  dataUrl: string;
}

export interface OccurrenceReport {
  schoolUnit: string;
  municipality: string;
  uf: string;
  fillDate: string;
  fillTime: string;

  studentName: string;
  studentPhoto: ReportImage | null;
  studentDob: string;
  studentAge: string;
  studentGrade: string;
  studentShift: string;
  studentRegistration: string;

  guardianName: string;
  guardianRelationship: string;
  guardianPhone: string;
  guardianAddress: string;

  occurrenceDate: string;
  occurrenceTime: string;
  occurrenceLocation: string;
  occurrenceTypes: {
    physicalAssault: boolean;
    verbalAssault: boolean;
    bullying: boolean;
    propertyDamage: boolean;
    truancy: boolean;
    socialRisk: boolean;
    prohibitedSubstances: boolean;
    other: boolean;
  };
  occurrenceOtherDescription: string;

  detailedDescription: string;
  images: ReportImage[];
  peopleInvolved: string;
  immediateActions: string;
  referralsMade: string;
  socialServiceObservation: string;

  reporterName: string;
  reporterDate: string;
  guardianSignatureName: string;
  guardianSignatureDate: string;
  socialWorkerSignatureName: string;
  socialWorkerSignatureDate: string;
}

export interface SavedReport extends OccurrenceReport {
  id: string;
  savedAt: string;
}

export interface GeminiAnalysisResult {
  summary: string;
  immediateActions: string;
  referrals: string;
  severity: 'Leve' | 'Moderada' | 'Grave' | string;
}
