#!/usr/bin/env python3
"""
Seed cash advances data for Malar Market Digital Ledger
"""

import asyncio
import sys
import os
from datetime import datetime, date

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'backend'))

from app.database import get_db
from app.models.cash_advance import CashAdvance
from app.models.farmer import Farmer
from app.models.user import User, UserRole
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4


async def seed_cash_advances():
    """Seed cash advances data"""
    print("Seeding cash advances...")
    
    # Sample cash advances data
    cash_advances_data = [
        {
            "id": str(uuid.uuid4()),
            "farmer_id": str(uuid.uuid4()),  # Will be updated after fetching actual farmer IDs
            "amount": 5000.00,
            "reason": "Seed money for planting season",
            "status": "approved",
            "approved_by": str(uuid.uuid4()),  # Will be updated after fetching actual admin user IDs
            "approved_at": datetime.utcnow(),
            "notes": "Approved for jasmine cultivation",
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "farmer_id": str(uuid.uuid4()),  # Will be updated after fetching actual farmer IDs
            "amount": 3000.00,
            "reason": "Equipment purchase",
            "status": "pending",
            "notes": "Request for new harvesting equipment",
            "created_at": datetime.utcnow()
        }
    ]
    
    # Get database session
    db = next(get_db())
    
    try:
        # Get actual IDs from database
        farmers_result = await db.execute(select(Farmer).limit(2))
        farmers = farmers_result.scalars().all()
        
        users_result = await db.execute(select(User).where(User.role == UserRole.ADMIN))
        admin_users = users_result.scalars().all()
        
        if len(farmers) >= 2 and len(admin_users) >= 1:
            # Update IDs with actual values
            cash_advances_data[0]["farmer_id"] = farmers[0].id
            cash_advances_data[1]["farmer_id"] = farmers[1].id if len(farmers) > 1 else farmers[0].id
            cash_advances_data[0]["approved_by"] = admin_users[0].id
        
        # Insert cash advances
        for advance_data in cash_advances_data:
            cash_advance = CashAdvance(
                id=advance_data["id"],
                farmer_id=advance_data["farmer_id"],
                amount=advance_data["amount"],
                reason=advance_data["reason"],
                status=advance_data["status"],
                approved_by=advance_data.get("approved_by"),
                approved_at=advance_data.get("approved_at"),
                notes=advance_data["notes"],
                created_at=advance_data["created_at"]
            )
            db.add(cash_advance)
        
        await db.commit()
        print(f"✓ Successfully seeded {len(cash_advances_data)} cash advances")
        
    except Exception as e:
        print(f"✗ Error seeding cash advances: {e}")
        raise e
        
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(seed_cash_advances())
