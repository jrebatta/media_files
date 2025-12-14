import { NextResponse } from 'next/server';
import { cleanupIndex } from '@/lib/storage';

/**
 * POST /api/cleanup
 * Limpia el índice eliminando referencias a archivos que ya no existen
 */
export async function POST() {
  try {
    const removedCount = cleanupIndex();

    return NextResponse.json({
      success: true,
      message: `Limpieza completada: ${removedCount} archivo(s) eliminado(s) del índice`,
      removedCount,
    });
  } catch (error) {
    console.error('Error en cleanup:', error);
    return NextResponse.json(
      { success: false, error: 'Error al limpiar el índice' },
      { status: 500 }
    );
  }
}
