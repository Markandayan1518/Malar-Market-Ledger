#!/usr/bin/env python3
"""
Seed time slots data for Malar Market Digital Ledger
"""

import asyncio
import sys
import os
import uuid
from datetime import datetime, time

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'backend'))

from app.database import get_db
from app.models.time_slot import TimeSlot
from sqlalchemy import select


async def seed_time_slots():
    """Seed time slots data"""
    print("Seeding time slots...")
    
    # Sample time slots data
    time_slots_data = [
        {
            "name": "Early Morning (4AM - 7AM)",
            "name_ta": "அதிகாலை (4AM - 7AM)",
            "start_time": time(4, 0),
            "end_time": time(7, 0)
        },
        {
            "name": "Morning (7AM - 12PM)",
            "name_ta": "காலை (7AM - 12PM)",
            "start_time": time(7, 0),
            "end_time": time(12, 0)
        },
        {
            "name": "Afternoon (12PM - 4PM)",
            "name_ta": "மதியம் (12PM - 4PM)",
            "start_time": time(12, 0),
            "end_time": time(16, 0)
        },
        {
            "name": "Evening (4PM - 8PM)",
            "name_ta": "மாலை (4PM - 8PM)",
            "start_time": time(16, 0),
            "end_time": time(20, 0)
        }
    ]
    
    # Get database session
    db_gen = get_db()
    db = await db_gen.__anext__()
    
    try:
        seeded_count = 0
        for slot_data in time_slots_data:
            # Check if time slot already exists
            result = await db.execute(
                select(TimeSlot).where(TimeSlot.name == slot_data["name"])
            )
            existing = result.scalar_one_or_none()
            
            if not existing:
                time_slot = TimeSlot(
                    id=str(uuid.uuid4()),
                    name=slot_data["name"],
                    name_ta=slot_data["name_ta"],
                    start_time=slot_data["start_time"],
                    end_time=slot_data["end_time"],
                    created_at=datetime.utcnow()
                )
                db.add(time_slot)
                seeded_count += 1
        
        await db.commit()
        print(f"✓ Successfully seeded {seeded_count} new time slots (skipped existing)")
        
    except Exception as e:
        print(f"✗ Error seeding time slots: {e}")
        await db.rollback()
        raise e
        
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(seed_time_slots())
