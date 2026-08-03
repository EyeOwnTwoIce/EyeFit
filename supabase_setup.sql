-- ════════════════════════════════════════════════════════════════
-- EyeFit — Setup de Supabase (tablas + RLS + políticas)
-- ════════════════════════════════════════════════════════════════
-- CÓMO USARLO:
--   1. Ve a https://supabase.com/dashboard → tu proyecto "eyefit"
--   2. Menú izquierdo → "SQL Editor"
--   3. "New query" → pega TODO este script → "Run"
--   4. Listo. Ya puedes usar la app con login y sincronización.
-- ════════════════════════════════════════════════════════════════

-- Extensión UUID (necesaria para gen_random_uuid)
create extension if not exists "pgcrypto";

-- ═══ Tabla: rutinas (una por usuario) ═══
create table if not exists public.routinas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  routine jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ═══ Tabla: sesiones (historial, varias por usuario) ═══
create table if not exists public.sesiones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Índices para consultas rápidas
create index if not exists sesiones_user_id_idx on public.sesiones(user_id);
create index if not exists sesiones_created_at_idx on public.sesiones(created_at desc);

-- ═══ Activar RLS (Row Level Security) ═══
alter table public.routinas enable row level security;
alter table public.sesiones enable row level security;

-- ═══ Políticas: RUTINAS ═══
-- Un usuario solo puede INSERTAR/ACTUALIZAR su propia rutina
drop policy if exists "routinas_insert_own" on public.routinas;
create policy "routinas_insert_own" on public.routinas
  for insert with check (auth.uid() = user_id);

drop policy if exists "routinas_update_own" on public.routinas;
create policy "routinas_update_own" on public.routinas
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "routinas_select_own" on public.routinas;
create policy "routinas_select_own" on public.routinas
  for select using (auth.uid() = user_id);

drop policy if exists "routinas_delete_own" on public.routinas;
create policy "routinas_delete_own" on public.routinas
  for delete using (auth.uid() = user_id);

-- ═══ Políticas: SESIONES ═══
drop policy if exists "sesiones_insert_own" on public.sesiones;
create policy "sesiones_insert_own" on public.sesiones
  for insert with check (auth.uid() = user_id);

drop policy if exists "sesiones_select_own" on public.sesiones;
create policy "sesiones_select_own" on public.sesiones
  for select using (auth.uid() = user_id);

drop policy if exists "sesiones_delete_own" on public.sesiones;
create policy "sesiones_delete_own" on public.sesiones
  for delete using (auth.uid() = user_id);

-- ═══ Trigger: updated_at automático en rutinas ═══
-- Nota: se fija search_path = '' (mejora de seguridad recomendada por Supabase lint).
-- now() es una función de pg_catalog, que siempre está disponible aunque search_path esté vacío.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_routinas_updated_at on public.routinas;
create trigger trg_routinas_updated_at
  before update on public.routinas
  for each row execute function public.set_updated_at();

-- ════════════════════════════════════════════════════════════════
-- FIN — Si ves "Success. No rows returned" es correcto.
-- ════════════════════════════════════════════════════════════════