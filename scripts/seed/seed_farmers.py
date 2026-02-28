#!/usr/bin/env python3
"""
Seed farmers data for Malar Market Digital Ledger using Faker
Generates 50+ realistic Tamil Nadu farmer profiles
"""

import asyncio
import sys
import os
import random
from datetime import datetime
from decimal import Decimal

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'backend'))

from faker import Faker
from app.database import get_db
from app.models.farmer import Farmer
from sqlalchemy import select
from uuid import uuid4

# Initialize Faker with Indian locale for more realistic data
fake = Faker('en_IN')

# Tamil Nadu villages and towns for realistic location data
TAMIL_NADU_VILLAGES = [
    "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem",
    "Tirunelveli", "Tiruppur", "Erode", "Vellore", "Thoothukudi",
    "Dindigul", "Thanjavur", "Ranipet", "Sivakasi", "Karur",
    "Udhagamandalam", "Hosur", "Nagercoil", "Kanchipuram", "Karur",
    "Cuddalore", "Kumbakonam", "Tiruvannamalai", "Pollachi", "Rajapalayam",
    "Gobichettipalayam", "Pudukkottai", "Villupuram", "Ambur", "Neyveli",
    "Nagapattinam", "Karaikudi", "Cumbum", "Tiruvarur", "Sivaganga",
    "Ooty", "Kovilpatti", "Mettur", "Papanasam", "Mayiladuthurai",
    "Arakkonam", "Tindivanam", "Namakkal", "Dharmapuri", "Mannargudi",
    "Perambalur", "Pattukkottai", "Krishnagiri", "Tiruchengode"
]

# Tamil names for farmers
TAMIL_FIRST_NAMES_MALE = [
    "Raj", "Kumar", "Siva", "Murugan", "Ramesh", "Suresh", "Mohan", "Karthik",
    "Arul", "Bala", "Chinnadurai", "Durai", "Elango", "Ganesan", "Jagan",
    "Kannan", "Lakshmanan", "Muthu", "Natarajan", "Palani", "Raju", "Selvam",
    "Thangam", "Udaya", "Velmurugan", "Yogesh", "Anbu", "Bharathi", "Chandran"
]

TAMIL_FIRST_NAMES_FEMALE = [
    "Mala", "Lakshmi", "Saroja", "Kamala", "Padma", "Sita", "Ganga", "Yamuna",
    "Kaveri", "Tamilarasi", "Ponni", "Bhavani", "Chitra", "Deepa", "Geetha",
    "Hema", "Indira", "Jaya", "Kala", "Leela", "Meena", "Nandini", "Oviya",
    "Prema", "Rani", "Sundari", "Thamizh", "Uma", "Vani", "Zamuna"
]

TAMIL_LAST_NAMES = [
    "Perumal", "Rajan", "Kumaran", "Muthusamy", "Ramasamy", "Chinnasamy",
    "Subramanian", "Kandasamy", "Ponnusamy", "Ganesan", "Murugesan",
    "Palanisamy", "Vellasamy", "Thangasamy", "Marisamy", "Velusamy",
    "Sundaram", "Lakshmanan", "Narayanan", "Ramanathan", "Chelladurai",
    "Pandiarajan", "Thiagarajan", "Balasubramanian", "Venkatesh"
]


def generate_tamil_name():
    """Generate a realistic Tamil name"""
    is_female = random.choice([True, False])
    if is_female:
        first_name = random.choice(TAMIL_FIRST_NAMES_FEMALE)
    else:
        first_name = random.choice(TAMIL_FIRST_NAMES_MALE)
    last_name = random.choice(TAMIL_LAST_NAMES)
    return f"{first_name} {last_name}", is_female


def generate_indian_phone():
    """Generate a realistic Indian phone number"""
    # Indian mobile prefixes
    prefixes = ['98', '99', '91', '90', '93', '94', '95', '96', '97', '89', '88', '87', '86', '85', '84', '83', '82', '81', '80', '79', '78', '77', '76', '75', '74', '73', '72', '71', '70']
    prefix = random.choice(prefixes)
    number = ''.join([str(random.randint(0, 9)) for _ in range(8)])
    return f"+91{prefix}{number}"


def generate_farmer_code(index):
    """Generate a unique farmer code"""
    return f"F{str(index).zfill(4)}"


async def seed_farmers(count=50):
    """Seed farmers data with Faker-generated realistic data"""
    print(f"Seeding {count} farmers with Faker data...")
    
    # Get database session
    db_gen = get_db()
    db = await db_gen.__anext__()
    
    created_farmers = []
    skipped_count = 0
    
    try:
        # Check how many farmers already exist
        existing_result = await db.execute(
            select(Farmer).where(Farmer.deleted_at == None)
        )
        existing_farmers = existing_result.scalars().all()
        existing_codes = {f.farmer_code for f in existing_farmers}
        
        if len(existing_farmers) >= count:
            print(f"✓ Farmers already seeded ({len(existing_farmers)} exist)")
            return existing_farmers
        
        # Start from the next available index
        start_index = len(existing_farmers) + 1
        
        for i in range(start_index, count + 1):
            # Generate realistic Tamil name
            full_name, is_female = generate_tamil_name()
            
            # Generate unique phone and farmer code
            phone = generate_indian_phone()
            farmer_code = generate_farmer_code(i)
            
            # Skip if farmer code already exists
            if farmer_code in existing_codes:
                skipped_count += 1
                continue
            
            # Select a random village
            village = random.choice(TAMIL_NADU_VILLAGES)
            
            # Generate address
            address = f"{fake.street_address()}, {village} District, Tamil Nadu"
            
            # Generate financial data (realistic for flower farmers)
            current_balance = Decimal(str(round(random.uniform(-5000, 25000), 2)))
            total_advances = Decimal(str(round(random.uniform(0, 15000), 2)))
            total_settlements = Decimal(str(round(random.uniform(5000, 50000), 2)))
            commission_pct = Decimal(str(random.choice([8.00, 10.00, 12.00, 15.00])))
            flat_fee_monthly = Decimal(str(random.choice([0, 100, 200, 500])))
            
            # Generate WhatsApp number (sometimes same as phone, sometimes different)
            whatsapp_number = phone if random.random() > 0.3 else generate_indian_phone()
            
            farmer = Farmer(
                id=str(uuid4()),
                farmer_code=farmer_code,
                name=full_name,
                phone=phone,
                village=village,
                whatsapp_number=whatsapp_number,
                address=address,
                current_balance=current_balance,
                total_advances=total_advances,
                total_settlements=total_settlements,
                commission_pct=commission_pct,
                flat_fee_monthly=flat_fee_monthly,
                is_active=random.random() > 0.1,  # 90% active
                created_at=fake.date_time_between(start_date='-2y', end_date='now'),
                updated_at=datetime.utcnow()
            )
            
            db.add(farmer)
            created_farmers.append(farmer)
            existing_codes.add(farmer_code)
        
        await db.commit()
        
        total_farmers = len(existing_farmers) + len(created_farmers)
        print(f"✓ Successfully seeded {len(created_farmers)} new farmers")
        if skipped_count > 0:
            print(f"  - Skipped {skipped_count} existing farmer codes")
        print(f"  - Total farmers in database: {total_farmers}")
        
        return created_farmers
        
    except Exception as e:
        print(f"✗ Error seeding farmers: {e}")
        await db.rollback()
        raise e
        
    finally:
        await db.close()


async def get_farmers():
    """Get all farmers from database"""
    db_gen = get_db()
    db = await db_gen.__anext__()
    
    try:
        result = await db.execute(
            select(Farmer).where(Farmer.deleted_at == None).order_by(Farmer.created_at)
        )
        farmers = result.scalars().all()
        return farmers
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(seed_farmers(50))
