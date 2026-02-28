#!/usr/bin/env python3
"""
Seed flower types data for Malar Market Digital Ledger
"""

import asyncio
import sys
import os
import uuid
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'backend'))

from app.database import get_db
from app.models.flower_type import FlowerType
from sqlalchemy import select


async def seed_flower_types():
    """Seed flower types data"""
    print("Seeding flower types...")
    
    # Sample flower types data with all required fields
    flower_types_data = [
        {
            "name": "Jasmine",
            "name_ta": "மல்லிகை",
            "code": "JAS",
            "description": "Fragrant white flowers with sweet aroma",
            "unit": "kg"
        },
        {
            "name": "Rose",
            "name_ta": "ரோஜா",
            "code": "ROS",
            "description": "Classic red flowers symbolizing love and passion",
            "unit": "kg"
        },
        {
            "name": "Marigold",
            "name_ta": "சாமந்தி",
            "code": "MAR",
            "description": "Vibrant yellow-orange flowers representing joy and celebration",
            "unit": "kg"
        },
        {
            "name": "Lily",
            "name_ta": "அல்லி",
            "code": "LIL",
            "description": "Pure white flowers representing peace and serenity",
            "unit": "kg"
        },
        {
            "name": "Lotus",
            "name_ta": "தாமரை",
            "code": "LOT",
            "description": "Sacred flower symbolizing purity and enlightenment",
            "unit": "kg"
        },
        {
            "name": "Chrysanthemum",
            "name_ta": "செவ்வந்தி",
            "code": "CHR",
            "description": "Colorful blooms for festivals and decorations",
            "unit": "kg"
        },
        {
            "name": "Tube Rose",
            "name_ta": "சம்பங்கி",
            "code": "TUB",
            "description": "Highly fragrant white flowers for garlands",
            "unit": "kg"
        },
        {
            "name": "Crossandra",
            "name_ta": "அபிரமி",
            "code": "CRO",
            "description": "Orange-red flowers used in hair decorations",
            "unit": "kg"
        }
    ]
    
    # Get database session
    db_gen = get_db()
    db = await db_gen.__anext__()
    
    try:
        seeded_count = 0
        for flower_data in flower_types_data:
            # Check if flower type already exists
            result = await db.execute(
                select(FlowerType).where(FlowerType.name == flower_data["name"])
            )
            existing = result.scalar_one_or_none()
            
            if not existing:
                # Create new flower type with all required fields
                flower_type = FlowerType(
                    id=str(uuid.uuid4()),
                    name=flower_data["name"],
                    name_ta=flower_data["name_ta"],
                    code=flower_data["code"],
                    description=flower_data["description"],
                    unit=flower_data["unit"],
                    is_active=True,
                    created_at=datetime.utcnow()
                )
                db.add(flower_type)
                seeded_count += 1
        
        await db.commit()
        print(f"✓ Successfully seeded {seeded_count} new flower types (skipped existing)")
        
    except Exception as e:
        print(f"✗ Error seeding flower types: {e}")
        await db.rollback()
        raise e
        
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(seed_flower_types())
