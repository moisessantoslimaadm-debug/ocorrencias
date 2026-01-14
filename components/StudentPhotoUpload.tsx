
import React, { useState, useCallback, useRef } from 'react';
import type { ReportImage } from '../types';

interface StudentPhotoUploadProps {
  photo: ReportImage | null;
  onPhotoChange: (photo: ReportImage | null) => void;
}

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const StudentPhotoUpload: React.FC<StudentPhotoUploadProps> = ({ photo, onPhotoChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const fileToDataUrl = (file: File): Promise<ReportImage> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, dataUrl: reader.result as string });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFile = useCallback(async (file: File) => {
    setError('');

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError(`Tipo de arquivo inválido. Apenas JPG, PNG, e WebP são permitidos.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`Arquivo muito grande. O tamanho máximo é ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    try {
      const newPhoto = await fileToDataUrl(file);
      onPhotoChange(newPhoto);
    } catch (err) {
      console.error("Erro ao processar imagem:", err);
      setError("Ocorreu um erro ao carregar a imagem.");
    }
  }, [onPhotoChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  const handleDragEvents = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLLabelElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        inputRef.current?.click();
    }
  };

  const handleRemove = () => {
    onPhotoChange(null);
    setError('');
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border-4 border-gray-300 mb-4 shadow-inner">
        {photo ? (
          <img src={photo.dataUrl} alt="Foto do Aluno" className="w-full h-full object-cover" />
        ) : (
          <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
        )}
      </div>
      
      {photo ? (
        <button
          type="button"
          onClick={handleRemove}
          className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors shadow-sm"
        >
          Remover Foto
        </button>
      ) : (
        <label
          htmlFor="student-photo-upload"
          onDrop={handleDrop}
          onDragEnter={handleDragEvents}
          onDragOver={handleDragEvents}
          onDragLeave={handleDragEvents}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="button"
          aria-label="Carregar ou tirar foto do aluno"
          className={`relative w-full border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
            ${isDragging ? 'border-emerald-500 bg-emerald-50 scale-105' : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'}`}
        >
          <input
            id="student-photo-upload"
            ref={inputRef}
            type="file"
            accept={ALLOWED_MIME_TYPES.join(',')}
            capture="user" 
            onChange={handleFileChange}
            className="sr-only"
          />
          <div className="flex flex-col items-center">
             <div className="mb-2 text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
             </div>
             <p className="text-sm font-medium text-gray-700">
                Tirar Foto ou Carregar
             </p>
             <p className="text-xs text-gray-500 mt-1">JPG, PNG ou WebP (Máx. 2MB)</p>
          </div>
        </label>
      )}
      {error && <p className="mt-2 text-xs text-red-600 animate-fade-in-up-fast" role="alert">{error}</p>}
    </div>
  );
};

export default StudentPhotoUpload;
