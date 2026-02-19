# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project

Flower commission business PWA (offline-first, bilingual English/Tamil) for managing 50+ farmers. Backend: FastAPI + SQLAlchemy 2.0 async + PostgreSQL + Redis. Frontend: React + Vite + TailwindCSS + i18next.

## Commands

```bash
# All services
./run.sh start          # Start backend + frontend
./run.sh stop           # Stop all services
./run.sh status         # Check service status
./run.sh logs backend   # View backend logs
./run.sh seed           # Seed database with sample data

# Backend (from backend/)
source venv/bin/activate && pytest                                    # Run all tests
pytest tests/test_api/test_farmers.py::test_create_farmer            # Run single test
pytest --cov=app --cov-report=html                                    # Tests with coverage

# Frontend (from frontend/)
npm run test              # Playwright e2e tests
npm run test:api          # API tests only
npm run test:headed       # Tests with visible browser
```

## Critical Patterns

### Backend
- **Soft Delete**: All queries MUST filter `where(Model.deleted_at == None)` - models use soft deletes
- **Type Aliases**: Use `DatabaseSession`, `CurrentUser`, `CurrentStaffOrAdminUser`, `CurrentAdminUser` from `app/dependencies.py`
- **Async Required**: All DB operations use SQLAlchemy 2.0 async - always `await` queries
- **UUID Strings**: Primary keys are `String(36)` UUIDs, not native UUID type

### Frontend
- **Translations**: ALL user text via `t()` from `react-i18next` - keys in `frontend/src/i18n/en.json` and `ta.json`
- **Custom Tailwind Colors**: `warm-cream`, `warm-sand`, `warm-taupe`, `warm-charcoal`, `warm-brown`, `accent-magenta`
- **LocalStorage Keys**: `auth_token`, `refresh_token`, `user_data`
- **Offline Store**: IndexedDB via `frontend/src/store/offlineStore.js`

### Testing
- **Backend**: HTTP-based tests via `requests` library (not async test client) - see `backend/tests/conftest.py`
- **Frontend**: Playwright for e2e (not Vitest) - tests in `frontend/tests/`
- **Test DB**: Separate test database required - `TEST_DATABASE_URL` env var
