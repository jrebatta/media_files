import fs from 'fs';
import path from 'path';
import { MediaIndex, MediaItem } from './types';
import { STORAGE_DIR, INDEX_FILE, TEMP_DIR, TEMP_STORAGE_DIR } from './constants';

/**
 * Asegura que la carpeta de almacenamiento existe
 */
export function ensureStorageDir(): void {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

/**
 * Asegura que la carpeta temporal existe
 */
export function ensureTempDir(): void {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

/**
 * Asegura que la carpeta de almacenamiento temporal existe
 */
export function ensureTempStorageDir(): void {
  if (!fs.existsSync(TEMP_STORAGE_DIR)) {
    fs.mkdirSync(TEMP_STORAGE_DIR, { recursive: true });
  }
}

/**
 * Lee el índice desde el disco.
 * Si no existe, devuelve un índice vacío.
 */
export function readIndex(): MediaIndex {
  try {
    if (!fs.existsSync(INDEX_FILE)) {
      return { items: [] };
    }

    const data = fs.readFileSync(INDEX_FILE, 'utf-8');
    const parsed = JSON.parse(data);

    // Validación básica de la estructura
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.items)) {
      console.error('Índice corrupto, reiniciando...');
      return { items: [] };
    }

    return parsed as MediaIndex;
  } catch (error) {
    console.error('Error al leer el índice:', error);
    return { items: [] };
  }
}

/**
 * Guarda el índice en el disco
 */
export function saveIndex(index: MediaIndex): void {
  try {
    const data = JSON.stringify(index, null, 2);
    fs.writeFileSync(INDEX_FILE, data, 'utf-8');
  } catch (error) {
    console.error('Error al guardar el índice:', error);
    throw new Error('No se pudo guardar el índice');
  }
}

/**
 * Agrega un nuevo elemento al índice
 */
export function addItemToIndex(item: MediaItem): void {
  const index = readIndex();
  index.items.push(item);
  saveIndex(index);
}

/**
 * Obtiene un elemento del índice por su ID
 */
export function getItemById(id: string): MediaItem | null {
  const index = readIndex();
  const item = index.items.find(item => item.id === id);
  return item || null;
}

/**
 * Obtiene todos los elementos del índice
 */
export function getAllItems(): MediaItem[] {
  const index = readIndex();
  return index.items;
}

/**
 * Limpia el índice eliminando referencias a archivos que ya no existen
 */
export function cleanupIndex(): number {
  const index = readIndex();
  const initialCount = index.items.length;

  // Filtrar solo items cuyos archivos existen físicamente
  index.items = index.items.filter(item => {
    // NO eliminar videos que están siendo convertidos
    if (item.conversionStatus === 'pending' || item.conversionStatus === 'converting') {
      console.log(`Manteniendo: ${item.fileName} (conversión en progreso)`);
      return true;
    }

    // Para el resto, verificar que el archivo existe en storage
    const filePath = getFilePath(item.fileName);
    const exists = fs.existsSync(filePath);

    if (!exists) {
      console.log(`Limpiando del índice: ${item.fileName} (archivo no existe)`);
    }

    return exists;
  });

  const removedCount = initialCount - index.items.length;

  if (removedCount > 0) {
    saveIndex(index);
    console.log(`Limpieza completada: ${removedCount} elemento(s) eliminado(s) del índice`);
  }

  return removedCount;
}

/**
 * Elimina un elemento del índice por su ID
 */
export function removeItemFromIndex(id: string): boolean {
  const index = readIndex();
  const initialLength = index.items.length;
  index.items = index.items.filter(item => item.id !== id);

  if (index.items.length < initialLength) {
    saveIndex(index);
    return true;
  }

  return false;
}

/**
 * Obtiene la ruta completa de un archivo en el almacenamiento
 */
export function getFilePath(fileName: string): string {
  return path.join(STORAGE_DIR, fileName);
}

/**
 * Obtiene la ruta completa de un archivo en el almacenamiento temporal
 */
export function getTempFilePath(fileName: string): string {
  return path.join(TEMP_STORAGE_DIR, fileName);
}

/**
 * Genera un ID único basado en timestamp y random
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Determina si un archivo es imagen o video basado en su tipo MIME
 */
export function getMediaType(mimeType: string): 'image' | 'video' {
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  if (mimeType.startsWith('video/')) {
    return 'video';
  }
  return 'image'; // fallback
}

/**
 * Actualiza el estado de conversión de un elemento
 */
export function updateConversionStatus(
  id: string,
  status: 'pending' | 'converting' | 'completed' | 'failed',
  convertedFileName?: string,
  thumbnailFileName?: string
): void {
  const index = readIndex();
  const item = index.items.find(item => item.id === id);

  if (item) {
    item.conversionStatus = status;
    if (convertedFileName) {
      item.convertedFileName = convertedFileName;
      // Si la conversión completó, actualizar mimeType, fileName y originalName
      if (status === 'completed') {
        item.mimeType = 'video/mp4';
        item.fileName = convertedFileName;
        // Cambiar extensión del nombre original de .mov a .mp4
        item.originalName = item.originalName.replace(/\.(mov|avi|webm|mpeg)$/i, '.mp4');

        // Actualizar el tamaño del archivo con el tamaño real del archivo convertido
        const convertedFilePath = getFilePath(convertedFileName);
        if (fs.existsSync(convertedFilePath)) {
          const stats = fs.statSync(convertedFilePath);
          item.size = stats.size;
        }

        // Guardar el nombre del archivo de miniatura si se proporcionó
        if (thumbnailFileName) {
          item.thumbnailFileName = thumbnailFileName;
        }
      }
    }
    saveIndex(index);
  }
}

/**
 * Cuenta cuántos videos están siendo convertidos actualmente
 */
export function countConvertingVideos(): number {
  const index = readIndex();
  return index.items.filter(
    item => item.conversionStatus === 'pending' || item.conversionStatus === 'converting'
  ).length;
}
