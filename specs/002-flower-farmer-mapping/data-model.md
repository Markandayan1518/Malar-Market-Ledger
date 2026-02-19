# Data Model: Shop-Specific Flower Types and Farmer Mapping

**Feature**: 002-flower-farmer-mapping
**Date**: 2026-02-19

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────────┐       ┌─────────────────┐
│    farmers      │       │   farmer_products   │       │  flower_types   │
├─────────────────┤       ├─────────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)             │    ┌──│ id (PK)         │
│ farmer_code     │  │    │ farmer_id (FK)      │────┘  │ name            │
│ name            │  └───>│ flower_type_id (FK) │<──────│ name_ta         │
│ village         │       │ created_at          │       │ code            │
│ phone           │       └─────────────────────┘       │ is_active       │
│ ...             │                                     │ deleted_at      │
└─────────────────┘                                     └─────────────────┘
```

## New Table: farmer_products

Associates farmers with the flower types they typically supply.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID string |
| farmer_id | VARCHAR(36) | NOT NULL, FK → farmers.id | Reference to farmer |
| flower_type_id | VARCHAR(36) | NOT NULL, FK → flower_types.id | Reference to flower type |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Association creation time |

### Indexes

| Name | Columns | Type |
|------|---------|------|
| ix_farmer_products_farmer_id | farmer_id | B-tree |
| ix_farmer_products_flower_type_id | flower_type_id | B-tree |
| ix_farmer_products_farmer_flower | farmer_id, flower_type_id | Composite |
| uq_farmer_flower | farmer_id, flower_type_id | UNIQUE |

### Foreign Key Constraints

| Constraint | On Delete | Action |
|------------|-----------|--------|
| fk_farmer_products_farmer | farmers.id | CASCADE |
| fk_farmer_products_flower | flower_types.id | CASCADE |

## Modified Table: flower_types

Add soft delete field for consistency with other models.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| deleted_at | TIMESTAMP | NULLABLE | Soft delete timestamp |

**Note**: The `is_active` field already exists and is used for shop-level enable/disable. The `deleted_at` field is for permanent soft deletion.

## Modified Table: farmers (via relationship)

No schema changes, but new relationship added:

```python
farmer_products = relationship(
    "FarmerProduct",
    back_populates="farmer",
    cascade="all, delete-orphan"
)
```

## SQLAlchemy Models

### FarmerProduct (NEW)

**File**: `backend/app/models/farmer_product.py`

```python
"""Farmer-Flower association model for crop mapping."""

from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class FarmerProduct(Base):
    """
    Associates farmers with the flower types they typically supply.
    Used for smart suggestions during daily entry.
    """
    __tablename__ = "farmer_products"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True
    )
    
    farmer_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("farmers.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    flower_type_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("flower_types.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    # Relationships
    farmer = relationship("Farmer", back_populates="farmer_products")
    flower_type = relationship("FlowerType", back_populates="farmer_products")

    # Constraints
    __table_args__ = (
        UniqueConstraint('farmer_id', 'flower_type_id', name='uq_farmer_flower'),
        Index('ix_farmer_products_farmer_flower', 'farmer_id', 'flower_type_id'),
    )

    def __repr__(self) -> str:
        return f"<FarmerProduct(farmer_id={self.farmer_id}, flower_id={self.flower_type_id})>"
```

### FlowerType (MODIFIED)

**File**: `backend/app/models/flower_type.py`

Add `deleted_at` field and `farmer_products` relationship:

```python
# Add to imports
from typing import Optional

# Add field
deleted_at: Mapped[Optional[datetime]] = mapped_column(
    DateTime,
    nullable=True
)

# Add relationship
farmer_products = relationship(
    "FarmerProduct",
    back_populates="flower_type",
    cascade="all, delete-orphan"
)
```

### Farmer (MODIFIED)

**File**: `backend/app/models/farmer.py`

Add `farmer_products` relationship:

```python
# Add relationship
farmer_products = relationship(
    "FarmerProduct",
    back_populates="farmer",
    cascade="all, delete-orphan"
)
```

## Migration SQL

### Create farmer_products table

```sql
-- Create farmer_products table
CREATE TABLE farmer_products (
    id VARCHAR(36) PRIMARY KEY,
    farmer_id VARCHAR(36) NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    flower_type_id VARCHAR(36) NOT NULL REFERENCES flower_types(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX ix_farmer_products_farmer_id ON farmer_products(farmer_id);
CREATE INDEX ix_farmer_products_flower_type_id ON farmer_products(flower_type_id);
CREATE INDEX ix_farmer_products_farmer_flower ON farmer_products(farmer_id, flower_type_id);

-- Create unique constraint
ALTER TABLE farmer_products ADD CONSTRAINT uq_farmer_flower UNIQUE (farmer_id, flower_type_id);
```

### Add deleted_at to flower_types

```sql
-- Add deleted_at column to flower_types
ALTER TABLE flower_types ADD COLUMN deleted_at TIMESTAMP NULL;

-- Create index for soft delete queries
CREATE INDEX ix_flower_types_deleted_at ON flower_types(deleted_at);
```

## Data Migration (Optional)

Seed existing farmers with flower associations based on their historical entries:

```sql
-- Create associations from historical daily entries
INSERT INTO farmer_products (id, farmer_id, flower_type_id, created_at)
SELECT 
    gen_random_uuid()::text,
    DISTINCT farmer_id,
    flower_type_id,
    NOW()
FROM daily_entries
WHERE deleted_at IS NULL
AND farmer_id IS NOT NULL
AND flower_type_id IS NOT NULL
ON CONFLICT (farmer_id, flower_type_id) DO NOTHING;
```

## Query Patterns

### Get farmer's associated flowers

```python
async def get_farmer_flowers(db: AsyncSession, farmer_id: str):
    result = await db.execute(
        select(FlowerType)
        .join(FarmerProduct)
        .where(FarmerProduct.farmer_id == farmer_id)
        .where(FlowerType.is_active == True)
        .where(FlowerType.deleted_at == None)
        .order_by(FlowerType.name)
    )
    return result.scalars().all()
```

### Get suggested flower for farmer

```python
async def get_suggested_flower(db: AsyncSession, farmer_id: str):
    flowers = await get_farmer_flowers(db, farmer_id)
    
    if len(flowers) == 1:
        return {
            "suggested_flower_id": flowers[0].id,
            "suggestion_type": "auto_select"
        }
    elif len(flowers) > 1:
        return {
            "suggested_flower_id": None,
            "suggestion_type": "prioritize",
            "associated_flower_ids": [f.id for f in flowers]
        }
    else:
        return {
            "suggested_flower_id": None,
            "suggestion_type": "none"
        }
```

### Get all active flowers with association status

```python
async def get_flowers_with_association(db: AsyncSession, farmer_id: str):
    # Get all active flowers
    all_flowers = await db.execute(
        select(FlowerType)
        .where(FlowerType.is_active == True)
        .where(FlowerType.deleted_at == None)
        .order_by(FlowerType.name)
    )
    
    # Get farmer's associations
    associated_ids = set(await get_farmer_flower_ids(db, farmer_id))
    
    return [
        {
            "id": f.id,
            "name": f.name,
            "name_ta": f.name_ta,
            "is_associated": f.id in associated_ids
        }
        for f in all_flowers.scalars().all()
    ]
```
