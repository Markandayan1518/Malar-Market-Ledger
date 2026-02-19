<!--
=============================================================================
SYNC IMPACT REPORT
=============================================================================
Version change: INITIAL → 1.0.0
Modified principles: N/A (initial creation)
Added sections: All (initial creation)
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ compatible (no updates required)
  - .specify/templates/spec-template.md: ✅ compatible (no updates required)
  - .specify/templates/tasks-template.md: ✅ compatible (no updates required)
Follow-up TODOs: None
=============================================================================
-->

# Malar Market Digital Ledger Constitution

## Core Principles

### I. Offline-First Architecture

All features MUST be designed to function without internet connectivity during critical business hours (4-9 AM). The application MUST gracefully handle network interruptions and sync data when connectivity is restored.

**Requirements:**
- Service Worker MUST cache all critical assets and API responses
- IndexedDB MUST be used for local data persistence via `frontend/src/store/offlineStore.js`
- Background sync MUST queue operations and resolve conflicts using last-write-wins with timestamps
- UI MUST provide optimistic updates with rollback capability on sync failure

**Rationale:** The flower market operates during early morning hours when internet connectivity is unreliable. Business continuity is non-negotiable.

### II. Bilingual Support (English/Tamil)

ALL user-visible text MUST use the `t()` function from `react-i18next`. Translation keys MUST be added to both `frontend/src/i18n/en.json` and `frontend/src/i18n/ta.json` before deployment.

**Requirements:**
- No hardcoded strings in UI components
- Date/time formatting MUST be locale-aware
- Currency display MUST be localized appropriately
- Error messages and notifications MUST be translated

**Rationale:** The user base includes both English and Tamil speakers. Incomplete translations create friction and exclude users.

### III. Soft Delete Pattern

All database queries MUST filter deleted records using `where(Model.deleted_at == None)`. Models MUST include a `deleted_at` timestamp field for soft delete support.

**Requirements:**
- Never physically delete data from the database
- Always set `deleted_at` timestamp instead
- All queries MUST explicitly filter out soft-deleted records
- Audit trails MUST be preserved for compliance

**Rationale:** Business data (entries, settlements, advances) must be retained for financial auditing and dispute resolution.

### IV. Type Safety & Async Patterns

Backend MUST use SQLAlchemy 2.0 async patterns with proper type aliases from `app/dependencies.py`. All database operations MUST be awaited.

**Requirements:**
- Use `DatabaseSession`, `CurrentUser`, `CurrentStaffOrAdminUser`, `CurrentAdminUser` type aliases
- Primary keys MUST be `String(36)` UUIDs generated with `str(uuid.uuid4())`
- Currency fields MUST use `Numeric(10, 2)` for precision
- All DB operations MUST use `await`

**Rationale:** Type safety prevents runtime errors. Async patterns ensure non-blocking operations for concurrent users.

### V. Test-Driven Development

Backend tests MUST use the `requests` library (HTTP-based), NOT async test client. Frontend tests MUST use Playwright for e2e testing. A separate test database is required via `TEST_DATABASE_URL`.

**Requirements:**
- Backend: HTTP-based tests via `requests` library (see `backend/tests/conftest.py`)
- Frontend: Playwright e2e tests in `frontend/tests/`
- Test database MUST be separate from development/production
- Tests MUST pass before merge

**Rationale:** HTTP-based tests accurately reflect production behavior. E2E tests validate complete user flows including offline scenarios.

## Technology Standards

### Backend Stack
- Python FastAPI for REST API
- SQLAlchemy ORM with async support
- PostgreSQL via Supabase
- Redis for caching
- Twilio/Interakt for WhatsApp integration

### Frontend Stack
- React.js with Vite
- PWA with Workbox for offline support
- IndexedDB for local data storage
- Tailwind CSS with custom colors: `warm-cream`, `warm-sand`, `warm-taupe`, `warm-charcoal`, `warm-brown`, `accent-magenta`
- i18next for bilingual support

### Authentication
- JWT-based authentication with refresh tokens
- Tokens stored in localStorage: `auth_token`, `refresh_token`, `user_data`
- Role-based access control: Admin, Staff, Farmer

## Development Workflow

### Code Quality Gates
1. All tests MUST pass before merge
2. No hardcoded strings - all text via i18n
3. Soft delete filter on all queries
4. Type aliases used for dependencies
5. Currency precision maintained at 2 decimal places

### Review Requirements
- Code review required for all PRs
- Constitution compliance verification
- Translation completeness check
- Offline functionality verification

## Governance

This constitution supersedes all other development practices and conventions. Amendments require:
1. Documentation of the proposed change
2. Team review and approval
3. Migration plan for existing code if needed
4. Update to this constitution with version bump

All PRs and code reviews MUST verify compliance with these principles. Complexity beyond these standards MUST be justified in writing.

For runtime development guidance, refer to `AGENTS.md` in the repository root.

**Version**: 1.0.0 | **Ratified**: 2026-02-17 | **Last Amended**: 2026-02-17
