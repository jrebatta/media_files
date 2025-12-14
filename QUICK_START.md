# 🚀 Guía Rápida de Inicio

## Inicio Local (5 minutos)

### 1. Instalar dependencias
```bash
npm install
```

### 2. Iniciar la aplicación
```bash
npm run dev
```

### 3. Abrir en el navegador
Abre [http://localhost:3000](http://localhost:3000)

**¡Listo!** Ya puedes subir fotos y videos.

---

## Acceso desde Móvil con ngrok (10 minutos)

### 1. Instalar ngrok

**Windows:**
```bash
# Con Chocolatey
choco install ngrok

# O descarga desde: https://ngrok.com/download
```

**macOS:**
```bash
brew install ngrok
```

**Linux:**
```bash
# Descargar y descomprimir
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
sudo tar xvzf ngrok-v3-stable-linux-amd64.tgz -C /usr/local/bin
```

### 2. Registrarte en ngrok (gratis)

1. Visita [https://ngrok.com/](https://ngrok.com/)
2. Crea una cuenta gratuita
3. Copia tu authtoken desde el dashboard
4. Configura el authtoken:
   ```bash
   ngrok config add-authtoken TU_TOKEN_AQUI
   ```

### 3. Iniciar la aplicación

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2:**
```bash
ngrok http 3000
```

### 4. Obtener la URL

ngrok mostrará algo como:
```
Forwarding   https://abc123.ngrok.io -> http://localhost:3000
```

### 5. Acceder desde tu móvil

1. Copia la URL `https://abc123.ngrok.io`
2. Ábrela en Safari (iPhone) o Chrome (Android)
3. ¡Ya puedes subir fotos desde tu móvil!

---

## Consejos

### Mantener la URL de ngrok

La versión gratuita cambia la URL cada vez. Para mantenerla:
- Usa ngrok Pro (de pago)
- O simplemente comparte la nueva URL cada vez

### Rendimiento

- Las fotos se suben directamente a tu computadora
- El tamaño máximo por archivo es 100 MB
- Puedes subir múltiples archivos a la vez

### Seguridad

⚠️ **IMPORTANTE**: No hay autenticación. Cualquiera con la URL puede:
- Ver tus fotos
- Subir archivos
- Descargar todo

**Recomendaciones:**
- No compartas la URL públicamente
- Usa solo para compartir con familia/amigos de confianza
- No subas fotos sensibles o privadas

---

## Atajos de Teclado

- **ESC**: Cerrar visor de foto/video
- **Click fuera del visor**: Cerrar visor

## Uso Básico

### Subir
1. Click en "📤 Subir archivos"
2. Selecciona fotos/videos
3. Espera la confirmación

### Ver
- Click en cualquier foto/video para verla en grande

### Descargar
- **Una foto**: Hover y click en ⬇️
- **Varias fotos**: Marca checkboxes → "📥 Descargar seleccionados"

**Nota**: Las descargas múltiples NO crean ZIP. Cada archivo se descarga por separado.

---

## Solución Rápida de Problemas

### No carga la página
- Verifica que `npm run dev` esté corriendo
- Prueba en otro navegador

### No puedo subir archivos
- Verifica el tamaño (máx. 100 MB)
- Revisa que sea foto o video (no documentos)

### ngrok no conecta
- Asegúrate de configurar el authtoken
- Verifica que la app esté en puerto 3000
- Prueba: `ngrok http 3000 --log=stdout`

### Las descargas múltiples se bloquean
- Permite descargas automáticas en tu navegador
- Chrome: Configuración → Descargas automáticas

---

**¿Necesitas ayuda?** Revisa el [README.md](README.md) completo para más detalles.
