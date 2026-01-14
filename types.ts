
export interface ReportImage {
  name: string;
  dataUrl: string;
}

export interface Modification {
  date: string;
  // In a full application with user authentication, you would also store user info:
  // userId: string;
  // userName: string;
}

export type ReportStatus = 'Novo' | 'Em Análise' | 'Resolvido' | 'Arquivado';

export interface SchoolData {
  id: string;
  name: string;
  zone: string;
  address: string;
  inep: string;
  director: string;
  phone: string;
}

export interface OccurrenceReport {
  // School Details
  schoolUnit: string;
  schoolAddress: string;
  schoolInep: string;
  schoolDirector: string;
  schoolPhone: string;
  schoolEmail: string; // Novo campo
  schoolZone: string;

  municipality: string;
  uf: string;
  fillDate: string;
  fillTime: string;

  studentName: string;
  studentId: string;
  studentPhoto: ReportImage | null;
  studentDob: string;
  studentAge: string;
  studentGrade: string;
  studentShift: string;
  studentRegistration: string;

  guardianName: string;
  guardianRelationship: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianAddress: string;

  occurrenceDateTime: string;
  occurrenceLocation: string;
  occurrenceSeverity: string;
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
  contactReason: string;
  reporterDate: string;
  guardianSignatureName: string;
  guardianSignatureDate: string;
  socialWorkerSignatureName: string;
  socialWorkerSignatureDate: string;
  
  status: ReportStatus;
  modificationHistory: Modification[];
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

export interface TrendInsight {
  title: string;
  suggestion: string;
}

export type FormErrors = Partial<Record<keyof OccurrenceReport | 'occurrenceTypes' | 'guardianPhone', string>>;
