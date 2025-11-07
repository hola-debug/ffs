# FFS Finance - PWA con React + Vite + Tailwind CSS v3

Progressive Web App moderna construida con las mejores tecnologías.

## 🚀 Stack Tecnológico

- **React 18** - Biblioteca UI
- **Vite 5** - Build tool y dev server ultra rápido
- **Tailwind CSS v3** - Framework CSS utility-first
- **Framer Motion** - Librería de animaciones profesionales
- **vite-plugin-pwa** - Plugin para convertir la app en PWA
- **Workbox** - Service workers para cache y funcionalidad offline

## 📦 Instalación

Las dependencias ya están instaladas. Si necesitas reinstalar:

```bash
npm install
```

## 🛠️ Comandos Disponibles

```bash
# Desarrollo (con PWA habilitada)
npm run dev

# Build de producción
npm run build

# Preview del build de producción
npm run preview

# Lint
npm run lint
```

## 🎨 Tailwind CSS v3

Tailwind está completamente configurado. Puedes usar todas las utilidades directamente:

```jsx
<div className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600">
  Botón con Tailwind
</div>
```

## ✨ Framer Motion

Ejemplos de animaciones profesionales:

```jsx
import { motion } from 'framer-motion'

// Animación de entrada
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Contenido animado
</motion.div>

// Hover effects
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Click me
</motion.button>
```

## 📱 PWA (Progressive Web App)

La app está configurada como PWA:

- ✅ Service Worker con actualización automática
- ✅ Manifest configurado
- ✅ Cache de assets
- ✅ Funcionalidad offline (Workbox)
- ✅ Instalable en dispositivos móviles y desktop

### Generar Iconos PWA

Necesitas crear los iconos de la app. Ver `generate-icons.md` para instrucciones detalladas.

Iconos requeridos en `public/`:
- `pwa-192x192.png`
- `pwa-512x512.png`

## 🎯 React Bits

Para instalar componentes de React Bits, puedes usar:

```bash
npm install @react-bits/ui
# o instalar componentes específicos según necesites
```

Consulta la documentación de React Bits para componentes específicos que necesites.

## 🚀 Deploy en Vercel

### Opción 1: Desde la terminal

```bash
# Instalar Vercel CLI si no la tienes
npm i -g vercel

# Deploy
vercel
```

### Opción 2: Desde GitHub

1. Sube el proyecto a GitHub
2. Importa el repositorio en [vercel.com](https://vercel.com)
3. Vercel detectará automáticamente la configuración de Vite
4. Click en "Deploy"

### Configuración de Vercel (vercel.json)

Ya está incluido en el proyecto:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## 📁 Estructura del Proyecto

```
ffs.finance/
├── public/              # Assets estáticos
├── src/
│   ├── assets/         # Imágenes, fuentes, etc.
│   ├── App.jsx         # Componente principal
│   ├── main.jsx        # Entry point
│   └── index.css       # Estilos globales (Tailwind)
├── index.html          # HTML principal
├── vite.config.js      # Configuración Vite + PWA
├── tailwind.config.js  # Configuración Tailwind
└── package.json        # Dependencias

```

## 🎨 Personalización

### Colores del tema PWA

Edita `vite.config.js`:

```js
manifest: {
  theme_color: '#tu-color',
  background_color: '#tu-color',
  // ...
}
```

### Tailwind

Extiende la configuración en `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      brand: '#tu-color',
    },
  },
}
```

## 📚 Recursos

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS v3](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [PWA Documentation](https://vite-pwa-org.netlify.app/)
- [Vercel Deployment](https://vercel.com/docs)

## 🐛 Troubleshooting

Si hay problemas con los módulos de node:
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📄 Licencia

MIT
