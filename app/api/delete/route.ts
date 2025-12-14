import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { getItemById, removeItemFromIndex, getFilePath } from '@/lib/storage';

/**
 * DELETE /api/delete
 * Elimina uno o varios archivos
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Se requiere un array de IDs' },
        { status: 400 }
      );
    }

    const deleted: string[] = [];
    const errors: string[] = [];

    for (const id of ids) {
      try {
        // Obtener el item del índice
        const item = getItemById(id);

        if (!item) {
          errors.push(`${id}: No encontrado en el índice`);
          continue;
        }

        // Eliminar archivo físico
        const filePath = getFilePath(item.fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Archivo eliminado: ${item.fileName}`);
        }

        // Eliminar del índice
        removeItemFromIndex(id);
        deleted.push(id);
        console.log(`Eliminado del índice: ${id} (${item.originalName})`);
      } catch (error) {
        console.error(`Error al eliminar ${id}:`, error);
        errors.push(`${id}: Error al eliminar`);
      }
    }

    return NextResponse.json({
      success: true,
      deleted: deleted.length,
      deletedIds: deleted,
      errors: errors.length > 0 ? errors : undefined,
      message: `${deleted.length} archivo(s) eliminado(s)`,
    });
  } catch (error) {
    console.error('Error en delete:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar archivos' },
      { status: 500 }
    );
  }
}
