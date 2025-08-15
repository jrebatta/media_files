# 📸 Servidor de Sincronización de Fotos

Servidor local para subir automáticamente fotos desde tu celular a tu PC.

## 🚀 Cómo usar

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar el servidor:**
   ```bash
   npm start
   ```

3. **Acceder desde tu celular:**
   - Encuentra la IP de tu PC en la red local
   - En tu celular, abre el navegador y ve a: `http://[IP-DE-TU-PC]:3000`
   - Ejemplo: `http://192.168.1.100:3000`

## 📱 Funcionalidades

- **Subida desde el navegador:** Interfaz web optimizada para móviles
- **Captura directa:** Opción para tomar foto directamente desde la cámara
- **Drag & Drop:** Arrastra fotos para subirlas
- **Preview:** Vista previa antes de subir
- **Auto-guardado:** Las fotos se guardan automáticamente en la carpeta `fotos/`
- **Nombres únicos:** Cada foto se guarda con timestamp para evitar duplicados

## 🔧 Configuración

- **Puerto:** 3000 (configurable en `server.js`)
- **Carpeta destino:** `fotos/` (se crea automáticamente)
- **Tamaño máximo:** 30MB por archivo
- **Formatos soportados:** JPG, PNG, GIF, WebP

## 🌐 Encontrar tu IP local

**Windows:**
```cmd
ipconfig
```

**Linux/Mac:**
```bash
ip addr show
```

Busca tu dirección IP local (generalmente 192.168.x.x o 10.x.x.x)

## 📂 Estructura del proyecto

```
mi-claude/
├── server.js          # Servidor principal
├── package.json       # Dependencias
├── public/
│   └── index.html     # Interfaz web
└── fotos/             # Fotos guardadas (se crea automáticamente)
```