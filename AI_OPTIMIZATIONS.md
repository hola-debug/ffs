# Optimizaciones Aplicadas a AI.json

## Fecha: 2025-11-13

## Cambios Realizados

### 1. **Descripciones de Tools (Eliminación de Ambigüedades)**

#### Tool: Create Account
- **Antes:** "Crear una nueva cuenta bancaria, billetera o efectivo"
- **Después:** "Crear nueva cuenta bancaria, billetera, efectivo, cripto u otra. Usar cuando el usuario mencione agregar dinero a una cuenta que no existe en el contexto."
- **Mejora:** Clarifica cuándo debe usarse la herramienta y amplía los tipos de cuenta

#### Tool: Create Category
- **Antes:** "Crear una nueva categoría de ingreso, gasto o ahorro"
- **Después:** "Crear nueva categoria para clasificar ingresos, gastos fijos, ahorros o gastos de bolsa. Usar cuando el usuario mencione una categoria que no existe en el contexto."
- **Mejora:** Especifica los tipos exactos y cuándo crear

#### Tool: Create Pocket
- **Antes:** "Crear una bolsa de gasto o ahorro"
- **Después:** "Crear bolsa para gestionar gastos recurrentes o metas de ahorro con duracion especifica. Requiere nombre, tipo (expense o saving), monto asignado, y fechas de inicio y fin. Usar cuando el usuario solicite crear una bolsa nueva."
- **Mejora:** Lista explícitamente los datos requeridos y el propósito

#### Tool: Create Movement
- **Antes:** "Registrar cualquier movimiento: ingreso, gasto fijo, ahorro, asignación a bolsa, gasto desde bolsa"
- **Después:** "Registrar movimiento financiero de cualquier tipo (income, fixed_expense, saving_deposit, pocket_allocation, pocket_expense, pocket_return). Validar que existan las dependencias requeridas antes de usar (account_id para ingresos, category_id para gastos y ahorros, pocket_id para operaciones de bolsa)."
- **Mejora:** Enumera tipos exactos y valida dependencias antes de usar

#### Tool: Update Pocket
- **Antes:** "Actualizar una bolsa existente (cambiar nombre, monto, fechas, etc)"
- **Después:** "Actualizar propiedades de una bolsa existente (nombre, monto asignado, fecha de fin, estado). Requiere el ID de la bolsa del contexto. Usar cuando el usuario solicite modificar una bolsa."
- **Mejora:** Especifica qué propiedades puede actualizar y el requisito del ID

#### Tool: Think
- **Antes:** "Razonamiento interno para operaciones complejas: cálculos multi-paso, búsqueda de IDs en contextos grandes, o planificación de múltiples acciones. No modifica la base de datos."
- **Después:** "Usar para razonamiento interno en operaciones complejas: planificar secuencia de multiples acciones, buscar IDs especificos en arrays grandes del contexto, o desglosar logica compleja. No modifica datos, solo ayuda a pensar."
- **Mejora:** Lenguaje más claro sobre su propósito

### 2. **Inputs de Tools (Delegación a Calculator)**

#### Amount field en Create Movement
- **Antes:** "Monto del movimiento (número mayor a 0)"
- **Después:** "Monto del movimiento en numero decimal. Si requiere calculos usar Calculator primero."
- **Mejora:** Instruye explícitamente a usar Calculator para operaciones aritméticas

## Próximos Pasos Sugeridos

### Optimizaciones del Prompt Principal (Pendientes)

El prompt principal en `text` y `systemMessage` aún contiene:

1. **Referencias a cálculos matemáticos** que deberían delegarse a Calculator:
   - "CALCULA porcentajes cuando los mencione"
   - Ejemplos con fórmulas: `available_balance * 0.20`
   - "la mitad de mi cuenta banco → account.balance / 2"

2. **Ambigüedades en la interpretación**:
   - Múltiples secciones que repiten las mismas reglas
   - Instrucciones contradictorias sobre brevedad

3. **Formato de respuesta**:
   - Ejemplos con backticks que luego prohíbe usar
   - Límite de "máximo 15 palabras" muy restrictivo

### Recomendaciones para el Prompt

**Sección de Cálculos:**
```
### CÁLCULOS NUMÉRICOS

**Usa la herramienta Calculator para:**
- Porcentajes (ejemplo: 20% de disponible)
- Divisiones (ejemplo: la mitad de una cuenta)
- Conversiones de moneda
- Cualquier operación aritmética

**Proceso:**
1. Identificar el valor base del contexto
2. Usar Calculator con la operación necesaria
3. Usar el resultado en la herramienta correspondiente
```

**Eliminar fórmulas matemáticas:**
- NO: "20% de mi disponible → `available_balance * 0.20`"
- SÍ: "20% de mi disponible → Usar Calculator con available_balance y multiplicar por 0.20"

## Beneficios de las Optimizaciones

1. **Claridad**: Las tools ahora tienen descripciones precisas sobre cuándo y cómo usarlas
2. **Separación de responsabilidades**: Calculator tool maneja operaciones matemáticas
3. **Menos ambigüedad**: Instrucciones específicas en lugar de genéricas
4. **Mejor validación**: Se especifican dependencias y requisitos antes de ejecutar

## Archivo de Backup

Se creó un backup del archivo original en:
```
/home/fran/Documents/DTE/ffs.finance/AI.json.backup
```

## Testing Recomendado

Probar los siguientes casos:

1. **Porcentajes**: "asigna el 20% de mi disponible a una bolsa"
2. **Creación con dependencias**: "gasté 1000 en Netflix" (debe crear categoría primero)
3. **Búsqueda en contexto**: "cuánto tengo en mi cuenta Santander"
4. **Operaciones complejas**: "crea bolsa con la mitad de mi disponible para gastos del mes"
