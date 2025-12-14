# Arquitectura de Descargas Múltiples (Sin ZIP)

## Decisión de Diseño

Este proyecto **NO utiliza archivos ZIP** para descargas múltiples. En su lugar, implementa descargas separadas e independientes por archivo.

## Razón

- **Mejor experiencia móvil**: Los dispositivos móviles (iPhone, Android) manejan mejor múltiples descargas individuales que archivos ZIP.
- **Simplicidad**: No requiere procesamiento adicional en el servidor ni librerías de compresión.
- **Inmediatez**: Los archivos se descargan directamente sin necesidad de esperar a que se genere un ZIP.

## Implementación

### Backend

El backend solo necesita la API de descarga individual:

```
GET /api/download/[id]
```

Esta API:
1. Busca el archivo en el índice por su ID
2. Lee el archivo del disco
3. Lo devuelve con headers apropiados para descarga
4. Usa el nombre original del archivo

**No hay API especial para descargas múltiples en el backend.**

### Frontend

El frontend es responsable de:

1. Permitir selección múltiple de archivos (checkboxes)
2. Al pulsar "Descargar seleccionados":
   - Iterar sobre cada archivo seleccionado
   - Para cada uno, iniciar una descarga usando `/api/download/[id]`
   - Esto se hace programáticamente creando enlaces temporales y disparando clicks

```typescript
// Ejemplo conceptual
selectedItems.forEach(item => {
  const url = `/api/download/${item.id}`;
  const link = document.createElement('a');
  link.href = url;
  link.download = item.originalName;
  link.click();
});
```

### Comportamiento del Navegador

- Los navegadores modernos manejan múltiples descargas simultáneas
- Algunos navegadores pueden pedir confirmación si son muchas descargas
- Cada archivo se descarga con su nombre original
- El usuario puede pausar, cancelar o reanudar cada descarga independientemente

## Ventajas

✅ Sin procesamiento adicional en servidor
✅ Sin consumo extra de CPU/memoria para comprimir
✅ Sin latencia esperando que se genere un ZIP
✅ Mejor para dispositivos móviles
✅ Cada archivo conserva su nombre original
✅ Descargas pueden iniciarse inmediatamente

## Limitaciones Conocidas

⚠️ Si se seleccionan muchos archivos (>10), algunos navegadores pueden bloquear las descargas automáticas
⚠️ El usuario verá múltiples notificaciones de descarga (una por archivo)

## Alternativas Consideradas

Se consideró usar ZIP pero se descartó porque:
- Requiere tiempo de procesamiento para comprimir
- Consume memoria del servidor
- En móviles es incómodo (necesitas app para descomprimir)
- Añade complejidad innecesaria para este caso de uso
