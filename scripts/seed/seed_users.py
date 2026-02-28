#!/usr/bin/env python3
"""
Seed users data for Malar Market Digital Ledger using Faker
Generates realistic user accounts for admin, staff, and farmer roles
"""

import asyncio
import sys
import os
import random
import uuid
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'backend'))

from faker import Faker
from app.database import get_db
from app.models.user import User, UserRole
from app.core.auth import get_password_hash
from sqlalchemy import select

# Initialize Faker with Indian locale
fake = Faker('en_IN')

# Tamil names for users
TAMIL_NAMES = [
    "Raj Kumar", "Mala Rani", "Siva Perumal", "Lakshmi Devi", "Karthik Rajan",
    "Saroja Kumari", "Murugan Swamy", "Kamala Sundaram", "Ramesh Babu", "Padma Priya",
    "Suresh Kumar", "Sita Ram", "Mohan Das", "Ganga Bhavani", "Arul Jyothi",
    "Deepa Lakshmi", "Kannan Govind", "Meena Kumari", "Natarajan Pillai", "Rani Ammal"
]


async def seed_users():
    """Seed users data with Faker-generated realistic data"""
    print("Seeding users with Faker data...")
    
    # Get database session
    db_gen = get_db()
    db = await db_gen.__anext__()
    
    try:
        seeded_count = 0
        
        # Create core admin user (check if exists first)
        result = await db.execute(
            select(User).where(User.email == "admin@malar.com")
        )
        admin_user = result.scalar_one_or_none()
        
        if not admin_user:
            admin_user = User(
                id=str(uuid.uuid4()),
                email="admin@malar.com",
                password_hash=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                full_name="Administrator",
                phone="+919876543210",
                is_active=True,
                email_verified=True,
                language_preference="en",
                created_at=datetime.utcnow()
            )
            db.add(admin_user)
            seeded_count += 1
        
        # Create staff users
        staff_count = 0
        for i in range(1, 6):  # 5 staff users
            result = await db.execute(
                select(User).where(User.email == f"staff{i}@malar.com")
            )
            existing = result.scalar_one_or_none()
            
            if not existing:
                staff_user = User(
                    id=str(uuid.uuid4()),
                    email=f"staff{i}@malar.com",
                    password_hash=get_password_hash("staff123"),
                    role=UserRole.STAFF,
                    full_name=random.choice(TAMIL_NAMES),
                    phone=f"+9198765432{str(i+10).zfill(2)}",
                    is_active=True,
                    email_verified=True,
                    language_preference="en",
                    created_at=fake.date_time_between(start_date='-1y', end_date='now')
                )
                db.add(staff_user)
                seeded_count += 1
                staff_count += 1
        
        # Create demo/test users for each role
        demo_users_data = [
            {
                "email": "demo_admin@malar.com",
                "password": "demo123",
                "role": UserRole.ADMIN,
                "full_name": "Demo Administrator",
                "phone": "+919999999901"
            },
            {
                "email": "demo_staff@malar.com",
                "password": "demo123",
                "role": UserRole.STAFF,
                "full_name": "Demo Staff User",
                "phone": "+919999999902"
            },
            {
                "email": "demo_farmer@malar.com",
                "password": "demo123",
                "role": UserRole.FARMER,
                "full_name": "Demo Farmer",
                "phone": "+919999999903"
            }
        ]
        
        demo_count = 0
        for demo_data in demo_users_data:
            result = await db.execute(
                select(User).where(User.email == demo_data["email"])
            )
            existing = result.scalar_one_or_none()
            
            if not existing:
                demo_user = User(
                    id=str(uuid.uuid4()),
                    email=demo_data["email"],
                    password_hash=get_password_hash(demo_data["password"]),
                    role=demo_data["role"],
                    full_name=demo_data["full_name"],
                    phone=demo_data["phone"],
                    is_active=True,
                    email_verified=True,
                    language_preference="en",
                    created_at=datetime.utcnow()
                )
                db.add(demo_user)
                seeded_count += 1
                demo_count += 1
        
        await db.commit()
        
        print(f"✓ Successfully seeded {seeded_count} new users")
        print("  Test credentials:")
        print("  - Admin: admin@malar.com / admin123")
        print("  - Staff: staff1-5@malar.com / staff123")
        print("  - Demo: demo_*@malar.com / demo123")
        
        return {
            'admin': admin_user,
            'seeded_count': seeded_count
        }
        
    except Exception as e:
        print(f"✗ Error seeding users: {e}")
        await db.rollback()
        raise e
        
    finally:
        await db.close()


async def get_users_by_role(role: UserRole):
    """Get all users by role from database"""
    db_gen = get_db()
    db = await db_gen.__anext__()
    
    try:
        result = await db.execute(
            select(User).where(User.role == role, User.deleted_at == None)
        )
        users = result.scalars().all()
        return users
    finally:
        await db.close()


async def get_admin_user():
    """Get first admin user from database"""
    db_gen = get_db()
    db = await db_gen.__anext__()
    
    try:
        result = await db.execute(
            select(User).where(User.role == UserRole.ADMIN, User.deleted_at == None).limit(1)
        )
        admin = result.scalar_one_or_none()
        return admin
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(seed_users())
