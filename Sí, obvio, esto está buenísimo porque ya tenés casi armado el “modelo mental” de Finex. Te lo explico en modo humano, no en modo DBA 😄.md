Sí, obvio, esto está buenísimo porque ya tenés casi armado el “modelo mental” de Finex. Te lo explico en modo humano, no en modo DBA 😄

1. Capas de la base de datos

Tenés tres “mundos”:

auth → todo lo que es login, sesiones, MFA, OAuth, etc. (lo maneja Supabase).

public → tu aplicación: cuentas, bolsas, movimientos, resúmenes, etc.

storage → archivos que subas (buckets, objetos, multipart uploads).

Lo que a vos más te importa para lógica de negocio es el schema public, pero te explico todo rápido.

2. Schema auth (Supabase Auth)

Acá están las relaciones típicas que arma Supabase:

auth.users → el usuario “real” de autenticación.

auth.identities → identidades externas (Google, etc.)

identities.user_id → users.id (ON DELETE CASCADE)

auth.sessions → sesiones activas del usuario

sessions.user_id → users.id

sessions.oauth_client_id → oauth_clients.id

auth.mfa_factors, auth.mfa_challenges, auth.mfa_amr_claims → todo lo de MFA

Siempre anclado a users o sessions, con ON DELETE CASCADE.

auth.oauth_clients, auth.oauth_authorizations, auth.oauth_consents → para OAuth

oauth_authorizations.user_id → users.id

oauth_authorizations.client_id → oauth_clients.id, etc.

auth.sso_providers, auth.sso_domains, auth.saml_providers, auth.saml_relay_states → SSO / SAML.

auth.one_time_tokens.user_id → users.id

auth.refresh_tokens.session_id → sessions.id

👉 Resumen:
Todo en auth.* cuelga de auth.users. Cuando se borra un usuario, se borran en cascada identidades, sesiones, tokens, MFA, etc.

3. Schema storage (archivos)

storage.buckets → contenedores (como carpetas raíz).

storage.objects

objects.bucket_id → buckets.id

storage.prefixes.bucket_id → buckets.id

storage.s3_multipart_uploads.bucket_id → buckets.id

storage.s3_multipart_uploads_parts.bucket_id → buckets.id

storage.s3_multipart_uploads_parts.upload_id → s3_multipart_uploads.id

👉 Resumen:
Estructura S3-like: un bucket tiene objetos, uploads y partes de uploads.

4. Schema public – corazón de Finex
4.1. profiles

Tabla de perfil de usuario de tu app.

Campos importantes:

id (uuid) → mismo id que auth.users.id

FK: profiles.id → auth.users.id ON DELETE CASCADE

email (NO NULL)

full_name

created_at

onboarding_completed (bool)

monthly_income (numeric)

currency (text, default 'UYU')

👉 Es el “usuario de Finex”, uno a uno con el de Supabase Auth.

4.2. accounts (cuentas de dinero)

Ejemplos: Santander, Efectivo, Prex, Cripto, etc.

Campos:

id (uuid, PK)

user_id → FK: accounts.user_id → profiles.id ON DELETE CASCADE

name → “Santander”, “Efectivo”, etc.

type → tipo de cuenta (ej. bank, cash, card, etc.)

currency → 'UYU' por defecto

is_primary → bool (cuenta principal)

created_at

👉 Cada cuenta pertenece a un solo usuario (profile).

4.3. categories (categorías de gasto/ingreso)

Ej: “Supermercado”, “Alquiler”, “Sueldo”, etc.

Campos:

id (uuid, PK)

user_id → categories.user_id → profiles.id ON DELETE CASCADE

name (texto)

created_at

type (texto, default 'pocket_expense')

Acá podés jugar con tipos: fixed_expense, income, etc.

icon (emoji o nombre de icono)

color (string para UI)

👉 Son las etiquetas que el usuario usa para clasificar los movimientos.

4.4. pockets (tus bolsas 🧺)

Acá vive tu concepto estrella: bolsas / pockets.

Campos:

id (uuid, PK)

user_id → pockets.user_id → profiles.id ON DELETE CASCADE

name → “Comida”, “Viaje Buenos Aires”, “Ahorro Alquiler”, etc.

type → ej. 'expense' / 'saving' (según lo que hayas definido)

emoji → para mostrar en la UI

allocated_amount (numeric) → lo que destinás a la bolsa.

current_balance (numeric, default 0) → cuánto queda dentro de esa bolsa.

currency (text, default 'UYU')

starts_at (date, default CURRENT_DATE)

ends_at (date) → hasta cuándo vive la bolsa (ej. fin de mes / viaje)

target_amount (numeric, opcional) → meta de ahorro.

status (text, default 'active') → puede ser active, completed, cancelled, etc.

auto_return_remaining (boolean, default true)
→ si al terminar el período, lo que sobra vuelve solo a la cuenta base.

created_at, updated_at

days_duration (int, derivado/guardado)

daily_allowance (numeric, calculado/guardado)

👉 Cada bolsa pertenece a un usuario y la podés linkear a movimientos para seguir su gasto/ahorro.

4.5. movements (transacciones / movimientos)

Esta es la tabla de movimientos reales: ingresos, gastos, transferencias internas, etc.

Campos:

id (uuid, PK)

user_id → movements.user_id → profiles.id ON DELETE CASCADE

type (text) → ej. 'expense', 'income', 'transfer'…

account_id (nullable)

FK: movements.account_id → accounts.id ON DELETE SET NULL

category_id (nullable)

FK: movements.category_id → categories.id ON DELETE SET NULL

pocket_id (nullable)

FK: movements.pocket_id → pockets.id ON DELETE CASCADE

amount (numeric, NOT NULL)

currency (text, default 'UYU')

date (date, default CURRENT_DATE)

description (texto)

metadata (jsonb) → para guardar detalles extra (origen, referencia, etc.)

created_at, updated_at

👀 Importante:

Si eliminás una cuenta o categoría, los movimientos quedan, pero con esos campos en NULL (no se pierden).

Si eliminás una bolsa, los movimientos asociados se eliminan en cascada.

Eso está bueno tenerlo presente para no perder histórico sin querer.

4.6. exchange_rates (tipos de cambio)

Para manejar multi-moneda.

Campos:

id (uuid, PK)

from_currency (text, ej. 'USD')

to_currency (text, ej. 'UYU')

rate (numeric, 18,8)

date (date, default CURRENT_DATE)

source (text) → de dónde sacaste el dato (ej. “BCU”, “Manual”)

created_at, updated_at

👉 Esto te permite convertir todo a la moneda default del usuario para los resúmenes.

4.7. products

Muy simple:

id (uuid, PK)

price (numeric)

Parece algo auxiliar (quizás para pricing de planes, productos de prueba, etc.).

5. Vistas / tablas derivadas (reporting)

Estas no las definís a mano en el frontend, pero son oro puro para tus dashboards.

5.1. account_balances

Estructura:

account_id

user_id

name

type

currency

is_primary

created_at

balance

Probablemente es una view o tabla materializada que te da:

El balance actual (o a una fecha) de cada cuenta del usuario.

Ideal para:

El widget de “Cuentas” en la home.

Sumar total_in_accounts en el resumen mensual.

5.2. active_pockets_summary

Estructura (resumen de bolsas activas):

id, user_id, name, type, emoji

allocated_amount

current_balance

currency

starts_at, ends_at

target_amount

status

auto_return_remaining

created_at, updated_at

days_duration

daily_allowance

days_elapsed

days_remaining

progress_percentage

remaining_daily_allowance

👉 Esta vista es la que usás para cosas como:

El módulo de proyección diaria (lo que estás mostrando en el PocketProjectionModule).

Saber cuánto podés gastar hoy sin romper la bolsa.

Mostrar barras de progreso, días que quedan, etc.

5.3. user_monthly_summary

Resumen mensual por usuario:

user_id

default_currency

total_in_accounts

income_month

fixed_expenses_month

saving_deposits_month

pockets_allocated_month

expense_pockets_balance

saving_pockets_balance

pockets_current_balance

👉 Acá tenés, por mes:

Cuánto tenés repartido en cuentas.

Cuánto te entró (income).

Cuánto se fue a gastos fijos.

Cuánto transferiste a ahorro.

Cuánto destinaste a bolsas.

Cuánto queda dentro de las bolsas (gasto vs ahorro).

Perfecto para la pantalla resumen que el agente usa cuando te dice:
“Tenés X en tus cuentas, Y comprometido en bolsas, Z de ingreso este mes…”

6. Cómo se conecta todo (modelo mental simple)

Podés pensarlo así:

Usuario entra a la app
auth.users → public.profiles

Configura sus cuentas
profiles (1) → (N) accounts

Define categorías
profiles (1) → (N) categories

Crea bolsas (pockets)
profiles (1) → (N) pockets

Registra movimientos

Cada movimiento pertenece a un usuario (user_id)

Puede afectar una cuenta (account_id)

Puede tener una categoría (category_id)

Puede estar linkeado a una bolsa (pocket_id)

El sistema calcula resúmenes

account_balances → saldo por cuenta

active_pockets_summary → estado de cada bolsa

user_monthly_summary → resumen financiero mensual

Si querés, en el próximo paso te puedo:

Dibujar un diagrama lógico (tipo entidad-relación, pero en texto).

O escribirte una explicación “para el agente” (system prompt) basada en este modelo para que entienda perfecto qué es cada cosa cuando ve accounts, pockets, movements, etc.
