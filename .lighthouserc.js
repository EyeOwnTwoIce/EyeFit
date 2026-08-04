/* EyeFit — Lighthouse CI budgets (perf ≥95, a11y ≥95, seo ≥95, etc.)
   staticDistDir: lhci sirve dist/ él mismo (determinista, sin servidor externo) */
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
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'errors-in-console': ['error', { maxLength: 0 }],
        'csp-xss': ['error', { minScore: 1 }],
        'link-name': ['error'],
        'button-name': ['error'],
        'image-alt': ['error'],
        'tap-targets': ['error']
      }
    },
    upload: { target: 'temporary-public-storage' }
  }
};