'use client';

import { MediaItem } from '@/lib/types';
import { useEffect } from 'react';

interface MediaViewerProps {
  item: MediaItem;
  onClose: () => void;
}

export default function MediaViewer({ item, onClose }: MediaViewerProps) {
  const downloadUrl = `/api/download/${item.id}`;

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDownload = () => {
    window.open(downloadUrl, '_blank');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-7xl w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black bg-opacity-50">
          <div className="text-white">
            <h2 className="text-lg font-medium truncate max-w-md">
              {item.originalName}
            </h2>
            <p className="text-sm text-gray-300">
              {formatFileSize(item.size)} · {formatDate(item.createdAt)}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              ⬇️ Descargar
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              ✕ Cerrar
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          {item.type === 'image' ? (
            <img
              src={downloadUrl}
              alt={item.originalName}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <video
              src={downloadUrl}
              controls
              className="max-w-full max-h-full"
              autoPlay
            >
              Tu navegador no soporta la reproducción de videos.
            </video>
          )}
        </div>

        {/* Footer con instrucciones */}
        <div className="p-4 text-center text-sm text-gray-400">
          Presiona <kbd className="px-2 py-1 bg-gray-700 rounded">ESC</kbd> o haz clic fuera para cerrar
        </div>
      </div>
    </div>
  );
}
