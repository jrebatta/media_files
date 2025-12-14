/**
 * Script para corregir los tamaños de los videos convertidos en el índice
 */
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();
const STORAGE_DIR = path.join(PROJECT_ROOT, 'storage');
const INDEX_FILE = path.join(PROJECT_ROOT, 'index.json');

// Leer índice actual
const indexData = fs.readFileSync(INDEX_FILE, 'utf-8');
const index = JSON.parse(indexData);

console.log('Corrigiendo tamaños de videos...\n');

let fixed = 0;

index.items.forEach(item => {
  // Solo procesar videos completados
  if (item.type === 'video' && item.conversionStatus === 'completed') {
    const filePath = path.join(STORAGE_DIR, item.fileName);

    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const actualSize = stats.size;
      const indexSize = item.size;

      if (actualSize !== indexSize) {
        console.log(`📝 ${item.fileName}`);
        console.log(`   Índice: ${(indexSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Real: ${(actualSize / 1024 / 1024).toFixed(2)} MB`);

        item.size = actualSize;
        fixed++;
      }
    }
  }
});

if (fixed > 0) {
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2), 'utf-8');
  console.log(`\n✅ ${fixed} video(s) corregido(s)`);
} else {
  console.log('✅ Todos los tamaños son correctos');
}
