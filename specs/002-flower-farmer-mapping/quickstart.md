# Quickstart: Shop-Specific Flower Types and Farmer Mapping

**Feature**: 002-flower-farmer-mapping
**Estimated Time**: ~20 hours

## Prerequisites

- Backend virtual environment activated
- Frontend dependencies installed
- Database running (PostgreSQL)
- Redis running (optional, for caching)

## Step 1: Database Migration (30 min)

### 1.1 Create the new model file

Create `backend/app/models/farmer_product.py`:

```python
"""Farmer-Flower association model for crop mapping."""

import uuid
from datetime import datetime
from typing import Optional

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
        primary_key=True,
        default=lambda: str(uuid.uuid4())
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

    __table_args__ = (
        UniqueConstraint('farmer_id', 'flower_type_id', name='uq_farmer_flower'),
        Index('ix_farmer_products_farmer_flower', 'farmer_id', 'flower_type_id'),
    )
```

### 1.2 Update existing models

**In `backend/app/models/flower_type.py`**, add:

```python
# Add to imports
from typing import Optional

# Add field (after is_active)
deleted_at: Mapped[Optional[datetime]] = mapped_column(
    DateTime,
    nullable=True
)

# Add relationship (in relationships section)
farmer_products = relationship(
    "FarmerProduct",
    back_populates="flower_type",
    cascade="all, delete-orphan"
)
```

**In `backend/app/models/farmer.py`**, add:

```python
# Add relationship (in relationships section)
farmer_products = relationship(
    "FarmerProduct",
    back_populates="farmer",
    cascade="all, delete-orphan"
)
```

### 1.3 Register the model

**In `backend/app/models/__init__.py`**, add import:

```python
from app.models.farmer_product import FarmerProduct
```

### 1.4 Run migration

```bash
cd backend
source venv/bin/activate
alembic revision --autogenerate -m "add_farmer_products_table"
alembic upgrade head
```

## Step 2: Backend API (3 hours)

### 2.1 Create schemas

**In `backend/app/schemas/all_schemas.py`**, add:

```python
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class FarmerProductBase(BaseModel):
    flower_type_id: str

class FarmerProductCreate(FarmerProductBase):
    pass

class FarmerProductResponse(FarmerProductBase):
    id: str
    farmer_id: str
    flower_name: str
    flower_name_ta: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SuggestedFlowerResponse(BaseModel):
    farmer_id: str
    suggested_flower_id: Optional[str] = None
    suggestion_type: str  # "auto_select" | "prioritize" | "none"
    associated_flowers: List[dict] = []
    all_active_flowers: List[dict] = []
```

### 2.2 Create API routes

Create `backend/app/api/farmer_products.py`:

```python
"""Farmer-Product association API routes."""

import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.dependencies import CurrentStaffOrAdminUser, DatabaseSession
from app.models.farmer import Farmer
from app.models.flower_type import FlowerType
from app.models.farmer_product import FarmerProduct
from app.schemas.common import create_success_response

router = APIRouter(tags=["Farmer Products"])


@router.get("/farmers/{farmer_id}/products")
async def get_farmer_products(
    farmer_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """Get all flower associations for a farmer."""
    # Verify farmer exists
    farmer = await db.execute(
        select(Farmer).where(Farmer.id == farmer_id, Farmer.deleted_at == None)
    )
    if not farmer.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    # Get associations with flower details
    result = await db.execute(
        select(FarmerProduct, FlowerType)
        .join(FlowerType, FarmerProduct.flower_type_id == FlowerType.id)
        .where(FarmerProduct.farmer_id == farmer_id)
        .where(FlowerType.is_active == True)
        .where(FlowerType.deleted_at == None)
        .order_by(FlowerType.name)
    )
    
    associations = []
    for fp, ft in result.all():
        associations.append({
            "id": fp.id,
            "farmer_id": fp.farmer_id,
            "flower_type_id": ft.id,
            "flower_name": ft.name,
            "flower_name_ta": ft.name_ta,
            "created_at": fp.created_at.isoformat()
        })
    
    return create_success_response(associations)


@router.post("/farmers/{farmer_id}/products", status_code=201)
async def add_farmer_product(
    farmer_id: str,
    flower_type_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """Add a flower association to a farmer."""
    # Verify farmer exists
    farmer = await db.execute(
        select(Farmer).where(Farmer.id == farmer_id, Farmer.deleted_at == None)
    )
    if not farmer.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    # Verify flower exists and is active
    flower = await db.execute(
        select(FlowerType).where(
            FlowerType.id == flower_type_id,
            FlowerType.is_active == True,
            FlowerType.deleted_at == None
        )
    )
    if not flower.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Flower type not found or inactive")
    
    # Check for duplicate
    existing = await db.execute(
        select(FarmerProduct).where(
            FarmerProduct.farmer_id == farmer_id,
            FarmerProduct.flower_type_id == flower_type_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Association already exists")
    
    # Create association
    association = FarmerProduct(
        id=str(uuid.uuid4()),
        farmer_id=farmer_id,
        flower_type_id=flower_type_id
    )
    db.add(association)
    await db.commit()
    await db.refresh(association)
    
    return create_success_response({
        "id": association.id,
        "farmer_id": farmer_id,
        "flower_type_id": flower_type_id
    }, message="Association added successfully")


@router.delete("/farmers/{farmer_id}/products/{flower_type_id}")
async def remove_farmer_product(
    farmer_id: str,
    flower_type_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """Remove a flower association from a farmer."""
    result = await db.execute(
        select(FarmerProduct).where(
            FarmerProduct.farmer_id == farmer_id,
            FarmerProduct.flower_type_id == flower_type_id
        )
    )
    association = result.scalar_one_or_none()
    
    if not association:
        raise HTTPException(status_code=404, detail="Association not found")
    
    await db.delete(association)
    await db.commit()
    
    return create_success_response({"deleted": True})


@router.get("/farmers/{farmer_id}/suggested-flower")
async def get_suggested_flower(
    farmer_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """Get suggested flower for daily entry based on farmer's associations."""
    # Verify farmer exists
    farmer = await db.execute(
        select(Farmer).where(Farmer.id == farmer_id, Farmer.deleted_at == None)
    )
    if not farmer.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    # Get farmer's associated flowers
    result = await db.execute(
        select(FlowerType)
        .join(FarmerProduct, FlowerType.id == FarmerProduct.flower_type_id)
        .where(FarmerProduct.farmer_id == farmer_id)
        .where(FlowerType.is_active == True)
        .where(FlowerType.deleted_at == None)
        .order_by(FlowerType.name)
    )
    associated_flowers = result.scalars().all()
    
    # Get all active flowers
    all_result = await db.execute(
        select(FlowerType)
        .where(FlowerType.is_active == True)
        .where(FlowerType.deleted_at == None)
        .order_by(FlowerType.name)
    )
    all_flowers = all_result.scalars().all()
    
    # Determine suggestion type
    if len(associated_flowers) == 1:
        suggestion_type = "auto_select"
        suggested_id = associated_flowers[0].id
    elif len(associated_flowers) > 1:
        suggestion_type = "prioritize"
        suggested_id = None
    else:
        suggestion_type = "none"
        suggested_id = None
    
    return create_success_response({
        "farmer_id": farmer_id,
        "suggested_flower_id": suggested_id,
        "suggestion_type": suggestion_type,
        "associated_flowers": [
            {"id": f.id, "name": f.name, "name_ta": f.name_ta}
            for f in associated_flowers
        ],
        "all_active_flowers": [
            {"id": f.id, "name": f.name, "name_ta": f.name_ta}
            for f in all_flowers
        ]
    })
```

### 2.3 Register routes

**In `backend/app/api/routes.py`**, add:

```python
from app.api.farmer_products import router as farmer_products_router
# ...
api_router.include_router(farmer_products_router)
```

## Step 3: Frontend Service (30 min)

Create `frontend/src/services/farmerProductService.js`:

```javascript
import api from './api';

export const getFarmerProducts = async (farmerId) => {
  const response = await api.get(`/farmers/${farmerId}/products`);
  return response.data.data;
};

export const addFarmerProduct = async (farmerId, flowerTypeId) => {
  const response = await api.post(
    `/farmers/${farmerId}/products?flower_type_id=${flowerTypeId}`
  );
  return response.data.data;
};

export const removeFarmerProduct = async (farmerId, flowerTypeId) => {
  const response = await api.delete(
    `/farmers/${farmerId}/products/${flowerTypeId}`
  );
  return response.data.data;
};

export const getSuggestedFlower = async (farmerId) => {
  const response = await api.get(`/farmers/${farmerId}/suggested-flower`);
  return response.data.data;
};
```

## Step 4: Farmer Crop Selector Component (2 hours)

Create `frontend/src/components/farmers/FarmerCropSelector.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getActiveFlowerTypes } from '../../services/flowerTypeService';
import {
  getFarmerProducts,
  addFarmerProduct,
  removeFarmerProduct
} from '../../services/farmerProductService';

export function FarmerCropSelector({ farmerId, onChange }) {
  const { t } = useTranslation();
  const [flowers, setFlowers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [farmerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load all active flowers
      const flowersRes = await getActiveFlowerTypes();
      setFlowers(flowersRes.data || flowersRes);

      // Load farmer's current associations
      if (farmerId) {
        const productsRes = await getFarmerProducts(farmerId);
        const ids = (productsRes.data || productsRes).map(p => p.flower_type_id);
        setSelectedIds(ids);
      }
    } catch (error) {
      console.error('Failed to load crop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFlower = async (flowerId) => {
    try {
      if (selectedIds.includes(flowerId)) {
        await removeFarmerProduct(farmerId, flowerId);
        setSelectedIds(prev => prev.filter(id => id !== flowerId));
      } else {
        await addFarmerProduct(farmerId, flowerId);
        setSelectedIds(prev => [...prev, flowerId]);
      }
      onChange?.(selectedIds);
    } catch (error) {
      console.error('Failed to update association:', error);
    }
  };

  if (loading) {
    return <div className="text-warm-charcoal/60">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-warm-charcoal">
        {t('farmers.supplyingCrops')} / {t('farmers.supplyingCropsTa')}
      </label>
      <div className="grid grid-cols-2 gap-2">
        {flowers.map(flower => (
          <label
            key={flower.id}
            className={`
              flex items-center gap-2 p-3 rounded-lg border cursor-pointer
              transition-colors duration-200
              ${selectedIds.includes(flower.id)
                ? 'border-accent-magenta bg-accent-magenta/10'
                : 'border-warm-taupe/30 hover:border-warm-taupe'}
            `}
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(flower.id)}
              onChange={() => toggleFlower(flower.id)}
              className="w-4 h-4 text-accent-magenta rounded"
            />
            <span className="text-warm-charcoal">
              {flower.name}
              {flower.name_ta && (
                <span className="text-warm-charcoal/60 text-sm ml-1">
                  ({flower.name_ta})
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
```

## Step 5: Smart Suggestions in Entry Grid (3 hours)

Modify `frontend/src/components/entry/EntryGridArctic.jsx`:

```jsx
// Add import
import { getSuggestedFlower } from '../../services/farmerProductService';

// In the entry row component, add this effect:
useEffect(() => {
  if (entry.farmer_id) {
    loadSuggestion();
  }
}, [entry.farmer_id]);

const loadSuggestion = async () => {
  try {
    const suggestion = await getSuggestedFlower(entry.farmer_id);
    
    if (suggestion.suggestion_type === 'auto_select') {
      // Auto-select the flower
      updateEntry(entry.id, {
        flower_type_id: suggestion.suggested_flower_id,
        _suggestionType: 'auto_select'
      });
    } else if (suggestion.suggestion_type === 'prioritize') {
      // Store prioritized flowers for dropdown sorting
      updateEntry(entry.id, {
        _prioritizedFlowers: suggestion.associated_flowers,
        _allFlowers: suggestion.all_active_flowers
      });
    } else {
      // No associations, use all flowers
      updateEntry(entry.id, {
        _allFlowers: suggestion.all_active_flowers
      });
    }
  } catch (error) {
    console.error('Failed to load suggestion:', error);
  }
};
```

## Step 6: Offline Support (1 hour)

### 6.1 Update offline store

**In `frontend/src/store/offlineStore.js`**, add:

```javascript
// Add to STORES
FARMER_PRODUCTS_CACHE: 'farmer_products_cache',

// In upgrade function
if (!db.objectStoreNames.contains(STORES.FARMER_PRODUCTS_CACHE)) {
  db.createObjectStore(STORES.FARMER_PRODUCTS_CACHE, { keyPath: 'id' });
}

// New functions
export const cacheFarmerProducts = async (farmerId, products) => {
  const db = await initDB();
  // Clear existing for this farmer
  const existing = await db.getAll(STORES.FARMER_PRODUCTS_CACHE);
  for (const item of existing) {
    if (item.farmer_id === farmerId) {
      await db.delete(STORES.FARMER_PRODUCTS_CACHE, item.id);
    }
  }
  // Add new
  for (const product of products) {
    await db.put(STORES.FARMER_PRODUCTS_CACHE, product);
  }
};

export const getCachedFarmerProducts = async (farmerId) => {
  const db = await initDB();
  const all = await db.getAll(STORES.FARMER_PRODUCTS_CACHE);
  return all.filter(p => p.farmer_id === farmerId);
};
```

### 6.2 Increment DB_VERSION

```javascript
const DB_VERSION = 3; // Incremented for new store
```

## Step 7: Translations (15 min)

**In `frontend/src/i18n/en.json`**, add:

```json
{
  "farmers": {
    "supplyingCrops": "Supplying Crops",
    "supplyingCropsTa": "பயிர்கள்",
    "addToProfile": "Add {{flower}} to {{farmer}}'s profile for future entries?",
    "yes": "Yes",
    "no": "No"
  }
}
```

**In `frontend/src/i18n/ta.json`**, add:

```json
{
  "farmers": {
    "supplyingCrops": "வழங்கும் பயிர்கள்",
    "supplyingCropsTa": "பயிர்கள்",
    "addToProfile": "{{farmer}} விவசாயியின் சுயவிவரத்தில் {{flower}} சேர்க்கவா?",
    "yes": "ஆம்",
    "no": "இல்லை"
  }
}
```

## Step 8: Testing (2 hours)

### 8.1 Backend tests

Create `backend/tests/test_api/test_farmer_products.py`:

```python
"""Tests for farmer-product associations."""

import pytest
import requests

BASE_URL = "http://localhost:8000/api/v1"

class TestFarmerProducts:
    
    def test_add_association(self, auth_headers, test_farmer, test_flower):
        """Test adding a flower association to a farmer."""
        response = requests.post(
            f"{BASE_URL}/farmers/{test_farmer}/products",
            params={"flower_type_id": test_flower},
            headers=auth_headers
        )
        assert response.status_code == 201
    
    def test_duplicate_prevention(self, auth_headers, test_farmer, test_flower):
        """Test that duplicate associations are prevented."""
        # Add first
        requests.post(
            f"{BASE_URL}/farmers/{test_farmer}/products",
            params={"flower_type_id": test_flower},
            headers=auth_headers
        )
        # Try duplicate
        response = requests.post(
            f"{BASE_URL}/farmers/{test_farmer}/products",
            params={"flower_type_id": test_flower},
            headers=auth_headers
        )
        assert response.status_code == 400
    
    def test_suggestion_auto_select(self, auth_headers, test_farmer, test_flower):
        """Test auto-select when farmer has one flower."""
        # Add single association
        requests.post(
            f"{BASE_URL}/farmers/{test_farmer}/products",
            params={"flower_type_id": test_flower},
            headers=auth_headers
        )
        
        response = requests.get(
            f"{BASE_URL}/farmers/{test_farmer}/suggested-flower",
            headers=auth_headers
        )
        data = response.json()["data"]
        
        assert data["suggestion_type"] == "auto_select"
        assert data["suggested_flower_id"] == test_flower
```

### 8.2 Frontend tests

Create `frontend/tests/farmer-crop-association.spec.js`:

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Farmer Crop Association', () => {
  
  test('should show crop selector in farmer form', async ({ page }) => {
    await page.goto('/farmers/new');
    await expect(page.getByText('Supplying Crops')).toBeVisible();
  });
  
  test('should auto-select flower for single-crop farmer', async ({ page }) => {
    // Setup: Create farmer with one flower association
    await page.goto('/entries');
    // Select farmer with single association
    await page.getByTestId('farmer-select').click();
    await page.getByText('Single Crop Farmer').click();
    
    // Verify flower is auto-selected
    const flowerSelect = page.getByTestId('flower-select');
    await expect(flowerSelect).toHaveValue('jasmine-id');
  });
  
  test('should prioritize associated flowers in dropdown', async ({ page }) => {
    // Setup: Create farmer with multiple associations
    await page.goto('/entries');
    await page.getByTestId('farmer-select').click();
    await page.getByText('Multi Crop Farmer').click();
    
    // Verify associated flowers are at top
    const options = await page.getByTestId('flower-option').all();
    // First two should be associated flowers
  });
});
```

## Verification Checklist

- [ ] Migration runs successfully
- [ ] API endpoints return correct responses
- [ ] Farmer form shows crop selector
- [ ] Entry grid auto-selects for single-crop farmers
- [ ] Entry grid prioritizes for multi-crop farmers
- [ ] Offline caching works
- [ ] Translations display correctly
- [ ] Tests pass

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Migration fails | Check that all foreign key tables exist |
| 404 on new endpoints | Verify routes are registered in routes.py |
| Dropdown not populating | Check API response format matches expected |
| Offline not working | Increment DB_VERSION to force cache refresh |
