#!/usr/bin/env python3
"""
Main seed script for Malar Market Digital Ledger
Run this script to populate the database with Faker-generated sample data

Usage:
    python scripts/seed/run_seed.py              # Default: 50 farmers
    python scripts/seed/run_seed.py --farmers 100  # Custom farmer count
    python scripts/seed/run_seed.py --quick       # Quick seed with less data
"""

import sys
import os
import argparse
import asyncio

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'backend'))
# Add current directory to path for seed modules
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Import seed functions
from seed_users import seed_users
from seed_farmers import seed_farmers
from seed_flower_types import seed_flower_types
from seed_time_slots import seed_time_slots
from seed_market_rates import seed_market_rates
from seed_daily_entries import seed_daily_entries
from seed_cash_advances import seed_cash_advances
from seed_settlements import seed_settlements


async def seed_all(farmers_count=50, quick_mode=False):
    """Main seed function that runs all seed scripts"""
    print("=" * 60)
    print("  MALAR MARKET LEDGER - Database Seeding with Faker")
    print("=" * 60)
    print()
    
    if quick_mode:
        farmers_count = 10
        entries_per_farmer = 2
        advances_per_farmer = 1
        settlements_per_farmer = 1
        market_days = 7
        print("🚀 Quick mode enabled - generating minimal data")
    else:
        entries_per_farmer = 5
        advances_per_farmer = 2
        settlements_per_farmer = 2
        market_days = 30
    
    print(f"📊 Configuration:")
    print(f"   - Farmers: {farmers_count}")
    print(f"   - Entries per farmer: ~{entries_per_farmer}")
    print(f"   - Advances per farmer: ~{advances_per_farmer}")
    print(f"   - Settlements per farmer: ~{settlements_per_farmer}")
    print(f"   - Market rate history: {market_days} days")
    print()
    
    try:
        # Step 1: System settings (if exists)
        print("Step 1/9: System Settings")
        try:
            from seed_system_settings import seed_system_settings
            await seed_system_settings()
        except ImportError:
            print("  ⚠ System settings seed not found, skipping...")
        print()
        
        # Step 2: Flower types
        print("Step 2/9: Flower Types")
        await seed_flower_types()
        print()
        
        # Step 3: Time slots
        print("Step 3/9: Time Slots")
        await seed_time_slots()
        print()
        
        # Step 4: Market rates
        print("Step 4/9: Market Rates")
        await seed_market_rates(days_back=market_days)
        print()
        
        # Step 5: Users
        print("Step 5/9: Users")
        await seed_users()
        print()
        
        # Step 6: Farmers
        print("Step 6/9: Farmers")
        await seed_farmers(count=farmers_count)
        print()
        
        # Step 7: Daily entries
        print("Step 7/9: Daily Entries")
        await seed_daily_entries(entries_per_farmer=entries_per_farmer, days_back=30)
        print()
        
        # Step 8: Cash advances
        print("Step 8/9: Cash Advances")
        await seed_cash_advances(advances_per_farmer=advances_per_farmer, days_back=90)
        print()
        
        # Step 9: Settlements
        print("Step 9/9: Settlements")
        await seed_settlements(settlements_per_farmer=settlements_per_farmer, months_back=6)
        print()
        
        print("=" * 60)
        print("✅ Database seeding completed successfully!")
        print("=" * 60)
        print()
        print("📋 Summary of seeded data:")
        print(f"   - Users: Admin + Staff + Demo accounts")
        print(f"   - Farmers: {farmers_count} Tamil Nadu flower farmers")
        print(f"   - Daily Entries: ~{farmers_count * entries_per_farmer} flower delivery records")
        print(f"   - Cash Advances: ~{farmers_count * advances_per_farmer} advance requests")
        print(f"   - Settlements: ~{farmers_count * settlements_per_farmer} payment settlements")
        print(f"   - Market Rates: {market_days} days of price data")
        print()
        print("🔐 Test Credentials:")
        print("   Admin: admin@malar.com / admin123")
        print("   Staff: staff1@malar.com / staff123")
        print("   Demo:  demo_admin@malar.com / demo123")
        print()
        print("Next steps:")
        print("1. Start the backend: ./run.sh start")
        print("2. Open API docs: http://localhost:8000/docs")
        print("3. Login with test credentials")
        print()
        
    except Exception as e:
        print()
        print("=" * 60)
        print(f"❌ Error seeding database: {e}")
        print("=" * 60)
        import traceback
        traceback.print_exc()
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description='Seed the Malar Market Ledger database with Faker-generated data'
    )
    parser.add_argument(
        '--farmers', 
        type=int, 
        default=50,
        help='Number of farmers to generate (default: 50)'
    )
    parser.add_argument(
        '--quick',
        action='store_true',
        help='Quick mode: generate minimal data for testing'
    )
    
    args = parser.parse_args()
    
    asyncio.run(seed_all(
        farmers_count=args.farmers,
        quick_mode=args.quick
    ))


if __name__ == "__main__":
    main()
