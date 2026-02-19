# Arctic Frost Theme - Migration Guide

## Quick Start

### 1. Update Imports

In `main.jsx`, add the Arctic CSS:

```jsx
import './styles/arctic.css'  // Add this line
import './index.css'
```

### 2. Update Tailwind Config

Replace `tailwind.config.js` with `tailwind.config.arctic.js`:

```bash
cp tailwind.config.arctic.js tailwind.config.js
```

Or merge the Arctic colors into your existing config.

### 3. Switch Components

Update your imports to use Arctic components:

```jsx
// Before
import EntryGrid from '../components/entry/EntryGrid';
import EntryRow from '../components/entry/EntryRow';
import DataTable from '../components/data/DataTable';

// After
import EntryGrid from '../components/entry/EntryGridArctic';
import EntryRow from '../components/entry/EntryRowArctic';
import DataTable from '../components/data/DataTableArctic';
```

---

## Component Mapping

| Legacy Component | Arctic Component | Changes |
|-----------------|------------------|---------|
| `EntryGrid.jsx` | `EntryGridArctic.jsx` | Frosted header, spotlight effect |
| `EntryRow.jsx` | `EntryRowArctic.jsx` | Flash freeze animation, hero numbers |
| `DataTable.jsx` | `DataTableArctic.jsx` | Arctic styling, improved pagination |
| `.btn-primary` | `.arctic-btn-primary` | Frost pill gradient |
| `.btn-secondary` | `.arctic-btn-secondary` | Frosted glass effect |
| `.input-field` | `.arctic-cell-input` | Clean minimal style |
| `.badge-*` | `.arctic-tag` | Pill-shaped tags |
| `.stats-card` | `.arctic-stat-card` | Ice block cards |

---

## CSS Class Migration

### Backgrounds

```css
/* Before */
bg-warm-cream → bg-arctic-snow
bg-warm-sand → bg-arctic-frost
bg-white → bg-arctic-ice

/* After */
bg-arctic-snow
bg-arctic-frost
bg-arctic-ice
```

### Text Colors

```css
/* Before */
text-warm-charcoal → text-arctic-slate
text-warm-brown → text-arctic-gray

/* After */
text-arctic-slate      /* Primary text */
text-arctic-gray       /* Secondary text */
text-arctic-charcoal   /* Hero numbers */
```

### Borders

```css
/* Before */
border-warm-taupe → border-arctic-border
border-warm-brown → border-arctic-border-dark

/* After */
border-arctic-border
border-arctic-border-dark
border-arctic-active   /* Focused state */
```

### Financial Colors

```css
/* Before */
bg-red-100 → bg-arctic-frostbite-light
text-red-800 → text-arctic-frostbite
bg-emerald-100 → bg-arctic-aurora-light
text-emerald-800 → text-arctic-aurora

/* After */
/* Deductions */
bg-arctic-frostbite-light
text-arctic-frostbite

/* Bonuses */
bg-arctic-aurora-light
text-arctic-aurora
```

---

## Tailwind Classes Quick Reference

### Colors

| Class | Hex | Usage |
|-------|-----|-------|
| `bg-arctic-snow` | #F8FAFC | Page background |
| `bg-arctic-ice` | #FFFFFF | Cards, elevated |
| `bg-arctic-frost` | #F1F5F9 | Hover, zebra |
| `bg-glacier-500` | #3B82F6 | Primary actions |
| `text-arctic-slate` | #1E293B | Primary text |
| `text-arctic-gray` | #64748B | Secondary text |
| `text-arctic-charcoal` | #0F172A | Hero numbers |
| `border-arctic-border` | #E2E8F0 | Default borders |

### Shadows

| Class | Usage |
|-------|-------|
| `shadow-arctic-sm` | Subtle elevation |
| `shadow-arctic-md` | Cards |
| `shadow-arctic-glow` | Active row |
| `shadow-arctic-btn` | Primary buttons |

### Border Radius

| Class | Value |
|-------|-------|
| `rounded-arctic` | 12px |
| `rounded-arctic-lg` | 16px |
| `rounded-arctic-pill` | 50px |

---

## Testing the Migration

### Visual Checklist

1. [ ] Page background is snow white (#F8FAFC)
2. [ ] Cards have ice white (#FFFFFF) background
3. [ ] Primary buttons are glacier blue with gradient
4. [ ] Active row has blue glow effect
5. [ ] Adjustment tags use correct colors
6. [ ] Focus rings are visible (blue glow)
7. [ ] Numbers use monospace font

### Functional Checklist

1. [ ] Flash freeze animation plays on save
2. [ ] Spotlight effect dims surrounding rows
3. [ ] Touch targets are large enough
4. [ ] Keyboard navigation works
5. [ ] Screen reader announces changes

---

## Rollback Instructions

If issues arise, rollback is simple:

1. Remove Arctic CSS import from `main.jsx`
2. Restore original `tailwind.config.js`
3. Switch component imports back to original

```bash
git checkout tailwind.config.js
```

---

## Performance Notes

The Arctic theme adds:

- **~2KB** additional CSS (minified + gzipped)
- **2 font families** (Inter + JetBrains Mono)
- **No JavaScript overhead** (pure CSS animations)
- **No additional dependencies**

### Font Loading Strategy

```html
<!-- Add to index.html for faster loading -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

Or self-host fonts for offline support:

```bash
npm install @fontsource/inter @fontsource/jetbrains-mono
```

```jsx
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
```
