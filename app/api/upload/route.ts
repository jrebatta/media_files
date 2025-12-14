import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  ensureStorageDir,
  ensureTempStorageDir,
  addItemToIndex,
  generateId,
  getMediaType,
  getFilePath,
  getTempFilePath,
  updateConversionStatus,
} from '@/lib/storage';
import { ACCEPTED_TYPES, MAX_FILE_SIZE } from '@/lib/constants';
import { MediaItem } from '@/lib/types';
import { convertVideoToMP4, generateThumbnail } from '@/lib/videoConverter';

// Configuración de tiempo máximo (ahora solo para subida, no conversión)
export const maxDuration = 60;

/**
 * Convierte un video en background (sin bloquear la respuesta)
 */
async function convertVideoInBackground(
  id: string,
  tempPath: string,
  mp4Path: string,
  mp4FileName: string
) {
  try {
    console.log(`[${id}] Iniciando conversión en background...`);
    console.log(`[${id}] Origen: temp_storage/${path.basename(tempPath)}`);
    console.log(`[${id}] Destino: storage/${mp4FileName}`);

    updateConversionStatus(id, 'converting');

    // Convertir de temp_storage a storage
    await convertVideoToMP4(tempPath, mp4Path);

    // Generar miniatura del video convertido
    const thumbnailFileName = `${id}-thumb.jpg`;
    const thumbnailPath = getFilePath(thumbnailFileName);
    try {
      await generateThumbnail(mp4Path, thumbnailPath);
      console.log(`[${id}] ✅ Miniatura generada: ${thumbnailFileName}`);
    } catch (thumbError) {
      console.error(`[${id}] ⚠️ Error al generar miniatura:`, thumbError);
      // No fallar la conversión si falla la miniatura
    }

    // Eliminar archivo temporal y actualizar índice
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
      console.log(`[${id}] Archivo temporal eliminado de temp_storage`);
    }

    updateConversionStatus(id, 'completed', mp4FileName, thumbnailFileName);
    console.log(`[${id}] ✅ Conversión completada - Video disponible en storage`);
  } catch (error) {
    console.error(`[${id}] ❌ Error en conversión:`, error);
    updateConversionStatus(id, 'failed');
  }
}

/**
 * POST /api/upload
 * Sube archivos al servidor
 * Videos se guardan primero y se convierten en background
 */
export async function POST(request: NextRequest) {
  try {
    ensureStorageDir();
    ensureTempStorageDir();

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se enviaron archivos' },
        { status: 400 }
      );
    }

    const uploadedItems: MediaItem[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        // Validar tipo de archivo
        if (!ACCEPTED_TYPES.includes(file.type)) {
          errors.push(`${file.name}: Tipo de archivo no permitido (${file.type})`);
          continue;
        }

        // Validar tamaño
        if (file.size > MAX_FILE_SIZE) {
          errors.push(`${file.name}: Archivo demasiado grande (máx. 100MB)`);
          continue;
        }

        const mediaType = getMediaType(file.type);
        const id = generateId();
        const ext = path.extname(file.name);
        const fileName = `${id}${ext}`;

        // Convertir File a Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Crear entrada en el índice
        const mediaItem: MediaItem = {
          id,
          originalName: file.name,
          fileName,
          mimeType: file.type,
          size: file.size,
          createdAt: new Date().toISOString(),
          type: mediaType,
        };

        // Si es video NO MP4: guardar en temp_storage y convertir
        if (mediaType === 'video' && file.type !== 'video/mp4') {
          // Guardar en temp_storage
          const tempPath = getTempFilePath(fileName);
          fs.writeFileSync(tempPath, buffer);
          console.log(`[${id}] Video guardado en temp_storage: ${fileName}`);

          mediaItem.conversionStatus = 'pending';

          // Agregar al índice
          addItemToIndex(mediaItem);
          uploadedItems.push(mediaItem);

          // Iniciar conversión en background (temp_storage → storage)
          const mp4FileName = `${id}.mp4`;
          const mp4Path = getFilePath(mp4FileName);

          setImmediate(() => {
            convertVideoInBackground(id, tempPath, mp4Path, mp4FileName);
          });

          console.log(`[${id}] Conversión iniciada: temp_storage → storage`);
        } else {
          // Imágenes o videos MP4: guardar directamente en storage
          const storagePath = getFilePath(fileName);
          fs.writeFileSync(storagePath, buffer);
          console.log(`[${id}] Archivo guardado en storage: ${fileName}`);

          if (mediaType === 'video') {
            mediaItem.conversionStatus = 'completed';
          }
          addItemToIndex(mediaItem);
          uploadedItems.push(mediaItem);
        }
      } catch (error) {
        console.error(`Error al procesar ${file.name}:`, error);
        errors.push(`${file.name}: Error al procesar el archivo`);
      }
    }

    return NextResponse.json({
      success: true,
      items: uploadedItems,
      count: uploadedItems.length,
      errors: errors.length > 0 ? errors : undefined,
      message: uploadedItems.some(i => i.conversionStatus === 'pending')
        ? 'Archivos subidos. Los videos aparecerán cuando terminen de convertirse a MP4.'
        : 'Archivos subidos correctamente',
    });
  } catch (error) {
    console.error('Error en upload:', error);
    return NextResponse.json(
      { success: false, error: 'Error al subir archivos' },
      { status: 500 }
    );
  }
}
