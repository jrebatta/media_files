import { NextResponse } from 'next/server';
import { countConvertingVideos } from '@/lib/storage';

/**
 * GET /api/conversion-status
 * Devuelve el estado de conversiones en progreso
 */
export async function GET() {
  try {
    const converting = countConvertingVideos();

    return NextResponse.json({
      success: true,
      converting,
      message: converting > 0
        ? `${converting} video(s) convirtiéndose...`
        : 'No hay conversiones en progreso',
    });
  } catch (error) {
    console.error('Error al obtener estado de conversión:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener estado' },
      { status: 500 }
    );
  }
}
