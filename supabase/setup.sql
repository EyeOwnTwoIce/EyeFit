-- ════════════════════════════════════════════════════════════════
-- EyeFit — Setup completo de Supabase
-- Ejecuta este script en Supabase Dashboard → SQL Editor
-- v2: sesiones idempotentes con session_id + updated_at
-- ════════════════════════════════════════════════════════════════

-- 1) Tabla "rutinas" (una fila por usuario con su rutina en JSONB + metadatos)
create table if not exists public.rutinas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  routine jsonb not null default '[]'::jsonb,
  meta jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Tabla "sesiones" (historial de entrenamientos por usuario)
--    session_id es un UUID generado en el cliente → idempotencia de sync
create table if not exists public.sesiones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sesiones_user_idx on public.sesiones(user_id);
-- Clave única para idempotencia: el mismo session_id del mismo usuario
-- solo se inserta/upsertea una vez (evita duplicados en sync concurrente)
alter table public.sesiones
  add constraint sesiones_user_session_unique unique (user_id, session_id);

-- 3) Row Level Security
alter table public.rutinas enable row level security;
alter table public.sesiones enable row level security;

-- Políticas rutinas
drop policy if exists "rutinas_select_own" on public.rutinas;
create policy "rutinas_select_own"
  on public.rutinas for select
  using (auth.uid() = user_id);

drop policy if exists "rutinas_insert_own" on public.rutinas;
create policy "rutinas_insert_own"
  on public.rutinas for insert
  with check (auth.uid() = user_id);

drop policy if exists "rutinas_update_own" on public.rutinas;
create policy "rutinas_update_own"
  on public.rutinas for update
  using (auth.uid() = user_id);

drop policy if exists "rutinas_delete_own" on public.rutinas;
create policy "rutinas_delete_own"
  on public.rutinas for delete
  using (auth.uid() = user_id);

-- Políticas sesiones
drop policy if exists "sesiones_select_own" on public.sesiones;
create policy "sesiones_select_own"
  on public.sesiones for select
  using (auth.uid() = user_id);

drop policy if exists "sesiones_insert_own" on public.sesiones;
create policy "sesiones_insert_own"
  on public.sesiones for insert
  with check (auth.uid() = user_id);

drop policy if exists "sesiones_update_own" on public.sesiones;
create policy "sesiones_update_own"
  on public.sesiones for update
  using (auth.uid() = user_id);

drop policy if exists "sesiones_delete_own" on public.sesiones;
create policy "sesiones_delete_own"
  on public.sesiones for delete
  using (auth.uid() = user_id);

-- 4) Triggers updated_at con search_path fijo y SECURITY INVOKER:
--    - SECURITY INVOKER: la función respeta RLS del caller (no bypass).
--      Solo asigna new.updated_at = now(); no necesita privilegios elevados.
--    - set search_path = '' evita el lint "mutable search_path".
--    - Revoke EXECUTE de anon/public como defensa en profundidad:
--      no debe ser llamable como RPC desde /rest/v1/rpc/...
drop trigger if exists set_rutinas_updated_at on public.rutinas;

create or replace function public.set_rutinas_updated_at()
returns trigger
language plpgsql
security invoker set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_rutinas_updated_at() from anon, public;

create trigger set_rutinas_updated_at
  before update on public.rutinas
  for each row execute function public.set_rutinas_updated_at();

drop trigger if exists set_sesiones_updated_at on public.sesiones;

create or replace function public.set_sesiones_updated_at()
returns trigger
language plpgsql
security invoker set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_sesiones_updated_at() from anon, public;

create trigger set_sesiones_updated_at
  before update on public.sesiones
  for each row execute function public.set_sesiones_updated_at();

-- 5) Limpieza de la antigua tabla mal escrita "routinas" (si existía de versiones previas)
drop table if exists public.routinas;