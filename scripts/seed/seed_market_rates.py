#!/usr/bin/env python3
"""
Seed market rates data for Malar Market Digital Ledger
"""

import asyncio
import sys
import os
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'backend'))

from app.database import get_db
from app.models.flower_type import FlowerType
from app.models.time_slot import TimeSlot
from app.models.market_rate import MarketRate
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4


async def seed_market_rates():
    """Seed market rates data"""
    print("Seeding market rates...")
    
    # Sample market rates data
    market_rates_data = [
        {
            "id": str(uuid.uuid4()),
            "flower_type_id": str(uuid.uuid4()),  # Jasmine
            "time_slot_id": str(uuid.uuid4()),  # Early Morning
            "rate_per_kg": 85.50,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "flower_type_id": str(uuid.uuid4()),  # Rose
            "time_slot_id": str(uuid.uuid4()),  # Morning
            "rate_per_kg": 90.00,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "flower_type_id": str(uuid.uuid4()), # Marigold
            "time_slot_id": str(uuid.uuid4()), # Morning
            "rate_per_kg": 95.00,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "flower_type_id": str(uuid.uuid4()), # Lily
            "time_slot_id": str(uuid.uuid4()), # Afternoon
            "rate_per_kg": 88.00,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "flower_type_id": str(uuid.uuid4()), # Lily
            "time_slot_id": str(uuid.uuid4()), # Evening
            "rate_per_kg": 92.00,
            "created_at": datetime.utcnow()
        }
    ]
    
    # Get database session
    db = next(get_db())
    
    try:
        # Insert market rates
        for rate_data in market_rates_data:
            market_rate = MarketRate(
                id=rate_data["id"],
                flower_type_id=rate_data["flower_type_id"],
                time_slot_id=rate_data["time_slot_id"],
                rate_per_kg=rate_data["rate_per_kg"],
                created_at=rate_data["created_at"]
            )
            db.add(market_rate)
        
        await db.commit()
        print(f"✓ Successfully seeded {len(market_rates_data)} market rates")
        
    except Exception as e:
        print(f"✗ Error seeding market rates: {e}")
        raise e
        
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(seed_market_rates())
