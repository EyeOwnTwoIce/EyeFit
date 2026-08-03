-- ════════════════════════════════════════════════════════════════
-- EyeFit — Migración: tabla "routinas" → "rutinas" (ortografía correcta)
-- Ejecuta este script en Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════════════════════

-- 1) Crear la tabla correcta "rutinas" (misma estructura que "routinas")
create table if not exists public.rutinas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  routine jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Migrar datos existentes (si la tabla vieja tiene filas)
--    Solo copiamos user_id + routine: la tabla nueva rellena
--    created_at/updated_at con sus valores por defecto (la tabla
--    antigua "routinas" no siempre tiene esas columnas)
insert into public.rutinas (user_id, routine)
select user_id, routine
from public.routinas
on conflict (user_id) do nothing;

-- 3) RLS en "rutinas"
alter table public.rutinas enable row level security;

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

-- 4) Trigger updated_at con search_path fijo (mismo fix que supabase_fix_trigger.sql)
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

create trigger set_rutinas_updated_at
  before update on public.rutinas
  for each row execute function public.set_rutinas_updated_at();

-- 5) Eliminar la tabla vieja "routinas" (tras migrar: ya no usamos la app)
drop table if exists public.routinas;

-- 6) Renombrar función vieja del trigger (ya no se usa)
drop function if exists public.set_updated_at();