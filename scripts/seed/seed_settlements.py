#!/usr/bin/env python3
"""Seed sample settlements for testing"""

import sys
import os
from datetime import date, timedelta
import random

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.database import SessionLocal
from app.models.farmer import Farmer
from app.models.user import User
from app.models.settlement import Settlement

def seed_settlements():
    """Seed sample settlements"""
    db = SessionLocal()
    
    # Get farmers and users
    farmers = db.query(Farmer).filter(Farmer.is_active == True).all()
    users = db.query(User).filter(User.is_active == True).all()
    
    if not farmers or not users:
        print("✗ No farmers or users found. Run other seed scripts first.")
        return
    
    # Create settlements for the last 8 weeks
    for weeks_ago in range(8):
        settlement_date = date.today() - timedelta(weeks=weeks_ago)
        
        # Create settlements for 3-5 farmers per week
        num_settlements = random.randint(3, 5)
        
        for _ in range(num_settlements):
            farmer = random.choice(farmers)
            user = random.choice(users)
            
            # Generate realistic settlement amount
            total_amount = round(random.uniform(5000.0, 50000.0), 2)
            commission_amount = round(total_amount * 0.05, 2)
            cash_advance_deductions = round(random.uniform(0.0, 5000.0), 2)
            net_amount = round(total_amount - commission_amount - cash_advance_deductions, 2)
            
            # Random status
            status = random.choice(["pending", "paid"])
            
            # If paid, set payment date
            payment_date = None
            if status == "paid":
                payment_date = settlement_date + timedelta(days=random.randint(1, 3))
            
            settlement = Settlement(
                farmer_id=farmer.id,
                user_id=user.id,
                settlement_date=settlement_date,
                total_amount=total_amount,
                commission_amount=commission_amount,
                cash_advance_deductions=cash_advance_deductions,
                net_amount=net_amount,
                status=status,
                payment_date=payment_date,
                notes=f"Weekly settlement for {farmer.name}"
            )
            db.add(settlement)
    
    db.commit()
    
    print(f"✓ Created sample settlements for last 8 weeks")

if __name__ == "__main__":
    seed_settlements()
