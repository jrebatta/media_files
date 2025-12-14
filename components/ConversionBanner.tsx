'use client';

import { useEffect, useState } from 'react';

export default function ConversionBanner() {
  const [converting, setConverting] = useState(0);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/conversion-status');
        const data = await res.json();

        if (data.success && data.converting > 0) {
          setConverting(data.converting);
          setShowBanner(true);
        } else if (data.converting === 0 && showBanner) {
          // Si terminó de convertir, mostrar mensaje de "listo"
          setConverting(0);
          setTimeout(() => {
            setShowBanner(false);
          }, 3000);
        }
      } catch (error) {
        console.error('Error al verificar estado de conversión:', error);
      }
    };

    // Verificar inmediatamente
    checkStatus();

    // Verificar cada 3 segundos
    const interval = setInterval(checkStatus, 3000);

    return () => clearInterval(interval);
  }, [showBanner]);

  if (!showBanner) {
    return null;
  }

  return (
    <div
      className={`mb-6 p-4 rounded-lg ${
        converting > 0
          ? 'bg-blue-100 border-blue-400 text-blue-800'
          : 'bg-green-100 border-green-400 text-green-800'
      } border-2`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {converting > 0 ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-800 mr-3"></div>
              <div>
                <p className="font-semibold">
                  Convirtiendo {converting} video{converting > 1 ? 's' : ''} a MP4...
                </p>
                <p className="text-sm">
                  Los videos aparecerán automáticamente cuando terminen
                </p>
              </div>
            </>
          ) : (
            <>
              <span className="text-2xl mr-3">✅</span>
              <div>
                <p className="font-semibold">Videos listos!</p>
                <p className="text-sm">Recarga la página para verlos</p>
              </div>
            </>
          )}
        </div>

        {converting === 0 && (
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Recargar
          </button>
        )}
      </div>
    </div>
  );
}
