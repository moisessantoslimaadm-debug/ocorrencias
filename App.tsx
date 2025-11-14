import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { OccurrenceReport, SavedReport, ReportImage, GeminiAnalysisResult, Modification, FormErrors, ReportStatus } from './types';
import { DRAFT_STORAGE_KEY, HISTORY_STORAGE_KEY, AUTH_SESSION_KEY, occurrenceTypeLabels, severityOptions } from './constants';


// New Component Imports
import AppHeader from './components/AppHeader';
import TabIdentificacao from './components/tabs/TabIdentificacao';
import TabOcorrencia from './components/tabs/TabOcorrencia';
import TabEvidencias from './components/tabs/TabEvidencias';
import TabFinalizacao from './components/tabs/TabFinalizacao';
import LoginScreen from './components/LoginScreen'; // Import LoginScreen

import PrintableReport from './components/PrintableReport';
import HistoryPanel from './components/HistoryPanel';
import Toast from './components/Toast';
import ConfirmationModal from './components/ConfirmationModal';
import GeminiAnalysisModal from './components/GeminiAnalysisModal';
import { seedData } from './data/seedData';
import Dropdown from './components/Dropdown';

// Add type declarations for CDN scripts
declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
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
  if (!trimmedAddress) return ''; // Not a required field, so no error if empty

  // Basic checks for a reasonably complete address.
  // We check for minimum length, at least one number, and a comma.
  const hasNumber = /\d/.test(trimmedAddress);
  const hasComma = /,/.test(trimmedAddress);
  const wordCount = trimmedAddress.split(/\s+/).length;

  if (trimmedAddress.length > 0 && (trimmedAddress.length < 10 || !hasNumber || !hasComma || wordCount < 3)) {
    return 'Endereço inválido. Forneça rua, número, bairro e cidade. Ex: Rua das Flores, 123, Centro.';
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
    // Check session storage for auth flag
    return sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';
  });

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


  // Gemini AI State
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);
  const [geminiResult, setGeminiResult] = useState<GeminiAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);

  const handleLogin = () => {
    sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    setIsAuthenticated(false);
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

    const hasUnsavedChanges = () => {
      const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
      return !!draft && draft !== JSON.stringify(getDefaultFormData());
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        event.preventDefault();
        event.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAuthenticated]);


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
    if (formData.uf && !/^[A-Za-z]{2}$/.test(formData.uf)) {
        newErrors.uf = 'UF deve conter exatamente 2 letras.';
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
            newErrors.guardianPhone = 'Telefone inválido. Deve conter DDD + 8 ou 9 dígitos.';
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
    
    const isAnyOccurrenceTypeChecked = Object.values(formData.occurrenceTypes).some(value => value);
    if (!isAnyOccurrenceTypeChecked) {
        newErrors.occurrenceTypes = 'Selecione ao menos um tipo de ocorrência.';
    }

    if(formData.occurrenceTypes.other && !formData.occurrenceOtherDescription) {
        newErrors.occurrenceOtherDescription = "Especifique o tipo de ocorrência 'Outros'.";
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
            setErrors(prev => ({ ...prev, guardianPhone: 'Telefone inválido. Deve conter DDD + 8 ou 9 dígitos.' }));
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
        const newState = { ...prev, [name]: value };
        if (name === 'studentDob') {
            newState.studentAge = calculateAge(value);
            if (new Date(value) > new Date()) {
                setErrors(prevErrors => ({ ...prevErrors, studentDob: 'A data de nascimento não pode ser no futuro.' }));
            } else {
                 setErrors(prevErrors => ({ ...prevErrors, studentDob: undefined }));
            }
        }
        return newState;
    });
  }, [errors, clearTabError]);

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [errors.occurrenceTypes, clearTabError]);

  const handleImagesChange = useCallback((images: ReportImage[]) => {
    setFormData(prev => ({
      ...prev,
      images,
    }));
  }, []);
  
  const handleStudentPhotoChange = useCallback((photo: ReportImage | null) => {
    setFormData(prev => ({
      ...prev,
      studentPhoto: photo,
    }));
  }, []);

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
  };


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        
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
    }, 1500); // Display success for 1.5 seconds.
  };

  const handleLoadReport = (id: string) => {
    const draftData = localStorage.getItem(DRAFT_STORAGE_KEY);
    const isDraftDirty = draftData && draftData !== JSON.stringify(getDefaultFormData());

    if (isDraftDirty && formData.id !== id) {
       setIsCancelEditModalOpen(true);
       return;
    }

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
        window.scrollTo(0, 0);
    }
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

  const handleExportSingleCsv = () => {
    if (!reportForExport) return;

    const headers = [
      "Status", "Unidade Escolar", "Município", "UF", "Data de Preenchimento", "Horário de Preenchimento",
      "Nome do Aluno", "Foto do Aluno", "Data de Nascimento", "Idade", "Ano/Série", "Turno", "Nº de Matrícula",
      "Nome do Responsável", "Parentesco", "Telefone do Responsável", "E-mail do Responsável", "Endereço do Responsável",
      "Data e Hora da Ocorrência", "Local da Ocorrência", "Gravidade da Ocorrência", "Tipos de Ocorrência", "Descrição 'Outros'",
      "Descrição Detalhada", "Evidências (Imagens)", "Pessoas Envolvidas", "Providências Imediatas",
      "Encaminhamentos Realizados", "Observações do Serviço Social",
      "Responsável pelo Registro", "Data do Registro", "Assinatura Responsável Legal", "Data Assinatura Resp. Legal",
      "Assinatura Assistente Social", "Data Assinatura Assist. Social",
      "Histórico de Modificações"
    ];

    const escapeCsvCell = (cell: any): string => {
        const cellStr = String(cell ?? '').replace(/"/g, '""');
        return `"${cellStr}"`;
    };

    const checkedTypes = occurrenceTypeLabels
        .filter(({ key }) => reportForExport.occurrenceTypes[key])
        .map(({ label }) => label)
        .join('; ');
    
    const imageNames = reportForExport.images.map(img => img.name).join('; ');
    const modificationDates = reportForExport.modificationHistory.map(mod => new Date(mod.date).toLocaleString('pt-BR')).join('; ');
    
    const row = [
      reportForExport.status, reportForExport.schoolUnit, reportForExport.municipality, reportForExport.uf, reportForExport.fillDate, reportForExport.fillTime,
      reportForExport.studentName, reportForExport.studentPhoto ? 'Sim' : 'Não', reportForExport.studentDob, reportForExport.studentAge, reportForExport.studentGrade, reportForExport.studentShift, reportForExport.studentRegistration,
      reportForExport.guardianName, reportForExport.guardianRelationship, reportForExport.guardianPhone, reportForExport.guardianEmail, reportForExport.guardianAddress,
      reportForExport.occurrenceDateTime, reportForExport.occurrenceLocation, reportForExport.occurrenceSeverity, checkedTypes, reportForExport.occurrenceOtherDescription,
      reportForExport.detailedDescription, imageNames || "Nenhuma", reportForExport.peopleInvolved, reportForExport.immediateActions,
      reportForExport.referralsMade, reportForExport.socialServiceObservation,
      reportForExport.reporterName, reportForExport.reporterDate, reportForExport.guardianSignatureName, reportForExport.guardianSignatureDate,
      reportForExport.socialWorkerSignatureName, reportForExport.socialWorkerSignatureDate,
      modificationDates || "Nenhuma"
    ];
    
    const csvContent = [headers.join(','), row.map(escapeCsvCell).join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-t;-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_${reportForExport.studentName.replace(/ /g, '_') || 'ocorrencia'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const handleAnalyzeWithAI = async () => {
    if (!formData.detailedDescription) return;

    setIsAnalyzing(true);
    setGeminiError(null);
    setGeminiResult(null);
    setIsGeminiModalOpen(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
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
              errorMessage = "A chave de API configurada não é válida. Verifique a configuração do ambiente.";
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
        return <TabIdentificacao {...commonProps} onPhotoChange={handleStudentPhotoChange} />;
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

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <>
      <div className="non-printable min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-8 w-full max-w-screen-2xl mx-auto">
          
          <main className="flex-grow lg:order-1">
            <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
              <AppHeader onLogout={handleLogout} />

              <div className="p-6 md:p-8">
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
                      <div className="flex-grow">
                        {/* Auto-save message is now a toast notification */}
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                           <button
                            type="button"
                            onClick={handleClear}
                            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition"
                          >
                            Limpar Formulário
                          </button>
                          {editingReportId && (
                            <button
                                type="button"
                                onClick={handleSaveDraft}
                                className="w-full sm:w-auto px-4 py-2 border border-emerald-300 rounded-md shadow-sm text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition"
                            >
                                Salvar Rascunho
                            </button>
                          )}
                          
                          {showExportOptions ? (
                              <Dropdown
                                  buttonText="Exportar Relatório"
                                  isLoading={isDownloadingPdf}
                                  loadingText="Baixando..."
                              >
                                  <button onClick={handlePrint} className="text-left w-full block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Imprimir Relatório</button>
                                  <button onClick={handleDownloadPdf} className="text-left w-full block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Baixar como PDF</button>
                                  <button onClick={handleExportSingleCsv} className="text-left w-full block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Exportar para CSV</button>
                              </Dropdown>
                          ) : (
                            <button
                              type="submit"
                              disabled={isSubmitting || isSuccess}
                              className={`w-full sm:w-auto px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white transition flex items-center justify-center disabled:cursor-not-allowed ${
                                isSuccess
                                  ? 'bg-green-500'
                                  : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400'
                              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500`}
                            >
                              {isSubmitting ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span>{editingReportId ? 'Atualizando...' : 'Registrando...'}</span>
                                </>
                              ) : isSuccess ? (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span>Sucesso!</span>
                                </>
                              ) : (
                                submitButtonText
                              )}
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <footer className="text-center text-gray-500 text-sm mt-8 pb-4">
                <p>Plataforma Inteligente de Registro de Ocorrências</p>
                <p>&copy; {new Date().getFullYear()}. Todos os direitos reservados.</p>
              </footer>
          </main>
          
          <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0 lg:order-2">
             <HistoryPanel 
                reports={history} 
                onLoadReport={handleLoadReport} 
                onDeleteReport={handleDeleteReport}
                onImportReports={handleImportReports}
                onStatusChange={handleStatusChange}
                currentReportId={editingReportId}
                onSetToast={setToast}
              />
          </aside>

        </div>
      </div>
      <PrintableReport reportData={reportForExport} />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        confirmText="Sim, Excluir"
        variant="danger"
      >
        Você tem certeza que deseja excluir o relatório de <strong>{reportToDelete?.studentName || 'este aluno'}</strong>?
        <br />
        Esta ação não pode ser desfeita.
      </ConfirmationModal>
      <ConfirmationModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={confirmClear}
        title="Limpar Formulário"
        confirmText="Sim, Limpar"
        variant="danger"
      >
        Você tem certeza que deseja limpar o formulário e descartar todas as informações inseridas?
        <br />
        Esta ação não pode ser desfeita.
      </ConfirmationModal>
      <ConfirmationModal
        isOpen={isCancelEditModalOpen}
        onClose={() => setIsCancelEditModalOpen(false)}
        onConfirm={confirmClear}
        title="Cancelar Edição"
        confirmText="Sim, Cancelar Edição"
        variant="danger"
      >
        Você tem certeza que deseja cancelar a edição? Todas as alterações não salvas serão perdidas.
      </ConfirmationModal>
      <GeminiAnalysisModal
        isOpen={isGeminiModalOpen}
        onClose={() => setIsGeminiModalOpen(false)}
        analysisResult={geminiResult}
        onApplySuggestion={handleApplySuggestion}
        isLoading={isAnalyzing}
        error={geminiError}
      />
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        @keyframes fade-in-up {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.3s ease-out forwards;
        }
        @keyframes fade-in-down {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
            animation: fade-in-down 0.3s ease-out forwards;
        }
        @keyframes backdrop-fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-backdrop-fade-in {
            animation: backdrop-fade-in 0.2s ease-out forwards;
        }
        @keyframes scale-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
            animation: scale-in 0.2s ease-out forwards;
        }
        @keyframes fade-in-up-fast {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up-fast {
            animation: fade-in-up-fast 0.2s ease-out forwards;
        }
      `}</style>
    </>
  );
}

export default App;