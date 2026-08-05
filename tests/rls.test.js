/* EyeFit — Check de RLS en supabase_setup.sql (CI)
   Valida estáticamente que:
   - RLS está habilitado en rutinas y sesiones
   - Existen las 8 políticas *_own con auth.uid() = user_id
   - Los triggers updated_at usan security invoker + search_path vacío
   - Las funciones trigger están revoke de anon/public
   - Idempotencia: create table if not exists + drop policy if exists
   - Constraints e índices clave para la idempotencia de sync */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const SQL = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'setup.sql'), 'utf8');

test('RLS: row level security habilitado en rutinas y sesiones', () => {
  assert.match(SQL, /alter table\s+public\.rutinas\s+enable row level security/i);
  assert.match(SQL, /alter table\s+public\.sesiones\s+enable row level security/i);
});

test('RLS: existen las 8 políticas *_own con auth.uid() = user_id', () => {
  const tables = ['rutinas', 'sesiones'];
  const ops = ['select', 'insert', 'update', 'delete'];
  for (const t of tables) {
    for (const op of ops) {
      assert.match(SQL, new RegExp(`create policy "?${t}_${op}_own`), `falta política ${t}_${op}_own`);
      assert.match(SQL, /auth\.uid\(\) = user_id/i, `auth.uid() = user_id en ${t}_${op}_own`);
    }
  }
});

test('RLS: triggers updated_at con security invoker + search_path vacío', () => {
  const triggers = ['set_rutinas_updated_at', 'set_sesiones_updated_at'];
  for (const fn of triggers) {
    assert.match(SQL, new RegExp(`create or replace function public\\.${fn}\\(\\\)`));
    assert.match(SQL, /security invoker set search_path = ''/);
  }
});

test('RLS: revoke execute de anon, public en funciones trigger', () => {
  const revokes = SQL.match(/revoke execute on function public\.\w+\(\) from anon, public;/g) || [];
  assert.equal(revokes.length, 2, 'debe haber 2 revokes (rutinas + sesiones)');
});

/* ============ Idempotencia y estructura de tablas ============ */
test('RLS: create table si no existe (idempotencia de deploy)', () => {
  assert.match(SQL, /create table if not exists public\.rutinas/i);
  assert.match(SQL, /create table if not exists public\.sesiones/i);
  /* Las políticas deben tener drop policy if exists antes del create */
  const drops = SQL.match(/drop policy if exists "(?:rutinas|sesiones)_(?:select|insert|update|delete)_own"/g) || [];
  assert.equal(drops.length, 8, 'debe haber 8 drop policy if exists (1 por política)');
});

test('RLS: ambos triggers con drop trigger if exists + create trigger before update', () => {
  assert.match(SQL, /drop trigger if exists set_rutinas_updated_at on public\.rutinas/i);
  assert.match(SQL, /drop trigger if exists set_sesiones_updated_at on public\.sesiones/i);
  assert.match(SQL, /create trigger set_rutinas_updated_at\s+before update on public\.rutinas\s+for each row execute function public\.set_rutinas_updated_at\(\)/i);
  assert.match(SQL, /create trigger set_sesiones_updated_at\s+before update on public\.sesiones\s+for each row execute function public\.set_sesiones_updated_at\(\)/i);
});

/* ============ Constraints para la idempotencia del sync ============ */
test('RLS: constraint único (user_id, session_id) para idempotencia', () => {
  assert.match(SQL, /add constraint sesiones_user_session_unique unique \(user_id, session_id\)/i);
});

test('RLS: índice sesiones_user_idx en user_id', () => {
  assert.match(SQL, /create index if not exists sesiones_user_idx on public\.sesiones\(user_id\)/i);
});

test('RLS: user_id referencia auth.users con on delete cascade', () => {
  /* Dos lugares: rutinas.user_id y sesiones.user_id */
  const refs = SQL.match(/references auth\.users\(id\) on delete cascade/g) || [];
  assert.equal(refs.length, 2, 'debe haber 2 referencias a auth.users (rutinas + sesiones)');
});

test('RLS: user_id NOT NULL y UNIQUE en rutinas (1 fila por usuario)', () => {
  assert.match(SQL, /user_id uuid not null unique references auth\.users\(id\) on delete cascade/i);
});

test('RLS: sesiones tiene data jsonb con default y session_id uuid con default', () => {
  assert.match(SQL, /session_id uuid not null default gen_random_uuid\(\)/i);
  assert.match(SQL, /data jsonb not null default '\{\}'::jsonb/i);
});

test('RLS: ambas tablas tienen primary key uuid con gen_random_uuid()', () => {
  const pks = SQL.match(/id uuid primary key default gen_random_uuid\(\)/g) || [];
  assert.equal(pks.length, 2, 'debe haber 2 primary keys (rutinas + sesiones)');
});

test('RLS: limpieza de la antigua tabla mal escrita routinas', () => {
  assert.match(SQL, /drop table if exists public\.routinas/i);
});
