-- ════════════════════════════════════════════════════════════════
-- EyeFit — Setup completo de Supabase
-- Ejecuta este script en Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════════════════════

-- 1) Tabla "rutinas" (una fila por usuario con su rutina en JSONB)
create table if not exists public.rutinas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  routine jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Tabla "sesiones" (historial de entrenamientos por usuario)
create table if not exists public.sesiones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sesiones_user_idx on public.sesiones(user_id);

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

drop policy if exists "sesiones_delete_own" on public.sesiones;
create policy "sesiones_delete_own"
  on public.sesiones for delete
  using (auth.uid() = user_id);

-- 4) Trigger updated_at con search_path fijo (evita el lint "mutable search_path")
drop trigger if exists set_rutinas_updated_at on public.rutinas;

create or replace function public.set_rutinas_updated_at()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Revocar EXECUTE de anon/public: esta función es solo un trigger interno
-- y NO debe ser llamable como RPC por clientes no autenticados
revoke execute on function public.set_rutinas_updated_at() from anon, public;

create trigger set_rutinas_updated_at
  before update on public.rutinas
  for each row execute function public.set_rutinas_updated_at();

-- 5) Limpieza de la antigua tabla mal escrita "routinas" (si existía de versiones previas)
drop table if exists public.routinas;