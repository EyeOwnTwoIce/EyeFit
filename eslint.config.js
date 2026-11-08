/* EyeFit — ESLint flat config
   Objetivo: errores reales (variables no definidas, reasignación de const,
   claves duplicadas), no estilo. El estilo se deja fuera para no generar ruido. */
'use strict';
const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    ignores: [
      'dist/**', 'node_modules/**', 'vendor/**', 'data/**', 'public/**',
      'playwright-report/**', 'test-results/**', '.lighthouseci/**'
    ]
  },
  js.configs.recommended,
  {
    rules: {
      /* El proyecto tiene mucho código heredado; primero cazamos bugs. */
      'no-unused-vars': 'off',
      'no-empty': 'off',
      'no-useless-escape': 'off',
      'no-cond-assign': 'off',
      'no-control-regex': 'off'
    }
  },
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        /* utils.js exporta para Node tras un guard typeof module/require */
        module: 'readonly',
        require: 'readonly'
      }
    }
  },
  {
    files: ['tests/**/*.js', 'tools/**/*.js', '*.config.js', '.lighthouserc.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.node }
    }
  },
  {
    /* Los page.evaluate() de Playwright se ejecutan en el navegador. */
    files: ['tests/e2e/**/*.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser }
    }
  }
];
