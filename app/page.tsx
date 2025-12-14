'use client';

import { useState } from 'react';
import UploadButton from '@/components/UploadButton';
import GalleryGrid from '@/components/GalleryGrid';
import ConversionBanner from '@/components/ConversionBanner';

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadComplete = () => {
    // Incrementar el trigger para forzar recarga de la galería
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            📸 Galería Personal
          </h1>
          <p className="text-gray-600 text-sm sm:text-base mb-6">
            Sube y gestiona tus fotos y videos desde cualquier dispositivo
          </p>

          {/* Botón de subida */}
          <UploadButton onUploadComplete={handleUploadComplete} />
        </div>

        {/* Banner de conversión */}
        <ConversionBanner />

        {/* Galería */}
        <GalleryGrid refreshTrigger={refreshTrigger} />
      </div>
    </main>
  );
}
