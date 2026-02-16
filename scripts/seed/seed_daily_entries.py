#!/usr/bin/env python3
"""
Seed daily entries data for Malar Market Digital Ledger
"""

import asyncio
import sys
import os
from datetime import datetime, date

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'backend'))

from app.database import get_db
from app.models.daily_entry import DailyEntry
from app.models.farmer import Farmer
from app.models.flower_type import FlowerType
from app.models.time_slot import TimeSlot
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4


async def seed_daily_entries():
    """Seed daily entries data"""
    print("Seeding daily entries...")
    
    # Sample daily entries data
    daily_entries_data = [
        {
            "id": str(uuid.uuid4()),
            "farmer_id": str(uuid.uuid4()),  # Will be updated after fetching actual farmer IDs
            "flower_type_id": str(uuid.uuid4()),  # Will be updated after fetching actual flower type IDs
            "time_slot_id": str(uuid.uuid4()),  # Will be updated after fetching actual time slot IDs
            "weight_kg": 25.5,
            "rate_per_kg": 85.50,
            "total_amount": 2180.25,
            "commission_rate": 0.10,
            "commission_amount": 218.03,
            "net_amount": 1962.22,
            "entry_date": date.today(),
            "notes": "Fresh morning flowers",
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "farmer_id": str(uuid.uuid4()),  # Will be updated after fetching actual farmer IDs
            "flower_type_id": str(uuid.uuid4()),  # Will be updated after fetching actual flower type IDs
            "time_slot_id": str(uuid.uuid4()),  # Will be updated after fetching actual time slot IDs
            "weight_kg": 18.0,
            "rate_per_kg": 90.00,
            "total_amount": 1620.00,
            "commission_rate": 0.10,
            "commission_amount": 162.00,
            "net_amount": 1458.00,
            "entry_date": date.today(),
            "notes": "Afternoon delivery",
            "created_at": datetime.utcnow()
        }
    ]
    
    # Get database session
    db = next(get_db())
    
    try:
        # Get actual IDs from database
        farmers_result = await db.execute(select(Farmer).limit(2))
        farmers = farmers_result.scalars().all()
        
        flower_types_result = await db.execute(select(FlowerType).limit(2))
        flower_types = flower_types_result.scalars().all()
        
        time_slots_result = await db.execute(select(TimeSlot).limit(2))
        time_slots = time_slots_result.scalars().all()
        
        if len(farmers) >= 2 and len(flower_types) >= 2 and len(time_slots) >= 2:
            # Update IDs with actual values
            daily_entries_data[0]["farmer_id"] = farmers[0].id
            daily_entries_data[0]["flower_type_id"] = flower_types[0].id
            daily_entries_data[0]["time_slot_id"] = time_slots[0].id
            
            daily_entries_data[1]["farmer_id"] = farmers[1].id if len(farmers) > 1 else farmers[0].id
            daily_entries_data[1]["flower_type_id"] = flower_types[1].id if len(flower_types) > 1 else flower_types[0].id
            daily_entries_data[1]["time_slot_id"] = time_slots[1].id if len(time_slots) > 1 else time_slots[0].id
        
        # Insert daily entries
        for entry_data in daily_entries_data:
            daily_entry = DailyEntry(
                id=entry_data["id"],
                farmer_id=entry_data["farmer_id"],
                flower_type_id=entry_data["flower_type_id"],
                time_slot_id=entry_data["time_slot_id"],
                weight_kg=entry_data["weight_kg"],
                rate_per_kg=entry_data["rate_per_kg"],
                total_amount=entry_data["total_amount"],
                commission_rate=entry_data["commission_rate"],
                commission_amount=entry_data["commission_amount"],
                net_amount=entry_data["net_amount"],
                entry_date=entry_data["entry_date"],
                notes=entry_data["notes"],
                created_at=entry_data["created_at"]
            )
            db.add(daily_entry)
        
        await db.commit()
        print(f"✓ Successfully seeded {len(daily_entries_data)} daily entries")
        
    except Exception as e:
        print(f"✗ Error seeding daily entries: {e}")
        raise e
        
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(seed_daily_entries())
