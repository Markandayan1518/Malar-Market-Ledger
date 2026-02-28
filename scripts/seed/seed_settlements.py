#!/usr/bin/env python3
"""
Seed settlements data for Malar Market Digital Ledger using Faker
Generates realistic settlement records for farmers
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
from app.models.settlement import Settlement
from app.models.farmer import Farmer
from sqlalchemy import select
from uuid import uuid4

# Initialize Faker
fake = Faker()

# Settlement notes
SETTLEMENT_NOTES = [
    "Monthly settlement for jasmine sales",
    "Monthly settlement for rose sales",
    "Weekly settlement - all flower types",
    "Bi-weekly settlement",
    "End of season settlement",
    "Festival period settlement",
    "Wedding season settlement",
    "Quarterly settlement",
    "Special settlement - market bonus",
    "Year-end settlement",
    None,  # Some settlements have no notes
    None
]

# Status distribution (weighted)
STATUS_CHOICES = [
    ("completed", 60),
    ("pending", 25),
    ("processing", 10),
    ("cancelled", 5)
]


def get_weighted_status():
    """Get a random status based on weighted distribution"""
    choices = []
    for status, weight in STATUS_CHOICES:
        choices.extend([status] * weight)
    return random.choice(choices)


async def seed_settlements(settlements_per_farmer=2, months_back=6):
    """
    Seed settlements data with Faker-generated realistic data
    
    Args:
        settlements_per_farmer: Average number of settlements per farmer
        months_back: Number of months in the past to generate settlements for
    """
    print(f"Seeding settlements (avg {settlements_per_farmer} per farmer, last {months_back} months)...")
    
    # Get database session
    db_gen = get_db()
    db = await db_gen.__anext__()
    
    try:
        # Get all active farmers
        farmers_result = await db.execute(
            select(Farmer).where(Farmer.deleted_at == None, Farmer.is_active == True)
        )
        farmers = farmers_result.scalars().all()
        
        if not farmers:
            print("✗ No farmers found. Please seed farmers first.")
            return []
        
        created_settlements = []
        today = date.today()
        
        # Generate settlements for each farmer
        for farmer in farmers:
            # Random number of settlements (1-4)
            num_settlements = random.randint(1, settlements_per_farmer + 2)
            
            for i in range(num_settlements):
                # Generate settlement for past months
                months_ago = random.randint(0, months_back)
                
                # Calculate period dates (typically 15-day or monthly periods)
                if random.random() > 0.5:
                    # Monthly period
                    period_start = date(today.year, today.month, 1) - timedelta(days=months_ago * 30)
                    period_end = period_start + timedelta(days=29)
                else:
                    # Bi-weekly period
                    period_start = today - timedelta(days=months_ago * 30 + random.randint(0, 15))
                    period_end = period_start + timedelta(days=13)
                
                settlement_date = period_end + timedelta(days=random.randint(1, 5))
                
                # Generate realistic amounts based on farmer's scale
                base_sales = random.uniform(10000, 50000)
                total_sales = Decimal(str(round(base_sales, 2)))
                
                # Calculate commission (typically 8-15%)
                commission_rate = farmer.commission_pct
                total_commission = (total_sales * commission_rate) / 100
                
                # Advances deduction (some of the total advances)
                total_advances = Decimal(str(round(random.uniform(0, float(farmer.total_advances) * 0.3), 2)))
                
                # Net amount
                net_amount = total_sales - total_commission - total_advances
                
                # Get weighted status
                status = get_weighted_status()
                
                # Notes
                notes = random.choice(SETTLEMENT_NOTES)
                if notes is None:
                    notes = f"Settlement for period {period_start.strftime('%d %b')} - {period_end.strftime('%d %b %Y')}"
                
                settlement = Settlement(
                    id=str(uuid4()),
                    farmer_id=farmer.id,
                    settlement_date=settlement_date,
                    settlement_number=f"SET-{datetime.now().strftime('%Y%m')}-{str(uuid4())[:8].upper()}",
                    period_start=period_start,
                    period_end=period_end,
                    total_entries=random.randint(5, 20),
                    total_quantity=Decimal(str(round(random.uniform(100, 500), 2))),
                    gross_amount=total_sales,
                    total_commission=total_commission,
                    total_fees=Decimal(str(round(random.uniform(0, 500), 2))),
                    total_advances=total_advances,
                    net_payable=net_amount,
                    status=status,
                    notes=notes,
                    created_by="b077830b-b3d3-4b0e-8832-a1e9ab9f5d1b",  # Admin user id
                    created_at=datetime.combine(settlement_date, datetime.min.time()),
                    updated_at=datetime.utcnow()
                )
                
                db.add(settlement)
                created_settlements.append(settlement)
        
        await db.commit()
        
        # Calculate totals
        total_sales_sum = sum(float(s.gross_amount) for s in created_settlements)
        total_commission_sum = sum(float(s.total_commission) for s in created_settlements)
        total_net_sum = sum(float(s.net_payable) for s in created_settlements)
        
        # Count by status
        status_counts = {}
        for settlement in created_settlements:
            status_counts[settlement.status] = status_counts.get(settlement.status, 0) + 1
        
        print(f"✓ Successfully seeded {len(created_settlements)} settlements")
        print(f"  - Farmers with settlements: {len(farmers)}")
        print(f"  - Total sales: ₹{total_sales_sum:,.2f}")
        print(f"  - Total commission: ₹{total_commission_sum:,.2f}")
        print(f"  - Total net amount: ₹{total_net_sum:,.2f}")
        print(f"  - Status breakdown:")
        for status, count in sorted(status_counts.items()):
            print(f"    - {status}: {count}")
        
        return created_settlements
        
    except Exception as e:
        print(f"✗ Error seeding settlements: {e}")
        await db.rollback()
        raise e
        
    finally:
        await db.close()


async def get_settlements_by_farmer(farmer_id: str):
    """Get all settlements for a specific farmer"""
    db_gen = get_db()
    db = await db_gen.__anext__()
    
    try:
        result = await db.execute(
            select(Settlement)
            .where(Settlement.farmer_id == farmer_id, Settlement.deleted_at == None)
            .order_by(Settlement.settlement_date.desc())
        )
        settlements = result.scalars().all()
        return settlements
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(seed_settlements(settlements_per_farmer=2, months_back=6))
