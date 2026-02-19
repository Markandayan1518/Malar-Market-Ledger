# Code Mode Rules (Non-Obvious Only)

## Backend Coding
- Always add `where(Model.deleted_at == None)` to queries - soft deletes are used everywhere
- Import type aliases from `app/dependencies.py`: `DatabaseSession`, `CurrentUser`, `CurrentStaffOrAdminUser`, `CurrentAdminUser`
- Primary keys are `String(36)` UUIDs - generate with `str(uuid.uuid4())`
- Currency fields use `Numeric(10, 2)` - always 2 decimal places

## Frontend Coding
- ALL user-visible text must use `t()` from `react-i18next` - add keys to both `en.json` and `ta.json`
- Use custom Tailwind colors: `warm-cream`, `warm-sand`, `warm-taupe`, `warm-charcoal`, `warm-brown`, `accent-magenta`
- Auth tokens stored in localStorage keys: `auth_token`, `refresh_token`, `user_data`
- Offline data stored in IndexedDB via `frontend/src/store/offlineStore.js`

## Testing
- Backend tests use `requests` library (HTTP-based), NOT async test client
- Frontend tests use Playwright (e2e), NOT Vitest - test files in `frontend/tests/`
