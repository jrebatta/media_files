/**
 * Script para recuperar videos convertidos que no están en el índice
 */
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();
const STORAGE_DIR = path.join(PROJECT_ROOT, 'storage');
const INDEX_FILE = path.join(PROJECT_ROOT, 'index.json');

// Leer índice actual
const indexData = fs.readFileSync(INDEX_FILE, 'utf-8');
const index = JSON.parse(indexData);

// Leer archivos en storage
const files = fs.readdirSync(STORAGE_DIR);

// Filtrar solo MP4 que no están en el índice
const existingFileNames = new Set(index.items.map(item => item.fileName));
const orphanedVideos = files.filter(file =>
  file.endsWith('.mp4') && !existingFileNames.has(file)
);

console.log(`Encontrados ${orphanedVideos.length} videos huérfanos`);

// Agregar al índice
orphanedVideos.forEach(fileName => {
  const filePath = path.join(STORAGE_DIR, fileName);
  const stats = fs.statSync(filePath);
  const id = fileName.replace('.mp4', '');

  const item = {
    id,
    originalName: fileName,
    fileName,
    mimeType: 'video/mp4',
    size: stats.size,
    createdAt: stats.birthtime.toISOString(),
    type: 'video',
    conversionStatus: 'completed',
  };

  index.items.push(item);
  console.log(`✅ Agregado: ${fileName} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
});

// Guardar índice actualizado
fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2), 'utf-8');
console.log(`\n✅ Índice actualizado con ${orphanedVideos.length} videos`);
