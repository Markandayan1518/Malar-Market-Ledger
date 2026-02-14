#!/usr/bin/env python3
"""Seed users data"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.database import SessionLocal, engine
from app.models.user import User
from app.core.auth import get_password_hash

def seed_users():
    """Seed admin and staff users"""
    db = SessionLocal()
    
    # Create admin user
    admin_user = User(
        email="admin@malar.com",
        full_name="Admin User",
        phone="+919876543210",
        role="admin",
        is_active=True,
        email_verified=True,
        language_preference="en",
        password_hash=get_password_hash("Admin@123")
    )
    db.add(admin_user)
    
    # Create staff users
    staff_users = [
        User(
            email=f"staff{i}@malar.com",
            full_name=f"Staff User {i}",
            phone=f"+9198765432{i:02d}",
            role="staff",
            is_active=True,
            email_verified=True,
            language_preference="ta" if i <= 2 else "en",
            password_hash=get_password_hash(f"Staff{i}@123")
        )
        for i in range(1, 5)
    ]
    
    db.add_all(staff_users)
    db.commit()
    
    print(f"✓ Created {len(staff_users) + 1} users")

if __name__ == "__main__":
    seed_users()
