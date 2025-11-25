# 🎯 Quick Reference - Drag & Drop Integration

## 📦 Imports Necesarios

```typescript
// En tu componente sortable
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// En tu página/container
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
import { useDragState } from '../hooks/useDragState';
```

---

## 🎨 Componente Sortable (Template)

```typescript
export function SortableItem({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,  // ⭐ Importante
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    transition: isDragging ? undefined : transition,
    zIndex: isDragging ? 10 : undefined,
    willChange: isDragging ? 'transform' : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Drag Handle */}
      <button
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        style={{ touchAction: 'none' }}
        className="cursor-grab active:cursor-grabbing"
      >
        ⠿
      </button>
      
      {children}
    </div>
  );
}
```

---

## 🏗️ Container con DndContext (Template)

```typescript
export function MyPage() {
  const isDragging = useDragState();
  const [items, setItems] = useState([...]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // Reordenar items
    }
  };

  const handleOpenModal = (id) => {
    if (isDragging) return;  // ⭐ Bloquear durante drag
    setActiveModal(id);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
    >
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        {items.map(item => (
          <SortableItem key={item.id} id={item.id}>
            <ItemContent item={item} onOpenModal={handleOpenModal} />
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

---

## 🎣 Hook useDragState

```typescript
// src/hooks/useDragState.ts
import { useDndMonitor } from '@dnd-kit/core';
import { useState } from 'react';

export function useDragState() {
  const [isDragging, setIsDragging] = useState(false);

  useDndMonitor({
    onDragStart() { setIsDragging(true); },
    onDragEnd() { setIsDragging(false); },
    onDragCancel() { setIsDragging(false); },
  });

  return isDragging;
}
```

**Uso:**
```typescript
const isDragging = useDragState();

if (isDragging) return; // Bloquear acción
```

---

## 🎛️ Modifiers Comunes

```typescript
import {
  restrictToVerticalAxis,      // Solo vertical
  restrictToHorizontalAxis,     // Solo horizontal
  restrictToWindowEdges,        // No salir de ventana
  restrictToParentElement,      // No salir del padre
  snapCenterToCursor,           // Centrar en cursor
} from '@dnd-kit/modifiers';

<DndContext modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}>
```

---

## 🎨 Icono Drag Handle (SVG)

```tsx
<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
  <circle cx="4" cy="4" r="1.5" fill="currentColor" />
  <circle cx="12" cy="4" r="1.5" fill="currentColor" />
  <circle cx="4" cy="8" r="1.5" fill="currentColor" />
  <circle cx="12" cy="8" r="1.5" fill="currentColor" />
  <circle cx="4" cy="12" r="1.5" fill="currentColor" />
  <circle cx="12" cy="12" r="1.5" fill="currentColor" />
</svg>
```

---

## ✅ Checklist de Implementación

### Componente Sortable
- [ ] Importar `useSortable` y `CSS` de `@dnd-kit`
- [ ] Destructurar `setActivatorNodeRef` de `useSortable`
- [ ] Usar `CSS.Translate` (no `CSS.Transform`)
- [ ] Crear botón con `ref={setActivatorNodeRef}`
- [ ] Aplicar `{...listeners}` y `{...attributes}` al botón
- [ ] Agregar `style={{ touchAction: 'none' }}` al botón
- [ ] Agregar `willChange: 'transform'` cuando `isDragging`

### Container/Page
- [ ] Importar `useDragState` hook
- [ ] Importar modifiers necesarios
- [ ] Llamar `const isDragging = useDragState()`
- [ ] Bloquear modales: `if (isDragging) return`
- [ ] Configurar `sensors` con `PointerSensor`
- [ ] Agregar `modifiers` al `DndContext`
- [ ] Implementar `handleDragEnd`

### Hook useDragState
- [ ] Crear archivo `src/hooks/useDragState.ts`
- [ ] Importar `useDndMonitor` de `@dnd-kit/core`
- [ ] Implementar estado con `useState`
- [ ] Configurar callbacks: `onDragStart`, `onDragEnd`, `onDragCancel`

---

## 🚫 Errores Comunes

### ❌ Error 1: Drag no funciona
**Causa:** Olvidaste `setActivatorNodeRef`
```typescript
// ❌ Mal
<button {...listeners}>

// ✅ Bien
<button ref={setActivatorNodeRef} {...listeners}>
```

### ❌ Error 2: Todo el container es draggable
**Causa:** Aplicaste `{...listeners}` al container
```typescript
// ❌ Mal
<div ref={setNodeRef} {...listeners}>

// ✅ Bien
<div ref={setNodeRef}>
  <button ref={setActivatorNodeRef} {...listeners}>
```

### ❌ Error 3: Modales se abren durante drag
**Causa:** No bloqueaste con `useDragState`
```typescript
// ❌ Mal
const handleClick = () => setModal(true);

// ✅ Bien
const isDragging = useDragState();
const handleClick = () => {
  if (isDragging) return;
  setModal(true);
};
```

### ❌ Error 4: Performance lenta
**Causa:** Usaste `CSS.Transform` o `filter: brightness()`
```typescript
// ❌ Mal
transform: CSS.Transform.toString(transform)
filter: 'brightness(1.05)'

// ✅ Bien
transform: CSS.Translate.toString(transform)
willChange: isDragging ? 'transform' : undefined
```

---

## 📊 Performance Tips

| Optimización | Código |
|--------------|--------|
| Usar Translate | `CSS.Translate.toString(transform)` |
| willChange | `willChange: isDragging ? 'transform' : undefined` |
| Sin transition durante drag | `transition: isDragging ? undefined : transition` |
| Sin filter | ❌ No usar `filter: brightness()` |
| touchAction solo en handle | `style={{ touchAction: 'none' }}` en botón |

---

## 🎯 Resultado Esperado

✅ Drag solo desde handle  
✅ Modales bloqueados durante drag  
✅ Movimiento solo vertical  
✅ No sale de ventana  
✅ 90% menos re-renders  
✅ Performance fluida en mobile  

---

## 📚 Documentación Completa

- [DND_INTEGRATION.md](./DND_INTEGRATION.md) - Guía completa
- [DND_SUMMARY.md](./DND_SUMMARY.md) - Resumen ejecutivo
- [DND_EXAMPLES.tsx](./DND_EXAMPLES.tsx) - Ejemplos de código
- [DND_BEFORE_AFTER.md](./DND_BEFORE_AFTER.md) - Comparación

---

**Última actualización:** 2025-11-25
