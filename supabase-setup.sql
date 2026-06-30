-- ============================================================================
-- BANCO DE PRUEBAS PARA SCANNER DE SEGURIDAD (Sereno) — DATOS 100% FALSOS
-- Corré todo esto en el SQL Editor de tu proyecto de Supabase DE PRUEBA.
-- NO USAR EN PRODUCCIÓN. Cada tabla/bucket está en un estado distinto a
-- propósito para validar que el scanner detecta cada caso.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CASO 1 — `clientes_abierta`: RLS DESACTIVADO (exposición total)
-- El scanner DEBE marcarla como CRÍTICA (datos sensibles legibles sin auth).
-- ----------------------------------------------------------------------------
create table if not exists public.clientes_abierta (
  id       bigint generated always as identity primary key,
  nombre   text,
  email    text,
  telefono text,
  dni      text
);

-- RLS explícitamente DESACTIVADO.
alter table public.clientes_abierta disable row level security;
grant select on public.clientes_abierta to anon, authenticated;

insert into public.clientes_abierta (nombre, email, telefono, dni) values
  ('Lucia Ferreyra',  'lucia.ferreyra@example.com',  '+54 9 11 4000-1111', '32.118.456'),
  ('Marcos Gimenez',  'marcos.gimenez@example.com',  '+54 9 11 4000-2222', '30.225.789'),
  ('Sofia Paredes',   'sofia.paredes@example.com',   '+54 9 11 4000-3333', '35.667.012');

-- ----------------------------------------------------------------------------
-- CASO 2 — `pedidos_policy_abierta`: RLS ACTIVADO, pero con una policy INÚTIL
-- (permite SELECT a anon con USING true). El scanner DEBE marcarla igual:
-- RLS existe pero no protege nada.
-- ----------------------------------------------------------------------------
create table if not exists public.pedidos_policy_abierta (
  id        bigint generated always as identity primary key,
  cliente   text,
  monto     numeric,
  direccion text
);

alter table public.pedidos_policy_abierta enable row level security;
grant select on public.pedidos_policy_abierta to anon, authenticated;

-- Policy permisiva: deja leer TODO al rol anónimo. Este es el error a detectar.
drop policy if exists "lectura_publica_pedidos" on public.pedidos_policy_abierta;
create policy "lectura_publica_pedidos"
  on public.pedidos_policy_abierta
  for select
  to anon
  using (true);

insert into public.pedidos_policy_abierta (cliente, monto, direccion) values
  ('Lucia Ferreyra', 15400.00, 'Calle Falsa 123, CABA'),
  ('Marcos Gimenez',  8990.50, 'Av. Siempreviva 742, Rosario'),
  ('Sofia Paredes',  23150.75, 'Pasaje Test 9, Córdoba');

-- ----------------------------------------------------------------------------
-- CASO 3 — `usuarios_protegida`: RLS activado + policy CORRECTA
-- (cada usuario solo ve SUS filas: auth.uid() = user_id). Como anon no tiene
-- auth.uid(), la API devuelve [] → el scanner NO debe marcarla.
-- ----------------------------------------------------------------------------
create table if not exists public.usuarios_protegida (
  id       bigint generated always as identity primary key,
  user_id  uuid not null,
  nombre   text,
  email    text
);

alter table public.usuarios_protegida enable row level security;
grant select on public.usuarios_protegida to anon, authenticated;

drop policy if exists "ver_solo_propias" on public.usuarios_protegida;
create policy "ver_solo_propias"
  on public.usuarios_protegida
  for select
  to authenticated
  using (auth.uid() = user_id);

insert into public.usuarios_protegida (user_id, nombre, email) values
  (gen_random_uuid(), 'Usuario Uno',  'uno@example.com'),
  (gen_random_uuid(), 'Usuario Dos',  'dos@example.com'),
  (gen_random_uuid(), 'Usuario Tres', 'tres@example.com');

-- ----------------------------------------------------------------------------
-- CASO 4 — Storage: bucket PÚBLICO vs bucket PRIVADO
-- `documentos` es público (cualquiera lee los archivos por la URL pública).
-- `privado` es privado y sin policies (no accesible sin auth).
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', true)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('privado', 'privado', false)
on conflict (id) do update set public = excluded.public;

-- NOTA: subí 1–2 archivos de prueba al bucket `documentos` desde el dashboard
-- (Storage → documentos → Upload), p. ej. un PDF o imagen cualquiera. Los
-- buckets públicos sirven sus archivos sin autenticación: ese es el caso a
-- detectar. Al bucket `privado` no le pongas policies (queda restringido).

-- ============================================================================
-- VERIFICACIÓN RÁPIDA (opcional): qué ve el rol anónimo
-- ============================================================================
-- clientes_abierta        → 3 filas   (RLS off → expuesto)
-- pedidos_policy_abierta  → 3 filas   (policy USING true → expuesto)
-- usuarios_protegida      → 0 filas   (policy correcta → protegido)
