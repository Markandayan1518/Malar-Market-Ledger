#!/usr/bin/env python3
"""Add missing columns to flower_types table"""

import asyncio
from sqlalchemy import text
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.database import engine


async def add_columns():
    # Add unit column
    async with engine.begin() as conn:
        try:
            await conn.execute(text('ALTER TABLE flower_types ADD COLUMN unit VARCHAR(20)'))
            print('Added unit column')
        except Exception as e:
            if 'already exists' in str(e):
                print('unit column already exists')
            else:
                print(f'Error adding unit: {e}')
    
    # Add is_active column
    async with engine.begin() as conn:
        try:
            await conn.execute(text('ALTER TABLE flower_types ADD COLUMN is_active BOOLEAN DEFAULT TRUE'))
            print('Added is_active column')
        except Exception as e:
            if 'already exists' in str(e):
                print('is_active column already exists')
            else:
                print(f'Error adding is_active: {e}')

    
    # Update existing records to have default values
    async with engine.begin() as conn:
        await conn.execute(text("UPDATE flower_types SET unit = 'kg' WHERE unit IS NULL"))
        print('Set default unit values')
        
    async with engine.begin() as conn:
        await conn.execute(text('UPDATE flower_types SET is_active = TRUE WHERE is_active IS NULL'))
        print('Set default is_active values')
        
    async with engine.begin() as conn:
        # Use LEFT with SUBSTRING for PostgreSQL compatibility
        await conn.execute(text("UPDATE flower_types SET code = UPPER(LEFT(name, 3)) WHERE code IS NULL OR code = ''"))
        print('Set default code values')


if __name__ == "__main__":
    asyncio.run(add_columns())
