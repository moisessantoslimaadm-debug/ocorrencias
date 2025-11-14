import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { OccurrenceReport, SavedReport, ReportImage, GeminiAnalysisResult, Modification, FormErrors, ReportStatus } from './types';
import { DRAFT_STORAGE_KEY, HISTORY_STORAGE_KEY, AUTH_SESSION_KEY, API_KEY_STORAGE_KEY, occurrenceTypeLabels, severityOptions } from './constants';


// New Component Imports
import AppHeader from './components/AppHeader';
import TabIdentificacao from './components/tabs/TabIdentificacao';
import TabOcorrencia from './components/tabs/TabOcorrencia';
import TabEvidencias from './components/tabs/TabEvidencias';
import TabFinalizacao from './components/tabs/TabFinalizacao';
import LoginScreen from './components/LoginScreen'; // Import LoginScreen
import GoodbyeScreen from './components/GoodbyeScreen'; // Import GoodbyeScreen
import Dashboard from './components/Dashboard';

import PrintableReport from './components/PrintableReport';
import HistoryPanel from './components/HistoryPanel';
import Toast from './components/Toast';
import ConfirmationModal from './components/ConfirmationModal';
import GeminiAnalysisModal from './components/GeminiAnalysisModal';
import ApiKeyModal from './components/ApiKeyModal';
import { seedData } from './data/seedData';
import FloatingActionButton from './components/FloatingActionButton';

// Add type declarations for CDN scripts
declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
    XLSX: any;
  }
}

const TABS = [
  'Identificação',
  'Ocorrência',
  'Evidências e Ações',
  'Finalização'
];

const validateAddress = (address: string): string => {
  const trimmedAddress = address.trim();
  // Not a required field, so no error if empty. But if user started typing, we validate.
  if (!trimmedAddress) {
    return '';
  }

  // Check for minimum length first, as a very short address will fail other checks anyway.
  if (trimmedAddress.length < 15) {
    return 'Endereço muito curto. Por favor, forneça mais detalhes.';
  }

  const hasNumber = /\d/.test(trimmedAddress);
  if (!hasNumber) {
    return 'Endereço inválido. O número da residência parece estar faltando.';
  }

  const hasComma = /,/.test(trimmedAddress);
  if (!hasComma) {
    return 'Endereço inválido. Utilize vírgulas para separar rua, bairro, cidade, etc.';
  }

  const hasZipCode = /\d{5}-?\d{3}/.test(trimmedAddress);
  if (!hasZipCode) {
    return 'Endereço inválido. O CEP (formato 12345-678) parece estar faltando.';
  }
  
  const hasUF = /(,|-|\s)\b[A-Z]{2}\b/i.test(trimmedAddress);
  if (!hasUF) {
    return 'Endereço inválido. A sigla do estado (UF, ex: BA) parece estar faltando.';
  }
  
  return '';
};


export const FIELD_TO_TAB_MAP: { [key in keyof FormErrors]?: number } = {
  // Tab 0: Identificação
  schoolUnit: 0, municipality: 0, uf: 0,
  studentName: 0, studentDob: 0, studentRegistration: 0,
  guardianAddress: 0,
  guardianPhone: 0, guardianEmail: 0,
  // Tab 1: Ocorrência
  occurrenceDateTime: 1, occurrenceLocation: 1, occurrenceSeverity: 1,
  occurrenceTypes: 1, occurrenceOtherDescription: 1, detailedDescription: 1,
  // Tab 3: Finalização
  reporterName: 3, reporterDate: 3, guardianSignatureDate: 3, socialWorkerSignatureDate: 3
};

export const calculateAge = (dob: string): string => {
  if (!dob) return '';
  const birthDate = new Date(dob);
  const today = new Date();
  if (isNaN(birthDate.getTime()) || birthDate > today) return '';

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 0 ? age.toString() : '';
};

const getDefaultFormData = (): OccurrenceReport & { id?: string } => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].substring(0, 5);

    return {
      schoolUnit: '',
      municipality: '',
      uf: '',
      fillDate: date,
      fillTime: time,
      studentName: '',
      studentPhoto: null,
      studentDob: '',
      studentAge: '',
      studentGrade: '',
      studentShift: '',
      studentRegistration: '',
      guardianName: '',
      guardianRelationship: '',
      guardianPhone: '',
      guardianEmail: '',
      guardianAddress: '',
      occurrenceDateTime: '',
      occurrenceLocation: '',
      occurrenceSeverity: '',
      occurrenceTypes: {
        physicalAssault: false,
        verbalAssault: false,
        bullying: false,
        propertyDamage: false,
        truancy: false,
        socialRisk: false,
        prohibitedSubstances: false,
        other: false,
      },
      occurrenceOtherDescription: '',
      detailedDescription: '',
      images: [],
      peopleInvolved: '',
      immediateActions: '',
      referralsMade: '',
      socialServiceObservation: '',
      reporterName: '',
      reporterDate: date,
      guardianSignatureName: '',
      guardianSignatureDate: '',
      socialWorkerSignatureName: '',
      socialWorkerSignatureDate: '',
      status: 'Novo',
      modificationHistory: [],
    };
};

const getInitialDraftData = (): OccurrenceReport & { id?: string } => {
    const savedData = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            if (typeof parsedData === 'object' && parsedData !== null && 'schoolUnit' in parsedData) {
                 if (!parsedData.images) parsedData.images = [];
                 if (!('studentPhoto' in parsedData)) parsedData.studentPhoto = null;
                 if (!('modificationHistory' in parsedData)) parsedData.modificationHistory = [];
                 if (!('guardianEmail' in parsedData)) parsedData.guardianEmail = '';
                 if (!('status' in parsedData)) parsedData.status = 'Novo';

                 // Migration for old drafts
                 if (!('occurrenceDateTime' in parsedData) && parsedData.occurrenceDate && parsedData.occurrenceTime) {
                    parsedData.occurrenceDateTime = `${parsedData.occurrenceDate}T${parsedData.occurrenceTime}`;
                 }
                 if (!('occurrenceSeverity' in parsedData)) {
                    parsedData.occurrenceSeverity = '';
                 }
                 delete parsedData.occurrenceDate;
                 delete parsedData.occurrenceTime;

                 return parsedData as OccurrenceReport & { id?: string };
            }
        } catch (error) {
            console.error("Failed to parse form data from localStorage", error);
            localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
    }
    return getDefaultFormData();
};

const getInitialHistory = (): SavedReport[] => {
    const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (savedHistory) {
        try {
            const parsedHistory = JSON.parse(savedHistory);
            if (Array.isArray(parsedHistory)) {
                // Return seed data if history is empty array, meaning user cleared it.
                if (parsedHistory.length === 0) {
                    return seedData;
                }
                return parsedHistory.map(report => {
                    // Migration for old history records
                    if (!('occurrenceDateTime' in report) && report.occurrenceDate && report.occurrenceTime) {
                        report.occurrenceDateTime = `${report.occurrenceDate}T${report.occurrenceTime}`;
                    }
                    delete report.occurrenceDate;
                    delete report.occurrenceTime;
                    return {
                        ...report,
                        images: report.images || [],
                        studentPhoto: report.studentPhoto || null,
                        modificationHistory: report.modificationHistory || [],
                        guardianEmail: report.guardianEmail || '',
                        occurrenceDateTime: report.occurrenceDateTime || '',
                        occurrenceSeverity: report.occurrenceSeverity || '',
                        status: report.status || 'Novo',
                    };
                }) as SavedReport[];
            }
        } catch (error)
        {
            console.error("Failed to parse history data from localStorage", error);
            localStorage.removeItem(HISTORY_STORAGE_KEY);
        }
    }
    // If no history exists in storage, initialize with seed data.
    return seedData;
};

const validateStudentRegistration = (value: string): string => {
  const maxLength = 20;
  if (!value) return '';
  if (value.length > maxLength) {
    return `O número de matrícula não pode exceder ${maxLength} caracteres.`;
  }
  if (!/^[a-zA-Z0-9-]*$/.test(value)) {
    return 'A matrícula deve conter apenas letras, números e hífens.';
  }
  return '';
};

// More robust email validation regex
const EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';
  });
  const [showGoodbyeScreen, setShowGoodbyeScreen] = useState(false);

  const [formData, setFormData] = useState<OccurrenceReport & { id?: string }>(getInitialDraftData);
  const [history, setHistory] = useState<SavedReport[]>(getInitialHistory);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<SavedReport | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isCancelEditModalOpen, setIsCancelEditModalOpen] = useState(false);
  const [lastSubmittedReport, setLastSubmittedReport] = useState<OccurrenceReport | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [tabErrors, setTabErrors] = useState<Record<number, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | undefined>(formData.id);
  const [validationSummary, setValidationSummary] = useState<string | null>(null);
  
  // New state for view management
  const [view, setView] = useState<'dashboard' | 'form'>('dashboard');
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);

  // New state for load confirmation flow
  const [isLoadConfirmModalOpen, setIsLoadConfirmModalOpen] = useState(false);
  const [reportToLoadId, setReportToLoadId] = useState<string | null>(null);
  const [isLeavePageModalOpen, setIsLeavePageModalOpen] = useState(false);
  const [leavePageAction, setLeavePageAction] = useState<(() => void) | null>(null);


  // Gemini AI State
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);
  const [geminiResult, setGeminiResult] = useState<GeminiAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const checkForUnsavedChanges = (action: () => void) => {
    const isPristine = JSON.stringify(formData) === JSON.stringify(getDefaultFormData());
    if (!isPristine) {
      setLeavePageAction(() => action);
      setIsLeavePageModalOpen(true);
    } else {
      action();
    }
  };

  const confirmLeavePage = () => {
    if (leavePageAction) {
      leavePageAction();
    }
    setIsLeavePageModalOpen(false);
    setLeavePageAction(null);
  };

  const handleLogin = () => {
    sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
    setIsAuthenticated(true);
    setShowGoodbyeScreen(false);
  };

  const handleLogout = () => {
    checkForUnsavedChanges(() => {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      setIsAuthenticated(false);
      setShowGoodbyeScreen(true);
    });
  };
  
  const handleReturnToLogin = () => {
    setShowGoodbyeScreen(false);
  };

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return; // Don't run if not authenticated

    const intervalId = setInterval(() => {
      const isPristine = JSON.stringify(formData) === JSON.stringify(getDefaultFormData());
      if (!isSubmitted && !isPristine) {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
        const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        setToast({ message: `Rascunho salvo automaticamente às ${time}`, type: 'success' });
      }
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [formData, isSubmitted, isAuthenticated]);


  // Warn user before leaving if there are unsaved changes
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const isPristine = JSON.stringify(formData) === JSON.stringify(getDefaultFormData());
      // Don't show the prompt if the form is pristine or we are about to submit
      if (!isPristine && !isSubmitting) {
        event.preventDefault();
        event.returnValue = ''; // Required for legacy browsers
        return ''; // Required for modern browsers
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAuthenticated, formData, isSubmitting]); // Add formData and isSubmitting


  useEffect(() => {
    if (isAuthenticated) {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    }
  }, [history, isAuthenticated]);

  // Handle focus management when switching tabs.
  useEffect(() => {
    // This logic runs after the tab has visually transitioned to manage focus.
    const focusOnTabContent = () => {
      const tabContentWrapper = document.getElementById('tab-content-wrapper');
      if (!tabContentWrapper) return;

      const errorKeysOnCurrentTab = (Object.keys(errors) as Array<keyof FormErrors>)
        .filter(key => FIELD_TO_TAB_MAP[key] === activeTab);
      
      let elementToFocus: HTMLElement | null = null;

      if (errorKeysOnCurrentTab.length > 0) {
        // Construct a selector for all fields with errors on the current tab.
        // querySelector will find the first one in the DOM order, which is more reliable.
        const errorSelector = errorKeysOnCurrentTab.map(key => `#${key}`).join(', ');
        elementToFocus = tabContentWrapper.querySelector<HTMLElement>(errorSelector);
      }
      
      // If no errors are present on the tab, or if a specific error element wasn't found,
      // focus the tab's main header or the first interactive element as a fallback.
      if (!elementToFocus) {
        elementToFocus = tabContentWrapper.querySelector('h2') ||
                         tabContentWrapper.querySelector('input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])');
      }

      if (elementToFocus) {
        elementToFocus.focus({ preventScroll: true });
        elementToFocus.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    // A timeout ensures the new tab's content is rendered before we try to focus.
    const timer = setTimeout(focusOnTabContent, 100);

    return () => clearTimeout(timer);
  }, [activeTab]); // This effect should only run when the active tab changes.
  
  const validateForm = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};
    const now = new Date();
    // A date string 'YYYY-MM-DD' compared to now. `new Date('YYYY-MM-DD')` is midnight local time.
    // So comparing against `now` is correct to check for future dates.
    // To check if a date is "today or before", we can set `now` to the end of today.
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);


    // Helper to check max length
    const checkMaxLength = (field: keyof OccurrenceReport, maxLength: number, label: string) => {
        const value = formData[field] as string | undefined;
        if (value && value.length > maxLength) {
            newErrors[field] = `${label} não pode exceder ${maxLength} caracteres.`;
        }
    };
    
    // --- REQUIRED FIELDS ---
    const requiredFields: (keyof OccurrenceReport)[] = [
      'schoolUnit', 'municipality', 'uf', 'studentName', 'studentDob',
      'occurrenceDateTime', 'occurrenceLocation', 'occurrenceSeverity',
      'detailedDescription', 'reporterName', 'reporterDate'
    ];

    requiredFields.forEach(field => {
      if (!formData[field as keyof OccurrenceReport]) {
        newErrors[field as keyof OccurrenceReport] = 'Este campo é obrigatório.';
      }
    });

    // --- SPECIFIC FIELD VALIDATIONS ---

    // Tab 0: Identification
    checkMaxLength('schoolUnit', 100, 'Unidade Escolar');
    checkMaxLength('municipality', 100, 'Município');
    if (formData.uf && !/^[A-Z]{2}$/.test(formData.uf)) {
        newErrors.uf = 'UF deve conter exatamente 2 letras maiúsculas.';
    }
    
    checkMaxLength('studentName', 150, 'Nome do aluno');
    if (formData.studentDob && new Date(formData.studentDob) > endOfToday) {
        newErrors.studentDob = 'A data de nascimento não pode ser no futuro.';
    }

    const registrationError = validateStudentRegistration(formData.studentRegistration);
    if (registrationError) {
        newErrors.studentRegistration = registrationError;
    }
    
    checkMaxLength('guardianName', 150, 'Nome do responsável');
    checkMaxLength('guardianRelationship', 50, 'Parentesco');
    checkMaxLength('guardianAddress', 200, 'Endereço');
    
    const addressError = validateAddress(formData.guardianAddress);
    if (addressError) {
        newErrors.guardianAddress = addressError;
    }
    
    if (formData.guardianPhone && formData.guardianPhone.replace(/\D/g, '').length > 0) {
        const phoneDigits = formData.guardianPhone.replace(/\D/g, '');
        if (![10, 11].includes(phoneDigits.length)) {
            newErrors.guardianPhone = 'O número de telefone deve ter 10 ou 11 dígitos, incluindo o DDD.';
        }
    }
    
    if (formData.guardianEmail && !EMAIL_REGEX.test(formData.guardianEmail)) {
        newErrors.guardianEmail = 'Por favor, insira um endereço de e-mail válido.';
    }

    // Tab 1: Occurrence
    if (formData.occurrenceDateTime && new Date(formData.occurrenceDateTime) > now) {
        newErrors.occurrenceDateTime = 'A data da ocorrência não pode ser no futuro.';
    }
    
    checkMaxLength('occurrenceLocation', 100, 'Local da ocorrência');
    
    if (formData.occurrenceSeverity && !severityOptions.some(opt => opt.value === formData.occurrenceSeverity)) {
        newErrors.occurrenceSeverity = 'Por favor, selecione uma opção de gravidade válida.';
    }
    
    const isAnyOccurrenceTypeChecked = Object.values(formData.occurrenceTypes).some(value => value);
    if (!isAnyOccurrenceTypeChecked) {
        newErrors.occurrenceTypes = 'Selecione ao menos um tipo de ocorrência.';
    }

    if (formData.occurrenceTypes.other && !formData.occurrenceOtherDescription.trim()) {
        newErrors.occurrenceOtherDescription = "Este campo deve ser preenchido pois a opção 'Outros' está marcada.";
    }
    checkMaxLength('occurrenceOtherDescription', 200, 'Descrição de "Outros"');
    checkMaxLength('detailedDescription', 2000, 'Descrição detalhada');

    // Tab 3: Finalization
    checkMaxLength('reporterName', 150, 'Responsável pelo registro');
    
    const dateFields: (keyof OccurrenceReport)[] = ['reporterDate', 'guardianSignatureDate', 'socialWorkerSignatureDate'];
    dateFields.forEach(field => {
      const dateValue = formData[field] as string | undefined;
      if (dateValue && new Date(dateValue) > endOfToday) {
        newErrors[field] = 'A data não pode ser no futuro.';
      }
    });

    return newErrors;
  }, [formData]);


  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
  
    if (name === 'guardianEmail') {
      const trimmedValue = value.trim();
      if (trimmedValue !== value) {
        setFormData(prev => ({ ...prev, guardianEmail: trimmedValue }));
      }
      if (trimmedValue && !EMAIL_REGEX.test(trimmedValue)) {
        setErrors(prev => ({ ...prev, guardianEmail: 'Por favor, insira um endereço de e-mail válido.' }));
      } else {
        setErrors(prev => ({ ...prev, guardianEmail: undefined }));
      }
    }
    
    if (name === 'guardianPhone') {
        const phoneDigits = value.replace(/\D/g, '');
        if (phoneDigits.length > 0 && ![10, 11].includes(phoneDigits.length)) {
            setErrors(prev => ({ ...prev, guardianPhone: 'O número de telefone deve ter 10 ou 11 dígitos, incluindo o DDD.' }));
        } else {
            setErrors(prev => ({ ...prev, guardianPhone: undefined }));
        }
    }
    if (name === 'guardianAddress') {
        const addressError = validateAddress(value);
        if (addressError) {
            setErrors(prev => ({ ...prev, guardianAddress: addressError }));
        } else {
            setErrors(prev => ({ ...prev, guardianAddress: undefined }));
        }
    }
  };
  
  const clearTabError = useCallback((fieldName: keyof FormErrors) => {
    const tabIndex = FIELD_TO_TAB_MAP[fieldName];
    if (tabIndex !== undefined && tabErrors[tabIndex]) {
        setTabErrors(prev => ({ ...prev, [tabIndex]: false }));
    }
  }, [tabErrors]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (validationSummary) setValidationSummary(null);
    const { name, value } = e.target as { name: keyof OccurrenceReport, value: string };
    const fieldName = name as keyof FormErrors;

    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: undefined }));
    }
    clearTabError(fieldName);

    if (name === 'studentRegistration') {
        const errorMessage = validateStudentRegistration(value);
        setErrors(prev => ({ ...prev, studentRegistration: errorMessage }));
    }

    setFormData(prev => {
        let finalValue = value;
        // Auto-format UF to uppercase and limit length
        if (name === 'uf') {
          finalValue = value.toUpperCase().slice(0, 2);
        }

        const newState = { ...prev, [name]: finalValue };

        if (name === 'studentDob') {
            // NOTE: use original `value` for age calculation, not finalValue
            newState.studentAge = calculateAge(value);
            if (new Date(value) > new Date()) {
                setErrors(prevErrors => ({ ...prevErrors, studentDob: 'A data de nascimento não pode ser no futuro.' }));
            } else {
                 setErrors(prevErrors => ({ ...prevErrors, studentDob: undefined }));
            }
        }
        return newState;
    });
  }, [errors, clearTabError, validationSummary]);

  const handleAutocompleteChange = useCallback((name: keyof OccurrenceReport, value: string) => {
      if (validationSummary) setValidationSummary(null);
      const fieldName = name as keyof FormErrors;
      if (errors[fieldName]) {
        setErrors(prev => ({ ...prev, [fieldName]: undefined }));
      }
      clearTabError(fieldName);

      setFormData(prev => ({
          ...prev,
          [name]: value,
      }));
  }, [errors, clearTabError, validationSummary]);

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (validationSummary) setValidationSummary(null);
    const { name, checked } = e.target as { name: keyof OccurrenceReport['occurrenceTypes'], checked: boolean };
    
    if(errors.occurrenceTypes) {
        setErrors(prev => ({...prev, occurrenceTypes: undefined}));
        clearTabError('occurrenceTypes');
    }

    setFormData(prev => ({
      ...prev,
      occurrenceTypes: {
        ...prev.occurrenceTypes,
        [name]: checked,
      },
    }));
  }, [errors.occurrenceTypes, clearTabError, validationSummary]);

  const handleImagesChange = useCallback((images: ReportImage[]) => {
    if (validationSummary) setValidationSummary(null);
    setFormData(prev => ({
      ...prev,
      images,
    }));
  }, [validationSummary]);
  
  const handleStudentPhotoChange = useCallback((photo: ReportImage | null) => {
    if (validationSummary) setValidationSummary(null);
    setFormData(prev => ({
      ...prev,
      studentPhoto: photo,
    }));
  }, [validationSummary]);

  const handleClear = () => {
    setIsClearModalOpen(true);
  };

  const confirmClear = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setFormData(getDefaultFormData());
    setErrors({});
    setTabErrors({});
    setActiveTab(0);
    setIsSubmitted(false);
    setLastSubmittedReport(null);
    setIsClearModalOpen(false);
    setIsCancelEditModalOpen(false);
    setEditingReportId(undefined);
    setView('form'); // Ensure we are on the form view after clearing.
  };

  const handleNewReport = () => {
    const isDraftDirty = localStorage.getItem(DRAFT_STORAGE_KEY);
     if (editingReportId || (isDraftDirty && isDraftDirty !== JSON.stringify(getDefaultFormData()))) {
        setIsCancelEditModalOpen(true);
    } else {
      confirmClear();
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationSummary(null);
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setValidationSummary('Foram encontrados erros no formulário. Por favor, verifique os campos destacados em vermelho.');
        
        const newTabErrors: Record<number, boolean> = {};
        let firstErrorTab: number | null = null;

        for (const key of Object.keys(validationErrors) as Array<keyof FormErrors>) {
            const tabIndex = FIELD_TO_TAB_MAP[key];
            if (tabIndex !== undefined) {
                newTabErrors[tabIndex] = true;
                if (firstErrorTab === null || tabIndex < firstErrorTab) {
                    firstErrorTab = tabIndex;
                }
            }
        }
        setTabErrors(newTabErrors);

        if (firstErrorTab !== null) {
            setActiveTab(firstErrorTab);
        }

        setIsSubmitting(false);
        setTimeout(() => {
          document.getElementById('validation-summary')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        return;
    }

    setErrors({});
    setTabErrors({});

    const { id, ...reportData } = formData;
    let savedReport: SavedReport | undefined;

    setHistory(prevHistory => {
        if (id) {
            setToast({ message: 'Relatório atualizado com sucesso!', type: 'success' });

            const newModification: Modification = { date: new Date().toISOString() };
            const updatedModificationHistory = [...(reportData.modificationHistory || []), newModification];
            
            const updatedReport = { 
                ...reportData, 
                id,
                modificationHistory: updatedModificationHistory,
                savedAt: new Date().toISOString() 
            };
            savedReport = updatedReport;

            return prevHistory.map(report => report.id === id ? updatedReport : report);
        } else {
            setToast({ message: 'Ocorrência registrada com sucesso!', type: 'success' });
            const newReport: SavedReport = {
                ...reportData,
                id: Date.now().toString(),
                savedAt: new Date().toISOString(),
                modificationHistory: [],
            };
            savedReport = newReport;
            return [newReport, ...prevHistory];
        }
    });
    
    setLastSubmittedReport(savedReport || null);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    const newDefaultForm = getDefaultFormData();
    setFormData(newDefaultForm);
    setIsSubmitted(true);
    setActiveTab(0);
    setEditingReportId(undefined);
    window.scrollTo(0, 0);

    // The submit button will now show the success state.
    setIsSuccess(true);
    setIsSubmitting(false);

    // Revert the button back to its normal state after a delay.
    setTimeout(() => {
        setIsSuccess(false);
    }, 1000); // Display success for 1 second.
  };
  
  const executeLoad = (id: string) => {
    const reportToLoad = history.find(report => report.id === id);
    if (reportToLoad) {
        const currentDate = new Date().toISOString().split('T')[0];
        const loadedData = {
          ...reportToLoad,
          images: reportToLoad.images || [],
          studentPhoto: reportToLoad.studentPhoto || null,
          modificationHistory: reportToLoad.modificationHistory || [],
          guardianEmail: reportToLoad.guardianEmail || '',
          occurrenceDateTime: reportToLoad.occurrenceDateTime || '',
          occurrenceSeverity: reportToLoad.occurrenceSeverity || '',
          status: reportToLoad.status || 'Novo',
          fillDate: currentDate,
          reporterDate: currentDate,
        };
        setFormData(loadedData);
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(loadedData));

        setIsSubmitted(false);
        setErrors({});
        setTabErrors({});
        setActiveTab(0);
        setLastSubmittedReport(null);
        setEditingReportId(reportToLoad.id);
        setView('form'); // Switch to form view
        setIsHistoryPanelOpen(false); // Close panel on load
        window.scrollTo(0, 0);
    }
  };

  const handleLoadReport = (id: string) => {
    const defaultDataString = JSON.stringify(getDefaultFormData());
    const currentDataString = JSON.stringify(formData);
    const isDirty = currentDataString !== defaultDataString;
    const isLoadingDifferentReport = formData.id !== id;

    if (isDirty && isLoadingDifferentReport) {
       setReportToLoadId(id);
       setIsLoadConfirmModalOpen(true);
       return;
    }

    executeLoad(id);
  };
  
  const confirmDiscardAndLoad = () => {
    if (reportToLoadId) {
        executeLoad(reportToLoadId);
    }
    setIsLoadConfirmModalOpen(false);
    setReportToLoadId(null);
  };

  const handleSaveDraft = () => {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
    setToast({ message: 'Rascunho salvo com sucesso!', type: 'success' });
  };

  const handleDeleteReport = (id: string) => {
      const report = history.find(report => report.id === id);
      if (report) {
        setReportToDelete(report);
        setIsDeleteModalOpen(true);
      }
  };
  
  const confirmDelete = () => {
    if (reportToDelete) {
        setHistory(prev => prev.filter(report => report.id !== reportToDelete.id));
        if (formData.id === reportToDelete.id) {
            confirmClear();
        }
    }
    setIsDeleteModalOpen(false);
    setReportToDelete(null);
  };
  
  const handleImportReports = (importedReports: SavedReport[]) => {
    setHistory(importedReports);
    setToast({ message: 'Backup importado com sucesso!', type: 'success' });
  };
  
  const handleStatusChange = useCallback((reportId: string, newStatus: ReportStatus) => {
    setHistory(prevHistory => 
        prevHistory.map(report => 
            report.id === reportId ? { ...report, status: newStatus } : report
        )
    );
    setToast({ message: 'Status do relatório atualizado!', type: 'info' });
  }, []);

  const handleNavigateToDashboard = () => {
    checkForUnsavedChanges(() => {
      setView('dashboard');
    });
  };
  const handleToggleHistory = () => setIsHistoryPanelOpen(prev => !prev);


  const reportForExport = isSubmitted ? lastSubmittedReport : (editingReportId ? formData : null);

  const handlePrint = () => {
    if (!reportForExport) return;
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!reportForExport) return;

    if (!window.jspdf || !window.html2canvas) {
      alert('A biblioteca de PDF ainda não foi carregada. Tente novamente em alguns segundos.');
      return;
    }

    setIsDownloadingPdf(true);
    const reportElement = document.querySelector('.printable-area') as HTMLElement;
    if (!reportElement) {
      console.error('Elemento para impressão não encontrado.');
      setIsDownloadingPdf(false);
      return;
    }
    
    const originalStyle = reportElement.style.cssText;
    const originalClassName = reportElement.className;
    reportElement.className = 'printable-area bg-white';
    reportElement.style.position = 'absolute';
    reportElement.style.left = '-9999px';
    reportElement.style.top = '0';
    reportElement.style.width = '210mm'; // A4 width

    try {
      const canvas = await window.html2canvas(reportElement, { scale: 2, useCORS: true });
      
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      heightLeft -= (pageHeight - margin * 2);

      while (heightLeft > 0) {
        position = position - (pageHeight - margin * 2);
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position + margin, imgWidth, imgHeight);
        heightLeft -= (pageHeight - margin * 2);
      }
      
      pdf.save(`relatorio-${reportForExport.studentName.replace(/ /g, '_') || 'ocorrencia'}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.");
    } finally {
      reportElement.className = originalClassName;
      reportElement.style.cssText = originalStyle;
      setIsDownloadingPdf(false);
    }
  };

  const handleExportExcel = () => {
    if (!reportForExport) return;

    if (!window.XLSX) {
      setToast({ message: 'A biblioteca de exportação ainda não carregou. Tente novamente em um instante.', type: 'error' });
      return;
    }

    const headers = ["Campo", "Informação"];
    const checkedTypes = occurrenceTypeLabels
      .filter(({ key }) => reportForExport.occurrenceTypes[key])
      .map(({ label }) => label)
      .join('; ');
    const imageNames = reportForExport.images.map(img => img.name).join('; ') || "Nenhuma";
    const modificationDates = reportForExport.modificationHistory.map(mod => new Date(mod.date).toLocaleString('pt-BR')).join('; ') || "Nenhuma";

    const data = [
      ["ID do Relatório", (reportForExport as SavedReport).id || 'Novo'],
      ["Status", reportForExport.status],
      ["Data de Preenchimento", `${reportForExport.fillDate} ${reportForExport.fillTime}`],
      ["Unidade Escolar", reportForExport.schoolUnit],
      ["Município", reportForExport.municipality],
      ["UF", reportForExport.uf],
      ["--- DADOS DO ALUNO ---", ""],
      ["Nome do Aluno", reportForExport.studentName],
      ["Foto Anexada", reportForExport.studentPhoto ? 'Sim' : 'Não'],
      ["Data de Nascimento", reportForExport.studentDob],
      ["Idade", reportForExport.studentAge],
      ["Ano/Série", reportForExport.studentGrade],
      ["Turno", reportForExport.studentShift],
      ["Nº de Matrícula", reportForExport.studentRegistration],
      ["--- DADOS DO RESPONSÁVEL ---", ""],
      ["Nome do Responsável", reportForExport.guardianName],
      ["Parentesco", reportForExport.guardianRelationship],
      ["Telefone", reportForExport.guardianPhone],
      ["E-mail", reportForExport.guardianEmail],
      ["Endereço", reportForExport.guardianAddress],
      ["--- DADOS DA OCORRÊNCIA ---", ""],
      ["Data e Hora da Ocorrência", reportForExport.occurrenceDateTime.replace('T', ' ')],
      ["Local da Ocorrência", reportForExport.occurrenceLocation],
      ["Gravidade", reportForExport.occurrenceSeverity],
      ["Tipos de Ocorrência", checkedTypes],
      ["Descrição 'Outros'", reportForExport.occurrenceOtherDescription],
      ["Descrição Detalhada", reportForExport.detailedDescription],
      ["--- AÇÕES E EVIDÊNCIAS ---", ""],
      ["Evidências (Imagens)", imageNames],
      ["Pessoas Envolvidas", reportForExport.peopleInvolved],
      ["Providências Imediatas", reportForExport.immediateActions],
      ["Encaminhamentos Realizados", reportForExport.referralsMade],
      ["Observações do Serviço Social", reportForExport.socialServiceObservation],
      ["--- FINALIZAÇÃO ---", ""],
      ["Responsável pelo Registro", reportForExport.reporterName],
      ["Data do Registro", reportForExport.reporterDate],
      ["Assinatura Responsável Legal", reportForExport.guardianSignatureName],
      ["Data Ass. Resp. Legal", reportForExport.guardianSignatureDate],
      ["Assinatura Assistente Social", reportForExport.socialWorkerSignatureName],
      ["Data Ass. Assist. Social", reportForExport.socialWorkerSignatureDate],
      ["Histórico de Modificações", modificationDates],
    ];

    const worksheet = window.XLSX.utils.aoa_to_sheet([headers, ...data]);
    worksheet['!cols'] = [{ wch: 30 }, { wch: 80 }];

    // Style headers and section separators
    const headerStyle = { font: { bold: true } };
    const sectionStyle = { font: { bold: true, sz: 14 }, fill: { fgColor: { rgb: "FFE0E0E0" } } };
    worksheet['A1'].s = headerStyle;
    worksheet['B1'].s = headerStyle;
    data.forEach((row, index) => {
        if (row[0].startsWith("---")) {
            const rowIndex = index + 2;
            worksheet[`A${rowIndex}`].s = sectionStyle;
            if (worksheet[`B${rowIndex}`]) {
                worksheet[`B${rowIndex}`].s = sectionStyle;
            } else {
                 worksheet[`B${rowIndex}`] = { t:'s', v: '', s: sectionStyle };
            }
        }
    });

    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório de Ocorrência');
    window.XLSX.writeFile(workbook, `Relatorio_${reportForExport.studentName.replace(/ /g, '_') || 'Ocorrencia'}.xlsx`);
  };


  const handleAnalyzeWithAI = async () => {
    if (!formData.detailedDescription) return;
    if (!apiKey) {
      setIsApiKeyModalOpen(true);
      return;
    }

    setIsAnalyzing(true);
    setGeminiError(null);
    setGeminiResult(null);
    setIsGeminiModalOpen(true);

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const checkedTypes = occurrenceTypeLabels
        .filter(({ key }) => formData.occurrenceTypes[key])
        .map(({ label }) => label)
        .join(', ');
      
      const prompt = `
        Analise a seguinte ocorrência escolar e forneça um resumo, ações imediatas, encaminhamentos e uma classificação de gravidade.
        Tipos de Ocorrência Marcados: ${checkedTypes || 'Nenhum'}
        Descrição do Fato: ${formData.detailedDescription}
      `;
      
      const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  summary: {
                    type: Type.STRING,
                    description: "Um resumo conciso do incidente em 2-3 frases.",
                  },
                  immediateActions: {
                    type: Type.STRING,
                    description: "Uma lista de 3 a 5 sugestões de ações imediatas que a escola pode tomar, formatada como um único parágrafo com itens separados por ponto e vírgula.",
                  },
                  referrals: {
                    type: Type.STRING,
                    description: "Uma lista de 2 a 4 sugestões de encaminhamentos (para conselho tutelar, psicólogo, etc.), formatada como um único parágrafo com itens separados por ponto e vírgula.",
                  },
                  severity: {
                    type: Type.STRING,
                    description: "Uma classificação da gravidade do incidente como 'Leve', 'Moderada' ou 'Grave'.",
                  },
                }
              }
          }
      });
      
      const text = response.text.trim();
      try {
        const result = JSON.parse(text) as GeminiAnalysisResult;
        setGeminiResult(result);
      } catch (parseError) {
        console.error("Falha ao analisar o JSON da IA:", parseError);
        console.error("Texto recebido:", text);
        throw new Error("Formato de resposta da IA inválido.");
      }

    } catch (error) {
      console.error("Erro na API do Gemini:", error);
      let errorMessage = "Não foi possível obter a análise da IA. Verifique sua conexão e tente novamente.";
      if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            errorMessage = "A chave de API fornecida não é válida. Verifique a chave e tente novamente.";
        } else if (error.message.includes('fetch')) {
            errorMessage = "Erro de rede ao contatar a IA. Verifique sua conexão com a internet.";
        } else if (error.message.includes('Formato de resposta da IA inválido')) {
            errorMessage = "A IA retornou uma resposta em um formato inesperado. Por favor, tente novamente.";
        }
      }
      setGeminiError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveApiKey = (newKey: string) => {
    const trimmedKey = newKey.trim();
    if (trimmedKey) {
        setApiKey(trimmedKey);
        localStorage.setItem(API_KEY_STORAGE_KEY, trimmedKey);
        setIsApiKeyModalOpen(false);
        setToast({ message: 'Chave de API salva com sucesso!', type: 'success' });
        // After saving the key, retry the analysis if the user was trying to.
        if (isGeminiModalOpen) {
          setIsGeminiModalOpen(false); // Close the gemini modal to restart the process
          setTimeout(() => handleAnalyzeWithAI(), 100);
        }
    } else {
        setApiKey(null);
        localStorage.removeItem(API_KEY_STORAGE_KEY);
        setToast({ message: 'Chave de API removida.', type: 'info' });
    }
  };

  const handleApplySuggestion = (field: 'immediateActions' | 'referralsMade', value: string) => {
    setFormData(prev => ({
        ...prev,
        [field]: prev[field] ? `${prev[field]}\n\n[Sugestão IA]: ${value}` : value,
    }));
    setIsGeminiModalOpen(false);
    setToast({ message: 'Sugestão aplicada com sucesso!', type: 'success' });
  };


  const submitButtonText = editingReportId ? 'Atualizar Relatório' : 'Registrar Ocorrência';
  const showExportOptions = isSubmitted || !!editingReportId;
  const progressPercentage = useMemo(() => ((activeTab + 1) / TABS.length) * 100, [activeTab]);


  const renderTabContent = () => {
    const commonProps = { formData, handleChange, handleBlur, errors };
    switch (activeTab) {
      case 0:
        return <TabIdentificacao {...commonProps} onPhotoChange={handleStudentPhotoChange} onAutocompleteChange={handleAutocompleteChange} />;
      case 1:
        return <TabOcorrencia {...commonProps} onCheckboxChange={handleCheckboxChange} onAnalyze={handleAnalyzeWithAI} isAnalyzing={isAnalyzing} />;
      case 2:
        return <TabEvidencias {...commonProps} onImagesChange={handleImagesChange} />;
      case 3:
        return <TabFinalizacao {...commonProps} />;
      default:
        return null;
    }
  };

  if (showGoodbyeScreen) {
    return <GoodbyeScreen onReturnToLogin={handleReturnToLogin} />;
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <>
      <div className="non-printable min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-screen-2xl mx-auto">
          
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
            <AppHeader
              onLogout={handleLogout}
              onApiKeyClick={() => setIsApiKeyModalOpen(true)}
              onNavigateToDashboard={handleNavigateToDashboard}
              onToggleHistory={handleToggleHistory}
              currentView={view}
            />

            <main className="p-6 md:p-8">
              {view === 'dashboard' ? (
                <Dashboard
                  reports={history}
                  onLoadReport={handleLoadReport}
                  onNewReport={handleNewReport}
                />
              ) : (
                <>
                  {isSubmitted && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 animate-fade-in-down" role="alert">
                      <p className="font-bold">Sucesso!</p>
                      <p>Ocorrência registrada com sucesso! Agora você pode exportar, imprimir ou baixar o relatório.</p>
                    </div>
                  )}
                  {editingReportId && (
                    <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 flex justify-between items-center animate-fade-in-down" role="status">
                        <div>
                          <p className="font-bold">Modo de Edição</p>
                          <p>Você está editando o relatório de <strong>{formData.studentName}</strong>.</p>
                        </div>
                        <button 
                          onClick={() => setIsCancelEditModalOpen(true)}
                          className="px-3 py-1.5 text-sm font-medium text-blue-800 bg-blue-200 rounded-md hover:bg-blue-300"
                        >
                          Cancelar Edição
                        </button>
                    </div>
                  )}

                  {validationSummary && (
                    <div id="validation-summary" className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 animate-fade-in-down" role="alert">
                      <p className="font-bold">Atenção!</p>
                      <p>{validationSummary}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} noValidate>
                    <div className="mb-6">
                      <div className="bg-gray-200 rounded-full h-2.5">
                        <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                      </div>
                    </div>

                    <div className="border-b border-gray-200 mb-6">
                      <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        {TABS.map((tabName, index) => (
                          <button
                            key={tabName}
                            type="button"
                            onClick={() => setActiveTab(index)}
                            className={`relative whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors
                              ${activeTab === index 
                                ? 'border-emerald-500 text-emerald-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              }`}
                          >
                            {tabName}
                            {tabErrors[index] && 
                              <span className="absolute top-2 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full" title="Esta aba contém erros">
                                  <span className="sr-only">Esta aba contém erros</span>
                              </span>
                            }
                          </button>
                        ))}
                      </nav>
                    </div>

                    <div id="tab-content-wrapper" className="min-h-[400px]">
                      {renderTabContent()}
                    </div>

                    <div className="mt-8 pt-5 border-t border-gray-200">
                      <div className="flex justify-between items-center mb-6">
                          <button
                              type="button"
                              onClick={() => setActiveTab(p => p - 1)}
                              disabled={activeTab === 0}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                              Voltar
                          </button>
                          <span className="text-sm text-gray-500">
                            Etapa {activeTab + 1} de {TABS.length}
                          </span>
                          <button
                              type="button"
                              onClick={() => setActiveTab(p => p + 1)}
                              disabled={activeTab === TABS.length - 1}
                              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                              Avançar
                          </button>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                          <button
                            type="button"
                            onClick={handleClear}
                            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition"
                          >
                            Limpar Formulário
                          </button>
                        </div>
                        
                        <div>
                           <button
                              type="submit"
                              disabled={isSubmitting || isSuccess}
                              className="w-full sm:w-auto px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 flex items-center justify-center disabled:bg-emerald-400 disabled:cursor-not-allowed"
                            >
                              {isSubmitting ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                  <span>Processando...</span>
                                </>
                              ) : isSuccess ? (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                  <span>Sucesso!</span>
                                </>
                              ) : (
                                submitButtonText
                              )}
                            </button>
                        </div>
                      </div>

                    </div>
                  </form>
                  <FloatingActionButton
                    onNewReport={handleNewReport}
                    onSaveDraft={handleSaveDraft}
                    onDownloadPdf={handleDownloadPdf}
                    onExportExcel={handleExportExcel}
                    showExportOptions={showExportOptions}
                    editingReportId={editingReportId}
                  />
                </>
              )}
            </main>
          </div>
        </div>
        
        <HistoryPanel 
          reports={history} 
          onLoadReport={handleLoadReport} 
          onDeleteReport={handleDeleteReport}
          onImportReports={handleImportReports}
          onStatusChange={handleStatusChange}
          onClose={handleToggleHistory}
          currentReportId={editingReportId}
          onSetToast={setToast}
        />

        {/* --- Modals and Toasts --- */}
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Confirmar Exclusão"
          variant="danger"
          confirmText="Excluir"
        >
          Você tem certeza que deseja excluir o relatório de <strong>{reportToDelete?.studentName}</strong>? Esta ação não pode ser desfeita.
        </ConfirmationModal>
        
        <ConfirmationModal
          isOpen={isClearModalOpen}
          onClose={() => setIsClearModalOpen(false)}
          onConfirm={confirmClear}
          title="Limpar Formulário"
          variant="danger"
          confirmText="Limpar"
        >
          Você tem certeza que deseja limpar todos os campos do formulário? Qualquer rascunho não salvo será perdido.
        </ConfirmationModal>

        <ConfirmationModal
          isOpen={isCancelEditModalOpen}
          onClose={() => setIsCancelEditModalOpen(false)}
          onConfirm={confirmClear}
          title="Descartar Alterações"
          variant="primary"
          confirmText="Descartar e Sair"
        >
          Você está editando um relatório ou possui um rascunho. Deseja descartar as alterações e começar um novo registro?
        </ConfirmationModal>

        <ConfirmationModal
          isOpen={isLoadConfirmModalOpen}
          onClose={() => setIsLoadConfirmModalOpen(false)}
          onConfirm={confirmDiscardAndLoad}
          title="Carregar Relatório"
          variant="primary"
          confirmText="Descartar e Carregar"
        >
          Você tem alterações não salvas no formulário atual. Deseja descartá-las para carregar um relatório do histórico?
        </ConfirmationModal>

        <ConfirmationModal
          isOpen={isLeavePageModalOpen}
          onClose={() => setIsLeavePageModalOpen(false)}
          onConfirm={confirmLeavePage}
          title="Descartar Alterações?"
          variant="danger"
          confirmText="Sair e Descartar"
        >
          Você possui alterações não salvas. Tem certeza que deseja sair desta página e perder seu progresso?
        </ConfirmationModal>

        <GeminiAnalysisModal
          isOpen={isGeminiModalOpen}
          onClose={() => setIsGeminiModalOpen(false)}
          analysisResult={geminiResult}
          onApplySuggestion={handleApplySuggestion}
          isLoading={isAnalyzing}
          error={geminiError}
        />
        
        <ApiKeyModal
          isOpen={isApiKeyModalOpen}
          onClose={() => setIsApiKeyModalOpen(false)}
          onSave={handleSaveApiKey}
          currentApiKey={apiKey}
        />

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
      <div className="printable-area">
        <PrintableReport reportData={reportForExport} />
      </div>
    </>
  );
}

export default App;