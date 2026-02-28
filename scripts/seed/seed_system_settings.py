#!/usr/bin/env python3
"""
Seed system settings data for Malar Market Digital Ledger
"""

import sys
import os
import uuid

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'backend'))

from app.database import get_db
from app.models.system_setting import SystemSetting
from datetime import datetime
from sqlalchemy import select


async def seed_system_settings():
    """Seed system settings"""
    print("Seeding system settings...")
    
    # Get database session
    db_gen = get_db()
    db = await db_gen.__anext__()
    
    settings_data = [
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
        },
        {
            "key": "default_language",
            "value": "en",
            "value_type": "string",
            "description": "Default language for users",
            "is_public": True
        }
    ]
    
    try:
        seeded_count = 0
        for setting_data in settings_data:
            # Check if setting already exists
            result = await db.execute(
                select(SystemSetting).where(SystemSetting.key == setting_data["key"])
            )
            existing = result.scalar_one_or_none()
            
            if existing:
                # Update existing setting
                existing.value = setting_data["value"]
                existing.value_type = setting_data["value_type"]
                existing.description = setting_data["description"]
                existing.is_public = setting_data["is_public"]
                existing.updated_at = datetime.utcnow()
            else:
                # Create new setting
                setting = SystemSetting(id=str(uuid.uuid4()), **setting_data)
                db.add(setting)
                seeded_count += 1
        
        await db.commit()
        print(f"✓ Successfully seeded {seeded_count} new system settings (skipped existing)")
        
    except Exception as e:
        print(f"✗ Error seeding system settings: {e}")
        await db.rollback()
        raise e
        
    finally:
        await db.close()


if __name__ == "__main__":
    import asyncio
    asyncio.run(seed_system_settings())
