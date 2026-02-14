# Malar Market Digital Ledger - Database Migration Guide

## Table of Contents

1. [Overview](#overview)
2. [Initial Database Setup](#initial-database-setup)
3. [Migration Strategy](#migration-strategy)
4. [Seed Data](#seed-data)
5. [Production Data Migration](#production-data-migration)
6. [Backup and Restore](#backup-and-restore)
7. [Rollback Procedures](#rollback-procedures)
8. [Data Validation](#data-validation)
9. [Maintenance Tasks](#maintenance-tasks)

---

## Overview

This guide provides comprehensive procedures for database setup, migration, seeding, backup, and maintenance for the Malar Market Digital Ledger.

### Database Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                      │
│  (Supabase / Self-hosted)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tables:                                                   │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ users                  │ User accounts           │     │
│  │ farmers                │ Farmer information     │     │
│  │ flower_types           │ Flower varieties      │     │
│  │ time_slots             │ Time-based pricing     │     │
│  │ market_rates           │ Current rates         │     │
│  │ daily_entries          │ Daily flower entries  │     │
│  │ cash_advances          │ Cash advance records  │     │
│  │ settlements            │ Settlement records     │     │
│  │ settlement_items        │ Settlement line items  │     │
│  │ security_logs          │ Audit trail           │     │
│  │ notifications          │ Notifications         │     │
│  │ system_settings        │ Configuration         │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                             │
│  Indexes:                                                  │
│  - Primary keys (id)                                      │
│  - Foreign keys (relationships)                               │
│  - Performance indexes (frequently queried columns)              │
│  - Unique constraints (business rules)                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Migration Tools

- **Alembic**: Database migration framework
- **SQLAlchemy**: ORM for database operations
- **psql**: PostgreSQL command-line tool
- **pg_dump**: Backup utility
- **pg_restore**: Restore utility

---

## Initial Database Setup

### 1. Create Database

#### Using Supabase

```bash
# Log in to Supabase dashboard
# https://supabase.com/dashboard

# Create new project
# - Name: malar-market-ledger
# - Database Password: Generate strong password
# - Region: Choose nearest region
```

#### Using Self-Hosted PostgreSQL

```bash
# Connect to PostgreSQL server
psql -U postgres

# Create database
CREATE DATABASE malar_market_ledger;

# Create user
CREATE USER malar_user WITH PASSWORD 'strong_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE malar_market_ledger TO malar_user;

# Exit
\q
```

### 2. Initialize Alembic

```bash
# Navigate to backend directory
cd backend

# Initialize Alembic (first time only)
alembic init alembic

# This creates:
# - alembic/ directory
# - alembic.ini file
# - env.py file
```

### 3. Configure Alembic

Edit `alembic.ini`:

```ini
[alembic]
script_location = alembic
prepend_sys_path = .
version_path_separator = os
version_locations = %(here)s/bar/versions

# Database URL (can be overridden by environment variable)
sqlalchemy.url = postgresql://malar_user:password@localhost:5432/malar_market_ledger
```

Edit `alembic/env.py`:

```python
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
import sys
import os

# Add models directory to Python path
sys.path.append(os.getcwd())

# Import your Base and models
from app.database import Base
from app.models import *  # Import all models

# Set target metadata
target_metadata = Base.metadata

# Other configuration remains the same
```

### 4. Create Initial Migration

```bash
# Generate migration from models
alembic revision --autogenerate -m "Initial migration"

# This creates:
# - alembic/versions/001_initial_migration.py
# - Contains CREATE TABLE statements for all models
```

### 5. Run Migration

```bash
# Apply migration to database
alembic upgrade head

# Verify migration
alembic current

# Expected output:
# <current revision hash>
```

---

## Migration Strategy

### Migration Workflow

```mermaid
graph LR
    A[Code Change] --> B[Create Migration]
    B --> C[Test Locally]
    C --> D[Review SQL]
    D --> E[Commit to Git]
    E --> F[Deploy to Staging]
    F --> G[Run Migration]
    G --> H[Verify]
    H --> I[Deploy to Production]
    I --> J[Run Migration]
    J --> K[Monitor]
    K --> L[Rollback if Issues]
```

### Creating Migrations

#### Adding New Table

```bash
# 1. Create model in app/models/new_table.py
# 2. Import model in app/models/__init__.py
# 3. Generate migration
alembic revision --autogenerate -m "Add new_table"
```

#### Adding New Column

```bash
# 1. Add column to model
# 2. Generate migration
alembic revision --autogenerate -m "Add column to table"
```

#### Modifying Column

```bash
# 1. Modify column in model
# 2. Generate migration
alembic revision --autogenerate -m "Modify column in table"
```

#### Dropping Column

```bash
# 1. Remove column from model
# 2. Generate migration
alembic revision --autogenerate -m "Drop column from table"
```

### Manual Migration

For complex changes that require custom SQL:

```bash
# Create empty migration
alembic revision -m "Custom migration"

# Edit the generated migration file
# Add custom upgrade and downgrade functions
```

Example manual migration:

```python
# alembic/versions/002_custom_migration.py
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Custom SQL operations
    op.execute("""
        CREATE INDEX idx_daily_entries_composite 
        ON daily_entries (farmer_id, entry_date);
    """)
    
    # Add new column with default
    op.add_column('daily_entries', 
        sa.Column('sync_status', sa.String(20), 
                 server_default='synced'))

def downgrade():
    # Reverse operations
    op.drop_index('idx_daily_entries_composite')
    op.drop_column('daily_entries', 'sync_status')
```

### Running Migrations

#### Local Development

```bash
# Apply migration
alembic upgrade head

# Rollback one step
alembic downgrade -1

# Rollback to specific version
alembic downgrade <revision_hash>

# Check current version
alembic current

# View migration history
alembic history
```

#### Staging/Production

```bash
# Set environment variables
export DATABASE_URL=postgresql://user:password@host:5432/database_name

# Run migration
alembic upgrade head

# Verify
alembic current
```

### Migration Best Practices

1. **Always review generated SQL** before applying
2. **Test migrations on staging** before production
3. **Keep migrations reversible** (provide downgrade)
4. **Use transactions** for data migrations
5. **Add comments** to complex migrations
6. **Backup before major migrations**
7. **Monitor migration performance**
8. **Test rollback procedures**

---

## Seed Data

### Seed Data Structure

```
scripts/seed/
├── __init__.py
├── seed_users.py          # Admin and staff users
├── seed_farmers.py        # Sample farmers
├── seed_flower_types.py   # Flower varieties
├── seed_time_slots.py     # Time slots
├── seed_market_rates.py    # Initial rates
├── seed_system_settings.py # Configuration
└── run_seed.py          # Main seed script
```

### Seed Users

```python
# scripts/seed/seed_users.py
from app.database import SessionLocal
from app.models.user import User
from app.core.auth import get_password_hash

def seed_users():
    db = SessionLocal()
    
    # Create admin user
    admin = User(
        email="admin@malar.com",
        full_name="Admin User",
        phone="+919876543210",
        role="admin",
        is_active=True,
        email_verified=True,
        language_preference="en",
        password_hash=get_password_hash("admin123")
    )
    db.add(admin)
    
    # Create staff users
    staff1 = User(
        email="staff1@malar.com",
        full_name="Staff User 1",
        phone="+919876543211",
        role="staff",
        is_active=True,
        email_verified=True,
        language_preference="ta",
        password_hash=get_password_hash("staff123")
    )
    db.add(staff1)
    
    db.commit()
    db.close()
    
    print("✓ Users seeded successfully")

if __name__ == "__main__":
    seed_users()
```

### Seed Farmers

```python
# scripts/seed/seed_farmers.py
from app.database import SessionLocal
from app.models.farmer import Farmer
import uuid

def seed_farmers():
    db = SessionLocal()
    
    farmers_data = [
        {
            "farmer_code": "FAR001",
            "name": "Raj Kumar",
            "village": "Madurai",
            "phone": "+919876543211",
            "whatsapp_number": "+919876543211",
            "address": "123, Flower Street, Madurai"
        },
        {
            "farmer_code": "FAR002",
            "name": "Kumar Raja",
            "village": "Dindigul",
            "phone": "+919876543212",
            "whatsapp_number": "+919876543212",
            "address": "456, Market Road, Dindigul"
        },
        {
            "farmer_code": "FAR003",
            "name": "Muthu Pandi",
            "village": "Trichy",
            "phone": "+919876543213",
            "whatsapp_number": "+919876543213",
            "address": "789, Garden Lane, Trichy"
        }
    ]
    
    for farmer_data in farmers_data:
        farmer = Farmer(
            id=uuid.uuid4(),
            **farmer_data
        )
        db.add(farmer)
    
    db.commit()
    db.close()
    
    print("✓ Farmers seeded successfully")

if __name__ == "__main__":
    seed_farmers()
```

### Seed Flower Types

```python
# scripts/seed/seed_flower_types.py
from app.database import SessionLocal
from app.models.flower_type import FlowerType
import uuid

def seed_flower_types():
    db = SessionLocal()
    
    flower_types = [
        {
            "name": "Rose",
            "name_ta": "ரோஜா",
            "code": "FLW001",
            "description": "Fresh red roses",
            "unit": "kg"
        },
        {
            "name": "Jasmine",
            "name_ta": "மல்லிகை",
            "code": "FLW002",
            "description": "Fragrant jasmine flowers",
            "unit": "kg"
        },
        {
            "name": "Marigold",
            "name_ta": "சாமந்தி",
            "code": "FLW003",
            "description": "Bright marigold flowers",
            "unit": "kg"
        },
        {
            "name": "Lotus",
            "name_ta": "தாமரை",
            "code": "FLW004",
            "description": "Sacred lotus flowers",
            "unit": "piece"
        },
        {
            "name": "Chrysanthemum",
            "name_ta": "சாமந்தி",
            "code": "FLW005",
            "description": "Colorful chrysanthemum",
            "unit": "kg"
        }
    ]
    
    for flower_data in flower_types:
        flower_type = FlowerType(
            id=uuid.uuid4(),
            **flower_data
        )
        db.add(flower_type)
    
    db.commit()
    db.close()
    
    print("✓ Flower types seeded successfully")

if __name__ == "__main__":
    seed_flower_types()
```

### Seed Time Slots

```python
# scripts/seed/seed_time_slots.py
from app.database import SessionLocal
from app.models.time_slot import TimeSlot
import uuid

def seed_time_slots():
    db = SessionLocal()
    
    time_slots = [
        {
            "name": "Early Morning",
            "name_ta": "காலை",
            "start_time": "04:00:00",
            "end_time": "06:00:00"
        },
        {
            "name": "Morning Peak",
            "name_ta": "காலை உச்சம்",
            "start_time": "06:00:00",
            "end_time": "08:00:00"
        },
        {
            "name": "Late Morning",
            "name_ta": "மாலை",
            "start_time": "08:00:00",
            "end_time": "10:00:00"
        },
        {
            "name": "Afternoon",
            "name_ta": "மதியன்",
            "start_time": "10:00:00",
            "end_time": "14:00:00"
        },
        {
            "name": "Evening",
            "name_ta": "மாலை",
            "start_time": "14:00:00",
            "end_time": "18:00:00"
        }
    ]
    
    for slot_data in time_slots:
        time_slot = TimeSlot(
            id=uuid.uuid4(),
            **slot_data
        )
        db.add(time_slot)
    
    db.commit()
    db.close()
    
    print("✓ Time slots seeded successfully")

if __name__ == "__main__":
    seed_time_slots()
```

### Seed Market Rates

```python
# scripts/seed/seed_market_rates.py
from app.database import SessionLocal
from app.models.market_rate import MarketRate
from app.models.flower_type import FlowerType
from app.models.time_slot import TimeSlot
import uuid
from datetime import date

def seed_market_rates():
    db = SessionLocal()
    
    # Get flower types and time slots
    flower_types = db.query(FlowerType).all()
    time_slots = db.query(TimeSlot).all()
    
    # Create rates for each flower type and time slot
    for flower_type in flower_types:
        for time_slot in time_slots:
            # Different rates for different time slots
            if "Early" in time_slot.name:
                rate = 150.00
            elif "Peak" in time_slot.name:
                rate = 180.00
            elif "Late" in time_slot.name:
                rate = 140.00
            else:
                rate = 120.00
            
            market_rate = MarketRate(
                id=uuid.uuid4(),
                flower_type_id=flower_type.id,
                time_slot_id=time_slot.id,
                rate_per_unit=rate,
                effective_date=date.today()
            )
            db.add(market_rate)
    
    db.commit()
    db.close()
    
    print("✓ Market rates seeded successfully")

if __name__ == "__main__":
    seed_market_rates()
```

### Seed System Settings

```python
# scripts/seed/seed_system_settings.py
from app.database import SessionLocal
from app.models.system_setting import SystemSetting
import uuid

def seed_system_settings():
    db = SessionLocal()
    
    settings = [
        {
            "key": "commission_rate",
            "value": "5.0",
            "value_type": "number",
            "description": "Default commission rate percentage",
            "is_public": False
        },
        {
            "key": "market_open_time",
            "value": "04:00:00",
            "value_type": "string",
            "description": "Market opening time",
            "is_public": True
        },
        {
            "key": "market_close_time",
            "value": "18:00:00",
            "value_type": "string",
            "description": "Market closing time",
            "is_public": True
        },
        {
            "key": "settlement_frequency",
            "value": "weekly",
            "value_type": "string",
            "description": "Settlement frequency",
            "is_public": False
        },
        {
            "key": "whatsapp_enabled",
            "value": "true",
            "value_type": "boolean",
            "description": "WhatsApp integration enabled",
            "is_public": False
        }
    ]
    
    for setting_data in settings:
        setting = SystemSetting(
            id=uuid.uuid4(),
            **setting_data
        )
        db.add(setting)
    
    db.commit()
    db.close()
    
    print("✓ System settings seeded successfully")

if __name__ == "__main__":
    seed_system_settings()
```

### Main Seed Script

```python
# scripts/seed/run_seed.py
import sys
import os

# Add scripts directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from seed.seed_users import seed_users
from seed.seed_farmers import seed_farmers
from seed.seed_flower_types import seed_flower_types
from seed.seed_time_slots import seed_time_slots
from seed.seed_market_rates import seed_market_rates
from seed.seed_system_settings import seed_system_settings

def run_all_seeds():
    print("Starting database seeding...")
    print("-" * 50)
    
    try:
        seed_system_settings()
        seed_flower_types()
        seed_time_slots()
        seed_users()
        seed_farmers()
        seed_market_rates()
        
        print("-" * 50)
        print("✓ All seed data created successfully!")
        print("\nNext steps:")
        print("1. Verify data in database")
        print("2. Test application with seed data")
        print("3. Adjust seed data as needed")
        
    except Exception as e:
        print(f"✗ Error seeding database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_all_seeds()
```

### Running Seed Data

```bash
# Run all seeds
cd backend
python scripts/seed/run_seed.py

# Run specific seed
python scripts/seed/seed_users.py

# Reset and reseed (development only)
alembic downgrade base
alembic upgrade head
python scripts/seed/run_seed.py
```

---

## Production Data Migration

### Migration Planning

#### Pre-Migration Checklist

- [ ] Backup current database
- [ ] Test migration on staging
- [ ] Document migration steps
- [ ] Estimate migration time
- [ ] Plan rollback procedure
- [ ] Notify stakeholders
- [ ] Schedule maintenance window
- [ ] Prepare rollback script

#### Migration Strategy

**Option 1: Zero-Downtime Migration**

```python
# 1. Create new tables with suffix _new
CREATE TABLE daily_entries_new (
    -- Same structure as daily_entries
);

# 2. Copy data to new tables
INSERT INTO daily_entries_new 
SELECT * FROM daily_entries;

# 3. Verify data integrity
SELECT COUNT(*) FROM daily_entries;
SELECT COUNT(*) FROM daily_entries_new;

# 4. Rename tables
ALTER TABLE daily_entries RENAME TO daily_entries_old;
ALTER TABLE daily_entries_new RENAME TO daily_entries;

# 5. Drop old tables (after verification)
DROP TABLE daily_entries_old;
```

**Option 2: Application-Layer Migration**

```python
# 1. Deploy new version with dual schema support
# 2. Application writes to both old and new schemas
# 3. Background job migrates data from old to new
# 4. Switch application to read from new schema
# 5. Remove old schema support
```

### Data Transformation

#### Example: Migrating Farmer Balances

```python
# scripts/migrations/migrate_farmer_balances.py
from app.database import SessionLocal
from app.models.farmer import Farmer

def migrate_farmer_balances():
    db = SessionLocal()
    
    # Get all farmers
    farmers = db.query(Farmer).all()
    
    for farmer in farmers:
        # Recalculate balance from settlements and advances
        total_settlements = sum(s.net_payable for s in farmer.settlements)
        total_advances = sum(a.amount for a in farmer.cash_advances if a.status == 'approved')
        
        # Update balance
        farmer.current_balance = total_settlements - total_advances
        farmer.total_settlements = total_settlements
        farmer.total_advances = total_advances
    
    db.commit()
    db.close()
    
    print("✓ Farmer balances migrated successfully")

if __name__ == "__main__":
    migrate_farmer_balances()
```

#### Example: Migrating Time Slots

```python
# scripts/migrations/migrate_time_slots.py
from app.database import SessionLocal
from app.models.time_slot import TimeSlot
from app.models.daily_entry import DailyEntry

def migrate_time_slots():
    db = SessionLocal()
    
    # Get entries without time slots
    entries = db.query(DailyEntry).filter(DailyEntry.time_slot_id == None).all()
    
    for entry in entries:
        # Determine time slot based on entry time
        hour = entry.entry_time.hour
        
        if 4 <= hour < 6:
            slot_name = "Early Morning"
        elif 6 <= hour < 8:
            slot_name = "Morning Peak"
        elif 8 <= hour < 10:
            slot_name = "Late Morning"
        elif 10 <= hour < 14:
            slot_name = "Afternoon"
        else:
            slot_name = "Evening"
        
        # Find time slot
        time_slot = db.query(TimeSlot).filter(TimeSlot.name == slot_name).first()
        
        if time_slot:
            entry.time_slot_id = time_slot.id
    
    db.commit()
    db.close()
    
    print("✓ Time slots migrated successfully")

if __name__ == "__main__":
    migrate_time_slots()
```

### Post-Migration Verification

```sql
-- Verify data integrity
SELECT 
    'farmers' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT id) as unique_ids
FROM farmers
UNION ALL
SELECT 
    'daily_entries' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT id) as unique_ids
FROM daily_entries
UNION ALL
SELECT 
    'settlements' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT id) as unique_ids
FROM settlements;

-- Verify foreign key constraints
SELECT 
    COUNT(*) as orphaned_entries
FROM daily_entries de
LEFT JOIN farmers f ON de.farmer_id = f.id
WHERE f.id IS NULL;

-- Verify data consistency
SELECT 
    de.id,
    de.quantity,
    de.rate_per_unit,
    de.total_amount,
    (de.quantity * de.rate_per_unit) as calculated_amount
FROM daily_entries de
WHERE de.total_amount != (de.quantity * de.rate_per_unit);
```

---

## Backup and Restore

### Backup Strategies

#### Full Database Backup

```bash
# Using pg_dump
pg_dump -h localhost -U malar_user -d malar_market_ledger \
  -F c -f backup_$(date +%Y%m%d_%H%M%S).sql

# Using custom format
pg_dump -h localhost -U malar_user -d malar_market_ledger \
  --format=custom \
  --column-inserts \
  -f backup_custom_$(date +%Y%m%d_%H%M%S).sql
```

#### Schema-Only Backup

```bash
# Backup schema only
pg_dump -h localhost -U malar_user -d malar_market_ledger \
  --schema-only \
  -f schema_backup_$(date +%Y%m%d).sql
```

#### Data-Only Backup

```bash
# Backup data only
pg_dump -h localhost -U malar_user -d malar_market_ledger \
  --data-only \
  -f data_backup_$(date +%Y%m%d).sql
```

#### Table-Specific Backup

```bash
# Backup specific table
pg_dump -h localhost -U malar_user -d malar_market_ledger \
  -t farmers \
  -f farmers_backup_$(date +%Y%m%d).sql
```

### Supabase Backup

```bash
# Supabase automatic backups
# Dashboard > Database > Backups
# - Daily backups enabled
# - 30-day retention
# - Point-in-time recovery (7 days)

# Manual backup
# Dashboard > Database > Backups > Create Backup
```

### Restore Procedures

#### Restore from Full Backup

```bash
# Drop existing database
dropdb -h localhost -U malar_user malar_market_ledger

# Create new database
createdb -h localhost -U malar_user malar_market_ledger

# Restore from backup
psql -h localhost -U malar_user -d malar_market_ledger \
  -f backup_20260214_120000.sql

# Verify restore
psql -h localhost -U malar_user -d malar_market_ledger \
  -c "SELECT COUNT(*) FROM farmers;"
```

#### Restore from Table Backup

```bash
# Restore specific table
psql -h localhost -U malar_user -d malar_market_ledger \
  -f farmers_backup_20260214.sql

# Verify table
psql -h localhost -U malar_user -d malar_market_ledger \
  -c "SELECT COUNT(*) FROM farmers;"
```

#### Point-in-Time Recovery (Supabase)

```bash
# Supabase dashboard
# Database > Point-in-Time Recovery
# Select timestamp to restore
# Preview changes
# Confirm restore
```

### Backup Automation

```bash
# Cron job for daily backups
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /usr/bin/pg_dump -h localhost -U malar_user \
  -d malar_market_ledger -F c \
  -f /backups/malar_$(date +\%Y\%m\%d).sql

# Keep last 30 days
0 3 * * * find /backups -name "malar_*.sql" -mtime +30 -delete
```

### Backup Verification

```bash
# Verify backup file
ls -lh backup_20260214_120000.sql

# Check backup contents
head -n 50 backup_20260214_120000.sql

# Test restore to test database
createdb test_restore
psql -d test_restore -f backup_20260214_120000.sql
dropdb test_restore
```

---

## Rollback Procedures

### Migration Rollback

#### Using Alembic

```bash
# Rollback one migration
alembic downgrade -1

# Rollback to specific version
alembic downgrade <revision_hash>

# Rollback to base (all migrations)
alembic downgrade base

# Verify current version
alembic current
```

#### Manual Rollback

```sql
-- Rollback schema change
ALTER TABLE daily_entries DROP COLUMN new_column;

-- Restore old table
ALTER TABLE daily_entries_old RENAME TO daily_entries;

-- Drop new table
DROP TABLE daily_entries_new;
```

### Data Rollback

#### Restore from Backup

```bash
# Stop application
sudo systemctl stop malar-api

# Restore from backup
psql -h localhost -U malar_user -d malar_market_ledger \
  -f backup_20260214_120000.sql

# Verify data
psql -h localhost -U malar_user -d malar_market_ledger \
  -c "SELECT COUNT(*) FROM farmers;"

# Restart application
sudo systemctl start malar-api
```

### Rollback Verification

```bash
# Verify application health
curl http://localhost:8000/health

# Check application logs
sudo journalctl -u malar-api -f

# Monitor for errors
tail -f /var/log/malar-api/app.log
```

---

## Data Validation

### Validation Checks

#### Data Integrity Checks

```sql
-- Check for orphaned records
SELECT 
    'daily_entries' as table_name,
    COUNT(*) as orphaned_count
FROM daily_entries de
LEFT JOIN farmers f ON de.farmer_id = f.id
WHERE f.id IS NULL;

-- Check for duplicate records
SELECT 
    farmer_id,
    entry_date,
    COUNT(*) as duplicate_count
FROM daily_entries
GROUP BY farmer_id, entry_date
HAVING COUNT(*) > 1;

-- Check for negative values
SELECT 
    id,
    quantity,
    total_amount,
    current_balance
FROM daily_entries
WHERE quantity < 0 
   OR total_amount < 0;

-- Check for null values in required fields
SELECT 
    COUNT(*) as null_farmer_id
FROM daily_entries
WHERE farmer_id IS NULL;
```

#### Business Logic Checks

```sql
-- Verify settlement calculations
SELECT 
    s.id,
    s.gross_amount,
    s.total_commission,
    s.total_fees,
    s.total_advances,
    s.net_payable,
    (s.gross_amount - s.total_commission - s.total_fees - s.total_advances) 
        as calculated_net
FROM settlements s
WHERE s.net_payable != 
    (s.gross_amount - s.total_commission - s.total_fees - s.total_advances);

-- Verify farmer balances
SELECT 
    f.id,
    f.farmer_code,
    f.current_balance,
    (f.total_settlements - f.total_advances) as calculated_balance
FROM farmers f
WHERE f.current_balance != (f.total_settlements - f.total_advances);

-- Verify commission calculations
SELECT 
    de.id,
    de.quantity,
    de.rate_per_unit,
    de.total_amount,
    de.commission_rate,
    de.commission_amount,
    (de.total_amount * de.commission_rate / 100) as calculated_commission
FROM daily_entries de
WHERE de.commission_amount != 
    (de.total_amount * de.commission_rate / 100);
```

#### Referential Integrity Checks

```sql
-- Check foreign key constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, ccu.table_name;

-- Check for circular references
-- (Custom query based on your schema)
```

### Validation Script

```python
# scripts/validate_data.py
from app.database import SessionLocal
from app.models import *

def validate_data():
    db = SessionLocal()
    
    errors = []
    
    # Check for orphaned entries
    orphaned_entries = db.query(DailyEntry).filter(
        ~DailyEntry.farmer_id.in_(
            db.query(Farmer.id).all()
        )
    ).all()
    
    if orphaned_entries:
        errors.append(f"Found {len(orphaned_entries)} orphaned entries")
    
    # Check for negative balances
    negative_balances = db.query(Farmer).filter(
        Farmer.current_balance < 0
    ).all()
    
    if negative_balances:
        errors.append(f"Found {len(negative_balances)} farmers with negative balances")
    
    # Check for invalid settlements
    invalid_settlements = db.query(Settlement).filter(
        Settlement.net_payable < 0
    ).all()
    
    if invalid_settlements:
        errors.append(f"Found {len(invalid_settlements)} settlements with negative net payable")
    
    if errors:
        print("✗ Data validation errors found:")
        for error in errors:
            print(f"  - {error}")
        return False
    else:
        print("✓ Data validation passed")
        return True

if __name__ == "__main__":
    validate_data()
```

---

## Maintenance Tasks

### Regular Maintenance

#### Daily Tasks

```sql
-- Check database size
SELECT 
    pg_size_pretty(pg_database_size('malar_market_ledger')) as database_size;

-- Check table sizes
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Check active connections
SELECT 
    count(*) as active_connections
FROM pg_stat_activity
WHERE state = 'active';
```

#### Weekly Tasks

```sql
-- Vacuum and analyze tables
VACUUM ANALYZE daily_entries;
VACUUM ANALYZE settlements;
VACUUM ANALYZE farmers;

-- Reindex tables
REINDEX TABLE daily_entries;
REINDEX TABLE settlements;
REINDEX TABLE farmers;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC
LIMIT 10;
```

#### Monthly Tasks

```sql
-- Analyze slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check for bloat
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as actual_size,
    (pg_total_relation_size(schemaname||'.'||tablename) - 
     pg_relation_size(schemaname||'.'||tablename)) as bloat_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY bloat_size DESC
LIMIT 10;
```

### Performance Optimization

```sql
-- Create missing indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_entries_date 
ON daily_entries(entry_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_entries_farmer_date 
ON daily_entries(farmer_id, entry_date);

-- Update statistics
ANALYZE daily_entries;
ANALYZE settlements;
ANALYZE farmers;
```

### Cleanup Tasks

```sql
-- Archive old data (optional)
CREATE TABLE daily_entries_archive AS
SELECT * FROM daily_entries
WHERE entry_date < CURRENT_DATE - INTERVAL '1 year';

-- Delete archived data
DELETE FROM daily_entries
WHERE entry_date < CURRENT_DATE - INTERVAL '1 year';

-- Clean up old logs
DELETE FROM security_logs
WHERE created_at < CURRENT_DATE - INTERVAL '90 days';

-- Clean up old notifications
DELETE FROM notifications
WHERE created_at < CURRENT_DATE - INTERVAL '30 days';
```

---

## Troubleshooting

### Common Issues

#### Migration Fails

**Problem**: Migration fails with error

**Solution**:
```bash
# Check migration SQL
alembic upgrade head --sql

# Test migration manually
psql -d malar_market_ledger -f migration.sql

# Check database logs
tail -f /var/log/postgresql/postgresql.log
```

#### Seed Data Fails

**Problem**: Seed script fails with error

**Solution**:
```bash
# Check database connection
psql -d malar_market_ledger -c "SELECT 1;"

# Check for duplicate data
psql -d malar_market_ledger -c "SELECT farmer_code FROM farmers;"

# Run seed with debug output
python scripts/seed/run_seed.py --verbose
```

#### Backup Fails

**Problem**: Backup fails with error

**Solution**:
```bash
# Check disk space
df -h

# Check database permissions
psql -d malar_market_ledger -c "\l+"

# Try different backup method
pg_dump -h localhost -U malar_user -d malar_market_ledger \
  --format=directory -f backup_dir
```

#### Restore Fails

**Problem**: Restore fails with error

**Solution**:
```bash
# Check backup file integrity
head backup_20260214.sql

# Check database exists
psql -l

# Create new database
createdb test_restore

# Restore to test database
psql -d test_restore -f backup_20260214.sql
```

---

## Best Practices

### Migration Best Practices

1. **Always test on staging** before production
2. **Create reversible migrations** whenever possible
3. **Document migration steps** thoroughly
4. **Backup before major changes**
5. **Use transactions** for data changes
6. **Monitor migration performance**
7. **Verify data integrity** after migration
8. **Have rollback plan** ready

### Backup Best Practices

1. **Automate backups** with cron jobs
2. **Test restore procedures** regularly
3. **Keep multiple backup copies**
4. **Store backups off-site**
5. **Monitor backup success**
6. **Verify backup integrity**
7. **Document backup retention** policy

### Data Validation Best Practices

1. **Run validation after changes**
2. **Monitor for data anomalies**
3. **Set up alerts** for data issues
4. **Regular integrity checks**
5. **Document validation rules**
6. **Automate validation** where possible

---

**Document Version**: 1.0
**Last Updated**: 2026-02-14
**Author**: Database Team
