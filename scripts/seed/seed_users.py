#!/usr/bin/env python3
"""
Seed users data for Malar Market Digital Ledger
"""

import asyncio
import sys
import os
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'backend'))

from app.database import get_db
from app.models.user import User, UserRole
from app.core.auth import get_password_hash
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4


async def seed_users():
    """Seed users data"""
    print("Seeding users...")
    
    # Sample users data
    users_data = [
        {
            "id": str(uuid.uuid4()),
            "username": "admin",
            "email": "admin@malar.com",
            "password": get_password_hash("admin123"),
            "role": UserRole.ADMIN,
            "full_name": "Admin User",
            "phone": "+919876543210",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "username": "staff",
            "email": "staff@malar.com",
            "password": get_password_hash("staff123"),
            "role": UserRole.STAFF,
            "full_name": "Staff User",
            "phone": "+919876543211",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "username": "farmer1",
            "email": "farmer1@malar.com",
            "password": get_password_hash("farmer123"),
            "role": UserRole.FARMER,
            "full_name": "Farmer One",
            "phone": "+919876543212",
            "is_active": True,
            "created_at": datetime.utcnow()
        }
    ]
    
    # Get database session
    db = next(get_db())
    
    try:
        # Insert users
        for user_data in users_data:
            user = User(
                id=user_data["id"],
                username=user_data["username"],
                email=user_data["email"],
                password=user_data["password"],
                role=user_data["role"],
                full_name=user_data["full_name"],
                phone=user_data["phone"],
                is_active=user_data["is_active"],
                created_at=user_data["created_at"]
            )
            db.add(user)
        
        await db.commit()
        print(f"✓ Successfully seeded {len(users_data)} users")
        
    except Exception as e:
        print(f"✗ Error seeding users: {e}")
        raise e
        
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(seed_users())
