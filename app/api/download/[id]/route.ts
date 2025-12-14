import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { getItemById, getFilePath } from '@/lib/storage';

/**
 * GET /api/download/[id]
 * Descarga un archivo específico por su ID
 * Query params:
 *   - thumb=true: Devuelve la miniatura del video en lugar del video completo
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const isThumb = searchParams.get('thumb') === 'true';

    // Buscar el elemento en el índice
    const item = getItemById(id);

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Archivo no encontrado' },
        { status: 404 }
      );
    }

    // Si se solicita la miniatura y el item la tiene
    if (isThumb && item.thumbnailFileName) {
      const thumbPath = getFilePath(item.thumbnailFileName);

      if (!fs.existsSync(thumbPath)) {
        return NextResponse.json(
          { success: false, error: 'Miniatura no encontrada en disco' },
          { status: 404 }
        );
      }

      const thumbBuffer = fs.readFileSync(thumbPath);
      const thumbStats = fs.statSync(thumbPath);

      return new NextResponse(thumbBuffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Length': thumbStats.size.toString(),
          'Cache-Control': 'public, max-age=31536000', // Cache por 1 año
        },
      });
    }

    // Obtener la ruta del archivo normal
    const filePath = getFilePath(item.fileName);

    // Verificar que el archivo existe en disco
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'Archivo no encontrado en disco' },
        { status: 404 }
      );
    }

    // Leer el archivo
    const fileBuffer = fs.readFileSync(filePath);

    // Crear la respuesta con el archivo
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': item.mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(item.originalName)}"`,
        'Content-Length': item.size.toString(),
      },
    });
  } catch (error) {
    console.error('Error al descargar archivo:', error);
    return NextResponse.json(
      { success: false, error: 'Error al descargar el archivo' },
      { status: 500 }
    );
  }
}
