# UI Redesign Specification - Arctic Frost Theme Completion

## Overview

### Context
The Malar Market Ledger application requires a complete UI redesign to deliver a distinctive, production-grade frontend that avoids generic aesthetics. An "Arctic Frost" design system has been partially implemented but requires completion and refinement across all pages and components.

### Problem Statement
- Current UI lacks visual cohesion and distinctive character
- "Arctic Frost" theme partially implemented (only Daily Entry and Settlements pages)
- Inconsistent styling between old warm-color palette and new arctic theme
- Generic template-like appearance in several pages
- Suboptimal user experience during critical 4-9 AM rush hours

### Goals
1. Complete the Arctic Frost design system implementation across ALL pages
2. Create a distinctive, memorable visual identity that avoids AI-slop aesthetics
3. Optimize for high-efficiency data entry during early morning operations
4. Ensure WCAG AAA accessibility compliance for low-light conditions
5. Maintain offline-first PWA functionality throughout

---

## Functional Requirements

### FR-001: Design System Completion
**Requirement**: Complete Arctic Frost theme implementation across all pages and components.

**Acceptance Criteria**:
- All 14 pages use Arctic Frost styling consistently
- No remnants of old warm-color palette in production code
- CSS variables used for all color tokens
- Dark mode support prepared (optional toggle)

**Pages requiring update**:
| Page | Current Status | Priority |
|------|----------------|----------|
| LoginPage | Warm colors | P0 |
| DashboardPage | Mixed styling | P0 |
| DailyEntryPage | Arctic (partial) | P0 |
| SettlementsPage | Arctic (partial) | P0 |
| FarmersPage | Warm colors | P1 |
| MarketRatesPage | Warm colors | P1 |
| ReportsPage | Warm colors | P1 |
| CashAdvancesPage | Warm colors | P1 |
| InvoicePage | Warm colors | P1 |
| SettingsPage | Warm colors | P2 |
| BusinessSettingsPage | Warm colors | P2 |
| ForgotPasswordPage | Warm colors | P2 |
| ResetPasswordPage | Warm colors | P2 |

### FR-002: Typography System
**Requirement**: Implement distinctive typography that avoids generic fonts.

**Acceptance Criteria**:
- Display font: Distinctive characterful font for headings
- Body font: Refined readable font for content
- Mono font: JetBrains Mono for financial numbers
- Tamil font: Noto Sans Tamil for Tamil text
- Font loading optimized for performance

**Typography Scale**:
| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| Hero | 24px | 700 | Totals, key metrics |
| Heading | 18px | 600 | Section headers |
| Body | 14px | 400 | Standard text |
| Caption | 12px | 500 | Labels, headers |
| Micro | 11px | 500 | Tags, badges |

### FR-003: Color System Refinement
**Requirement**: Refine and standardize the Arctic Frost color palette.

**Acceptance Criteria**:
- All colors defined as CSS custom properties
- Tailwind config extended with arctic color tokens
- WCAG AAA contrast ratios verified
- Status colors use both color AND icons for accessibility

**Color Tokens**:
```css
/* Backgrounds */
--arctic-ice: #FFFFFF;
--arctic-snow: #F8FAFC;
--arctic-frost: #F1F5F9;

/* Primary Actions */
--glacier-500: #3B82F6;
--glacier-600: #2563EB;

/* Status */
--aurora-green: #10B981;
--frostbite-red: #EF4444;
--gold-ice: #F59E0B;

/* Text */
--cool-gray-900: #1F2937;
--cool-gray-500: #6B7280;
```

### FR-004: Component Library Enhancement
**Requirement**: Enhance all UI components with Arctic Frost styling.

**Acceptance Criteria**:
- All components use arctic theme classes
- Micro-interactions implemented (hover, focus, active states)
- Touch targets meet 44x44px minimum
- Focus indicators visible (3px ring minimum)

**Components requiring update**:
| Component | Location | Status |
|-----------|----------|--------|
| Button | forms/Button.jsx | Needs arctic update |
| Input | forms/Input.jsx | Needs arctic update |
| Select | forms/Select.jsx | Needs arctic update |
| DatePicker | forms/DatePicker.jsx | Needs arctic update |
| Modal | feedback/Modal.jsx | Needs arctic update |
| Toast | feedback/Toast.jsx | Needs arctic update |
| Card | data/Card.jsx | Needs arctic update |
| Badge | data/Badge.jsx | Needs arctic update |
| DataTable | data/DataTable.jsx | Partial (Arctic version exists) |
| Header | layout/Header.jsx | Needs arctic update |
| Sidebar | layout/Sidebar.jsx | Needs arctic update |
| Footer | layout/Footer.jsx | Needs arctic update |

### FR-005: Micro-Interactions
**Requirement**: Implement meaningful micro-interactions throughout the UI.

**Acceptance Criteria**:
- Page load: Staggered reveals with animation-delay
- Row save: Flash freeze animation (blue glow)
- Focus: Subtle pulse ring animation
- Button press: Scale feedback
- Tag toggle: Smooth transition
- Reduced motion: Respect prefers-reduced-motion

**Animation Specifications**:
```css
/* Flash Freeze - Row Save */
@keyframes flash-freeze {
  0% { background: #FFFFFF; }
  30% { background: #DBEAFE; box-shadow: 0 0 0 2px #3B82F6; }
  100% { background: #FFFFFF; box-shadow: none; }
}

/* Focus Ring Pulse */
@keyframes focus-ring-pulse {
  0%, 100% { box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
  50% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2); }
}
```

### FR-006: Responsive Design
**Requirement**: Ensure responsive layouts for all screen sizes.

**Acceptance Criteria**:
- Mobile (< 640px): Card list view for data tables
- Tablet (640-1024px): Horizontal scroll with sticky columns
- Desktop (> 1024px): Full table view with all columns
- Touch targets: 44x44px minimum on mobile
- Breakpoints documented and consistent

### FR-007: Login Page Redesign
**Requirement**: Create a distinctive, memorable login experience.

**Acceptance Criteria**:
- Asymmetric layout with visual interest
- Gradient mesh or textured background
- Smooth entrance animations
- Bilingual support (EN/TA) with language toggle
- Forgot password flow integrated
- Offline-capable form validation

### FR-008: Dashboard Enhancement
**Requirement**: Transform dashboard into a visually striking command center.

**Acceptance Criteria**:
- Stat cards with arctic styling and micro-interactions
- Quick action buttons with gradient styling
- Recent activity feed with visual hierarchy
- Today's summary prominently displayed
- Charts/visualizations with arctic color scheme

---

## Non-Functional Requirements

### NFR-001: Performance
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.5s
- Cumulative Layout Shift: < 0.1

### NFR-002: Accessibility
- WCAG AAA contrast ratios (7:1 for text)
- Focus indicators on all interactive elements
- Screen reader compatible
- Keyboard navigation support
- Reduced motion support

### NFR-003: Offline Support
- All UI components functional offline
- Service Worker caches arctic CSS/assets
- IndexedDB for data persistence
- Visual indicator for offline status

### NFR-004: Bilingual Support
- All text via t() function
- Translation keys in en.json and ta.json
- Tamil font rendering optimized
- RTL-ready (future-proofing)

### NFR-005: Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

---

## User Stories

### US-001: Early Morning Data Entry
**As a** commission agent  
**I want** a high-contrast, easy-to-read interface at 4 AM  
**So that** I can quickly enter farmer data without eye strain

**Acceptance Criteria**:
- Text contrast ratio ≥ 7:1
- Active row clearly highlighted
- Large touch targets for quick data entry
- No bright white backgrounds that hurt tired eyes

### US-002: Tamil Language User
**As a** Tamil-speaking user  
**I want** the entire interface in Tamil  
**So that** I can use the application comfortably

**Acceptance Criteria**:
- All UI text translated to Tamil
- Tamil font renders correctly
- Numbers remain in Arabic numerals
- Currency symbol (₹) displays correctly

### US-003: Mobile Tablet User
**As a** user on a tablet  
**I want** the data tables to scroll horizontally  
**So that** I can see all columns without zooming

**Acceptance Criteria**:
- Horizontal scroll on tables
- First column sticky
- Touch scrolling smooth
- No content cut off

### US-004: First-Time User
**As a** new user  
**I want** an impressive, modern login page  
**So that** I feel confident in the application quality

**Acceptance Criteria**:
- Visually striking design
- Clear call-to-action
- Helpful error messages
- Password visibility toggle

---

## Edge Cases

### EC-001: Slow Network
- Skeleton loaders while content loads
- Progressive enhancement
- Offline indicator visible
- Retry mechanisms for failed requests

### EC-002: Long Data Lists
- Virtual scrolling for 100+ items
- Pagination controls visible
- Search/filter always accessible
- Performance remains smooth

### EC-003: Small Screen Devices
- Collapsible navigation
- Card view for tables
- Prioritized content display
- No horizontal page scroll

### EC-004: High Contrast Mode
- System preference detected
- Enhanced border visibility
- Stronger color differentiation
- Tested with accessibility tools

---

## API Requirements

> **Note**: The API audit revealed significant gaps between documented and implemented endpoints. The following requirements are necessary to fully support the UI redesign.

### API-001: Backend CRUD Operations

**Requirement**: Implement missing CRUD operations for core modules.

**Affected Modules**:
| Module | Missing Endpoints | Priority |
|--------|-------------------|----------|
| farmers.py | POST, PUT, DELETE, GET /{id}/balance, GET /search | P0 |
| daily_entries.py | GET /{id}, POST, PUT, DELETE, GET /summary, POST /bulk | P0 |
| settlements.py | GET /{id}, POST /generate, PUT /{id}/approve, PUT /{id}/pay | P1 |
| cash_advances.py | POST, PUT /{id}/approve, PUT /{id}/reject | P1 |
| users.py | GET /{id}, POST, PUT /{id}, DELETE /{id} | P1 |

**Acceptance Criteria**:
- All endpoints follow standard response envelope format
- Soft delete filters applied to all list queries
- Pagination supported on all list endpoints
- Proper error handling with consistent error response format

### API-002: Dashboard Activity Feed

**Requirement**: Create dashboard activity endpoint for recent actions feed.

**Endpoint Specification**:
```
GET /api/v1/dashboard/activity
```

**Response**:
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "uuid",
        "type": "entry_created | settlement_approved | advance_requested",
        "description": "Entry created for Raj Kumar - 10.5kg Rose",
        "timestamp": "2026-02-17T05:30:00Z",
        "user_id": "uuid",
        "entity_type": "daily_entry",
        "entity_id": "uuid"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 10,
      "total_items": 50
    }
  }
}
```

**Acceptance Criteria**:
- Returns last 50 activities across all modules
- Supports pagination
- Includes user information who performed the action
- Respects soft delete (excludes deleted entities)

### API-003: User Preferences API

**Requirement**: Create endpoints for user theme and preference management.

**Endpoint Specifications**:
```
GET /api/v1/users/me/preferences
PUT /api/v1/users/me/preferences
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "theme": "arctic | arctic-dark",
    "language": "en | ta",
    "dashboard_layout": "default | compact",
    "font_size": "normal | large",
    "reduced_motion": false
  }
}
```

**Acceptance Criteria**:
- Preferences persist across sessions
- Theme preference affects CSS class on root element
- Language preference syncs with i18next
- Reduced motion preference respects accessibility needs

### API-004: Response Format Standardization

**Requirement**: Standardize all API responses to match documented format.

**Standard Response Envelope**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 150,
    "total_pages": 8,
    "has_next": true,
    "has_previous": false
  }
}
```

**Modules Requiring Updates**:
- farmers.py (currently returns `{"farmers": [...]}`)
- daily_entries.py (currently returns `{"entries": [...]}`)
- settlements.py (currently returns `{"settlements": [...]}`)
- cash_advances.py (currently returns `{"advances": [...]}`)

### API-005: Soft Delete Implementation

**Requirement**: Add soft delete filters to all list queries.

**Affected Modules**:
| Module | Current Status | Fix Required |
|--------|---------------|--------------|
| farmers.py | ✅ Has filter | None |
| daily_entries.py | ❌ Missing | Add `DailyEntry.deleted_at == None` |
| settlements.py | ❌ Missing | Add `Settlement.deleted_at == None` |
| cash_advances.py | ❌ Missing | Add `CashAdvance.deleted_at == None` |

---

## Out of Scope

- ~~Backend API changes~~ **UPDATED**: API changes now in scope (see API Requirements section)
- Database schema modifications
- New feature development (beyond API completion)
- WhatsApp integration changes
- PDF/Excel report generation changes

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Visual consistency | 100% pages | Design review |
| Accessibility score | AAA | WCAG audit |
| Performance score | >90 | Lighthouse |
| User satisfaction | >4.5/5 | User feedback |
| Load time | <2s | Performance monitoring |

---

## Dependencies

- Existing Arctic Frost CSS (arctic-frost.css, arctic.css)
- Tailwind configuration (tailwind.config.arctic.js)
- i18n translation files (en.json, ta.json)
- Service Worker (public/sw.js)
- Offline store (store/offlineStore.js)

---

## References

- [Arctic Design System](frontend/docs/arctic-design-system.md)
- [Arctic Frost Design Spec](frontend/docs/arctic-frost-design-spec.md)
- [Arctic Accessibility Guide](frontend/docs/arctic-accessibility-guide.md)
- [Constitution](.specify/memory/constitution.md)
