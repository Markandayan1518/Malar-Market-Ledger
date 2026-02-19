# Debug Mode Rules (Non-Obvious Only)

## Backend Debugging
- Logs location: `./run.sh logs backend` or `tail -f logs/backend.log`
- API docs at http://localhost:8000/docs (Swagger UI) - use for testing endpoints
- Test database is separate - set `TEST_DATABASE_URL` env var for test runs
- Backend tests use HTTP `requests` library, not async test client - see `backend/tests/conftest.py`

## Frontend Debugging
- Playwright tests in headed mode: `npm run test:headed` (visible browser)
- Playwright UI mode: `npm run test:ui` for interactive debugging
- Test report: `npm run test:report` opens HTML report from `frontend/playwright-report/`
- Auth state persists in `auth-state.json` for Playwright tests

## Common Issues
- Soft deletes: If query returns no results, check if `deleted_at == None` filter is missing
- UUID primary keys: Must be `String(36)`, not native UUID type
- Translations missing: Check both `en.json` and `ta.json` have the key
