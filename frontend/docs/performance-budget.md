# Performance Budget - Arctic Frost Design System

This document defines the performance budget and optimization guidelines for the Malar Market Ledger PWA.

## Performance Targets

### Lighthouse Scores (Minimum Targets)
| Category | Score | Notes |
|----------|-------|-------|
| Performance | 90+ | Critical for 4 AM rush hour operations |
| Accessibility | 95+ | WCAG AAA compliance for early morning use |
| Best Practices | 95+ | Modern web standards |
| SEO | 90+ | Search discoverability |

### Core Web Vitals
| Metric | Target | Budget |
|--------|--------|--------|
| LCP (Largest Contentful Paint) | < 2.5s | Hero text/images must load fast |
| FID (First Input Delay) | < 100ms | Buttons must respond instantly |
| CLS (Cumulative Layout Shift) | < 0.1 | No visual jumping during load |
| TTI (Time to Interactive) | < 3.8s | Full interactivity |
| TBT (Total Blocking Time) | < 200ms | Minimal main thread blocking |

## Resource Budgets

### JavaScript
| Resource | Budget | Notes |
|----------|--------|-------|
| Total JS (compressed) | < 150KB | Initial bundle |
| Per-route chunk | < 50KB | Lazy loaded routes |
| Third-party JS | < 30KB | Minimal dependencies |

### CSS
| Resource | Budget | Notes |
|----------|--------|-------|
| Total CSS (compressed) | < 50KB | Tailwind purged |
| Critical CSS | < 10KB | Above-fold styles inline |
| Animation CSS | < 5KB | Separate file, cached |

### Fonts
| Resource | Budget | Notes |
|----------|--------|-------|
| Total font files | < 100KB | 4 font families |
| Per-font | < 30KB | Subset for used characters |
| Font display | swap | Immediate text rendering |

### Images
| Resource | Budget | Notes |
|----------|--------|-------|
| Hero images | < 100KB | WebP format preferred |
| Icons (SVG) | < 2KB each | Inline critical icons |
| Total page images | < 500KB | Lazy load below-fold |

## Optimization Strategies

### 1. Font Loading
```html
<!-- Already implemented in index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="...&display=swap" rel="stylesheet">
```

### 2. CSS Optimization
- **Tailwind Purge**: Remove unused utility classes in production
- **CSS Variables**: Use for theming to reduce duplication
- **Critical CSS**: Inline above-fold styles
- **Animation CSS**: Separate file for caching

### 3. JavaScript Optimization
- **Code Splitting**: Lazy load routes and heavy components
- **Tree Shaking**: Remove unused exports
- **Minification**: Terser for production builds
- **Compression**: Gzip/Brotli on server

### 4. Image Optimization
- **Format**: WebP with JPEG fallback
- **Responsive**: srcset for different screen sizes
- **Lazy Loading**: Native loading="lazy" for below-fold
- **Icons**: SVG sprites for repeated icons

### 5. Caching Strategy
- **Service Worker**: Cache-first for static assets
- **CDN**: Edge caching for global users
- **Cache Headers**: Long expiry for versioned assets

## Monitoring

### Automated Checks
- **CI/CD**: Lighthouse CI on every PR
- **Budget Alerts**: Fail build if budget exceeded
- **Bundle Analysis**: Track bundle size changes

### Manual Audits
- **Weekly**: Full Lighthouse audit on production
- **Monthly**: WebPageTest with different devices
- **Quarterly**: Core Web Vitals review

## Arctic Frost Specific Optimizations

### High-Contrast Mode (4 AM Use)
- Ensure text contrast ≥ 7:1
- Large touch targets (44x44px minimum)
- Minimal animations for reduced motion

### Offline-First
- Cache all critical CSS/JS
- IndexedDB for offline data
- Background sync for pending entries

### Tamil Font Optimization
- Subset Noto Sans Tamil for used characters only
- Preload Tamil font for Tamil language users
- Fallback to system fonts if loading fails

## Build Configuration

### Vite Production Build
```javascript
// vite.config.js optimizations
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom', 'react-router-dom'],
        i18n: ['i18next', 'react-i18next'],
        charts: ['recharts']
      }
    }
  },
  minify: 'terser',
  cssCodeSplit: true
}
```

### Tailwind Purge Configuration
```javascript
// tailwind.config.js
purge: {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  options: {
    safelist: [
      // Dynamic classes that can't be detected
      /^af-/,
      /^arctic-/,
      /^glacier-/,
      /^aurora-/
    ]
  }
}
```

## Performance Testing Commands

```bash
# Run Lighthouse audit
npm run lighthouse

# Analyze bundle size
npm run analyze

# Test with throttling
npm run test:throttled
```

## Performance Regression Actions

If performance budget is exceeded:

1. **Identify**: Check bundle analyzer for large dependencies
2. **Optimize**: Lazy load, tree shake, or replace dependencies
3. **Verify**: Re-run Lighthouse to confirm improvement
4. **Document**: Update budget if legitimate increase needed

---

Last Updated: February 2026
Version: 1.0.0
