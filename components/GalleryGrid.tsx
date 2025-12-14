'use client';

import { useEffect, useState } from 'react';
import { MediaItem } from '@/lib/types';
import MediaCard from './MediaCard';
import MediaViewer from './MediaViewer';

interface GalleryGridProps {
  refreshTrigger?: number;
}

export default function GalleryGrid({ refreshTrigger }: GalleryGridProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewingItem, setViewingItem] = useState<MediaItem | null>(null);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/media');
      const data = await response.json();

      if (data.success) {
        setItems(data.items);
      }
    } catch (error) {
      console.error('Error al cargar medios:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [refreshTrigger]);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const downloadSelected = () => {
    if (selectedItems.size === 0) {
      alert('No hay archivos seleccionados');
      return;
    }

    const selectedItemsArray = items.filter(item => selectedItems.has(item.id));

    selectedItemsArray.forEach((item, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = `/api/download/${item.id}`;
        link.download = item.originalName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 200); // Pequeño delay entre descargas
    });

    alert(`🚀 Iniciando descarga de ${selectedItems.size} archivo(s)`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">No hay archivos en la galería</p>
          <p className="text-sm">Sube algunas fotos o videos para comenzar</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Barra de acciones cuando hay selección */}
      {selectedItems.size > 0 && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
          <div className="text-sm font-medium text-blue-900">
            {selectedItems.size} archivo(s) seleccionado(s)
          </div>
          <div className="flex gap-2">
            <button
              onClick={downloadSelected}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
            >
              📥 Descargar seleccionados
            </button>
            <button
              onClick={() => setSelectedItems(new Set())}
              className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 transition-colors"
            >
              Deseleccionar
            </button>
          </div>
        </div>
      )}

      {/* Botón seleccionar todos */}
      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {items.length} archivo(s) en total
        </p>
        <button
          onClick={selectAll}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {selectedItems.size === items.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
        </button>
      </div>

      {/* Grid de medios */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {items.map(item => (
          <MediaCard
            key={item.id}
            item={item}
            isSelected={selectedItems.has(item.id)}
            onSelect={toggleSelection}
            onView={setViewingItem}
          />
        ))}
      </div>

      {/* Visor de medios */}
      {viewingItem && (
        <MediaViewer
          item={viewingItem}
          onClose={() => setViewingItem(null)}
        />
      )}
    </>
  );
}
