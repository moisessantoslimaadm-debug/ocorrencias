import type { OccurrenceReport, ReportStatus } from './types';

export const DRAFT_STORAGE_KEY = 'schoolOccurrenceReportFormData';
export const HISTORY_STORAGE_KEY = 'schoolOccurrenceReportHistory';
export const AUTH_SESSION_KEY = 'pioe_auth_session';
export const RECENT_SEARCHES_KEY = 'pioe_recent_searches';

export const occurrenceTypeLabels: { key: keyof OccurrenceReport['occurrenceTypes']; label: string }[] = [
    { key: 'physicalAssault', label: 'Agressão física' },
    { key: 'verbalAssault', label: 'Agressão verbal/ofensas' },
    { key: 'bullying', label: 'Situação de bullying' },
    { key: 'propertyDamage', label: 'Danos ao patrimônio' },
    { key: 'truancy', label: 'Fuga/abandono de sala ou unidade escolar' },
    { key: 'socialRisk', label: 'Situação de risco/vulnerabilidade social' },
    { key: 'prohibitedSubstances', label: 'Uso/porte de substâncias proibidas' },
    { key: 'other', label: 'Outros' },
];

export const severityOptions: { value: string; label: string }[] = [
    { value: 'Leve', label: 'Leve' },
    { value: 'Moderada', label: 'Moderada' },
    { value: 'Grave', label: 'Grave' },
];

export const statusOptions: { value: ReportStatus; label: string }[] = [
    { value: 'Novo', label: 'Novo' },
    { value: 'Em Análise', label: 'Em Análise' },
    { value: 'Resolvido', label: 'Resolvido' },
    { value: 'Arquivado', label: 'Arquivado' },
];