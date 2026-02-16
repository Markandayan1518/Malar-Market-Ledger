#!/usr/bin/env python3
"""
Main seed script for Malar Market Digital Ledger
Run this script to populate the database with sample data
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'backend'))
# Add current directory to path for seed modules
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from seed_users import seed_users
from seed_farmers import seed_farmers
from seed_flower_types import seed_flower_types
from seed_time_slots import seed_time_slots
from seed_market_rates import seed_market_rates
from seed_system_settings import seed_system_settings
from seed_daily_entries import seed_daily_entries
from seed_cash_advances import seed_cash_advances
from seed_settlements import seed_settlements

def main():
    """Main seed function"""
    print("Starting database seeding...")
    print("=" * 50)
    
    try:
        # Run all seed functions in order
        seed_system_settings()
        seed_flower_types()
        seed_time_slots()
        seed_market_rates()
        seed_users()
        seed_farmers()
        seed_daily_entries()
        seed_cash_advances()
        seed_settlements()
        
        print("=" * 50)
        print("✓ Database seeding completed successfully!")
        print("\nNext steps:")
        print("1. Verify data in database")
        print("2. Test application with seed data")
        print("3. Adjust seed data as needed")
        print("\nNote: To reset and reseed, run:")
        print("  - alembic downgrade base")
        print("  - python scripts/seed/run_seed.py")
        
    except Exception as e:
        print(f"✗ Error seeding database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
