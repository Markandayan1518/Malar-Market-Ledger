#!/usr/bin/env python3
"""
Seed flower types data for Malar Market Digital Ledger
"""

import asyncio
import sys
import os
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'backend'))

from app.database import get_db
from app.models.flower_type import FlowerType
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4


async def seed_flower_types():
    """Seed flower types data"""
    print("Seeding flower types...")
    
    # Sample flower types data
    flower_types_data = [
        {
            "id": str(uuid.uuid4()),
            "name": "Jasmine",
            "name_ta": "மல்",
            "description": "Fragrant white flowers with sweet aroma",
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Rose",
            "name_ta": "ரோஸ்",
            "description": "Classic red flowers symbolizing love and passion",
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Marigold",
            "name_ta": "மரிரோாட்",
            "description": "Vibrant yellow-orange flowers representing joy and celebration",
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Lily",
            "name_ta": "கிளி",
            "description": "Pure white flowers representing peace and serenity",
            "created_at": datetime.utcnow()
        }
    ]
    
    # Get database session
    db = next(get_db())
    
    try:
        # Insert flower types
        for flower_data in flower_types_data:
            flower_type = FlowerType(
                id=flower_data["id"],
                name=flower_data["name"],
                name_ta=flower_data["name_ta"],
                description=flower_data["description"],
                created_at=flower_data["created_at"]
            )
            db.add(flower_type)
        
        await db.commit()
        print(f"✓ Successfully seeded {len(flower_types_data)} flower types")
        
    except Exception as e:
        print(f"✗ Error seeding flower types: {e}")
        raise e
        
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(seed_flower_types())