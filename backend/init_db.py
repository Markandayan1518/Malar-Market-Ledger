#!/usr/bin/env python3
"""
Database initialization script for Malar Market Digital Ledger
Run this script to create all database tables
"""

import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.database import init_db, close_db
from app.models import *  # Import all models to register them with SQLAlchemy

async def main():
    """Initialize database tables"""
    print("Initializing database...")
    try:
        await init_db()
        print("✓ Database tables created successfully!")
    except Exception as e:
        print(f"✗ Error initializing database: {e}")
        sys.exit(1)
    finally:
        await close_db()

if __name__ == "__main__":
    asyncio.run(main())