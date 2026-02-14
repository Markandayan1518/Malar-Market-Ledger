#!/usr/bin/env python3
"""Seed market rates data"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.database import SessionLocal
from app.models.flower_type import FlowerType
from app.models.time_slot import TimeSlot
from app.models.market_rate import MarketRate
from datetime import date

def seed_market_rates():
    """Seed market rates"""
    db = SessionLocal()
    
    # Get flower types and time slots
    flower_types = db.query(FlowerType).filter(FlowerType.is_active == True).all()
    time_slots = db.query(TimeSlot).filter(TimeSlot.is_active == True).all()
    
    # Create rates for each flower type and time slot
    for flower_type in flower_types:
        for time_slot in time_slots:
            # Determine rate based on time slot name
            if "Early Morning" in time_slot.name:
                rate = 150.00
            elif "Morning Peak" in time_slot.name:
                rate = 180.00
            elif "Late Morning" in time_slot.name:
                rate = 140.00
            elif "Afternoon" in time_slot.name:
                rate = 120.00
            elif "Evening" in time_slot.name:
                rate = 100.00
            else:
                rate = 130.00
            
            market_rate = MarketRate(
                flower_type_id=flower_type.id,
                time_slot_id=time_slot.id,
                rate_per_unit=rate,
                effective_date=date.today(),
                is_active=True
            )
            db.add(market_rate)
    
    db.commit()
    
    print(f"✓ Created {len(flower_types) * len(time_slots)} market rates")

if __name__ == "__main__":
    seed_market_rates()
