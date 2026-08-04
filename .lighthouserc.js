/* EyeFit — Lighthouse CI budgets (perf ≥95, a11y ≥95, etc.) */
'use strict';
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:4173/'],
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