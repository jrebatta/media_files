'use client';

import { MediaItem } from '@/lib/types';

interface MediaCardProps {
  item: MediaItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onView: (item: MediaItem) => void;
}

export default function MediaCard({ item, isSelected, onSelect, onView }: MediaCardProps) {
  const downloadUrl = `/api/download/${item.id}`;
  const isConverting = item.conversionStatus === 'converting' || item.conversionStatus === 'pending';
  const conversionFailed = item.conversionStatus === 'failed';

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(downloadUrl, '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div
      className={`relative group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer ${
        isSelected ? 'ring-4 ring-blue-500' : ''
      }`}
      onClick={() => onView(item)}
    >
      {/* Checkbox de selección */}
      <div
        className="absolute top-2 left-2 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(item.id)}
          className="w-5 h-5 cursor-pointer"
        />
      </div>

      {/* Miniatura */}
      <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden relative">
        {item.type === 'image' ? (
          <img
            src={downloadUrl}
            alt={item.originalName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : item.thumbnailFileName ? (
          <div className="relative w-full h-full">
            <img
              src={`/api/download/${item.id}?thumb=true`}
              alt={item.originalName}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Ícono de play sobre la miniatura */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-16 h-16 text-white drop-shadow-lg opacity-80"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-500">
            <svg
              className="w-16 h-16 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium">Video</span>
          </div>
        )}

        {/* Indicador de conversión */}
        {isConverting && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-center px-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <span className="text-xs">Convirtiendo...</span>
            </div>
          </div>
        )}

        {/* Indicador de error */}
        {conversionFailed && (
          <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
            <div className="text-red-600 text-center px-2">
              <span className="text-2xl">⚠️</span>
              <span className="text-xs block mt-1">Error</span>
            </div>
          </div>
        )}
      </div>

      {/* Información */}
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 truncate" title={item.originalName}>
          {item.originalName}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {formatFileSize(item.size)}
        </p>
      </div>

      {/* Botón de descarga (visible en hover) */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleDownload}
          className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
          title="Descargar"
        >
          ⬇️
        </button>
      </div>
    </div>
  );
}
