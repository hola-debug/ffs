# Guía de Integración - PocketEditor

## 📋 Resumen
El nuevo `PocketEditor` está completamente modularizado en:
- **Create**: Wizard de 3 pasos para crear bolsas
- **Edit**: Formulario directo para editar bolsas existentes

---

## 🎯 PASO 1: Actualizar el archivo que lista bolsas

Por ejemplo, en `src/components/modules/SavingPockets/index.tsx` o similar:

### Antes:
```javascript
import { BaseCard } from '../BaseCard';
import { useNavigate } from 'react-router-dom';

export function SavingPocketsModule({ pockets }: SavingPocketsModuleProps) {
  const navigate = useNavigate();
  
  return (
    // ... código existente sin edición
  );
}
```

### Después:
```javascript
import { useState } from 'react';  // ← AGREGAR
import { BaseCard } from '../BaseCard';
import { useNavigate } from 'react-router-dom';
import PocketEditor from '../../modals/PocketEditor/PocketEditor';  // ← AGREGAR

export function SavingPocketsModule({ pockets }: SavingPocketsModuleProps) {
  const navigate = useNavigate();
  
  // ← AGREGAR ESTOS ESTADOS
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [selectedPocket, setSelectedPocket] = useState(null);

  // ← AGREGAR: Crear nueva bolsa
  const handleCreateNew = () => {
    setEditorMode('create');
    setSelectedPocket(null);
    setIsEditorOpen(true);
  };

  // ← AGREGAR: Editar bolsa existente
  const handleEditPocket = (pocket) => {
    setEditorMode('edit');
    setSelectedPocket(pocket);
    setIsEditorOpen(true);
  };

  // ← AGREGAR: Al completar la acción
  const handleEditorSuccess = () => {
    // Aquí recargar la lista de pockets
    // Ej: refetch(), setReload(!reload), etc.
  };
  
  return (
    <>
      {/* ← AGREGAR: Botón crear nueva bolsa */}
      <button 
        onClick={handleCreateNew}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        + Nueva Bolsa
      </button>

      <BaseCard className="col-span-2">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🐷</span>
            <h3 className="text-lg font-bold text-white/90">Bolsas de Ahorro</h3>
          </div>

          {/* Pockets Grid */}
          <div className="grid gap-3">
            {pockets.map((pocket) => {
              // ... código existente ...
              
              return (
                <div
                  key={pocket.id}
                  className="group relative bg-white/5..."
                >
                  {/* ← AGREGAR: Botón editar (opcional, como hover) */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPocket(pocket);
                      }}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                    >
                      Editar
                    </button>
                  </div>

                  {/* ... resto del contenido existente ... */}
                </div>
              );
            })}
          </div>
        </div>
      </BaseCard>

      {/* ← AGREGAR: Modal del PocketEditor */}
      <PocketEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSuccess={handleEditorSuccess}
        mode={editorMode}
        pocket={selectedPocket}
      />
    </>
  );
}
```

---

## 🎯 PASO 2: Recargar datos después de crear/editar

En `handleEditorSuccess()`, implementa UNA de estas opciones:

### Opción A: Si usas un hook personalizado (recomendado)
```javascript
const { pockets, refetch } = usePockets(); // tu hook

const handleEditorSuccess = () => {
  refetch(); // Recarga los datos desde Supabase
};
```

### Opción B: Si usas useState
```javascript
const [refresh, setRefresh] = useState(0);

const handleEditorSuccess = () => {
  setRefresh(prev => prev + 1); // Fuerza re-renderizado
};

// En el useEffect que carga las bolsas:
useEffect(() => {
  fetchPockets();
}, [refresh]);
```

### Opción C: Si usas React Query
```javascript
const { refetch } = useQuery('pockets', fetchPockets);

const handleEditorSuccess = () => {
  refetch();
};
```

---

## 📱 PASO 3: Estructura visual recomendada

### Con botón "Crear" en la parte superior
```
┌─────────────────────────┐
│ + Nueva Bolsa [Botón]   │  ← handleCreateNew()
├─────────────────────────┤
│ 🐷 Bolsas de Ahorro     │
│                         │
│ [Bolsa 1] [Editar 🎯]   │  ← handleEditPocket(pocket1)
│ [Bolsa 2] [Editar 🎯]   │  ← handleEditPocket(pocket2)
│ [Bolsa 3] [Editar 🎯]   │  ← handleEditPocket(pocket3)
└─────────────────────────┘
```

### Con botón "+" flotante
```
┌─────────────────────────┐
│ 🐷 Bolsas de Ahorro     │
│                         │
│ [Bolsa 1] [Editar]      │
│ [Bolsa 2] [Editar]      │
│ [Bolsa 3] [Editar]      │
│                    [+] ← handleCreateNew()
└─────────────────────────┘
```

---

## 🔄 FLUJO COMPLETO

```
Usuario hace clic en "+ Nueva"
    ↓
handleCreateNew()
    ↓
setEditorMode('create')
    ↓
PocketEditor renderiza → PocketCreateWizard
    ↓
Paso 1: Selecciona tipo (saving/expense/debt)
    ↓
Paso 2: Selecciona subtype (si es expense)
    ↓
Paso 3: Rellena campos (nombre, emoji, monto, etc.)
    ↓
Click "Crear" → usePocketSubmit.submit()
    ↓
Validación → INSERT en Supabase
    ↓
onSuccess() → handleEditorSuccess()
    ↓
Recarga datos
    ↓
Modal cierra
```

---

## ✅ CHECKLIST DE INTEGRACIÓN

- [ ] Importar `useState` en el componente
- [ ] Importar `PocketEditor` desde `'../../modals/PocketEditor/PocketEditor'`
- [ ] Agregar estados: `isEditorOpen`, `editorMode`, `selectedPocket`
- [ ] Crear función `handleCreateNew()`
- [ ] Crear función `handleEditPocket(pocket)`
- [ ] Crear función `handleEditorSuccess()`
- [ ] Agregar botón "+ Nueva Bolsa"
- [ ] Agregar botón "Editar" en cada bolsa
- [ ] Agregar componente `<PocketEditor />` al final
- [ ] Implementar recarga de datos en `handleEditorSuccess()`
- [ ] Testear: crear nueva bolsa
- [ ] Testear: editar bolsa existente
- [ ] Testear: cancelar sin guardar

---

## 🐛 PROBLEMAS COMUNES

### "El modal no se cierra"
→ Asegúrate de que `handleEditorSuccess()` llama a `setIsEditorOpen(false)` internamente, O configura `onClose` correctamente.

### "Los datos no se actualizan"
→ Verifica que `handleEditorSuccess()` realmente recarga los datos (refetch, setState, etc).

### "Tipos TypeScript no coinciden"
→ Asegúrate de que `pocket` tiene la estructura de `Pocket` del tipo importado.

---

## 📞 SOPORTE

Ubicación del PocketEditor:
```
src/components/modals/PocketEditor/
├── PocketEditor.tsx (entrada principal)
├── Create/
│   ├── PocketCreateWizard.tsx
│   └── steps/
├── Edit/
│   └── PocketEditForm.tsx
└── fields/
    ├── CommonFields.tsx
    └── subtypes/
```

Cualquier duda, revisar estos archivos.
