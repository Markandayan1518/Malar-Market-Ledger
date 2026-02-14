#!/usr/bin/env python3
"""Seed sample daily entries for testing"""

import sys
import os
from datetime import date, timedelta
import random

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.database import SessionLocal
from app.models.farmer import Farmer
from app.models.flower_type import FlowerType
from app.models.time_slot import TimeSlot
from app.models.daily_entry import DailyEntry

def seed_daily_entries():
    """Seed sample daily entries"""
    db = SessionLocal()
    
    # Get farmers, flower types, and time slots
    farmers = db.query(Farmer).filter(Farmer.is_active == True).all()
    flower_types = db.query(FlowerType).filter(FlowerType.is_active == True).all()
    time_slots = db.query(TimeSlot).filter(TimeSlot.is_active == True).all()
    
    if not farmers or not flower_types or not time_slots:
        print("✗ No farmers, flower types, or time slots found. Run other seed scripts first.")
        return
    
    # Create entries for the last 7 days
    for days_ago in range(7):
        entry_date = date.today() - timedelta(days=days_ago)
        
        # Create 5-10 entries per day
        num_entries = random.randint(5, 10)
        
        for _ in range(num_entries):
            farmer = random.choice(farmers)
            flower_type = random.choice(flower_types)
            time_slot = random.choice(time_slots)
            
            # Generate realistic values
            weight_kg = round(random.uniform(5.0, 50.0), 2)
            rate_per_unit = round(random.uniform(100.0, 200.0), 2)
            total_amount = round(weight_kg * rate_per_unit, 2)
            commission_amount = round(total_amount * 0.05, 2)  # 5% commission
            net_amount = round(total_amount - commission_amount, 2)
            
            entry = DailyEntry(
                farmer_id=farmer.id,
                flower_type_id=flower_type.id,
                time_slot_id=time_slot.id,
                entry_date=entry_date,
                weight_kg=weight_kg,
                rate_per_unit=rate_per_unit,
                total_amount=total_amount,
                commission_amount=commission_amount,
                net_amount=net_amount,
                status="verified",
                notes=f"Sample entry for {farmer.name}"
            )
            db.add(entry)
    
    db.commit()
    
    print(f"✓ Created sample daily entries for last 7 days")

if __name__ == "__main__":
    seed_daily_entries()
