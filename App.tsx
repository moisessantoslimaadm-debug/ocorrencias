import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import type { OccurrenceReport, SavedReport, ReportImage, GeminiAnalysisResult, Modification } from './types';
import SectionHeader from './components/SectionHeader';
import InputField from './components/InputField';
import TextAreaField from './components/TextAreaField';
import PrintableReport from './components/PrintableReport';
import HistoryPanel from './components/HistoryPanel';
import ImageUpload from './components/ImageUpload';
import StudentPhotoUpload from './components/StudentPhotoUpload';
import Toast from './components/Toast';
import ConfirmationModal from './components/ConfirmationModal';
import GeminiAnalysisModal from './components/GeminiAnalysisModal';

// Add type declarations for CDN scripts
declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

const DRAFT_STORAGE_KEY = 'schoolOccurrenceReportFormData';
const HISTORY_STORAGE_KEY = 'schoolOccurrenceReportHistory';

const calculateAge = (dob: string): string => {
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
      occurrenceDate: '',
      occurrenceTime: '',
      occurrenceLocation: '',
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
      modificationHistory: [],
    };
};

const getInitialDraftData = (): OccurrenceReport & { id?: string } => {
    const savedData = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            if (typeof parsedData === 'object' && parsedData !== null && 'schoolUnit' in parsedData) {
                 if (!parsedData.images) {
                    parsedData.images = [];
                 }
                 if (!('studentPhoto' in parsedData)) {
                    parsedData.studentPhoto = null;
                 }
                 if (!('modificationHistory' in parsedData)) {
                    parsedData.modificationHistory = [];
                 }
                 if (!('guardianEmail' in parsedData)) {
                    parsedData.guardianEmail = '';
                 }
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
                return parsedHistory.map(report => ({
                    ...report,
                    images: report.images || [],
                    studentPhoto: report.studentPhoto || null,
                    modificationHistory: report.modificationHistory || [],
                    guardianEmail: report.guardianEmail || '',
                })) as SavedReport[];
            }
        } catch (error) {
            console.error("Failed to parse history data from localStorage", error);
            localStorage.removeItem(HISTORY_STORAGE_KEY);
        }
    }
    return [];
};


const occurrenceTypeLabels: { key: keyof OccurrenceReport['occurrenceTypes']; label: string }[] = [
    { key: 'physicalAssault', label: 'Agressão física' },
    { key: 'verbalAssault', label: 'Agressão verbal/ofensas' },
    { key: 'bullying', label: 'Situação de bullying' },
    { key: 'propertyDamage', label: 'Danos ao patrimônio' },
    { key: 'truancy', label: 'Fuga/abandono de sala ou unidade escolar' },
    { key: 'socialRisk', label: 'Situação de risco/vulnerabilidade social' },
    { key: 'prohibitedSubstances', label: 'Uso/porte de substâncias proibidas' },
    { key: 'other', label: 'Outros' },
];

const validateStudentRegistration = (value: string): string => {
  const maxLength = 20;
  if (!value) return '';
  if (value.length > maxLength) {
    return `O número de matrícula não pode exceder ${maxLength} caracteres.`;
  }
  if (!/^[a-zA-Z0-9]*$/.test(value)) {
    return 'O número de matrícula deve conter apenas letras e números.';
  }
  return '';
};

type FormErrors = Partial<Record<keyof OccurrenceReport | 'occurrenceTypes' | 'guardianPhone', string>>;


function App() {
  const [formData, setFormData] = useState<OccurrenceReport & { id?: string }>(getInitialDraftData);
  const [history, setHistory] = useState<SavedReport[]>(getInitialHistory);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<SavedReport | null>(null);
  const [autoSaveMessage, setAutoSaveMessage] = useState('');

  // Gemini AI State
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);
  const [geminiResult, setGeminiResult] = useState<GeminiAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);


  // Auto-save draft every 60 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Don't save if the form was just submitted or is in a pristine default state
      const isPristine = JSON.stringify(formData) === JSON.stringify(getDefaultFormData());
      if (!isSubmitted && !isPristine) {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
        const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        setAutoSaveMessage(`Rascunho salvo automaticamente às ${time}`);
        // Message fades out after 5 seconds
        setTimeout(() => setAutoSaveMessage(''), 5000);
      }
    }, 60000); // 60 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [formData, isSubmitted]);


  // Warn user before leaving if there are unsaved changes
  useEffect(() => {
    const hasUnsavedChanges = () => {
      // Check if there's a draft in local storage that isn't the default empty form
      const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
      // We only want to trigger the warning if there's a meaningful draft saved
      return !!draft && draft !== JSON.stringify(getDefaultFormData());
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        event.preventDefault();
        // Standard for most browsers
        event.returnValue = '';
        return ''; // Required for some older browsers
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []); // Run only once on component mount


  useEffect(() => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  }, [history]);
  
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};
    const requiredFields: (keyof OccurrenceReport)[] = [
      'schoolUnit', 'municipality', 'uf', 'studentName', 'studentDob',
      'occurrenceDate', 'occurrenceTime', 'occurrenceLocation', 'detailedDescription',
      'reporterName', 'reporterDate'
    ];

    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'Este campo é obrigatório.';
      }
    });

    if (formData.guardianPhone) {
        const phoneDigits = formData.guardianPhone.replace(/\D/g, '');
        // A valid number must have 10 (DDD + 8 digits) or 11 digits (DDD + 9 digits).
        // The field is optional, so we only validate if it's not empty.
        if (phoneDigits.length > 0 && ![10, 11].includes(phoneDigits.length)) {
            newErrors.guardianPhone = 'Número de telefone inválido. Deve conter 10 ou 11 dígitos, incluindo o DDD.';
        }
    }

    const isAnyOccurrenceTypeChecked = Object.values(formData.occurrenceTypes).some(value => value);
    if (!isAnyOccurrenceTypeChecked) {
        newErrors.occurrenceTypes = 'Selecione ao menos um tipo de ocorrência.';
    }

    if(formData.occurrenceTypes.other && !formData.occurrenceOtherDescription) {
        newErrors.occurrenceOtherDescription = "Especifique o tipo de ocorrência 'Outros'.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.guardianEmail && !emailRegex.test(formData.guardianEmail)) {
        newErrors.guardianEmail = 'Por favor, insira um endereço de e-mail válido.';
    }

    const registrationError = validateStudentRegistration(formData.studentRegistration);
    if (registrationError) {
        newErrors.studentRegistration = registrationError;
    }

    return newErrors;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'guardianEmail') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setErrors(prev => ({ ...prev, guardianEmail: 'Por favor, insira um endereço de e-mail válido.' }));
      } else {
        // Clear error if the field is valid or empty
        setErrors(prev => ({ ...prev, guardianEmail: undefined }));
      }
    }
    
    if (name === 'guardianPhone') {
        const phoneDigits = value.replace(/\D/g, '');
        if (phoneDigits.length > 0 && ![10, 11].includes(phoneDigits.length)) {
            setErrors(prev => ({ ...prev, guardianPhone: 'Número de telefone inválido. Deve conter 10 ou 11 dígitos, incluindo o DDD.' }));
        } else {
            // Clear error if the field is valid or empty
            setErrors(prev => ({ ...prev, guardianPhone: undefined }));
        }
    }
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as { name: keyof OccurrenceReport, value: string };
    
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    if (name === 'studentRegistration') {
        const errorMessage = validateStudentRegistration(value);
        setErrors(prev => ({ ...prev, studentRegistration: errorMessage }));
    }

    setFormData(prev => {
        const newState = { ...prev, [name]: value };
        if (name === 'studentDob') {
            newState.studentAge = calculateAge(value);
        }
        return newState;
    });
  }, [errors]);

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target as { name: keyof OccurrenceReport['occurrenceTypes'], checked: boolean };
    
    if(errors.occurrenceTypes) {
        setErrors(prev => ({...prev, occurrenceTypes: undefined}));
    }

    setFormData(prev => ({
      ...prev,
      occurrenceTypes: {
        ...prev.occurrenceTypes,
        [name]: checked,
      },
    }));
  }, [errors.occurrenceTypes]);

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
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setFormData(getDefaultFormData());
    setErrors({});
    setIsSubmitted(false);
    setSuccessMessage('');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        const firstErrorKey = Object.keys(validationErrors)[0];
        const firstErrorElement = document.getElementById(firstErrorKey);
        if (firstErrorElement) {
          firstErrorElement.focus({ preventScroll: true });
          firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    setErrors({});

    const { id, ...reportData } = formData;
    setHistory(prevHistory => {
        if (id) {
            setSuccessMessage('Relatório atualizado com sucesso!');
            setToast({ message: 'Relatório atualizado com sucesso!', type: 'success' });

            const newModification: Modification = { date: new Date().toISOString() };
            const updatedModificationHistory = [...(reportData.modificationHistory || []), newModification];

            return prevHistory.map(report => 
                report.id === id ? { 
                    ...report, 
                    ...reportData, 
                    modificationHistory: updatedModificationHistory,
                    savedAt: new Date().toISOString() 
                } : report
            );
        } else {
            setSuccessMessage('Ocorrência registrada com sucesso!');
            setToast({ message: 'Ocorrência registrada com sucesso!', type: 'success' });
            const newReport: SavedReport = {
                ...reportData,
                id: Date.now().toString(),
                savedAt: new Date().toISOString(),
                modificationHistory: [],
            };
            return [newReport, ...prevHistory];
        }
    });
    
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    const newDefaultForm = getDefaultFormData();
    setFormData(newDefaultForm);
    setIsSubmitted(true);
    window.scrollTo(0, 0);
  };

  const handleLoadReport = (id: string) => {
    const draftData = localStorage.getItem(DRAFT_STORAGE_KEY);
    const isDraftDirty = draftData && draftData !== JSON.stringify(getDefaultFormData());

    if (isDraftDirty && formData.id !== id) {
       const isConfirmed = window.confirm("Você tem certeza que deseja carregar este relatório? As alterações não salvas no formulário atual serão perdidas.");
       if (!isConfirmed) return;
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
          fillDate: currentDate,
          reporterDate: currentDate,
        };
        setFormData(loadedData);
        // Save the loaded data as the current draft
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(loadedData));

        setIsSubmitted(false);
        setSuccessMessage('');
        setErrors({});
        window.scrollTo(0, 0);
    }
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
            handleClear();
        }
    }
    setIsDeleteModalOpen(false);
    setReportToDelete(null);
  };
  
  const handleImportReports = (importedReports: SavedReport[]) => {
    const isConfirmed = window.confirm(
      "Você tem certeza que deseja importar este backup? Todos os relatórios existentes no navegador serão substituídos. Esta ação não pode ser desfeita."
    );
    if (isConfirmed) {
      setHistory(importedReports);
      setToast({ message: 'Backup importado com sucesso!', type: 'success' });
    }
  };

  const handlePrint = () => {
    window.print();
  };
  
  const handleDownloadPdf = async () => {
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
    reportElement.style.width = '210mm';

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
      
      pdf.save(`relatorio-${formData.studentName.replace(/ /g, '_') || 'ocorrencia'}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.");
    } finally {
      reportElement.className = originalClassName;
      reportElement.style.cssText = originalStyle;
      setIsDownloadingPdf(false);
    }
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
        Analise a seguinte ocorrência escolar:

        Tipos de Ocorrência Marcados: ${checkedTypes || 'Nenhum'}
        Descrição do Fato: ${formData.detailedDescription}

        Por favor, retorne um objeto JSON com a seguinte estrutura, sem nenhum texto adicional ou formatação:
        {
          "summary": "Um resumo conciso do incidente em 2-3 frases.",
          "immediateActions": "Uma lista de 3 a 5 sugestões de ações imediatas que a escola pode tomar, formatada como um único parágrafo com itens separados por ponto e vírgula.",
          "referrals": "Uma lista de 2 a 4 sugestões de encaminhamentos (para conselho tutelar, psicólogo, etc.), formatada como um único parágrafo com itens separados por ponto e vírgula.",
          "severity": "Uma classificação da gravidade do incidente como 'Leve', 'Moderada' ou 'Grave'."
        }
      `;
      
      const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
              responseMimeType: "application/json",
          }
      });
      
      const text = response.text.trim();
      const result = JSON.parse(text) as GeminiAnalysisResult;
      setGeminiResult(result);

    } catch (error) {
      console.error("Erro na API do Gemini:", error);
      setGeminiError("Não foi possível obter a análise da IA. Verifique sua conexão ou a chave de API e tente novamente.");
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


  const submitButtonText = formData.id ? 'Atualizar Relatório' : 'Registrar Ocorrência';

  return (
    <>
      <div className="non-printable min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-8 w-full max-w-screen-2xl mx-auto">
          
          <main className="flex-grow lg:order-1">
            <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
              <header className="bg-emerald-700 p-6 text-white text-center">
                <h1 className="text-2xl md:text-3xl font-bold">FICHA DE REGISTRO DE OCORRÊNCIA ESCOLAR</h1>
                <p className="text-emerald-200 mt-1">Plataforma Inteligente de Registro de Situações Críticas</p>
              </header>

              <div className="p-6 md:p-8">
                {isSubmitted && successMessage && (
                  <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
                    <p className="font-bold">Sucesso!</p>
                    <p>{successMessage} Agora você pode imprimir ou baixar o relatório do formulário limpo.</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <InputField id="schoolUnit" name="schoolUnit" label="Unidade Escolar" type="text" value={formData.schoolUnit} onChange={handleChange} className="lg:col-span-4" error={errors.schoolUnit} />
                    <InputField id="municipality" name="municipality" label="Município" type="text" value={formData.municipality} onChange={handleChange} className="lg:col-span-3" error={errors.municipality} />
                    <InputField id="uf" name="uf" label="UF" type="text" value={formData.uf} onChange={handleChange} error={errors.uf} />
                    <InputField id="fillDate" name="fillDate" label="Data de Preenchimento" type="date" value={formData.fillDate} onChange={handleChange} className="lg:col-span-2" description="Selecione ou digite a data." error={errors.fillDate} readOnly/>
                    <InputField id="fillTime" name="fillTime" label="Horário" type="time" value={formData.fillTime} onChange={handleChange} className="lg:col-span-2" error={errors.fillTime} />
                  </div>

                  <SectionHeader title="1. IDENTIFICAÇÃO DO ALUNO ENVOLVIDO" />
                  <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 flex justify-center items-start pt-4">
                      <StudentPhotoUpload photo={formData.studentPhoto} onPhotoChange={handleStudentPhotoChange} />
                    </div>
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField id="studentName" name="studentName" label="Nome completo" type="text" value={formData.studentName} onChange={handleChange} className="sm:col-span-2" error={errors.studentName} />
                      <InputField id="studentDob" name="studentDob" label="Data de nascimento" type="date" value={formData.studentDob} onChange={handleChange} description="Selecione ou digite a data." error={errors.studentDob} />
                      <InputField id="studentAge" name="studentAge" label="Idade (anos)" type="number" value={formData.studentAge} onChange={handleChange} readOnly />
                      <InputField id="studentRegistration" name="studentRegistration" label="Nº de matrícula" type="text" value={formData.studentRegistration} onChange={handleChange} error={errors.studentRegistration} />
                      <InputField id="studentGrade" name="studentGrade" label="Ano/Série" type="text" value={formData.studentGrade} onChange={handleChange} />
                      <InputField id="studentShift" name="studentShift" label="Turno" type="text" value={formData.studentShift} onChange={handleChange} />
                    </div>
                  </div>
                  
                  <SectionHeader title="2. RESPONSÁVEL LEGAL" />
                  <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField id="guardianName" name="guardianName" label="Nome completo" type="text" value={formData.guardianName} onChange={handleChange} />
                    <InputField id="guardianRelationship" name="guardianRelationship" label="Parentesco" type="text" value={formData.guardianRelationship} onChange={handleChange} />
                    <InputField id="guardianPhone" name="guardianPhone" label="Contato telefônico" type="tel" value={formData.guardianPhone} onChange={handleChange} onBlur={handleBlur} placeholder="(00) 00000-0000" error={errors.guardianPhone} description="Deve conter DDD + 8 ou 9 dígitos." />
                    <InputField id="guardianEmail" name="guardianEmail" label="E-mail de contato" type="email" value={formData.guardianEmail} onChange={handleChange} onBlur={handleBlur} placeholder="exemplo@email.com" error={errors.guardianEmail} />
                    <InputField id="guardianAddress" name="guardianAddress" label="Endereço completo" type="text" value={formData.guardianAddress} onChange={handleChange} className="md:col-span-2" />
                  </div>
                  
                  <SectionHeader title="3. CARACTERIZAÇÃO DA OCORRÊNCIA" />
                  <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <InputField id="occurrenceDate" name="occurrenceDate" label="Data da ocorrência" type="date" value={formData.occurrenceDate} onChange={handleChange} description="Selecione ou digite a data." error={errors.occurrenceDate} />
                      <InputField id="occurrenceTime" name="occurrenceTime" label="Horário aproximado" type="time" value={formData.occurrenceTime} onChange={handleChange} error={errors.occurrenceTime} />
                      <InputField id="occurrenceLocation" name="occurrenceLocation" label="Local onde ocorreu" type="text" value={formData.occurrenceLocation} onChange={handleChange} error={errors.occurrenceLocation} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de ocorrência:</label>
                      {errors.occurrenceTypes && <p className="text-xs text-red-600 mb-2" role="alert">{errors.occurrenceTypes}</p>}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                        {occurrenceTypeLabels.map(({ key, label }) => (
                          <div key={key} className="flex items-center">
                            <input
                              id={key}
                              name={key}
                              type="checkbox"
                              checked={!!formData.occurrenceTypes[key]}
                              onChange={handleCheckboxChange}
                              className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                            />
                            <label htmlFor={key} className="ml-2 block text-sm text-gray-900">{label}</label>
                          </div>
                        ))}
                      </div>
                      {formData.occurrenceTypes.other && (
                        <InputField id="occurrenceOtherDescription" name="occurrenceOtherDescription" label="Especifique 'Outros'" type="text" value={formData.occurrenceOtherDescription} onChange={handleChange} className="mt-2" error={errors.occurrenceOtherDescription} />
                      )}
                    </div>
                  </div>

                  <SectionHeader title="4. DESCRIÇÃO DETALHADA DO FATO" />
                  <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200">
                    <div className="flex justify-end mb-2">
                      <button 
                        type="button" 
                        onClick={handleAnalyzeWithAI} 
                        disabled={!formData.detailedDescription || isAnalyzing}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-md hover:bg-emerald-200 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                      >
                         {isAnalyzing ? (
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9.622 3.203a.75.75 0 01.756 0l1.25 1.25a.75.75 0 010 1.06l-1.25 1.25a.75.75 0 01-1.06 0l-1.25-1.25a.75.75 0 010-1.06l1.25-1.25zM12.5 6.5a.75.75 0 00-1.06 0l-1.25 1.25a.75.75 0 000 1.06l1.25 1.25a.75.75 0 001.06 0l1.25-1.25a.75.75 0 000-1.06L12.5 6.5zM5.378 8.203a.75.75 0 01.756 0l1.25 1.25a.75.75 0 010 1.06l-1.25 1.25a.75.75 0 01-1.06 0L4.122 10.51a.75.75 0 010-1.06l1.25-1.25zM10 11.25a.75.75 0 00-1.06 0l-1.25 1.25a.75.75 0 000 1.06l1.25 1.25a.75.75 0 001.06 0l1.25-1.25a.75.75 0 000-1.06L10 11.25z" clipRule="evenodd" />
                            </svg>
                          )}
                        <span>{isAnalyzing ? 'Analisando...' : 'Analisar com IA'}</span>
                      </button>
                    </div>
                    <TextAreaField id="detailedDescription" name="detailedDescription" label="" subtitle="Relatar de forma objetiva, com sequência cronológica dos acontecimentos." value={formData.detailedDescription} onChange={handleChange} rows={6} error={errors.detailedDescription} maxLength={2000} />
                  </div>

                  <SectionHeader title="5. EVIDÊNCIAS (IMAGENS)" />
                  <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200">
                    <ImageUpload images={formData.images} onImagesChange={handleImagesChange} />
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

                  {formData.id && formData.modificationHistory && formData.modificationHistory.length > 0 && (
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
                        <p className="text-xs text-gray-500 mt-3 italic">Nota: A data de criação do relatório pode ser vista no painel de histórico lateral sob "Salvo em".</p>
                      </div>
                    </>
                  )}

                  <SectionHeader title="11. ASSINATURA" />
                  <div className="bg-white p-4 rounded-b-md border border-t-0 border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <InputField id="reporterName" name="reporterName" label="Responsável pelo registro" type="text" value={formData.reporterName} onChange={handleChange} error={errors.reporterName} />
                    <InputField id="reporterDate" name="reporterDate" label="Data" type="date" value={formData.reporterDate} onChange={handleChange} description="Selecione ou digite a data." ariaLabel="Data do registro" error={errors.reporterDate} readOnly />
                    <InputField id="guardianSignatureName" name="guardianSignatureName" label="Responsável legal do aluno" type="text" value={formData.guardianSignatureName} onChange={handleChange} />
                    <InputField id="guardianSignatureDate" name="guardianSignatureDate" label="Data" type="date" value={formData.guardianSignatureDate} onChange={handleChange} description="Selecione ou digite a data." ariaLabel="Data da assinatura do responsável legal" />
                    <InputField id="socialWorkerSignatureName" name="socialWorkerSignatureName" label="Assistente Social" type="text" value={formData.socialWorkerSignatureName} onChange={handleChange} />
                    <InputField id="socialWorkerSignatureDate" name="socialWorkerSignatureDate" label="Data" type="date" value={formData.socialWorkerSignatureDate} onChange={handleChange} description="Selecione ou digite a data." ariaLabel="Data da assinatura do assistente social" />
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row justify-end items-center gap-4">
                    <div className="mr-auto">
                        {autoSaveMessage && (
                            <p className="text-sm text-gray-500 transition-opacity duration-500 animate-fade-in" role="status">
                                {autoSaveMessage}
                            </p>
                        )}
                    </div>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition"
                    >
                      {formData.id ? 'Limpar e Criar Novo' : 'Limpar Formulário'}
                    </button>
                    
                    {isSubmitted ? (
                      <>
                        <button
                          type="button"
                          onClick={handleDownloadPdf}
                          disabled={isDownloadingPdf}
                          className="w-full sm:w-auto px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {isDownloadingPdf ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Baixando...</span>
                            </>
                          ) : (
                            'Baixar PDF'
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handlePrint}
                          className="w-full sm:w-auto px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition"
                        >
                          Imprimir Relatório
                        </button>
                      </>
                    ) : (
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition"
                      >
                        {submitButtonText}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
            <footer className="text-center text-gray-500 text-sm mt-8 pb-4">
                <p>Plataforma de Registro de Ocorrências</p>
                <p>&copy; {new Date().getFullYear()}. Todos os direitos reservados.</p>
              </footer>
          </main>
          
          <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0 lg:order-2">
             <HistoryPanel 
                reports={history} 
                onLoadReport={handleLoadReport} 
                onDeleteReport={handleDeleteReport}
                onImportReports={handleImportReports}
                currentReportId={formData.id} 
              />
          </aside>

        </div>
      </div>
      <PrintableReport reportData={formData} />
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
        title="Confirmar Exclusão de Relatório"
      >
        Você tem certeza que deseja excluir o relatório de <strong>{reportToDelete?.studentName || 'este aluno'}</strong>?
        <br />
        Esta ação não pode ser desfeita.
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
      `}</style>
    </>
  );
}

export default App;