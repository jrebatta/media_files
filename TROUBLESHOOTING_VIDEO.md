# 🔧 Solución de Problemas - Conversión de Videos

## Error: ECONNRESET al subir videos

### Problema
```
Error en upload: [Error: aborted] { code: 'ECONNRESET' }
POST /api/upload 200 in 28274ms
```

### Causa
La conexión se interrumpe porque la conversión de FFmpeg tarda demasiado y el cliente (navegador o ngrok) cierra la conexión por timeout.

### Solución Implementada

#### 1. Timeout aumentado en API Route
```typescript
// En app/api/upload/route.ts
export const maxDuration = 300; // 5 minutos
```

#### 2. Preset de FFmpeg más rápido
```typescript
// En lib/videoConverter.ts
'-preset veryfast'  // Antes era 'medium'
```

**Comparación de velocidad:**
- `ultrafast`: ~2x más rápido, archivos grandes
- `veryfast`: ~1.5x más rápido, buen balance ✅ (elegido)
- `fast`: ~1.2x más rápido
- `medium`: Balance estándar (anterior)
- `slow`: Mejor compresión, muy lento

#### 3. Headers CORS para ngrok
```javascript
// En next.config.js
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
      ],
    },
  ];
}
```

### Tiempos Esperados con `veryfast`

| Duración Video | Tamaño  | Tiempo Conversión |
|---------------|---------|-------------------|
| 10 segundos   | ~5 MB   | 3-5 segundos      |
| 30 segundos   | ~15 MB  | 8-12 segundos     |
| 1 minuto      | ~30 MB  | 15-25 segundos    |
| 2 minutos     | ~60 MB  | 30-50 segundos    |
| 5 minutos     | ~100 MB | 1-2 minutos       |

### Si el Problema Persiste

#### Opción 1: Reducir calidad para mayor velocidad
Edita `lib/videoConverter.ts`:
```typescript
'-preset ultrafast', // Muy rápido
'-crf 28',          // Calidad menor pero archivo más pequeño
```

#### Opción 2: Limitar resolución
Edita `lib/videoConverter.ts`, añade antes de `.outputOptions()`:
```typescript
.size('1280x?')  // Máximo 720p
// o
.size('1920x?')  // Máximo 1080p
```

#### Opción 3: Aumentar timeout del navegador
En Chrome/Edge:
1. F12 (DevTools)
2. Network tab
3. Desactivar "Disable cache"
4. Los timeouts serán más largos

#### Opción 4: Usar producción en lugar de desarrollo
```bash
npm run build
npm start
```
El modo producción puede ser más rápido.

---

## Error: FFmpeg no disponible

### Problema
```
Error al inicializar FFmpeg
FFmpeg no pudo ser inicializado
```

### Solución
```bash
# Reinstalar dependencias
npm install --force
# o
rm -rf node_modules package-lock.json
npm install
```

---

## Error: Critical dependency warnings

### Problema
```
⚠ ./node_modules/@ffmpeg-installer/ffmpeg/index.js
Critical dependency: the request of a dependency is an expression
```

### Solución
**Esto es normal y se puede ignorar**. Son warnings de webpack por cómo FFmpeg carga binarios nativos, pero no afecta la funcionalidad.

---

## Videos muy grandes (>100 MB)

### Problema
El límite es 100 MB por archivo.

### Solución
Edita `lib/constants.ts`:
```typescript
export const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB
```

Y `next.config.js`:
```javascript
serverActions: {
  bodySizeLimit: '200mb',
}
```

---

## Conversión muy lenta

### Diagnóstico
Revisa los logs del servidor:
```
Iniciando conversión: ffmpeg -i /temp/...
Progreso: 10%
Progreso: 25%
...
```

### Soluciones

#### 1. Cambiar a preset más rápido
En `lib/videoConverter.ts`:
```typescript
'-preset ultrafast'  // Más rápido, archivos grandes
```

#### 2. Reducir resolución automáticamente
```typescript
.size('1280x?')  // Forzar máximo 720p
```

#### 3. Reducir calidad (CRF más alto)
```typescript
'-crf 28'  // Mayor = menor calidad pero más rápido
```

#### 4. Deshabilitar conversión para videos MP4
En `app/api/upload/route.ts`, después de validar el tipo:
```typescript
// Si ya es MP4, saltar conversión
if (file.type === 'video/mp4') {
  // Guardar directamente sin convertir
  const ext = path.extname(file.name);
  finalFileName = `${id}${ext}`;
  // ... resto del código de imagen
} else if (mediaType === 'video') {
  // Convertir solo si NO es MP4
  // ... código de conversión actual
}
```

---

## Uso de CPU alto durante conversión

### Normal
FFmpeg usa mucho CPU durante la conversión. Es esperado.

### Si quieres limitarlo
No recomendado, pero puedes añadir:
```typescript
'-threads 2'  // Limitar a 2 threads (por defecto usa todos)
```

---

## Espacio en disco

### Problema
La carpeta `/temp` acumula archivos.

### Solución
Los archivos temporales se eliminan automáticamente después de la conversión exitosa. Si hay muchos archivos, significa que hubo conversiones fallidas.

Limpiar manualmente:
```bash
rm -rf temp/*
```

---

## Testing Local vs ngrok

### ngrok puede tener timeouts más cortos
Si funciona en `localhost:3000` pero falla en ngrok:

1. **Usar ngrok con timeout mayor** (requiere plan pago)
2. **Reducir preset a `veryfast` o `ultrafast`**
3. **Limitar tamaño de videos a 50 MB** en lugar de 100 MB

---

## Verificar que FFmpeg está funcionando

### Test rápido
Crea un archivo `test-ffmpeg.js`:
```javascript
const { execSync } = require('child_process');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

try {
  const version = execSync(`"${ffmpegPath}" -version`);
  console.log('✅ FFmpeg disponible:');
  console.log(version.toString());
} catch (error) {
  console.error('❌ FFmpeg no disponible:', error);
}
```

Ejecutar:
```bash
node test-ffmpeg.js
```

---

## Logs Detallados

Para ver más información durante la conversión, edita `lib/videoConverter.ts`:

```typescript
.on('start', (commandLine) => {
  console.log('='.repeat(60));
  console.log('INICIANDO CONVERSIÓN');
  console.log('Input:', inputPath);
  console.log('Output:', outputPath);
  console.log('Comando:', commandLine);
  console.log('='.repeat(60));
})
.on('progress', (progress) => {
  console.log(`Progreso: ${Math.round(progress.percent)}% | Frames: ${progress.frames} | FPS: ${progress.currentFps}`);
})
.on('end', () => {
  console.log('='.repeat(60));
  console.log('✅ CONVERSIÓN COMPLETADA');
  console.log('Output:', outputPath);
  console.log('='.repeat(60));
})
```

---

## Resumen de Optimizaciones Aplicadas

✅ **Timeout aumentado**: 300 segundos (5 minutos)
✅ **Preset más rápido**: `veryfast` en lugar de `medium`
✅ **Queue size aumentado**: Evita errores de muxing
✅ **Headers CORS**: Compatible con ngrok
✅ **Carga dinámica**: FFmpeg se carga solo cuando se necesita

---

## ¿Cuándo contactar soporte?

Si después de aplicar todas estas soluciones:
- Videos de <1 minuto tardan >1 minuto en convertirse
- Recibes errores de FFmpeg constantes
- La conversión nunca termina

Puede ser un problema con:
- Tu CPU (muy lenta)
- FFmpeg corrupto (reinstalar dependencias)
- Permisos de disco (verificar acceso a /temp y /storage)
