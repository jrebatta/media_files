/**
 * Script para generar miniaturas de videos existentes que no las tienen
 */
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

// Configurar FFmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const PROJECT_ROOT = process.cwd();
const STORAGE_DIR = path.join(PROJECT_ROOT, 'storage');
const INDEX_FILE = path.join(PROJECT_ROOT, 'index.json');

/**
 * Genera una miniatura de un video
 */
function generateThumbnail(videoPath, thumbnailPath) {
  return new Promise((resolve, reject) => {
    console.log('  Generando miniatura...');

    const fileName = path.basename(thumbnailPath);
    const folder = path.dirname(thumbnailPath);

    ffmpeg(videoPath)
      .screenshots({
        timestamps: ['1'], // Capturar frame en el segundo 1
        filename: fileName,
        folder: folder,
        size: '320x?', // Ancho 320px, altura proporcional
      })
      .on('end', () => {
        console.log('  ✅ Miniatura generada');
        resolve();
      })
      .on('error', (err) => {
        console.error('  ❌ Error:', err.message);
        reject(err);
      });
  });
}

async function main() {
  console.log('🎬 Generando miniaturas para videos existentes...\n');

  // Leer índice actual
  const indexData = fs.readFileSync(INDEX_FILE, 'utf-8');
  const index = JSON.parse(indexData);

  // Filtrar videos completados sin miniatura
  const videosWithoutThumbs = index.items.filter(
    item =>
      item.type === 'video' &&
      item.conversionStatus === 'completed' &&
      !item.thumbnailFileName
  );

  if (videosWithoutThumbs.length === 0) {
    console.log('✅ Todos los videos ya tienen miniaturas');
    return;
  }

  console.log(`Encontrados ${videosWithoutThumbs.length} video(s) sin miniatura\n`);

  let generated = 0;
  let failed = 0;

  for (const item of videosWithoutThumbs) {
    console.log(`📹 ${item.originalName}`);

    const videoPath = path.join(STORAGE_DIR, item.fileName);
    const thumbnailFileName = `${item.id}-thumb.jpg`;
    const thumbnailPath = path.join(STORAGE_DIR, thumbnailFileName);

    // Verificar que el video existe
    if (!fs.existsSync(videoPath)) {
      console.log(`  ⚠️  Video no encontrado: ${item.fileName}`);
      failed++;
      continue;
    }

    try {
      await generateThumbnail(videoPath, thumbnailPath);

      // Actualizar el índice
      item.thumbnailFileName = thumbnailFileName;
      generated++;
    } catch (error) {
      console.error(`  ❌ Error al generar miniatura: ${error.message}`);
      failed++;
    }

    console.log('');
  }

  // Guardar índice actualizado
  if (generated > 0) {
    fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2), 'utf-8');
    console.log(`\n✅ ${generated} miniatura(s) generada(s)`);
  }

  if (failed > 0) {
    console.log(`⚠️  ${failed} video(s) fallaron`);
  }
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
