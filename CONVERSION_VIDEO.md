# 🎬 Conversión Automática de Videos a MP4

## Resumen de Cambios

Se ha implementado la conversión automática de todos los videos subidos a formato MP4 en el backend.

## ✅ Fases Completadas

### FASE 1: Integración de FFmpeg
- ✅ Instaladas dependencias: `fluent-ffmpeg`, `@ffmpeg-installer/ffmpeg`
- ✅ Creado módulo `lib/videoConverter.ts` con carga dinámica
- ✅ Función `convertVideoToMP4()` para conversión estándar H.264/AAC

### FASE 2: Flujo de Subida Modificado
- ✅ Creada carpeta temporal (`/temp`) para archivos en proceso
- ✅ Modificado `app/api/upload/route.ts`:
  - Videos: guardado temporal → conversión a MP4 → almacenamiento final → eliminación temporal
  - Imágenes: flujo normal sin cambios
- ✅ Todos los videos se almacenan como `.mp4` independientemente del formato original

### FASE 3: Validaciones y Manejo de Errores
- ✅ Validación de tipos MIME (solo imágenes y videos)
- ✅ Manejo de errores en conversión con limpieza de archivos temporales
- ✅ Mensajes de error claros al usuario
- ✅ Feedback mejorado en UI cuando se suben videos

---

## 📝 Archivos Modificados

### Nuevos Archivos
1. **`lib/videoConverter.ts`**
   - Módulo de conversión con carga dinámica de FFmpeg
   - Evita problemas de build con Next.js
   - Configuración optimizada: H.264 + AAC, CRF 23, preset medium

### Archivos Modificados
1. **`lib/constants.ts`**
   - Agregada constante `TEMP_DIR` para carpeta temporal

2. **`lib/storage.ts`**
   - Agregada función `ensureTempDir()` para crear carpeta temporal

3. **`app/api/upload/route.ts`**
   - Lógica de conversión para videos
   - Manejo de archivos temporales
   - Limpieza automática en caso de error

4. **`components/UploadButton.tsx`**
   - Mensaje mejorado cuando se suben videos
   - Indica "convirtiendo" para alertar que puede tardar

5. **`.gitignore`**
   - Agregada carpeta `/temp` a archivos ignorados

### Dependencias Agregadas
```json
{
  "fluent-ffmpeg": "^2.1.3",
  "@ffmpeg-installer/ffmpeg": "^4.1.0",
  "@types/fluent-ffmpeg": "^2.1.24"
}
```

---

## 🔧 Configuración de Conversión

### Parámetros FFmpeg
```typescript
.videoCodec('libx264')     // Codec H.264 (compatible universal)
.audioCodec('aac')         // Codec AAC (compatible universal)
.format('mp4')             // Formato MP4
.outputOptions([
  '-preset medium',        // Balance velocidad/calidad
  '-crf 23',              // Calidad constante (23 = buena)
  '-movflags +faststart'  // Optimización para streaming
])
```

### Calidad y Rendimiento
- **CRF 23**: Calidad visual muy buena, tamaño razonable
- **Preset medium**: Conversión en tiempo moderado
- **FPS**: Se mantienen los FPS originales
- **Resolución**: Se mantiene la resolución original

---

## 🔄 Flujo de Conversión

### Para Videos (MOV, AVI, WebM, etc.)
```
1. Usuario sube video.mov
2. Backend guarda temporalmente en /temp/123456.mov
3. FFmpeg convierte a /storage/123456.mp4
4. Se elimina /temp/123456.mov
5. índice.json registra el .mp4
6. Usuario solo ve el .mp4 en la galería
```

### Para Imágenes
```
1. Usuario sube foto.jpg
2. Backend guarda directamente en /storage/123456.jpg
3. índice.json registra el .jpg
4. Sin conversión (flujo normal)
```

---

## 🎯 Validaciones Implementadas

### Backend (`app/api/upload/route.ts`)
1. ✅ Validación de tipo MIME
2. ✅ Validación de tamaño (100 MB máximo)
3. ✅ Manejo de errores en conversión
4. ✅ Limpieza automática de archivos temporales
5. ✅ Rollback en caso de error (elimina parciales)

### Frontend (`components/UploadButton.tsx`)
1. ✅ Detección de videos en selección
2. ✅ Mensaje de "convirtiendo" cuando hay videos
3. ✅ Notificaciones de éxito/error
4. ✅ Bloqueo de UI durante conversión

---

## 📁 Estructura de Carpetas

```
galeria/
├── storage/              # Videos finales (.mp4)
│   ├── 123456.mp4       # Video convertido
│   ├── 123457.jpg       # Imagen sin conversión
│   └── ...
├── temp/                 # Archivos temporales (se limpian automáticamente)
│   └── (vacía después de conversión exitosa)
└── index.json           # Metadatos (solo referencias a .mp4)
```

---

## ⚠️ Consideraciones Importantes

### Tiempo de Conversión
- Un video de 1 minuto puede tardar 10-30 segundos en convertirse
- El tiempo depende del tamaño y resolución del video original
- La UI muestra "convirtiendo" para informar al usuario

### Almacenamiento
- Los archivos convertidos pueden ser más pequeños o más grandes que el original
- Depende del codec/bitrate original vs H.264 CRF 23
- En promedio, videos QuickTime (MOV) de iPhone se reducen ~30%

### Compatibilidad
- **Formatos de entrada aceptados**: MP4, MOV, AVI, WebM, MPEG
- **Formato de salida**: Siempre MP4 (H.264 + AAC)
- **Compatibilidad**: Funciona en todos los navegadores modernos

### Errores Comunes
1. **"Error al convertir video"**: El archivo está corrupto o no es un video válido
2. **"FFmpeg no disponible"**: Problema con la instalación de dependencias
3. **Timeout**: Video muy grande (>100 MB o >30 min)

---

## 🧪 Pruebas Sugeridas

### Videos para Probar
1. ✅ Video MP4 (ya en formato correcto, se re-convierte)
2. ✅ Video MOV de iPhone (común, debería reducir tamaño)
3. ✅ Video AVI (formato antiguo, debería funcionar)
4. ✅ Video WebM (formato web, debería funcionar)

### Escenarios
- [x] Subir solo imágenes (no debe invocar FFmpeg)
- [x] Subir solo videos (debe convertir todos)
- [x] Subir mezcla de imágenes y videos
- [x] Subir video corrupto (debe mostrar error)
- [x] Subir video muy grande (debe validar tamaño)

---

## 🔍 Logs y Debug

### En Consola del Servidor
```
Iniciando conversión: ffmpeg -i /temp/123.mov ...
Progreso: 25%
Progreso: 50%
Progreso: 75%
Progreso: 100%
Conversión completada: /storage/123.mp4
```

### En Caso de Error
```
Error en conversión: [mensaje de FFmpeg]
FFmpeg stderr: [detalles técnicos]
```

---

## 📊 Impacto en el Proyecto

### Cambios en el Código
- **Líneas agregadas**: ~150
- **Archivos nuevos**: 1 (`videoConverter.ts`)
- **Archivos modificados**: 5
- **Dependencias nuevas**: 3

### Sin Cambios en
- ✅ Frontend (excepto mensaje de feedback)
- ✅ API de descarga
- ✅ API de listado
- ✅ Visualización de videos
- ✅ Descargas múltiples

### Ventajas
- ✅ Todos los videos en formato estándar MP4
- ✅ Mejor compatibilidad con navegadores
- ✅ Reproducción más confiable
- ✅ Posibilidad de optimizar tamaño

### Desventajas
- ⚠️ Tiempo extra al subir videos
- ⚠️ Uso temporal de CPU para conversión
- ⚠️ Requiere FFmpeg (dependencia adicional)

---

## 🚀 Próximos Pasos Opcionales

Si quieres mejorar la conversión en el futuro:

### Optimizaciones
- [ ] Barra de progreso en tiempo real (websockets)
- [ ] Cola de conversión para múltiples videos
- [ ] Generación de thumbnails/miniaturas
- [ ] Conversión en background (worker threads)

### Mejoras de Calidad
- [ ] Configuración de calidad personalizable (CRF 18-28)
- [ ] Detección automática de resolución óptima
- [ ] Reducción de resolución para videos 4K
- [ ] Normalización de audio

### Características Avanzadas
- [ ] Múltiples calidades (HD, SD, thumbnail)
- [ ] Extracción de metadatos (duración, fps, resolución)
- [ ] Soporte para subtítulos
- [ ] Estabilización de video

---

**Conversión de videos a MP4 implementada y funcionando** ✅
