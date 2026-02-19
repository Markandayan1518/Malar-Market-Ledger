# Ask Mode Rules (Non-Obvious Only)

## Documentation Locations
- `docs/architecture.md` - System architecture details
- `docs/database-schema.md` - Complete database design
- `docs/api-design.md` - RESTful API documentation
- `backend/docs/report-generation-guide.md` - PDF report generation with Tamil font support

## Counterintuitive Structure
- Seed scripts in `scripts/seed/` (not in backend/) - run via `python scripts/seed/run_seed.py`
- Frontend tests in `frontend/tests/` (not in `src/`) - Playwright e2e tests
- Backend tests use HTTP requests (not async test client) - see `backend/tests/conftest.py`

## Key Context
- PWA designed for offline-first operation during 4-9 AM rush hours
- Bilingual: English and Tamil - all user text must be in both `en.json` and `ta.json`
- Time-based pricing: flower prices vary by time slot (morning vs evening market)
- WhatsApp bot integration for farmer notifications
