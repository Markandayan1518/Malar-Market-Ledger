#!/usr/bin/env python3
"""
Seed cash advances data for Malar Market Digital Ledger using Faker
Generates realistic cash advance records for farmers
"""

import asyncio
import sys
import os
import random
from datetime import datetime, date, timedelta
from decimal import Decimal

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'backend'))

from faker import Faker
from app.database import get_db
from app.models.cash_advance import CashAdvance
from app.models.farmer import Farmer
from app.models.user import User, UserRole
from sqlalchemy import select
from uuid import uuid4

# Initialize Faker
fake = Faker()

# Cash advance reasons
ADVANCE_REASONS = [
    "Seed money for planting season",
    "Equipment purchase",
    "Fertilizer and pesticides",
    "Labor wages for harvesting",
    "Irrigation system repair",
    "Transportation costs",
    "Family emergency",
    "Farm expansion",
    "New greenhouse setup",
    "Drip irrigation installation",
    "Farm tools purchase",
    "Storage facility construction",
    "Vehicle repair for transport",
    "Wedding in family",
    "Medical emergency",
    "Education expenses",
    "Land lease payment",
    "Organic certification fees"
]

# Status distribution (weighted)
STATUS_CHOICES = [
    ("approved", 50),
    ("pending", 30),
    ("disbursed", 15),
    ("rejected", 5)
]


def get_weighted_status():
    """Get a random status based on weighted distribution"""
    choices = []
    for status, weight in STATUS_CHOICES:
        choices.extend([status] * weight)
    return random.choice(choices)


async def seed_cash_advances(advances_per_farmer=2, days_back=90):
    """
    Seed cash advances data with Faker-generated realistic data
    
    Args:
        advances_per_farmer: Average number of advances per farmer
        days_back: Number of days in the past to generate advances for
    """
    print(f"Seeding cash advances (avg {advances_per_farmer} per farmer, last {days_back} days)...")
    
    # Get database session
    db_gen = get_db()
    db = await db_gen.__anext__()
    
    try:
        # Get all active farmers
        farmers_result = await db.execute(
            select(Farmer).where(Farmer.deleted_at == None, Farmer.is_active == True)
        )
        farmers = farmers_result.scalars().all()
        
        # Get admin/staff users for approvals
        admin_result = await db.execute(
            select(User).where(User.role.in_([UserRole.ADMIN, UserRole.STAFF]), User.deleted_at == None)
        )
        admin_users = admin_result.scalars().all()
        
        if not farmers:
            print("✗ No farmers found. Please seed farmers first.")
            return []
        
        if not admin_users:
            print("✗ No admin/staff users found. Please seed users first.")
            return []
        
        created_advances = []
        today = date.today()
        
        # Generate advances for each farmer
        for farmer in farmers:
            # Random number of advances (0-4, with some farmers having none)
            num_advances = random.randint(0, advances_per_farmer + 2)
            
            for _ in range(num_advances):
                # Random date within the past days_back days
                days_ago = random.randint(0, days_back)
                advance_date = today - timedelta(days=days_ago)
                
                # Generate realistic amount (typically 1000-20000 Rs)
                amount = Decimal(str(round(random.uniform(1000, 20000), 2)))
                
                # Select random reason
                reason = random.choice(ADVANCE_REASONS)
                
                # Get weighted status
                status = get_weighted_status()
                
                # Select random admin for approval/rejection
                approved_by = None
                approved_at = None
                notes = None
                
                if status == "approved":
                    approved_by = random.choice(admin_users).id
                    approved_at = datetime.combine(advance_date, datetime.min.time()) + timedelta(hours=random.randint(1, 48))
                    notes = f"Approved for {reason.lower()}"
                elif status == "disbursed":
                    approved_by = random.choice(admin_users).id
                    approved_at = datetime.combine(advance_date, datetime.min.time()) + timedelta(hours=random.randint(1, 24))
                    notes = f"Amount disbursed to farmer account"
                elif status == "rejected":
                    notes = random.choice([
                        "Insufficient credit history",
                        "Outstanding balance too high",
                        "Documentation incomplete",
                        "Not eligible at this time"
                    ])
                else:  # pending
                    notes = "Awaiting approval"
                
                advance = CashAdvance(
                    id=str(uuid4()),
                    farmer_id=farmer.id,
                    amount=amount,
                    reason=reason,
                    advance_date=advance_date,
                    status=status,
                    approved_by=approved_by,
                    approved_at=approved_at,
                    notes=notes,
                    created_by=random.choice(admin_users).id,
                    created_at=datetime.combine(advance_date, datetime.min.time()),
                    updated_at=datetime.utcnow()
                )
                
                db.add(advance)
                created_advances.append(advance)
        
        await db.commit()
        
        # Count by status
        status_counts = {}
        for advance in created_advances:
            status_counts[advance.status] = status_counts.get(advance.status, 0) + 1
        
        print(f"✓ Successfully seeded {len(created_advances)} cash advances")
        print(f"  - Farmers with advances: {len([f for f in farmers if random.random() > 0.3])}")
        print(f"  - Status breakdown:")
        for status, count in sorted(status_counts.items()):
            print(f"    - {status}: {count}")
        
        return created_advances
        
    except Exception as e:
        print(f"✗ Error seeding cash advances: {e}")
        await db.rollback()
        raise e
        
    finally:
        await db.close()


async def get_cash_advances_by_farmer(farmer_id: str):
    """Get all cash advances for a specific farmer"""
    db_gen = get_db()
    db = await db_gen.__anext__()
    
    try:
        result = await db.execute(
            select(CashAdvance)
            .where(CashAdvance.farmer_id == farmer_id, CashAdvance.deleted_at == None)
            .order_by(CashAdvance.created_at.desc())
        )
        advances = result.scalars().all()
        return advances
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(seed_cash_advances(advances_per_farmer=2, days_back=90))
