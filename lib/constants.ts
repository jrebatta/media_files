import path from 'path';

// Ruta base del proyecto
export const PROJECT_ROOT = process.cwd();

// Carpeta donde se almacenan los archivos FINALES (solo MP4 e imágenes)
export const STORAGE_DIR = path.join(PROJECT_ROOT, 'storage');

// Carpeta temporal para videos .mov originales (antes de convertir)
export const TEMP_STORAGE_DIR = path.join(PROJECT_ROOT, 'temp_storage');

// Carpeta temporal para procesar videos
export const TEMP_DIR = path.join(PROJECT_ROOT, 'temp');

// Archivo JSON que actúa como índice
export const INDEX_FILE = path.join(PROJECT_ROOT, 'index.json');

// Tipos MIME aceptados
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
];

export const ACCEPTED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
  'video/mpeg',
];

export const ACCEPTED_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES];

// Tamaño máximo de archivo (100 MB)
export const MAX_FILE_SIZE = 100 * 1024 * 1024;
