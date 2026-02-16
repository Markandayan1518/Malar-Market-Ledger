#!/usr/bin/env python3
"""
Seed time slots data for Malar Market Digital Ledger
"""

import asyncio
import sys
import os
from datetime import datetime, time

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'backend'))

from app.database import get_db
from app.models.time_slot import TimeSlot
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4


async def seed_time_slots():
    """Seed time slots data"""
    print("Seeding time slots...")
    
    # Sample time slots data
    time_slots_data = [
        {
            "id": str(uuid.uuid4()),
            "name": "Early Morning (4AM - 7AM)",
            "name_ta": "காகாட் (4AM - 7AM)",
            "start_time": time(4, 0),
            "end_time": time(7, 0),
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Morning (7AM - 12PM)",
            "name_ta": "காகாட் (7AM - 12PM)",
            "start_time": time(7, 0),
            "end_time": time(12, 0),
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Afternoon (12PM - 4PM)",
            "name_ta": "மதுவன் (12PM - 4PM)",
            "start_time": time(12, 0),
            "end_time": time(16, 0),
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Evening (4PM - 8PM)",
            "name_ta": "மால் (4PM - 8PM)",
            "start_time": time(16, 0),
            "end_time": time(20, 0),
            "created_at": datetime.utcnow()
        }
    ]
    
    # Get database session
    db = next(get_db())
    
    try:
        # Insert time slots
        for slot_data in time_slots_data:
            time_slot = TimeSlot(
                id=slot_data["id"],
                name=slot_data["name"],
                name_ta=slot_data["name_ta"],
                start_time=slot_data["start_time"],
                end_time=slot_data["end_time"],
                created_at=slot_data["created_at"]
            )
            db.add(time_slot)
        
        await db.commit()
        print(f"✓ Successfully seeded {len(time_slots_data)} time slots")
        
    except Exception as e:
        print(f"✗ Error seeding time slots: {e}")
        raise e
        
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(seed_time_slots())