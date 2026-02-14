#!/usr/bin/env python3
"""Seed system settings data"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.database import SessionLocal
from app.models.system_setting import SystemSetting

def seed_system_settings():
    """Seed system settings"""
    db = SessionLocal()
    
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
    
    for setting_data in settings_data:
        setting = SystemSetting(**setting_data)
        db.add(setting)
    
    db.commit()
    
    print(f"✓ Created {len(settings_data)} system settings")

if __name__ == "__main__":
    seed_system_settings()
