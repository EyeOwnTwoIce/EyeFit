/* EyeFit — Check de RLS en supabase_setup.sql (CI)
   Valida estáticamente que:
   - RLS está habilitado en rutinas y sesiones
   - Existen las 8 políticas *_own con auth.uid() = user_id
   - Los triggers updated_at usan security invoker + search_path vacío
   - Las funciones trigger están revoke de anon/public */
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
    assert.match(SQL, new RegExp(`create or replace function public\\.${fn}\\(\\)`));
    assert.match(SQL, /security invoker set search_path = ''/);
  }
});

test('RLS: revoke execute de anon, public en funciones trigger', () => {
  const revokes = SQL.match(/revoke execute on function public\.\w+\(\) from anon, public;/g) || [];
  assert.equal(revokes.length, 2, 'debe haber 2 revokes (rutinas + sesiones)');
});