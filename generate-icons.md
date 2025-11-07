# Generación de Iconos PWA

Para generar los iconos de la PWA, necesitas crear dos imágenes:

1. **pwa-192x192.png** - Icono de 192x192 píxeles
2. **pwa-512x512.png** - Icono de 512x512 píxeles

## Opciones para generar iconos:

### Opción 1: Usar una herramienta online
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

### Opción 2: Usar CLI (pwa-asset-generator)
```bash
npx pwa-asset-generator [tu-logo.svg/png] public --icon-only --type png
```

### Opción 3: Manual con herramienta de diseño
Crea dos archivos PNG con las dimensiones exactas y colócalos en la carpeta `public/`:
- `public/pwa-192x192.png`
- `public/pwa-512x512.png`

## Iconos temporales
Por ahora, puedes usar el logo de Vite que ya está en `public/vite.svg` como referencia.
