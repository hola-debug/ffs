# DAILY ALLOWANCE - Setup Completo

Panel de finanzas personales con React, TypeScript, Supabase y Tailwind CSS.

## 📋 Pre-requisitos

- Node.js 18+ instalado
- Cuenta en [Supabase](https://supabase.com) (gratis)
- Cuenta en [Vercel](https://vercel.com) (opcional, para deploy)

---

## 🚀 Instalación Local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase

#### A. Crear proyecto en Supabase

1. Ingresá a [supabase.com](https://supabase.com)
2. Creá un nuevo proyecto
3. Esperá a que termine de configurarse (1-2 minutos)

#### B. Ejecutar el schema SQL

1. En el panel de Supabase, andá a **SQL Editor**
2. Abrí el archivo `supabase-schema.sql` de este proyecto
3. Copiá **todo** el contenido
4. Pegalo en el editor SQL de Supabase
5. Clickeá **RUN** o presioná `Ctrl+Enter`

Esto va a crear:
- Todas las tablas (accounts, transactions, categories, etc.)
- Vistas optimizadas (vw_daily_spendable, vw_month_summary, etc.)
- Políticas RLS para seguridad
- Trigger para auto-crear profiles

#### C. Obtener credenciales

1. Andá a **Settings → API** en Supabase
2. Copiá:
   - **Project URL** (ej: `https://abc123.supabase.co`)
   - **anon public** key (la larga)

### 3. Configurar variables de entorno

Creá un archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Editá `.env` y pegá tus credenciales:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

Abrí [http://localhost:5173](http://localhost:5173)

---

## 🎯 Primer Uso

### 1. Crear cuenta

1. Abrí la app
2. Clickeá en "¿No tenés cuenta? Registrate"
3. Ingresá email y contraseña
4. **IMPORTANTE**: Revisá tu email para confirmar la cuenta

### 2. Insertar datos iniciales

Una vez logueado, ejecutá estos SQL en Supabase para tener datos de prueba.

Andá a **SQL Editor** y ejecutá cada bloque:

```sql
-- Crear cuenta principal
INSERT INTO accounts (user_id, name, type, currency, is_primary)
VALUES (auth.uid(), 'Efectivo', 'cash', 'UYU', true);

-- Crear categorías
INSERT INTO categories (user_id, name, kind) VALUES
(auth.uid(), 'Supermercado', 'variable'),
(auth.uid(), 'Transporte', 'variable'),
(auth.uid(), 'Alquiler', 'fixed'),
(auth.uid(), 'Sueldo', 'income'),
(auth.uid(), 'Salidas', 'random');

-- Crear vault de ahorro
INSERT INTO savings_vaults (user_id, name, currency, target_amount)
VALUES (auth.uid(), 'Ahorro USD', 'USD', 5000);

-- Plan mensual (ajustá los valores)
INSERT INTO monthly_plan (user_id, month, year, planned_income, planned_fixed_expenses, planned_savings)
VALUES (
  auth.uid(),
  EXTRACT(MONTH FROM CURRENT_DATE),
  EXTRACT(YEAR FROM CURRENT_DATE),
  100000,  -- Ingresos planeados
  30000,   -- Gastos fijos
  20000    -- Ahorro objetivo
);

-- Ejemplo de ingreso
INSERT INTO transactions (user_id, account_id, type, amount, currency, date, notes)
SELECT
  auth.uid(),
  id,
  'income',
  100000,
  'UYU',
  CURRENT_DATE,
  'Sueldo mes'
FROM accounts
WHERE user_id = auth.uid() AND is_primary = true
LIMIT 1;

-- Ejemplo de gasto fijo
INSERT INTO transactions (user_id, account_id, category_id, type, amount, currency, date, is_fixed, notes)
SELECT
  auth.uid(),
  a.id,
  c.id,
  'expense',
  20000,
  'UYU',
  CURRENT_DATE,
  true,
  'Alquiler'
FROM accounts a, categories c
WHERE a.user_id = auth.uid() AND a.is_primary = true
  AND c.user_id = auth.uid() AND c.name = 'Alquiler'
LIMIT 1;
```

### 3. Recargar la app

Presioná F5 y deberías ver tus datos en el dashboard.

---

## 📦 Deploy en Vercel

### 1. Subir a GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/ffs-finance.git
git push -u origin main
```

### 2. Conectar con Vercel

1. Andá a [vercel.com](https://vercel.com)
2. Clickeá **Import Project**
3. Seleccioná tu repo de GitHub
4. En **Environment Variables**, agregá:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Clickeá **Deploy**

Listo, tu app está en producción 🚀

---

## 🏗️ Estructura del Proyecto

```
ffs.finance/
├── src/
│   ├── components/       # Tarjetas y modales
│   ├── contexts/         # Auth context
│   ├── hooks/            # Hooks personalizados
│   ├── lib/              # Supabase client + types
│   ├── pages/            # Login y Dashboard
│   ├── App.tsx           # Router principal
│   ├── main.tsx          # Entry point
│   └── index.css         # Estilos globales
├── supabase-schema.sql   # Schema completo de DB
├── .env.example          # Template de env vars
└── package.json
```

---

## 🔑 Características Principales

### Panel Dashboard

- **Saldo diario**: Cuánto podés gastar hoy (calculado automáticamente)
- **Gastos diarios**: Gastos de hoy + agregar nuevo
- **Ahorro total**: Por moneda (USD, UYU, etc.)
- **Ingreso mes**: Total ingresado en el mes actual
- **Día del mes**: Número grande del día actual
- **Gastos random**: Gastos no planificados del mes

### Cálculo Inteligente

La vista `vw_daily_spendable` calcula:

```
Disponible = Ingresos del mes - Gastos fijos - Ahorro objetivo
Saldo diario = Disponible / Días restantes del mes
Saldo disponible hoy = Saldo diario - Gastos de hoy
```

---

## 🛠️ Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

---

## 📝 Próximos Pasos

Ideas para extender el proyecto:

- [ ] Agregar gráficos con Recharts
- [ ] Histórico de gastos por mes
- [ ] Exportar a CSV/Excel
- [ ] Notificaciones push con PWA
- [ ] Modo offline con Service Workers
- [ ] Multi-moneda con conversión automática
- [ ] Presupuestos por categoría
- [ ] Escaneo de facturas con IA

---

## 🐛 Troubleshooting

### Error: "Faltan las variables de entorno de Supabase"

Asegurate de tener el archivo `.env` en la raíz con las variables correctas.

### Error en las vistas SQL

Si las vistas devuelven datos vacíos, asegurate de haber insertado al menos:
1. Una cuenta (accounts)
2. Una transacción de ingreso (transactions type='income')

### No veo datos en el dashboard

1. Verificá que ejecutaste el SQL de datos iniciales
2. Verificá que tu usuario está logueado (mirá la consola del navegador)
3. Abrí las DevTools → Network y chequeá que las queries a Supabase devuelvan 200

---

## 📄 Licencia

MIT - Hacé lo que quieras con este código.

---

**¡Éxito con tus finanzas! 💰**
