#!/usr/bin/env python3
"""
Seed farmers data for Malar Market Digital Ledger
"""

import asyncio
import sys
import os
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'backend'))

from app.database import get_db
from app.models.farmer import Farmer
from app.models.user import User
from app.core.auth import get_password_hash
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4


async def seed_farmers():
    """Seed farmers data"""
    print("Seeding farmers...")
    
    # Sample farmer data
    farmers_data = [
        {
            "id": str(uuid.uuid4()),
            "farmer_code": "F001",
            "name": "Raj Kumar",
            "phone": "+919876543210",
            "village": "Chennai",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "farmer_code": "F002", 
            "name": "Mala Rani",
            "phone": "+919876543211",
            "village": "Coimbatore",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "farmer_code": "F003",
            "name": "Siva Perumal",
            "phone": "+919876543212",
            "village": "Tiruppur",
            "is_active": True,
            "created_at": datetime.utcnow()
        }
    ]
    
    # Get database session
    db = next(get_db())
    
    try:
        # Insert farmers
        for farmer_data in farmers_data:
            farmer = Farmer(
                id=farmer_data["id"],
                farmer_code=farmer_data["farmer_code"],
                name=farmer_data["name"],
                phone=farmer_data["phone"],
                village=farmer_data["village"],
                is_active=farmer_data["is_active"],
                created_at=farmer_data["created_at"]
            )
            db.add(farmer)
        
        # Create a staff user for each farmer (for demo purposes)
        for farmer_data in farmers_data:
            user = User(
                id=str(uuid.uuid4()),
                username=f"staff_{farmer_data['farmer_code'].lower()}",
                email=f"{farmer_data['farmer_code'].lower()}@malar.com",
                password_hash=get_password_hash("password123"),
                role="staff",
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(user)
        
        await db.commit()
        print(f"✓ Successfully seeded {len(farmers_data)} farmers")
        
    except Exception as e:
        print(f"✗ Error seeding farmers: {e}")
        raise e
        
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(seed_farmers())