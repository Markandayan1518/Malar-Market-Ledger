#!/usr/bin/env python3
"""Seed sample cash advances for testing"""

import sys
import os
from datetime import date, timedelta
import random

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.database import SessionLocal
from app.models.farmer import Farmer
from app.models.user import User
from app.models.cash_advance import CashAdvance

def seed_cash_advances():
    """Seed sample cash advances"""
    db = SessionLocal()
    
    # Get farmers and users
    farmers = db.query(Farmer).filter(Farmer.is_active == True).all()
    users = db.query(User).filter(User.is_active == True).all()
    
    if not farmers or not users:
        print("✗ No farmers or users found. Run other seed scripts first.")
        return
    
    # Create cash advances for the last 30 days
    for days_ago in range(30):
        advance_date = date.today() - timedelta(days=days_ago)
        
        # Create 1-3 advances per day
        num_advances = random.randint(1, 3)
        
        for _ in range(num_advances):
            farmer = random.choice(farmers)
            user = random.choice(users)
            
            # Generate realistic advance amount
            amount = round(random.uniform(1000.0, 10000.0), 2)
            
            # Random status
            status = random.choice(["pending", "approved", "settled"])
            
            # If settled, set settlement date
            settlement_date = None
            if status == "settled":
                settlement_date = advance_date + timedelta(days=random.randint(1, 7))
            
            advance = CashAdvance(
                farmer_id=farmer.id,
                user_id=user.id,
                advance_date=advance_date,
                amount=amount,
                status=status,
                settlement_date=settlement_date,
                notes=f"Sample cash advance for {farmer.name}"
            )
            db.add(advance)
    
    db.commit()
    
    print(f"✓ Created sample cash advances for last 30 days")

if __name__ == "__main__":
    seed_cash_advances()
