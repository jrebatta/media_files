import { ensureStorageDir, readIndex, saveIndex } from './storage';

/**
 * Inicializa el sistema de almacenamiento
 * - Crea la carpeta de storage si no existe
 * - Crea el archivo índice si no existe
 */
export function initializeStorage(): void {
  // Asegurar que existe la carpeta de almacenamiento
  ensureStorageDir();

  // Asegurar que existe el archivo índice
  const index = readIndex();
  saveIndex(index);

  console.log('Sistema de almacenamiento inicializado correctamente');
}
