'use client';

import { useRef, useState } from 'react';
import Toast from './Toast';

interface UploadButtonProps {
  onUploadComplete?: () => void;
}

type ToastMessage = {
  message: string;
  type: 'success' | 'error' | 'info';
} | null;

export default function UploadButton({ onUploadComplete }: UploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<ToastMessage>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const wakeLockRef = useRef<any>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    // Detectar si hay videos en la selección
    const hasVideos = Array.from(files).some(f => f.type.startsWith('video/'));
    const progressMsg = hasVideos
      ? `Subiendo y convirtiendo ${files.length} archivo(s)... Esto puede tardar. Mantén la pantalla encendida.`
      : `Subiendo ${files.length} archivo(s)...`;

    setUploadProgress(progressMsg);

    // Intentar mantener la pantalla encendida (Wake Lock API)
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        console.log('Wake Lock activado - pantalla se mantendrá encendida');
      }
    } catch (err) {
      console.log('Wake Lock no disponible o no permitido:', err);
    }

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          message: `${data.count} archivo(s) subido(s) correctamente`,
          type: 'success',
        });
        if (onUploadComplete) {
          onUploadComplete();
        }
      } else {
        setToast({
          message: `Error: ${data.error}`,
          type: 'error',
        });
      }

      if (data.errors && data.errors.length > 0) {
        console.error('Errores en algunos archivos:', data.errors);
        setToast({
          message: `Algunos archivos no se pudieron subir. Ver consola.`,
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error al subir:', error);
      setToast({
        message: 'Error al subir los archivos',
        type: 'error',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress('');

      // Liberar Wake Lock
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
          console.log('Wake Lock liberado');
        } catch (err) {
          console.log('Error al liberar Wake Lock:', err);
        }
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
        >
          {isUploading ? '⏳ Subiendo...' : '📤 Subir archivos'}
        </button>

        {uploadProgress && (
          <p className="mt-2 text-sm text-gray-600 animate-pulse">
            {uploadProgress}
          </p>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
