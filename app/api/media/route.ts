import { NextResponse } from 'next/server';
import { getAllItems, ensureStorageDir, cleanupIndex } from '@/lib/storage';

/**
 * GET /api/media
 * Devuelve la lista de todos los medios almacenados
 */
export async function GET() {
  try {
    // Asegurar que existe la carpeta de almacenamiento
    ensureStorageDir();

    // Limpiar índice de archivos que ya no existen
    const removedCount = cleanupIndex();
    if (removedCount > 0) {
      console.log(`Limpieza automática: ${removedCount} archivos eliminados del índice`);
    }

    // Obtener todos los elementos del índice
    const items = getAllItems();

    // Filtrar: solo mostrar videos que ya estén convertidos a MP4
    const readyItems = items.filter(item => {
      // Imágenes siempre se muestran
      if (item.type === 'image') {
        return true;
      }

      // Videos: solo mostrar si la conversión está completa
      // (completed o sin conversionStatus para MP4s originales)
      return !item.conversionStatus || item.conversionStatus === 'completed';
    });

    // Ordenar por fecha de creación (más recientes primero)
    const sortedItems = readyItems.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({
      success: true,
      items: sortedItems,
      count: sortedItems.length,
    });
  } catch (error) {
    console.error('Error al obtener medios:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener la lista de medios',
      },
      { status: 500 }
    );
  }
}
