const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const PORT = process.env.PORT || 3000;

// Crear directorios
const dirs = ['uploads', 'uploads/fotos', 'uploads/videos'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    // Headers para mejor cacheado en móviles
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 horas
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// Verificar FFmpeg
let ffmpegAvailable = false;
try {
  ffmpeg().getAvailableFormats((err, formats) => {
    ffmpegAvailable = !err && formats;
    console.log(ffmpegAvailable ? '✅ FFmpeg disponible' : '⚠️ FFmpeg no disponible');
  });
} catch (error) {
  console.log('⚠️ FFmpeg no instalado');
}

// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = file.mimetype.startsWith('video/') ? 'uploads/videos/' : 'uploads/fotos/';
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = path.extname(file.originalname);
    const prefix = file.mimetype.startsWith('video/') ? 'video' : 'foto';
    cb(null, `${prefix}_${timestamp}${extension}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const isValid = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');
    if (!isValid) {
      return cb(new Error('Solo se permiten imágenes y videos'), false);
    }
    cb(null, true);
  },
  limits: { 
    fileSize: 200 * 1024 * 1024, // 200MB para videos de móvil
    files: 20 // Máximo 20 archivos por subida
  }
});

// Convertir video a MP4
function convertVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    if (!ffmpegAvailable) {
      reject(new Error('FFmpeg no disponible'));
      return;
    }

    ffmpeg(inputPath)
      .output(outputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .format('mp4')
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

// Upload endpoint
app.post('/upload', upload.single('photo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió archivo' });
  }

  try {
    const isVideo = req.file.mimetype.startsWith('video/');
    
    // Respuesta inmediata para fotos
    if (!isVideo) {
      return res.json({
        success: true,
        message: 'Foto subida exitosamente',
        filename: req.file.filename,
        size: req.file.size,
        type: req.file.mimetype,
        converted: false
      });
    }

    // Manejo de videos
    const originalPath = req.file.path;
    const originalExt = path.extname(req.file.filename).toLowerCase();
    
    if (originalExt === '.mp4') {
      return res.json({
        success: true,
        message: 'Video subido exitosamente',
        filename: req.file.filename,
        size: req.file.size,
        type: req.file.mimetype,
        converted: false
      });
    }

    // Convertir a MP4 si FFmpeg está disponible
    if (ffmpegAvailable) {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const newFilename = `video_${timestamp}.mp4`;
        const outputPath = path.join('uploads/videos', newFilename);
        
        await convertVideo(originalPath, outputPath);
        
        // Limpiar archivo original
        if (fs.existsSync(originalPath)) {
          fs.unlinkSync(originalPath);
        }
        
        return res.json({
          success: true,
          message: 'Video convertido a MP4 exitosamente',
          filename: newFilename,
          originalFormat: originalExt,
          type: 'video/mp4',
          converted: true
        });
      } catch (conversionError) {
        console.error('Error en conversión:', conversionError);
        return res.json({
          success: true,
          message: 'Video subido en formato original',
          filename: req.file.filename,
          size: req.file.size,
          type: req.file.mimetype,
          converted: false,
          warning: 'No se pudo convertir a MP4'
        });
      }
    } else {
      return res.json({
        success: true,
        message: 'Video subido en formato original',
        filename: req.file.filename,
        size: req.file.size,
        type: req.file.mimetype,
        converted: false,
        info: 'FFmpeg no disponible para conversión'
      });
    }
  } catch (error) {
    console.error('Error procesando archivo:', error);
    
    // Limpiar archivo temporal en caso de error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error limpiando archivo temporal:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Error al procesar archivo',
      details: error.message
    });
  }
});

// Endpoint de estado de salud
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    ffmpeg: ffmpegAvailable,
    uptime: process.uptime()
  });
});

// Listar archivos
app.get('/fotos', (req, res) => {
  try {
    const getFiles = (dir, extensions) => {
      return fs.existsSync(dir) 
        ? fs.readdirSync(dir).filter(file => extensions.test(file))
        : [];
    };

    const fotos = getFiles('uploads/fotos', /\.(jpg|jpeg|png|gif|webp)$/i);
    const videos = getFiles('uploads/videos', /\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i);
    
    res.json({
      fotos: [...fotos, ...videos]
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al leer archivos' });
  }
});

// Eliminar archivo
app.delete('/fotos/:filename', (req, res) => {
  const filename = req.params.filename;
  
  if (!/\.(jpg|jpeg|png|gif|webp|mp4|avi|mov|wmv|flv|webm|mkv)$/i.test(filename)) {
    return res.status(400).json({ error: 'Archivo no válido' });
  }
  
  const isVideo = /\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i.test(filename);
  const filepath = path.join(isVideo ? 'uploads/videos' : 'uploads/fotos', filename);
  
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }
  
  fs.unlink(filepath, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al eliminar' });
    }
    res.json({ message: 'Archivo eliminado', filename });
  });
});

// Descarga individual
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  
  if (!/\.(jpg|jpeg|png|gif|webp|mp4|avi|mov|wmv|flv|webm|mkv)$/i.test(filename)) {
    return res.status(400).json({ error: 'Archivo no válido' });
  }
  
  const isVideo = /\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i.test(filename);
  const filepath = path.join(isVideo ? 'uploads/videos' : 'uploads/fotos', filename);
  
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }
  
  // Variables para manejo de errores
  let streamDestroyed = false;
  let fileStream = null;
  
  // Cleanup function
  const cleanup = () => {
    if (fileStream && !streamDestroyed) {
      fileStream.destroy();
      streamDestroyed = true;
    }
  };
  
  // Manejar desconexiones del cliente
  req.on('aborted', () => {
    console.log(`Descarga abortada por el cliente: ${filename}`);
    cleanup();
  });
  
  req.on('close', () => {
    console.log(`Conexión cerrada durante descarga: ${filename}`);
    cleanup();
  });
  
  res.on('close', () => {
    cleanup();
  });
  
  try {
    // Configurar headers para mejor compatibilidad móvil
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Obtener información del archivo
    const stats = fs.statSync(filepath);
    res.setHeader('Content-Length', stats.size);
    
    // Crear stream de lectura
    fileStream = fs.createReadStream(filepath);
    
    fileStream.on('error', (err) => {
      console.error('Error al leer archivo:', filename, err.message);
      cleanup();
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error al leer archivo' });
      }
    });
    
    fileStream.on('end', () => {
      console.log(`Descarga completada: ${filename}`);
    });
    
    fileStream.on('close', () => {
      streamDestroyed = true;
    });
    
    // Pipe con manejo de errores
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error en descarga:', filename, error.message);
    cleanup();
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// Descarga masiva (ZIP - mejorado para móviles)
app.post('/download-bulk', async (req, res) => {
  const { files } = req.body;
  
  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: 'Sin archivos para descargar' });
  }

  const zipName = `archivos_${new Date().toISOString().split('T')[0]}.zip`;
  let archive = null;
  let archiveFinished = false;
  
  // Cleanup function
  const cleanup = () => {
    if (archive && !archiveFinished) {
      try {
        archive.abort();
      } catch (err) {
        console.error('Error abortando archive:', err.message);
      }
    }
  };
  
  // Manejar desconexiones del cliente
  req.on('aborted', () => {
    console.log('Descarga ZIP abortada por el cliente');
    cleanup();
  });
  
  req.on('close', () => {
    console.log('Conexión cerrada durante descarga ZIP');
    cleanup();
  });
  
  res.on('close', () => {
    cleanup();
  });
  
  res.on('error', (err) => {
    console.error('Error en response ZIP:', err.message);
    cleanup();
  });
  
  try {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
    res.setHeader('Cache-Control', 'no-cache');

    archive = archiver('zip', { 
      zlib: { level: 6 }, // Reducir nivel de compresión para mejor rendimiento en móviles
      forceLocalTime: true,
      store: false
    });
    
    archive.on('error', (err) => {
      console.error('Error al crear ZIP:', err.message);
      cleanup();
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error al crear ZIP' });
      }
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('Archivo no encontrado en ZIP:', err.path);
      } else {
        console.error('Warning en ZIP:', err.message);
      }
    });
    
    archive.on('finish', () => {
      archiveFinished = true;
      console.log(`ZIP completado: ${archive.pointer()} bytes`);
    });

    archive.pipe(res);

    let addedFiles = 0;
    
    // Procesar archivos en lotes pequeños para móviles
    const batchSize = 5;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      
      for (const filename of batch) {
        const isVideo = /\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i.test(filename);
        const filepath = path.join(isVideo ? 'uploads/videos' : 'uploads/fotos', filename);
        
        if (fs.existsSync(filepath)) {
          try {
            archive.file(filepath, { name: filename });
            addedFiles++;
          } catch (err) {
            console.error(`Error añadiendo archivo ${filename} al ZIP:`, err.message);
          }
        }
      }
      
      // Pequeña pausa entre lotes para no sobrecargar en móviles
      if (i + batchSize < files.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    if (addedFiles === 0) {
      cleanup();
      return res.status(404).json({ error: 'Sin archivos válidos' });
    }

    console.log(`Creando ZIP con ${addedFiles} archivos`);
    archive.finalize();
    
  } catch (error) {
    console.error('Error general en descarga ZIP:', error.message);
    cleanup();
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor: http://localhost:${PORT}`);
  console.log(`🌐 Red local: http://[tu-ip]:${PORT}`);
});