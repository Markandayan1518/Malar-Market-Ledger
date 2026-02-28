#!/usr/bin/env python3
"""
Seed market rates data for Malar Market Digital Ledger using Faker
Generates realistic market rates for flower types per time slot
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
from app.models.flower_type import FlowerType
from app.models.time_slot import TimeSlot
from app.models.market_rate import MarketRate
from sqlalchemy import select
from uuid import uuid4

# Initialize Faker
fake = Faker()

# Base rates for different flowers (Rs per kg)
FLOWER_BASE_RATES = {
    "Jasmine": {"min": 80, "max": 150, "volatility": 0.15},
    "Rose": {"min": 60, "max": 120, "volatility": 0.12},
    "Marigold": {"min": 40, "max": 80, "volatility": 0.10},
    "Lily": {"min": 70, "max": 130, "volatility": 0.14},
    "Chrysanthemum": {"min": 50, "max": 90, "volatility": 0.11},
    "Tube Rose": {"min": 90, "max": 160, "volatility": 0.16},
    "Crossandra": {"min": 100, "max": 180, "volatility": 0.18},
    "Lotus": {"min": 120, "max": 200, "volatility": 0.20}
}

# Time slot price adjustments (morning typically higher)
TIME_SLOT_ADJUSTMENTS = {
    "Early Morning": 1.15,  # 15% premium
    "Morning": 1.10,        # 10% premium
    "Afternoon": 0.95,      # 5% discount
    "Evening": 0.90         # 10% discount
}


async def seed_market_rates(days_back=30):
    """
    Seed market rates data with Faker-generated realistic data
    
    Args:
        days_back: Number of days of historical rates to generate
    """
    print(f"Seeding market rates (last {days_back} days)...")
    
    # Get database session
    db_gen = get_db()
    db = await db_gen.__anext__()
    
    try:
        # Get all flower types and time slots
        flower_types_result = await db.execute(
            select(FlowerType).where(FlowerType.deleted_at == None)
        )
        flower_types = flower_types_result.scalars().all()
        
        time_slots_result = await db.execute(
            select(TimeSlot).where(TimeSlot.is_active == True)
        )
        time_slots = time_slots_result.scalars().all()
        
        if not flower_types:
            print("✗ No flower types found. Please seed flower types first.")
            return []
        
        if not time_slots:
            print("✗ No time slots found. Please seed time slots first.")
            return []
        
        created_rates = []
        skipped_count = 0
        today = date.today()
        
        # Generate rates for each combination of flower type, time slot, and date
        for days_ago in range(days_back + 1):
            rate_date = today - timedelta(days=days_ago)
            
            for flower_type in flower_types:
                # Get base rate info for this flower
                flower_name = flower_type.name
                if flower_name in FLOWER_BASE_RATES:
                    base_info = FLOWER_BASE_RATES[flower_name]
                else:
                    # Default for unknown flowers
                    base_info = {"min": 50, "max": 100, "volatility": 0.15}
                
                # Generate base rate for the day (with some daily variation)
                daily_base = random.uniform(base_info["min"], base_info["max"])
                
                for time_slot in time_slots:
                    # Check if rate already exists for this combination
                    existing_rate = await db.execute(
                        select(MarketRate).where(
                            MarketRate.flower_type_id == flower_type.id,
                            MarketRate.time_slot_id == time_slot.id,
                            MarketRate.effective_date == rate_date
                        )
                    )
                    if existing_rate.scalar_one_or_none():
                        skipped_count += 1
                        continue
                    
                    # Apply time slot adjustment
                    slot_name = time_slot.name
                    if "Early" in slot_name or "4AM" in slot_name:
                        adjustment = TIME_SLOT_ADJUSTMENTS["Early Morning"]
                    elif "Morning" in slot_name or "7AM" in slot_name:
                        adjustment = TIME_SLOT_ADJUSTMENTS["Morning"]
                    elif "Afternoon" in slot_name or "12PM" in slot_name:
                        adjustment = TIME_SLOT_ADJUSTMENTS["Afternoon"]
                    else:
                        adjustment = TIME_SLOT_ADJUSTMENTS["Evening"]
                    
                    # Add random volatility
                    volatility = random.uniform(-base_info["volatility"], base_info["volatility"])
                    final_rate = daily_base * adjustment * (1 + volatility)
                    
                    # Round to 2 decimal places
                    rate_per_unit = Decimal(str(round(final_rate, 2)))
                    
                    market_rate = MarketRate(
                        id=str(uuid4()),
                        flower_type_id=flower_type.id,
                        time_slot_id=time_slot.id,
                        rate_per_unit=rate_per_unit,
                        effective_date=rate_date,
                        is_active=True,
                        created_at=datetime.combine(rate_date, datetime.min.time()),
                        updated_at=datetime.utcnow()
                    )
                    
                    db.add(market_rate)
                    created_rates.append(market_rate)
        
        await db.commit()
        
        # Calculate statistics
        rates_by_flower = {}
        for rate in created_rates:
            if rate.flower_type_id not in rates_by_flower:
                rates_by_flower[rate.flower_type_id] = []
            rates_by_flower[rate.flower_type_id].append(float(rate.rate_per_unit))
        
        print(f"✓ Successfully seeded {len(created_rates)} market rates")
        print(f"  - Flower types: {len(flower_types)}")
        print(f"  - Time slots: {len(time_slots)}")
        print(f"  - Days covered: {days_back}")
        print(f"  - Rate ranges by flower:")
        for ft in flower_types:
            if ft.id in rates_by_flower:
                rates = rates_by_flower[ft.id]
                print(f"    - {ft.name}: ₹{min(rates):.2f} - ₹{max(rates):.2f}/kg")
        
        return created_rates
        
    except Exception as e:
        print(f"✗ Error seeding market rates: {e}")
        await db.rollback()
        raise e
        
    finally:
        await db.close()


async def get_current_rates():
    """Get current market rates for all flower types and time slots"""
    db_gen = get_db()
    db = await db_gen.__anext__()
    
    try:
        today = date.today()
        result = await db.execute(
            select(MarketRate)
            .where(MarketRate.effective_date == today, MarketRate.deleted_at == None)
        )
        rates = result.scalars().all()
        return rates
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(seed_market_rates(days_back=30))
