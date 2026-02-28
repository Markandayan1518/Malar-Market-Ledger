#!/usr/bin/env python3
"""
Seed daily entries data for Malar Market Digital Ledger using Faker
Generates realistic daily flower entries for farmers
"""

import asyncio
import sys
import os
import random
from datetime import datetime, date, time, timedelta
from decimal import Decimal

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'backend'))

from faker import Faker
from app.database import get_db
from app.models.daily_entry import DailyEntry
from app.models.farmer import Farmer
from app.models.flower_type import FlowerType
from app.models.time_slot import TimeSlot
from app.models.user import User, UserRole
from sqlalchemy import select
from uuid import uuid4

# Initialize Faker
fake = Faker()

# Notes for daily entries
ENTRY_NOTES = [
    "Fresh morning flowers",
    "Good quality batch",
    "Premium grade flowers",
    "Afternoon delivery",
    "Evening harvest",
    "Slightly wilted - price adjusted",
    "Excellent aroma",
    "First harvest of the season",
    "Organic quality",
    "Hand-picked selection",
    "Mixed quality batch",
    "Late delivery - market rate applied",
    "Early morning premium batch",
    "Festival season special",
    "Wedding season quality",
    None,  # Some entries have no notes
    None,
    None
]


async def seed_daily_entries(entries_per_farmer=5, days_back=30):
    """
    Seed daily entries data with Faker-generated realistic data
    
    Args:
        entries_per_farmer: Average number of entries per farmer
        days_back: Number of days in the past to generate entries for
    """
    print(f"Seeding daily entries (avg {entries_per_farmer} per farmer, last {days_back} days)...")
    
    # Get database session
    db_gen = get_db()
    db = await db_gen.__anext__()
    
    try:
        # Get all farmers, flower types, time slots, and staff users
        farmers_result = await db.execute(
            select(Farmer).where(Farmer.deleted_at == None, Farmer.is_active == True)
        )
        farmers = farmers_result.scalars().all()
        
        flower_types_result = await db.execute(
            select(FlowerType).where(FlowerType.deleted_at == None)
        )
        flower_types = flower_types_result.scalars().all()
        
        time_slots_result = await db.execute(
            select(TimeSlot).where(TimeSlot.is_active == True)
        )
        time_slots = time_slots_result.scalars().all()
        
        staff_result = await db.execute(
            select(User).where(User.role == UserRole.STAFF, User.deleted_at == None)
        )
        staff_users = staff_result.scalars().all()
        
        if not farmers:
            print("✗ No farmers found. Please seed farmers first.")
            return []
        
        if not flower_types:
            print("✗ No flower types found. Please seed flower types first.")
            return []
        
        if not time_slots:
            print("✗ No time slots found. Please seed time slots first.")
            return []
        
        if not staff_users:
            # Use admin if no staff
            admin_result = await db.execute(
                select(User).where(User.role == UserRole.ADMIN, User.deleted_at == None).limit(1)
            )
            staff_users = admin_result.scalars().all()
        
        if not staff_users:
            print("✗ No staff or admin users found. Please seed users first.")
            return []
        
        created_entries = []
        today = date.today()
        
        # Generate entries for each farmer
        for farmer in farmers:
            # Random number of entries for this farmer (some have more, some less)
            num_entries = random.randint(
                max(1, entries_per_farmer - 3),
                entries_per_farmer + 5
            )
            
            for _ in range(num_entries):
                # Random date within the past days_back days
                days_ago = random.randint(0, days_back)
                entry_date = today - timedelta(days=days_ago)
                
                # Select random flower type and time slot
                flower_type = random.choice(flower_types)
                time_slot = random.choice(time_slots)
                
                # Generate realistic quantity (in kg, typically 5-50 kg per entry)
                quantity = Decimal(str(round(random.uniform(5, 50), 2)))
                
                # Generate realistic rate per kg (flower prices vary 50-200 Rs/kg)
                rate_per_unit = Decimal(str(round(random.uniform(50, 200), 2)))
                
                # Calculate amounts
                total_amount = quantity * rate_per_unit
                
                # Commission rate (typically 8-15%)
                commission_rate = farmer.commission_pct
                commission_amount = (total_amount * commission_rate) / 100
                net_amount = total_amount - commission_amount
                
                # Generate entry time based on time slot
                entry_time = time(
                    random.randint(time_slot.start_time.hour, time_slot.end_time.hour),
                    random.randint(0, 59)
                )
                
                # Select random staff user as creator
                created_by = random.choice(staff_users)
                
                # Random notes
                notes = random.choice(ENTRY_NOTES)
                
                entry = DailyEntry(
                    id=str(uuid4()),
                    farmer_id=farmer.id,
                    flower_type_id=flower_type.id,
                    time_slot_id=time_slot.id,
                    entry_date=entry_date,
                    entry_time=entry_time,
                    quantity=quantity,
                    rate_per_unit=rate_per_unit,
                    total_amount=total_amount,
                    commission_rate=commission_rate,
                    commission_amount=commission_amount,
                    net_amount=net_amount,
                    notes=notes,
                    created_by=created_by.id,
                    created_at=datetime.combine(entry_date, entry_time),
                    updated_at=datetime.utcnow()
                )
                
                db.add(entry)
                created_entries.append(entry)
        
        await db.commit()
        print(f"✓ Successfully seeded {len(created_entries)} daily entries")
        print(f"  - Farmers with entries: {len(farmers)}")
        print(f"  - Average entries per farmer: {len(created_entries) / len(farmers):.1f}")
        
        return created_entries
        
    except Exception as e:
        print(f"✗ Error seeding daily entries: {e}")
        await db.rollback()
        raise e
        
    finally:
        await db.close()


async def get_daily_entries_by_farmer(farmer_id: str):
    """Get all daily entries for a specific farmer"""
    db_gen = get_db()
    db = await db_gen.__anext__()
    
    try:
        result = await db.execute(
            select(DailyEntry)
            .where(DailyEntry.farmer_id == farmer_id, DailyEntry.deleted_at == None)
            .order_by(DailyEntry.entry_date.desc())
        )
        entries = result.scalars().all()
        return entries
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(seed_daily_entries(entries_per_farmer=5, days_back=30))
