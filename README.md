# 📸 Galería Personal

Aplicación web tipo galería (similar a Google Fotos pero muy simple) para gestionar fotos y videos desde cualquier dispositivo.

## ✨ Características

- **Sin autenticación**: Acceso directo sin login
- **Sin base de datos**: Todo se almacena en disco local con un índice JSON
- **Subir archivos**: Fotos y videos desde cualquier dispositivo
- **Ver galería**: Vista responsive tipo grid
- **Descargar individual**: Descarga archivos uno por uno
- **Descargas múltiples**: Selecciona varios y descarga sin ZIP (descargas separadas)
- **Visualización**: Modal para ver fotos y reproducir videos
- **Responsive**: Funciona perfectamente en móvil, tablet y escritorio

## 🛠️ Tecnologías

- **Next.js 15** con App Router
- **TypeScript** para type safety
- **TailwindCSS** para estilos responsive
- **Almacenamiento local** en disco (carpeta `storage/`)
- **Índice JSON** para metadatos (`index.json`)

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Ejecutar en modo desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

### 3. Producción

```bash
npm run build
npm start
```

## 🌐 Uso con ngrok (Acceso desde otros dispositivos)

Para acceder a la galería desde tu móvil u otros dispositivos:

### 1. Instalar ngrok

```bash
# Windows (con Chocolatey)
choco install ngrok

# macOS (con Homebrew)
brew install ngrok

# O descarga desde: https://ngrok.com/download
```

### 2. Ejecutar la aplicación

```bash
npm run dev
```

### 3. En otra terminal, exponer con ngrok

```bash
ngrok http 3000
```

### 4. Acceder desde cualquier dispositivo

ngrok te dará una URL pública como:
```
https://abc123.ngrok.io
```

Copia esa URL y ábrela desde:
- Tu iPhone/iPad
- Dispositivos Android
- Cualquier computadora con internet

**Importante**: La URL de ngrok es temporal y cambia cada vez que reinicias ngrok. Si quieres una URL permanente, considera usar la versión de pago de ngrok o configurar un dominio personalizado.

## 📁 Estructura del Proyecto

```
galeria/
├── app/                      # Aplicación Next.js
│   ├── api/                  # API Routes (backend)
│   │   ├── media/            # GET: listar archivos
│   │   ├── upload/           # POST: subir archivos
│   │   └── download/[id]/    # GET: descargar archivo
│   ├── layout.tsx            # Layout principal
│   ├── page.tsx              # Página principal
│   └── globals.css           # Estilos globales
├── components/               # Componentes React
│   ├── GalleryGrid.tsx       # Grid de galería
│   ├── MediaCard.tsx         # Tarjeta de foto/video
│   ├── MediaViewer.tsx       # Visor de medios
│   ├── UploadButton.tsx      # Botón de subida
│   └── Toast.tsx             # Notificaciones
├── lib/                      # Utilidades
│   ├── storage.ts            # Funciones de almacenamiento
│   ├── types.ts              # Tipos TypeScript
│   ├── constants.ts          # Constantes
│   └── init.ts               # Inicialización
├── storage/                  # 📂 Archivos subidos (se crea automáticamente)
├── index.json                # 📄 Índice de archivos (se crea automáticamente)
└── ...
```

## 🎯 Uso de la Aplicación

### Subir Archivos

1. Haz clic en el botón "📤 Subir archivos"
2. Selecciona una o más fotos/videos
3. Los archivos se subirán automáticamente
4. Aparecerá una notificación de éxito

### Ver Archivos

- Los archivos se muestran en un grid responsive
- Haz clic en cualquier archivo para verlo en tamaño completo
- Para videos, se reproducirán automáticamente

### Descargar Archivos

**Individual:**
- Haz hover sobre un archivo
- Haz clic en el botón ⬇️ que aparece

**Múltiple (sin ZIP):**
1. Marca los checkboxes de los archivos que quieres
2. Haz clic en "📥 Descargar seleccionados"
3. El navegador iniciará descargas separadas para cada archivo

**Nota**: Las descargas múltiples NO crean un archivo ZIP. Cada archivo se descarga por separado, lo que es más cómodo en dispositivos móviles.

### Navegación

- **ESC**: Cerrar el visor de medios
- **Click fuera**: Cerrar el visor
- **Checkboxes**: Seleccionar múltiples archivos

## 🔧 Configuración

### Tipos de Archivo Aceptados

**Imágenes:**
- JPEG/JPG
- PNG
- GIF
- WebP
- HEIC/HEIF

**Videos:**
- MP4
- QuickTime (MOV)
- AVI
- WebM
- MPEG

### Tamaño Máximo

- **Por archivo**: 100 MB
- Configurable en `lib/constants.ts`

### Cambiar Puerto

Por defecto usa el puerto 3000. Para cambiarlo:

```bash
# Linux/macOS
PORT=8080 npm run dev

# Windows (CMD)
set PORT=8080 && npm run dev

# Windows (PowerShell)
$env:PORT=8080; npm run dev
```

## 🔒 Seguridad

**⚠️ IMPORTANTE**: Esta aplicación NO tiene autenticación. Cualquier persona con acceso a la URL puede:
- Ver todos los archivos
- Subir archivos
- Descargar archivos

**Recomendaciones:**
- No subas información sensible o privada
- Usa en redes de confianza
- Si usas ngrok, no compartas la URL públicamente
- Considera agregar autenticación si lo necesitas en producción

## 🐛 Solución de Problemas

### La carpeta storage no existe

La carpeta se crea automáticamente al subir el primer archivo. No necesitas crearla manualmente.

### Error al subir archivos grandes

Aumenta el límite en `next.config.js`:

```js
serverActions: {
  bodySizeLimit: '200mb', // Cambiar a 200MB
}
```

### ngrok no funciona

- Asegúrate de que la app esté corriendo en `localhost:3000`
- Verifica que ngrok esté instalado correctamente
- Prueba con: `ngrok http 3000 --log=stdout`

### Las descargas múltiples no funcionan

Algunos navegadores bloquean descargas automáticas múltiples. Necesitas:
- Permitir descargas múltiples en la configuración del navegador
- En Chrome: Configuración → Privacidad → Configuración de contenido → Descargas automáticas

## 📝 Desarrollo

### Comandos útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Producción
npm start

# Linter
npm run lint
```

### Agregar nuevas funcionalidades

El código está organizado de manera modular:
- APIs en `app/api/`
- Componentes en `components/`
- Lógica de negocio en `lib/`

## 📄 Licencia

Este es un proyecto personal sin licencia específica.

## 🤝 Contribuciones

Este es un proyecto personal, pero si encuentras bugs o tienes sugerencias, puedes crear un issue.

---

**Desarrollado con Next.js, TypeScript y TailwindCSS** ⚡
