import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

// Configurar FFmpeg en la primera importación
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Convierte un video a formato MP4
 * @param inputPath Ruta del archivo de entrada
 * @param outputPath Ruta del archivo de salida .mp4
 * @returns Promise que se resuelve cuando la conversión termina
 */
export function convertVideoToMP4(
  inputPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Estrategia 1: Copiar streams sin recodificar (rápido, sin pérdida)
    const attemptStreamCopy = () => {
      console.log('Intentando copia directa (sin pérdida de calidad)...');

      ffmpeg(inputPath)
        .output(outputPath)
        .videoCodec('copy') // Copiar video sin recodificar
        .audioCodec('copy') // Copiar audio sin recodificar
        .format('mp4')
        .outputOptions([
          '-movflags +faststart', // Optimización para streaming
        ])
        .on('start', (commandLine) => {
          console.log('Iniciando copia directa:', commandLine);
        })
        .on('end', () => {
          console.log('✅ Copia directa completada (sin pérdida):', outputPath);
          resolve();
        })
        .on('error', (err, stdout, stderr) => {
          console.log('❌ Copia directa falló, necesita recodificación');
          console.log('Motivo:', err.message);
          // Si falla la copia, intentar recodificar
          attemptReencode();
        })
        .run();
    };

    // Estrategia 2: Recodificar (cuando la copia directa no funciona)
    const attemptReencode = () => {
      console.log('Recodificando video con audio...');

      ffmpeg(inputPath)
        .output(outputPath)
        .outputOptions([
          '-map 0:v:0', // Mapear primer stream de video
          '-map 0:a:0', // Mapear primer stream de audio (ignorar otros)
          '-c:v libx264', // Codec de video H.264
          '-c:a aac', // Codec de audio AAC
          '-ac 2', // Estéreo
          '-b:a 128k', // Bitrate de audio
          '-preset veryfast', // Conversión rápida
          '-crf 23', // Calidad (0-51, 23 es buena calidad)
          '-movflags +faststart', // Optimización para streaming
          '-max_muxing_queue_size 1024', // Evitar errores de queue
        ])
        .format('mp4')
        .on('start', (commandLine) => {
          console.log('Iniciando recodificación:', commandLine);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`Progreso: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          console.log('✅ Recodificación completada con audio:', outputPath);
          resolve();
        })
        .on('error', (err, stdout, stderr) => {
          console.error('❌ Error en recodificación:', err.message);
          console.error('FFmpeg stderr:', stderr);
          reject(new Error(`Error al convertir video: ${err.message}`));
        })
        .run();
    };

    // Intentar primero copia directa (rápido y sin pérdida)
    attemptStreamCopy();
  });
}

/**
 * Genera una miniatura (thumbnail) de un video
 * @param videoPath Ruta del archivo de video
 * @param thumbnailPath Ruta donde guardar la miniatura .jpg
 * @returns Promise que se resuelve cuando se genera la miniatura
 */
export function generateThumbnail(
  videoPath: string,
  thumbnailPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Generando miniatura para:', videoPath);

    const path = require('path');
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
        console.log('✅ Miniatura generada:', thumbnailPath);
        resolve();
      })
      .on('error', (err) => {
        console.error('❌ Error al generar miniatura:', err.message);
        reject(new Error(`Error al generar miniatura: ${err.message}`));
      });
  });
}

/**
 * Verifica si FFmpeg está disponible
 */
export function checkFFmpegAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      ffmpeg.getAvailableFormats((err) => {
        if (err) {
          console.error('FFmpeg no disponible:', err);
          resolve(false);
        } else {
          console.log('FFmpeg disponible');
          resolve(true);
        }
      });
    } catch (error) {
      console.error('FFmpeg no disponible:', error);
      resolve(false);
    }
  });
}
