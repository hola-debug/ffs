# Integración de React Bits

React Bits no es un paquete npm unificado, sino una colección de componentes que puedes copiar directamente a tu proyecto.

## Opciones para usar React Bits

### Opción 1: Copiar componentes directamente

Visita https://react-bits.dev/ y copia los componentes que necesites directamente a tu carpeta `src/components/`.

### Opción 2: Usar bibliotecas similares recomendadas

Si prefieres paquetes npm completos con componentes pre-construidos:

#### shadcn/ui (Recomendado)
```bash
npx shadcn-ui@latest init
```

Luego instala componentes individuales:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
```

#### Radix UI (primitivos sin estilos)
```bash
npm install @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select
```

#### Headless UI (by Tailwind Labs)
```bash
npm install @headlessui/react
```

Ejemplo:
```jsx
import { Dialog } from '@headlessui/react'
```

#### DaisyUI (Componentes Tailwind)
```bash
npm install -D daisyui@latest
```

Luego agrega a `tailwind.config.js`:
```js
module.exports = {
  //...
  plugins: [require("daisyui")],
}
```

## Componentes útiles para combinar con Framer Motion

### react-hot-toast (Notificaciones)
```bash
npm install react-hot-toast
```

```jsx
import toast, { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <button onClick={() => toast.success('¡Éxito!')}>
        Mostrar toast
      </button>
    </>
  )
}
```

### react-hook-form (Formularios)
```bash
npm install react-hook-form
```

```jsx
import { useForm } from 'react-hook-form'

function MyForm() {
  const { register, handleSubmit } = useForm()
  
  return (
    <form onSubmit={handleSubmit(data => console.log(data))}>
      <input {...register('email')} />
      <button type="submit">Submit</button>
    </form>
  )
}
```

### react-icons (Iconos)
```bash
npm install react-icons
```

```jsx
import { FaHeart, FaUser } from 'react-icons/fa'

<FaHeart className="text-red-500" />
```

## Estructura recomendada para componentes

```
src/
├── components/
│   ├── ui/              # Componentes UI base (buttons, cards, etc)
│   ├── layout/          # Layout components (Header, Footer, Sidebar)
│   ├── forms/           # Form components
│   └── animations/      # Wrappers de Framer Motion reutilizables
├── hooks/               # Custom hooks
├── utils/               # Utilidades
└── styles/              # Estilos adicionales si necesitas
```

## Componentes animados reutilizables con Framer Motion

Crea `src/components/animations/FadeIn.jsx`:

```jsx
import { motion } from 'framer-motion'

export function FadeIn({ children, delay = 0, duration = 0.5, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
```

Uso:
```jsx
<FadeIn delay={0.2}>
  <h1>Título animado</h1>
</FadeIn>
```

## Recomendación final

Para este proyecto con Tailwind CSS v3 y Framer Motion, te recomiendo:

1. **shadcn/ui** - Para componentes base complejos (dialogs, dropdowns, etc)
2. **Framer Motion** - Ya instalado, para todas las animaciones
3. **react-icons** - Para iconos
4. **react-hot-toast** - Para notificaciones
5. Componentes custom cuando necesites algo específico

Esta combinación te da máxima flexibilidad y control sobre el diseño.
