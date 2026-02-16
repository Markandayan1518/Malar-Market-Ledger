#!/usr/bin/env python3
"""
Seed settlements data for Malar Market Digital Ledger
"""

import asyncio
import sys
import os
from datetime import datetime, date

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'backend'))

from app.database import get_db
from app.models.settlement import Settlement
from app.models.farmer import Farmer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4


async def seed_settlements():
    """Seed settlements data"""
    print("Seeding settlements...")
    
    # Sample settlements data
    settlements_data = [
        {
            "id": str(uuid.uuid4()),
            "farmer_id": str(uuid.uuid4()),  # Will be updated after fetching actual farmer IDs
            "settlement_date": date.today(),
            "period_start": date(date.today().year, date.today().month, 1),
            "period_end": date(date.today().year, date.today().month, 15),
            "total_sales": 25000.00,
            "total_commission": 2500.00,
            "total_advances": 5000.00,
            "net_amount": 17500.00,
            "status": "completed",
            "notes": "Monthly settlement for jasmine sales",
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "farmer_id": str(uuid.uuid4()),  # Will be updated after fetching actual farmer IDs
            "settlement_date": date.today(),
            "period_start": date(date.today().year, date.today().month, 1),
            "period_end": date(date.today().year, date.today().month, 15),
            "total_sales": 18000.00,
            "total_commission": 1800.00,
            "total_advances": 3000.00,
            "net_amount": 13200.00,
            "status": "pending",
            "notes": "Monthly settlement for rose sales",
            "created_at": datetime.utcnow()
        }
    ]
    
    # Get database session
    db = next(get_db())
    
    try:
        # Get actual IDs from database
        farmers_result = await db.execute(select(Farmer).limit(2))
        farmers = farmers_result.scalars().all()
        
        if len(farmers) >= 2:
            # Update IDs with actual values
            settlements_data[0]["farmer_id"] = farmers[0].id
            settlements_data[1]["farmer_id"] = farmers[1].id if len(farmers) > 1 else farmers[0].id
        
        # Insert settlements
        for settlement_data in settlements_data:
            settlement = Settlement(
                id=settlement_data["id"],
                farmer_id=settlement_data["farmer_id"],
                settlement_date=settlement_data["settlement_date"],
                period_start=settlement_data["period_start"],
                period_end=settlement_data["period_end"],
                total_sales=settlement_data["total_sales"],
                total_commission=settlement_data["total_commission"],
                total_advances=settlement_data["total_advances"],
                net_amount=settlement_data["net_amount"],
                status=settlement_data["status"],
                notes=settlement_data["notes"],
                created_at=settlement_data["created_at"]
            )
            db.add(settlement)
        
        await db.commit()
        print(f"✓ Successfully seeded {len(settlements_data)} settlements")
        
    except Exception as e:
        print(f"✗ Error seeding settlements: {e}")
        raise e
        
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(seed_settlements())
