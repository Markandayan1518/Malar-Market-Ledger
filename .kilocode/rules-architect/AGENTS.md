# Architect Mode Rules (Non-Obvious Only)

## Architectural Constraints
- **Offline-First PWA**: Must work without network during 4-9 AM rush hours - data syncs when online
- **Soft Deletes**: All models use `deleted_at` timestamp - never hard delete, always filter queries
- **UUID Strings**: Primary keys are `String(36)` not native UUID - affects DB indexing strategy
- **Async SQLAlchemy 2.0**: All DB operations must be async - no sync patterns allowed

## Data Flow
- Frontend offline store: IndexedDB via `frontend/src/store/offlineStore.js`
- Backend caching: Redis for frequently accessed data
- Auth tokens: localStorage (`auth_token`, `refresh_token`, `user_data`)

## Bilingual Requirements
- All user-facing text requires translations in both `en.json` and `ta.json`
- Tamil font support needed for PDF reports - see `backend/docs/report-generation-guide.md`
- Time-based pricing: rates vary by time slot for flower pricing

## Integration Points
- WhatsApp bot: `backend/app/services/whatsapp_service.py` for farmer notifications
- PDF/Excel reports: `backend/app/services/pdf_service.py` and `excel_service.py`
- Audit logging: `backend/app/services/audit_service.py` for security events
