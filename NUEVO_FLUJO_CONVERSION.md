# 🎬 Nuevo Flujo de Conversión (Background)

## ✅ Problema Solucionado

**ANTES**: La conversión bloqueaba la subida → Timeouts y errores
**AHORA**: Subida rápida → Conversión en background → Sin bloqueos

---

## 🔄 Nuevo Flujo Completo

### 1. Usuario Sube Video

```
Usuario selecciona video.mov → Click "Subir"
```

### 2. Subida Inmediata (2-5 segundos)

```
1. Video se guarda TAL CUAL en /storage/123.mov
2. Se agrega al índice con status: "pending"
3. Respuesta INMEDIATA al usuario ✅
4. Video aparece en galería con spinner "Convirtiendo..."
```

**Tiempo**: Depende solo del tamaño del archivo, NO de la conversión

### 3. Conversión en Background (15-50 segundos)

```
Backend (sin bloquear):
1. Actualiza status a "converting"
2. FFmpeg convierte 123.mov → 123.mp4
3. Elimina 123.mov original
4. Actualiza status a "completed"
5. Actualiza índice con nuevo fileName: 123.mp4
```

**Usuario no espera**: Ya recibió respuesta, puede seguir usando la app

### 4. Actualización Automática

```
Usuario refresca la galería:
- Status cambió de "converting" → "completed"
- Spinner desaparece
- Video listo para ver/descargar
```

---

## 📊 Comparación

### ANTES (Conversión Bloqueante)
```
┌─────────────────────────────────────────────────┐
│ Usuario sube → Espera → Espera → Espera → ✅   │
│                  [28+ segundos]                  │
│                 ⚠️ TIMEOUT POSIBLE               │
└─────────────────────────────────────────────────┘
```

### AHORA (Conversión Background)
```
┌──────────────┬─────────────────────────────────┐
│ Usuario sube │ Backend convierte (background)  │
│     ↓ ✅     │            ↓                    │
│  (3 seg)     │      (15-50 seg)                │
│              │  Usuario puede seguir usando     │
└──────────────┴─────────────────────────────────┘
```

**Resultado**: Usuario ve respuesta inmediata, sin errores

---

## 🎯 Estados de Conversión

### pending
- Video recién subido
- Esperando a iniciar conversión
- **UI**: Spinner + "Convirtiendo..."

### converting
- FFmpeg procesando el video
- **UI**: Spinner + "Convirtiendo..."

### completed
- Conversión exitosa
- Archivo MP4 listo
- **UI**: Normal (sin spinner)

### failed
- Error en conversión
- Archivo original disponible
- **UI**: Icono ⚠️ + "Error"

---

## 💻 Cambios en el Código

### 1. Tipos Actualizados ([lib/types.ts](lib/types.ts:9-10))

```typescript
export interface MediaItem {
  // ... campos existentes
  conversionStatus?: 'pending' | 'converting' | 'completed' | 'failed';
  convertedFileName?: string;
}
```

### 2. Nueva Función ([lib/storage.ts](lib/storage.ts:135-155))

```typescript
export function updateConversionStatus(
  id: string,
  status: 'pending' | 'converting' | 'completed' | 'failed',
  convertedFileName?: string
): void
```

### 3. Upload Modificado ([app/api/upload/route.ts](app/api/upload/route.ts))

```typescript
// Guardar video inmediatamente
fs.writeFileSync(filePath, buffer);
mediaItem.conversionStatus = 'pending';
addItemToIndex(mediaItem);

// Responder INMEDIATAMENTE al cliente
return NextResponse.json({ success: true, ... });

// Conversión en background (NO ESPERA)
setImmediate(() => {
  convertVideoInBackground(id, filePath, mp4Path, mp4FileName);
});
```

### 4. UI Actualizada ([components/MediaCard.tsx](components/MediaCard.tsx:14-15))

```typescript
const isConverting = item.conversionStatus === 'converting' ||
                     item.conversionStatus === 'pending';
const conversionFailed = item.conversionStatus === 'failed';
```

---

## 🧪 Cómo Probar

### 1. Reinicia el servidor
```bash
npm run dev
```

### 2. Sube un video desde navegador

1. Abre http://localhost:3003
2. Click "Subir archivos"
3. Selecciona un video (.mov, .avi, etc.)
4. **Observa**:
   - ✅ Respuesta inmediata (2-5 seg)
   - ✅ Video aparece con spinner
   - ✅ Sin errores de timeout

### 3. Verifica logs del servidor

```
POST /api/upload 200 in 3234ms  ← Respuesta rápida!
[123-abc] Video guardado, conversión iniciada en background
[123-abc] Iniciando conversión en background...
Iniciando conversión: ffmpeg -i storage/123.mov ...
Progreso: 25%
Progreso: 50%
Progreso: 75%
Progreso: 100%
Conversión completada: storage/123.mp4
[123-abc] Archivo original eliminado
[123-abc] Conversión completada exitosamente
```

### 4. Refresca la galería

- El spinner desaparece
- Video listo para reproducir

---

## 📱 Desde Celular (ngrok)

### Ventajas Adicionales

1. **No más timeouts**: La subida termina rápido
2. **No más pantalla bloqueada**: Wake Lock solo durante subida (rápida)
3. **Mejor experiencia**: Usuario no espera

### Flujo

```
Celular:
1. Sube video → 3-5 segundos → ✅ Listo
2. Puede cerrar app o bloquear pantalla
3. Backend convierte en background
4. Próxima vez que abra la app: video convertido
```

---

## ⚙️ Configuración

### Timeout Reducido

**ANTES**: 300 segundos (5 minutos)
**AHORA**: 60 segundos (1 minuto)

Razón: Solo necesitamos tiempo para la subida, NO para conversión

```typescript
// En app/api/upload/route.ts
export const maxDuration = 60;
```

---

## 🔍 Troubleshooting

### Video queda en "Convirtiendo..." para siempre

**Causa**: Conversión falló pero no se actualizó el estado

**Solución**:
1. Revisa logs del servidor
2. Busca errores de FFmpeg
3. El video original sigue disponible

### Video muestra "Error"

**Causa**: FFmpeg no pudo convertir el archivo

**Posibles razones**:
- Codec no soportado
- Archivo corrupto
- FFmpeg crasheó

**Solución**:
- Video original sigue en /storage
- Usuario puede descargarlo tal cual
- O intentar subir de nuevo

### Conversión muy lenta

**Normal**: Videos grandes tardan más

**Tiempos esperados**:
- 10 seg: 3-5 seg conversión
- 30 seg: 8-12 seg conversión
- 1 min: 15-25 seg conversión
- 2 min: 30-50 seg conversión

---

## 📊 Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| [lib/types.ts](lib/types.ts) | Agregado conversionStatus |
| [lib/storage.ts](lib/storage.ts) | Agregado updateConversionStatus() |
| [app/api/upload/route.ts](app/api/upload/route.ts) | Conversión en background |
| [components/MediaCard.tsx](components/MediaCard.tsx) | UI de estado |

---

## ✅ Ventajas del Nuevo Flujo

1. ✅ **Sin timeouts**: Subida rápida, sin esperas
2. ✅ **Sin bloqueos**: Usuario sigue usando la app
3. ✅ **Mejor UX**: Feedback inmediato
4. ✅ **Más robusto**: Errores no afectan la subida
5. ✅ **Móvil-friendly**: No requiere pantalla encendida todo el tiempo
6. ✅ **Escalable**: Múltiples conversiones en paralelo

---

## 🎯 Resultado Final

**Usuario feliz**:
- Sube videos rápido ✅
- No espera conversión ✅
- No se bloquea el celular ✅
- Ve progreso visual ✅

**Sistema robusto**:
- Sin timeouts ✅
- Sin errores de conexión ✅
- Conversiones en background ✅
- Estado visible en todo momento ✅

---

**Prueba ahora y verás la diferencia** 🚀
