import React, { useState, useCallback } from 'react';
import type { ReportImage } from '../types';

interface ImageUploadProps {
  images: ReportImage[];
  onImagesChange: (images: ReportImage[]) => void;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const ImageUpload: React.FC<ImageUploadProps> = ({ images, onImagesChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const fileToDataUrl = (file: File): Promise<ReportImage> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, dataUrl: reader.result as string });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFiles = useCallback(async (files: FileList) => {
    setError('');
    const newFiles = Array.from(files);

    if (images.length + newFiles.length > MAX_FILES) {
      setError(`Você pode anexar no máximo ${MAX_FILES} imagens.`);
      return;
    }

    const validFiles = newFiles.filter(file => {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setError(`Tipo de arquivo inválido: ${file.name}. Apenas JPG, PNG, GIF, e WebP são permitidos.`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`Arquivo muito grande: ${file.name}. O tamanho máximo é ${MAX_FILE_SIZE_MB}MB.`);
        return false;
      }
      return true;
    });

    if (error) return; // Stop if any file is invalid

    try {
      const newImages = await Promise.all(validFiles.map(fileToDataUrl));
      onImagesChange([...images, ...newImages]);
    } catch (err) {
      console.error("Erro ao processar imagens:", err);
      setError("Ocorreu um erro ao carregar as imagens.");
    }
  }, [images, onImagesChange, error]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleDragEvents = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDelete = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    onImagesChange(updatedImages);
  };

  return (
    <div>
      <label
        htmlFor="image-upload"
        onDrop={handleDrop}
        onDragEnter={handleDragEvents}
        onDragOver={handleDragEvents}
        onDragLeave={handleDragEvents}
        className={`relative block w-full border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}
      >
        <input
          id="image-upload"
          type="file"
          multiple
          accept={ALLOWED_MIME_TYPES.join(',')}
          onChange={handleFileChange}
          className="sr-only"
        />
        <div className="flex flex-col items-center">
          <svg className="w-12 h-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-semibold text-emerald-600">Clique para carregar</span> ou arraste e solte
          </p>
          <p className="text-xs text-gray-500">Máximo de 5 imagens (até {MAX_FILE_SIZE_MB}MB cada)</p>
        </div>
      </label>
      
      {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}

      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group border rounded-md overflow-hidden shadow-sm">
              <img src={image.dataUrl} alt={image.name} className="h-32 w-full object-cover" />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                  aria-label={`Remover ${image.name}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
               <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 p-1">
                <p className="text-xs text-white truncate" title={image.name}>{image.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
