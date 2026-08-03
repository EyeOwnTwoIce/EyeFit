-- ════════════════════════════════════════════════════════════════
-- EyeFit — Parche de seguridad: search_path fijo en set_updated_at
-- ════════════════════════════════════════════════════════════════
-- Resuelve el aviso del linter de Supabase:
--   "Function public.set_updated_at has mutable search_path"
--
-- CÓMO USARLO:
--   1. Ve a https://supabase.com/dashboard → tu proyecto "eyefit"
--   2. Menú izquierdo → "SQL Editor" → "New query"
--   3. Pega TODO este script → "Run"
--   4. Debe decir "Success. No rows returned"
-- ════════════════════════════════════════════════════════════════

-- Recrear la función con search_path fijo a '' (evita inyección vía search_path
-- y garantiza que las referencias sin calificar no dependan de la sesión del llamante).
-- now() pertenece a pg_catalog, que siempre está en el search_path implícito,
-- por lo que no es necesario calificarla.
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

-- Recrear el trigger (no es estrictamente necesario, pero garantiza que
-- apunte a la función actualizada)
drop trigger if exists trg_routinas_updated_at on public.routinas;
create trigger trg_routinas_updated_at
  before update on public.routinas
  for each row execute function public.set_updated_at();

-- ════════════════════════════════════════════════════════════════
-- FIN — Si ves "Success. No rows returned" el lint desaparecerá.
-- ════════════════════════════════════════════════════════════════