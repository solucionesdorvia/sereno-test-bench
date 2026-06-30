# Sereno — Banco de pruebas (Supabase vulnerable a propósito)

App de **prueba** para validar que el scanner de seguridad (Sereno) detecta cada
caso de mala configuración de Supabase. **Datos 100% falsos. No es producción.**

> ⚠️ Esto planta vulnerabilidades reales a propósito (incluida una service_role
> key expuesta). Usá un proyecto de Supabase **descartable**, sin datos reales, y
> borralo / rotá las keys cuando termines de testear.

## Casos plantados

| # | Tabla / recurso | Estado | El scanner debe… |
|---|---|---|---|
| 1 | `clientes_abierta` | RLS **desactivado** | marcar **crítico** (datos sensibles sin auth) |
| 2 | `pedidos_policy_abierta` | RLS on, policy `USING (true)` para anon | marcar **expuesto** (la policy no protege) |
| 3 | `usuarios_protegida` | RLS on, policy `auth.uid() = user_id` | **NO** marcar (bien configurada) |
| 4a | bucket `documentos` | **público** | marcar (archivos legibles sin auth) |
| 4b | bucket `privado` | privado, sin policies | **NO** marcar (restringido) |
| 5 | `service_role` key | **en el bundle del cliente** | marcar **crítico máximo** |

## Pasos para montarlo (los hacés vos — requieren tus cuentas)

### 1. Crear el proyecto de Supabase de prueba
- Creá un proyecto nuevo en [supabase.com](https://supabase.com) (uno descartable).
- SQL Editor → pegá y corré [`supabase-setup.sql`](./supabase-setup.sql). Crea
  las 3 tablas con sus estados, los datos falsos y los 2 buckets.
- Storage → bucket `documentos` → subí 1–2 archivos cualquiera (un PDF/imagen).
  Al bucket `privado` no le pongas policies.

### 2. Configurar las keys
- Settings → API. Copiá: Project URL, anon key y **service_role** key.
- Localmente: `cp .env.example .env.local` y completá las 3 variables.

### 3. Probar local
```bash
pnpm install
pnpm dev
```
Deberías ver: `clientes_abierta` y `pedidos_policy_abierta` con 3 filas;
`usuarios_protegida` con 0 filas; y la lista del bucket `documentos`.

### 4. Deploy a Vercel (URL pública)
- Subí el repo a GitHub e importalo en [vercel.com](https://vercel.com), **o**
  desde la carpeta: `pnpm dlx vercel` y seguí el prompt.
- En Vercel → Settings → Environment Variables, cargá las **3** variables
  `NEXT_PUBLIC_SUPABASE_*` (incluida la service_role, que es la fuga a testear).
- Redeploy. Te queda una URL pública tipo `https://sereno-test-bench.vercel.app`.

### 5. (Opcional) Verificación para Sereno
Cuando escanees con Sereno te va a pedir un `<meta name="sereno-site-verification">`
para probar que la app es tuya. Pegá el que te dé Sereno en `app/layout.tsx`
(dentro del `<head>`/metadata) y redeployá.

## Limpieza
Cuando termines: borrá el proyecto de Supabase (o al menos **rotá la
service_role key**) y bajá el deploy de Vercel. La service key estuvo pública.
