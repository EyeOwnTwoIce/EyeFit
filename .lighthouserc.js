/* EyeFit — Lighthouse CI budgets
   - Estrictas: accesibilidad (a11y), SEO, best-practices y auditorías de nombres/imágenes.
   - Warn (no bloquean): performance (runner frío flaky), csp-xss (nuestra CSP es
     <meta>, el audit solo puntúa cabeceras HTTP) y errors-in-console. */
'use strict';
module.exports = {
  ci: {
    collect: {
      staticDistDir: 'dist',
      numberOfRuns: 1,
      settings: {
        preset: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
      }
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'categories:performance': ['warn', { minScore: 0.9 }],
        'errors-in-console': ['warn', { maxLength: 0 }],
        'csp-xss': ['warn'],
        'link-name': ['error'],
        'button-name': ['error'],
        'image-alt': ['error']
      }
    },
    upload: { target: 'temporary-public-storage' }
  }
};