# Database Migrations

This folder contains SQL migration scripts for the Malar Market Digital Ledger database.

## How to Apply Migrations

### Option 1: Using psql command line

```bash
# Connect to your database and run the migration
psql -h localhost -U postgres -d malar_market -f migrations/001_add_farmer_financial_fields.sql
psql -h localhost -U postgres -d malar_market -f migrations/002_add_daily_entry_adjustment_fields.sql
```

### Option 2: Using Docker

```bash
# If running PostgreSQL in Docker
docker exec -i malar-postgres psql -U postgres -d malar_market < migrations/001_add_farmer_financial_fields.sql
docker exec -i malar-postgres psql -U postgres -d malar_market < migrations/002_add_daily_entry_adjustment_fields.sql
```

### Option 3: Fresh Database

For a fresh database, simply run the init script:

```bash
cd backend
python init_db.py
```

This will create all tables with the latest schema including all new fields.

## Migration History

| # | File | Date | Description |
|---|------|------|-------------|
| 001 | `001_add_farmer_financial_fields.sql` | 2026-02-19 | Adds `commission_pct` and `flat_fee_monthly` to farmers table |
| 002 | `002_add_daily_entry_adjustment_fields.sql` | 2026-02-19 | Adds `manual_adj_amount` and `adj_reason_code` to daily_entries table |

## Rollback

To rollback a migration, you can manually run the inverse SQL:

### Rollback 001:
```sql
ALTER TABLE farmers DROP COLUMN IF EXISTS commission_pct;
ALTER TABLE farmers DROP COLUMN IF EXISTS flat_fee_monthly;
DROP INDEX IF EXISTS idx_farmers_commission_pct;
```

### Rollback 002:
```sql
ALTER TABLE daily_entries DROP CONSTRAINT IF EXISTS chk_adj_reason_code;
ALTER TABLE daily_entries DROP COLUMN IF EXISTS manual_adj_amount;
ALTER TABLE daily_entries DROP COLUMN IF EXISTS adj_reason_code;
DROP INDEX IF EXISTS idx_daily_entries_adj_reason;
```

## Notes

- All migrations use `IF NOT EXISTS` checks to be idempotent
- Migrations are safe to run on existing databases
- The models in `backend/app/models/` already include these fields, so the application will work correctly after migrations are applied
