# Arquitectura Modular del Dashboard

## Estructura similar a la imagen de referencia

La nueva arquitectura está diseñada siguiendo el principio de **componentes modulares independientes**, similar a la imagen que mostraste, donde cada tarjeta/bloque es un complemento independiente.

## 📁 Estructura de directorios

```
src/
├── components/
│   ├── modules/
│   │   ├── BaseCard.tsx          # Componente base reutilizable
│   │   ├── index.ts              # Exportaciones centralizadas
│   │   ├── README.md             # Documentación de módulos
│   │   ├── DailyBalance/
│   │   │   └── index.tsx
│   │   ├── DailyExpenses/
│   │   │   └── index.tsx
│   │   ├── Savings/
│   │   │   └── index.tsx
│   │   ├── MonthlyIncome/
│   │   │   └── index.tsx
│   │   ├── DayCounter/
│   │   │   └── index.tsx
│   │   └── RandomExpenses/
│   │       └── index.tsx
```

## 🎯 Ventajas de esta arquitectura

### 1. **Modularidad**
Cada módulo es independiente y encapsulado:
- Puede desarrollarse por separado
- Fácil de testear individualmente
- Reduce acoplamiento entre componentes

### 2. **Reutilización**
El componente `BaseCard` proporciona estilos base:
```tsx
<BaseCard variant="gradient" title="Mi Módulo">
  {/* contenido */}
</BaseCard>
```

Variantes disponibles:
- `default` - Gris oscuro (por defecto)
- `gradient` - Gradiente azul
- `primary` - Azul sólido
- `success` - Verde
- `warning` - Amarillo/naranja
- `danger` - Rojo

### 3. **Escalabilidad**
Para agregar un nuevo módulo:

```tsx
// 1. Crear carpeta: src/components/modules/NuevoModulo/

// 2. Crear index.tsx
export function NuevoModuloModule({ data }) {
  return (
    <BaseCard variant="primary" title="Nuevo Módulo">
      <div className="text-6xl font-bold">
        {data.valor}
      </div>
    </BaseCard>
  );
}

// 3. Exportar en modules/index.ts
export { NuevoModuloModule } from './NuevoModulo';

// 4. Usar en DashboardPage.tsx
import { NuevoModuloModule } from '../components/modules';

<NuevoModuloModule data={data.nuevo} />
```

### 4. **Mantenibilidad**
- Cada módulo tiene su propia lógica
- Los cambios en un módulo no afectan otros
- Fácil identificar dónde hacer cambios

## 🎨 Diseño consistente con la imagen

Los módulos replican el estilo de la imagen:
- **Tarjetas con bordes redondeados**
- **Fondos de colores diferenciados**
- **Tipografía grande y legible**
- **Botones de acción prominentes**
- **Información organizada jerárquicamente**

## 🔧 Uso en Dashboard

```tsx
import { 
  DailyBalanceModule,
  DailyExpensesModule,
  SavingsModule,
  MonthlyIncomeModule,
  DayCounterModule,
  RandomExpensesModule
} from '../components/modules';

<div className="grid grid-cols-2 gap-3">
  <DailyBalanceModule data={data.dailySpendable} />
  <DailyExpensesModule 
    data={data.todayExpenses}
    accounts={data.accounts}
    categories={data.categories}
    onRefresh={data.refetch}
  />
  <SavingsModule data={data.savingsTotal} onRefresh={data.refetch} />
  <MonthlyIncomeModule data={data.monthSummary} />
  <DayCounterModule />
  <RandomExpensesModule
    data={data.randomExpenses}
    accounts={data.accounts}
    categories={data.categories}
    onRefresh={data.refetch}
  />
</div>
```

## 📋 Módulos disponibles

| Módulo | Descripción | Props requeridas |
|--------|-------------|------------------|
| `DailyBalanceModule` | Saldo diario disponible | `data` |
| `DailyExpensesModule` | Gastos del día con botón de agregar | `data`, `accounts`, `categories`, `onRefresh` |
| `SavingsModule` | Ahorros totales con desglose | `data`, `onRefresh` |
| `MonthlyIncomeModule` | Ingreso mensual | `data` |
| `DayCounterModule` | Día actual del mes | - |
| `RandomExpensesModule` | Gastos aleatorios/extras | `data`, `accounts`, `categories`, `onRefresh` |

## 🎯 Próximos pasos

### Expansiones sugeridas:

1. **Agregar tipos específicos por módulo**
```
DailyBalance/
├── index.tsx
├── types.ts      # Tipos específicos
└── hooks.ts      # Hooks del módulo
```

2. **Agregar configuración por módulo**
```tsx
// config.ts
export const MODULE_CONFIG = {
  title: 'Saldo Diario',
  refreshInterval: 30000,
  showIcon: true
};
```

3. **Sistema de plugins**
Permitir que los módulos se registren dinámicamente:
```tsx
const modules = [
  { id: 'balance', component: DailyBalanceModule, order: 1 },
  { id: 'expenses', component: DailyExpensesModule, order: 2 },
  // ...
];
```

4. **Personalización por usuario**
Permitir que el usuario ordene o muestre/oculte módulos

## 🔨 Personalización de BaseCard

Si necesitas estilos personalizados para un módulo específico:

```tsx
<BaseCard 
  variant="gradient"
  className="min-h-[300px] hover:scale-105 transition-transform"
>
  {/* contenido */}
</BaseCard>
```

## 📚 Comparación con la imagen

**Similitudes implementadas:**
✅ Tarjetas independientes y modulares
✅ Grid de 2 columnas fijas en todos los dispositivos (igual que la imagen)
✅ Colores diferenciados por tipo de información
✅ Números grandes y legibles
✅ Botones de acción claros
✅ Información complementaria en texto pequeño

**Diferencias:**
- La imagen usa específicamente verde brillante (#00FF00 aprox)
- Podrías agregar más detalles visuales (iconos, gráficos)
- Podrías agregar animaciones de transición

## 🎨 Ajustar colores para coincidir exactamente

Si quieres que coincida más con la imagen:

```tsx
// En BaseCard.tsx, ajustar variantStyles:
const variantStyles = {
  default: 'bg-black',
  gradient: 'bg-black',
  success: 'bg-green-500',  // Verde brillante como la imagen
  primary: 'bg-blue-600',
  // ...
};
```

---

**¡La arquitectura está lista para usar y expandir!** 🚀
