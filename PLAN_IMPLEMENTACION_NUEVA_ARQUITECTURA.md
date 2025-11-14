# 🚀 Plan de Implementación - Nueva Arquitectura de Tipos y Subtipos

**Fecha:** 2025-11-14  
**Commit Base:** c592c1e6b1437b9497a81b917caab4327501054e  
**Tiempo Estimado Total:** 60-90 minutos

---

## 📊 RESUMEN EJECUTIVO

### ¿Qué vamos a hacer?

Migrar completamente el sistema de bolsas (pockets) a la nueva arquitectura que incluye:

1. **Base de datos:** Soporte para múltiples divisas por cuenta + subtipos de expense
2. **Tipos TypeScript:** Sistema completo de tipos con type guards
3. **Modales:** Componente único `PocketEditor` que reemplaza múltiples modales
4. **Módulos:** Actualizar todos los módulos del dashboard para manejar subtipos
5. **Lógica:** Implementar cálculos automáticos y renderizado condicional

### Cambios Principales

| Aspecto | Antes | Después |
|---------|-------|---------|
| Tipos de bolsas | 2 (`expense`, `saving`) | 3 (`expense`, `saving`, `debt`) |
| Subtipos de expense | Ninguno | 4 (`period`, `recurrent`, `fixed`, `shared`) |
| Divisas por cuenta | 1 fija | Múltiples con `account_currencies` |
| Tipos de cuenta | 5 básicos | 6 (`bank`, `fintech`, `cash`, `crypto`, `investment`, `other`) |
| Movement types | 6 | 9 (+ `debt_payment`, `debt_interest`, `fixed_expense_auto`) |
| Modales de bolsas | 2 (`CreatePocketModal`, `AddExpenseModal`) | 1 (`PocketEditor`) |

---

## 🎯 OBJETIVOS POR FASE

### FASE 1: Base de Datos (5-10 min)
✅ Ejecutar migración SQL completa  
✅ Verificar estructura de tablas  
✅ Probar vistas y funciones  

### FASE 2: Sistema de Tipos (5 min)
✅ Reemplazar `types.ts` con versión nueva  
✅ Verificar compilación TypeScript  
✅ Eliminar referencias a tipos obsoletos  

### FASE 3: PocketEditor (10 min)
✅ Actualizar imports  
✅ Corregir subtipos (eliminar `variable`, agregar `recurrent`)  
✅ Implementar lógica para `recurrent`  
✅ Verificar validaciones  

### FASE 4: Modales Auxiliares (15 min)
✅ AddExpenseModal: Actualizar para subtipos  
✅ AddIncomeModal: Soporte divisas múltiples  
✅ AddAccountModal: Nuevos tipos + divisas  

### FASE 5: Módulos Dashboard (20 min)
✅ ExpensePockets: Renderizado condicional por subtipo  
✅ SavingPockets: Verificar campos nuevos  
✅ DailyBalance: Filtrar subtipos correctos  
✅ PocketProjection: Lógica por subtipo  
✅ TotalMoney, TotalSavings, AccountsBalance: Updates menores  

### FASE 6: Integración Dashboard (5 min)
✅ DashboardPage: Integrar PocketEditor  
✅ modals/index.ts: Exportar PocketEditor  
✅ Deprecar CreatePocketModal  

### FASE 7: Testing & Validación (15-20 min)
✅ Compilación sin errores  
✅ Testing manual completo  
✅ Verificar cálculos automáticos  

---

## 📋 CHECKLIST DETALLADO

### ☑️ FASE 1: BASE DE DATOS

#### 1.1 Ejecutar Migración SQL
- [ ] Abrir Supabase Dashboard → SQL Editor
- [ ] Copiar contenido de `supabase/migrations/003_refactor_pockets_with_divisas_and_subtypes.sql`
- [ ] Ejecutar (Run)
- [ ] Verificar mensaje de éxito
- [ ] **Archivo afectado:** Ninguno (solo BD)

#### 1.2 Verificar Tablas Creadas
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```
- [ ] Confirmar: `account_currencies`, `accounts`, `pockets`, `movements`, `profiles`

#### 1.3 Verificar Vistas
```sql
SELECT viewname FROM pg_views WHERE schemaname = 'public';
```
- [ ] Confirmar: `pocket_summary`, `account_with_currencies`

#### 1.4 Verificar Funciones
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
```
- [ ] Confirmar: `calculate_recommended_contribution`, `calculate_next_payment`

#### 1.5 Verificar Triggers
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```
- [ ] Confirmar: `trg_update_saving_pocket_balance`, `trg_update_expense_pocket_spent`, `trg_update_debt_pocket_remaining`

#### 1.6 Verificar Constraint de Subtipos
```sql
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'pockets_subtype_check';
```
- [ ] Confirmar que incluye: `'period', 'recurrent', 'fixed', 'shared'`

---

### ☑️ FASE 2: SISTEMA DE TIPOS

#### 2.1 Backup del types.ts Actual
- [ ] Ejecutar: `cp src/lib/types.ts src/lib/types-OLD-FINAL-BACKUP.ts`
- [ ] **Archivo creado:** `src/lib/types-OLD-FINAL-BACKUP.ts`

#### 2.2 Reemplazar types.ts
- [ ] Ejecutar: `cp src/lib/types-new.ts src/lib/types.ts`
- [ ] **Archivo modificado:** `src/lib/types.ts`

#### 2.3 Verificar Compilación
- [ ] Ejecutar: `npm run build` (o `tsc --noEmit`)
- [ ] Revisar errores de tipos
- [ ] **Resultado esperado:** Muchos errores (normal, los arreglaremos en siguientes fases)

#### 2.4 Buscar Referencias a Tipos Obsoletos
```bash
grep -r "subtype.*variable" src/ --include="*.ts" --include="*.tsx"
grep -r "type.*wallet" src/ --include="*.ts" --include="*.tsx"
```
- [ ] Anotar archivos que usan `'variable'` o `'wallet'`
- [ ] **Archivos a revisar:** (se completará durante búsqueda)

---

### ☑️ FASE 3: POCKETEDITOR

#### 3.1 Actualizar Imports
- [ ] **Archivo:** `src/components/modals/PocketEditor.tsx`
- [ ] Cambiar línea 17: `from '../../lib/types-new'` → `from '../../lib/types'`

#### 3.2 Actualizar EXPENSE_SUBTYPES
- [ ] **Archivo:** `src/components/modals/PocketEditor.tsx`
- [ ] Líneas 33-38: Actualizar array completo
- [ ] Eliminar: `{ value: 'variable', ... }`
- [ ] Agregar: `{ value: 'recurrent', label: 'Recurrente Variable', description: 'Vence cada mes, monto varía' }`

#### 3.3 Implementar Lógica para expense.recurrent
- [ ] **Archivo:** `src/components/modals/PocketEditor.tsx`
- [ ] Agregar states para recurrent (si no existen):
  - `averageAmount`
  - `lastPaymentAmount`
  - `notificationDaysBefore`
- [ ] Agregar caso en `handleSubmit` para `subtype === 'recurrent'`
- [ ] Agregar renderizado de campos en el form

#### 3.4 Actualizar Validaciones
- [ ] Verificar que cada subtipo tenga validaciones correctas
- [ ] `period`: requiere `allocated_amount`, `starts_at`, `ends_at`
- [ ] `recurrent`: requiere `average_amount`, `due_day`
- [ ] `fixed`: requiere `monthly_amount`, `due_day`

#### 3.5 Eliminar Referencias a 'variable'
- [ ] Buscar y reemplazar todas las referencias a `'variable'` por lógica de `'period'`
- [ ] Línea 72-77: Actualizar lógica de `allocatedAmount`

---

### ☑️ FASE 4: MODALES AUXILIARES

#### 4.1 AddExpenseModal.tsx
- [ ] **Archivo:** `src/components/modals/AddExpenseModal.tsx`
- [ ] Línea 4: Actualizar import `from '../../lib/types'`
- [ ] Verificar que funcione con todos los subtipos
- [ ] Opcional: Mostrar subtipo en el selector de bolsas

#### 4.2 AddIncomeModal.tsx
- [ ] **Archivo:** `src/components/modals/AddIncomeModal.tsx`
- [ ] Actualizar imports
- [ ] Agregar selector de divisa al registrar ingreso
- [ ] Consultar divisas disponibles de la cuenta seleccionada
- [ ] Usar `account_with_currencies` vista o query manual

#### 4.3 AddAccountModal.tsx
- [ ] **Archivo:** `src/components/modals/AddAccountModal.tsx`
- [ ] Actualizar selector de tipo de cuenta:
  - Opciones: `bank`, `fintech`, `cash`, `crypto`, `investment`, `other`
- [ ] Agregar selector de divisas (múltiple)
- [ ] Insertar en `account_currencies` al crear cuenta
- [ ] Marcar primera divisa como `is_primary: true`

---

### ☑️ FASE 5: MÓDULOS DASHBOARD

#### 5.1 ExpensePockets/index.tsx
- [ ] **Archivo:** `src/components/modules/ExpensePockets/index.tsx`
- [ ] Actualizar imports de types
- [ ] Implementar renderizado condicional:
  ```typescript
  if (pocket.subtype === 'period') {
    // Mostrar: días restantes, daily_allowance, progress bar
  } else if (pocket.subtype === 'recurrent') {
    // Mostrar: next_payment, average_amount, notification
  } else if (pocket.subtype === 'fixed') {
    // Mostrar: next_payment, monthly_amount, auto_register status
  }
  ```
- [ ] Usar type guards: `isExpensePeriodPocket()`, etc.

#### 5.2 SavingPockets/index.tsx
- [ ] **Archivo:** `src/components/modules/SavingPockets/index.tsx`
- [ ] Actualizar imports de types
- [ ] Verificar campos usados: `target_amount`, `amount_saved`, `progress_percentage`
- [ ] Opcional: Mostrar `recommended_contribution` de la vista

#### 5.3 DailyBalance/index.tsx
- [ ] **Archivo:** `src/components/modules/DailyBalance/index.tsx`
- [ ] Actualizar imports
- [ ] Filtrar solo bolsas `expense` con subtipo `period` para cálculo diario
- [ ] Excluir `recurrent` y `fixed` del daily balance

#### 5.4 PocketProjection/index.tsx
- [ ] **Archivo:** `src/components/modules/PocketProjection/index.tsx`
- [ ] Actualizar imports
- [ ] Revisar lógica de proyección
- [ ] Implementar proyección diferente por subtipo:
  - `period`: Proyectar hasta `ends_at`
  - `recurrent`: Proyectar próximos 3 meses
  - `fixed`: Proyectar próximos 3 meses

#### 5.5 TotalMoney/index.tsx
- [ ] **Archivo:** `src/components/modules/TotalMoney/index.tsx`
- [ ] Actualizar imports de types
- [ ] Verificar cálculo de totales

#### 5.6 TotalSavings/index.tsx
- [ ] **Archivo:** `src/components/modules/TotalSavings/index.tsx`
- [ ] Actualizar imports de types
- [ ] Verificar cálculo de savings totales

#### 5.7 AccountsBalance/index.tsx
- [ ] **Archivo:** `src/components/modules/AccountsBalance/index.tsx`
- [ ] Actualizar imports de types
- [ ] Opcional: Mostrar divisas múltiples por cuenta

#### 5.8 DailyExpenses/index.tsx
- [ ] **Archivo:** `src/components/modules/DailyExpenses/index.tsx`
- [ ] Actualizar imports
- [ ] Verificar filtros de gastos

---

### ☑️ FASE 6: INTEGRACIÓN DASHBOARD

#### 6.1 Actualizar modals/index.ts
- [ ] **Archivo:** `src/components/modals/index.ts`
- [ ] Agregar: `export { default as PocketEditor } from './PocketEditor';`

#### 6.2 Actualizar DashboardPage.tsx
- [ ] **Archivo:** `src/pages/DashboardPage.tsx`
- [ ] Importar: `import PocketEditor from '../components/modals/PocketEditor';`
- [ ] Reemplazar `<CreatePocketModal>` por:
  ```tsx
  <PocketEditor
    isOpen={activeModal === 'crear-bolsas'}
    mode="create"
    onClose={handleModalClose}
    onSuccess={handleModalSuccess}
  />
  ```
- [ ] Verificar que `activeModal` tenga el valor correcto
- [ ] Opcional: Agregar modo `edit` para editar bolsas existentes

#### 6.3 Deprecar CreatePocketModal
- [ ] **Archivo:** `src/components/modals/CreatePocketModal.tsx`
- [ ] Opción A: Eliminar archivo (recomendado si todo funciona)
- [ ] Opción B: Renombrar a `CreatePocketModal.OLD.tsx` como backup
- [ ] Actualizar `modals/index.ts` si se eliminó el export

---

### ☑️ FASE 7: TESTING & VALIDACIÓN

#### 7.1 Compilación Final
- [ ] Ejecutar: `npm run build`
- [ ] **Resultado esperado:** ✅ 0 errores, 0 warnings
- [ ] Si hay errores, revisar y corregir antes de continuar

#### 7.2 Ejecutar App en Dev
- [ ] Ejecutar: `npm run dev`
- [ ] Abrir navegador en `http://localhost:5173` (o puerto configurado)
- [ ] Verificar que cargue sin errores en consola

#### 7.3 Testing Manual - Cuentas
- [ ] Crear cuenta nueva:
  - Tipo: `bank`
  - Nombre: "Banco Test"
  - Divisas: ARS, USD
- [ ] Verificar que aparezca en `AccountsBalance`
- [ ] Verificar en Supabase que `account_currencies` tenga 2 filas

#### 7.4 Testing Manual - Bolsas de Ahorro
- [ ] Abrir PocketEditor
- [ ] Crear bolsa tipo `saving`:
  - Nombre: "Vacaciones"
  - Target: $50,000
  - Frecuencia: monthly
  - Fecha fin: 3 meses adelante
- [ ] Verificar que aparezca en `SavingPockets`
- [ ] Verificar campos calculados: `progress_percentage`, `recommended_contribution`

#### 7.5 Testing Manual - Bolsas de Gasto (period)
- [ ] Crear bolsa `expense.period`:
  - Nombre: "Comida Noviembre"
  - Monto: $10,000
  - Desde: 01/11/2025
  - Hasta: 30/11/2025
- [ ] Verificar que aparezca en `ExpensePockets`
- [ ] Verificar campos calculados: `daily_allowance`, `days_remaining`

#### 7.6 Testing Manual - Bolsas de Gasto (recurrent)
- [ ] Crear bolsa `expense.recurrent`:
  - Nombre: "Luz"
  - Promedio: $2,500
  - Vence día: 10
  - Notificar: 3 días antes
- [ ] Verificar que aparezca en `ExpensePockets`
- [ ] Verificar campo calculado: `next_payment`

#### 7.7 Testing Manual - Bolsas de Gasto (fixed)
- [ ] Crear bolsa `expense.fixed`:
  - Nombre: "Netflix"
  - Monto mensual: $599
  - Vence día: 15
  - Auto-registrar: ✅
- [ ] Verificar que aparezca en `ExpensePockets`
- [ ] Verificar campo calculado: `next_payment`

#### 7.8 Testing Manual - Bolsas de Deuda
- [ ] Crear bolsa `debt`:
  - Nombre: "Préstamo Personal"
  - Monto original: $50,000
  - Cuotas totales: 12
  - Monto cuota: $4,500
  - Interés: 3%
  - Vence día: 5
- [ ] Verificar que aparezca en módulo de deudas (si existe)
- [ ] Verificar campos: `remaining_amount`, `installment_current`

#### 7.9 Testing Manual - Movimientos
- [ ] Registrar ingreso a cuenta
- [ ] Registrar gasto desde bolsa `period`
- [ ] Verificar que `spent_amount` se actualice automáticamente
- [ ] Verificar que `daily_allowance_remaining` se recalcule

#### 7.10 Testing Manual - Triggers
- [ ] Abrir Supabase → Table Editor → `pockets`
- [ ] Verificar que `spent_amount` coincida con suma de movimientos
- [ ] Crear movimiento manual en `movements` tabla
- [ ] Verificar que trigger actualizó `spent_amount` automáticamente

#### 7.11 Testing Manual - Vistas
- [ ] Ejecutar en SQL Editor:
  ```sql
  SELECT * FROM pocket_summary WHERE user_id = '<tu-user-id>';
  ```
- [ ] Verificar que campos calculados estén correctos
- [ ] Ejecutar:
  ```sql
  SELECT * FROM account_with_currencies WHERE user_id = '<tu-user-id>';
  ```
- [ ] Verificar que muestre currencies como JSON array

#### 7.12 Validación de Cálculos
- [ ] Bolsa `period`: Verificar `daily_allowance = allocated_amount / days_duration`
- [ ] Bolsa `period`: Verificar `days_remaining = ends_at - CURRENT_DATE`
- [ ] Bolsa `recurrent`: Verificar `next_payment = próximo due_day`
- [ ] Bolsa `fixed`: Verificar `next_payment = próximo due_day`
- [ ] Bolsa `saving`: Verificar `progress_percentage = (amount_saved / target_amount) * 100`

---

## 📁 ARCHIVOS MODIFICADOS (RESUMEN)

### Archivos a CREAR
- [ ] `src/lib/types-OLD-FINAL-BACKUP.ts` (backup)
- [ ] `PLAN_IMPLEMENTACION_NUEVA_ARQUITECTURA.md` (este archivo)

### Archivos a MODIFICAR
1. [ ] `src/lib/types.ts` (reemplazar completo)
2. [ ] `src/components/modals/PocketEditor.tsx` (imports + subtipos)
3. [ ] `src/components/modals/AddExpenseModal.tsx` (imports)
4. [ ] `src/components/modals/AddIncomeModal.tsx` (divisas)
5. [ ] `src/components/modals/AddAccountModal.tsx` (tipos + divisas)
6. [ ] `src/components/modals/index.ts` (export PocketEditor)
7. [ ] `src/components/modules/ExpensePockets/index.tsx` (renderizado por subtipo)
8. [ ] `src/components/modules/SavingPockets/index.tsx` (imports)
9. [ ] `src/components/modules/DailyBalance/index.tsx` (filtros)
10. [ ] `src/components/modules/PocketProjection/index.tsx` (lógica subtipos)
11. [ ] `src/components/modules/TotalMoney/index.tsx` (imports)
12. [ ] `src/components/modules/TotalSavings/index.tsx` (imports)
13. [ ] `src/components/modules/AccountsBalance/index.tsx` (imports)
14. [ ] `src/components/modules/DailyExpenses/index.tsx` (imports)
15. [ ] `src/pages/DashboardPage.tsx` (integrar PocketEditor)

### Archivos a DEPRECAR/ELIMINAR (opcional)
- [ ] `src/components/modals/CreatePocketModal.tsx`
- [ ] `src/lib/types-new.ts` (ya se copió a types.ts)
- [ ] `src/lib/types-old-backup.ts` (si existe de antes)

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### Backup Antes de Empezar
```bash
# Crear rama de backup
git checkout -b backup-before-arquitectura-nueva
git add .
git commit -m "Backup antes de implementar nueva arquitectura"

# Crear rama de trabajo
git checkout -b feature/nueva-arquitectura-subtipos
```

### Durante la Implementación
1. **Compilar frecuentemente:** Ejecutar `npm run build` después de cada fase
2. **Commits incrementales:** Hacer commit después de cada fase completada
3. **Testing continuo:** Probar en navegador después de cambios importantes
4. **Consola de navegador:** Mantener DevTools abiertos para ver errores

### Si Algo Sale Mal
```bash
# Revertir a backup
git checkout backup-before-arquitectura-nueva

# O revertir archivo específico
git checkout HEAD -- src/path/to/file.tsx
```

### Base de Datos
- **No hay rollback fácil:** La migración SQL borra tablas. Hacer backup manual de Supabase antes de ejecutar
- **Backup de Supabase:** Dashboard → Database → Backups → Create backup

---

## 🎓 REFERENCIAS

### Documentación Creada
- `ARCHIVOS_CREADOS.md` - Inventario de archivos nuevos
- `ARQUITECTURA-SUBTIPOS-GASTOS.md` - Explicación detallada de subtipos
- `GUIA_MIGRACION_NUEVA_BD.md` - Guía paso a paso de migración BD
- `GUIA_MIGRACION_SUBTIPOS.md` - Migración específica de subtipos
- `README_NUEVA_ARQUITECTURA.md` - Resumen ejecutivo
- `RESUMEN_CAMBIOS.md` - Qué cambió y por qué

### Migración SQL
- `supabase/migrations/003_refactor_pockets_with_divisas_and_subtypes.sql`

### Tipos Nuevos
- `src/lib/types-new.ts` (será copiado a `types.ts`)

### Componente Principal
- `src/components/modals/PocketEditor.tsx`

---

## ✅ CRITERIOS DE ÉXITO

### Compilación
- ✅ `npm run build` sin errores
- ✅ `npm run dev` ejecuta sin errores
- ✅ No hay warnings de TypeScript

### Funcionalidad
- ✅ Crear cuenta con múltiples divisas
- ✅ Crear bolsas de todos los tipos: `saving`, `expense.period`, `expense.recurrent`, `expense.fixed`, `debt`
- ✅ Registrar ingresos con selector de divisa
- ✅ Registrar gastos desde bolsas
- ✅ Ver todas las bolsas en dashboard

### Cálculos Automáticos
- ✅ `daily_allowance` se calcula correctamente para `period`
- ✅ `next_payment` se calcula correctamente para `recurrent` y `fixed`
- ✅ `progress_percentage` se calcula correctamente para `saving`
- ✅ `spent_amount` se actualiza con trigger al crear movimiento
- ✅ `remaining_amount` se calcula correctamente para `debt`

### UI/UX
- ✅ PocketEditor muestra campos correctos según tipo/subtipo
- ✅ ExpensePockets renderiza diferentes cards por subtipo
- ✅ No hay referencias visuales a tipos obsoletos (`variable`, `wallet`)
- ✅ Validaciones funcionan correctamente

---

## 📊 TIEMPO ESTIMADO POR FASE

| Fase | Descripción | Tiempo Estimado |
|------|-------------|-----------------|
| 1 | Base de Datos | 5-10 min |
| 2 | Sistema de Tipos | 5 min |
| 3 | PocketEditor | 10 min |
| 4 | Modales Auxiliares | 15 min |
| 5 | Módulos Dashboard | 20 min |
| 6 | Integración Dashboard | 5 min |
| 7 | Testing & Validación | 15-20 min |
| **TOTAL** | | **75-85 min** |

Con imprevistos y debugging: **90-120 min**

---

## 🚀 PRÓXIMOS PASOS (POST-IMPLEMENTACIÓN)

### Mejoras Futuras
1. [ ] Implementar auto-registro de `expense.fixed` con cron job
2. [ ] Implementar notificaciones para `expense.recurrent`
3. [ ] Agregar módulo específico para deudas
4. [ ] Implementar edición de bolsas con PocketEditor en modo `edit`
5. [ ] Agregar gráficos de proyección por subtipo
6. [ ] Implementar `expense.shared` (gastos compartidos)
7. [ ] Agregar sincronización bancaria

### Optimizaciones
1. [ ] Índices adicionales en BD si hay queries lentas
2. [ ] Caché de vistas calculadas
3. [ ] Lazy loading de módulos

---

**¡Todo listo para empezar! 🎉**

Usa este plan como guía y marca cada checkbox al completar cada tarea.
