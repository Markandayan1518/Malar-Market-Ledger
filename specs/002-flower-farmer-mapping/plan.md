# Implementation Plan: Shop-Specific Flower Types and Farmer Mapping

**Branch**: `002-flower-farmer-mapping` | **Date**: 2026-02-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-flower-farmer-mapping/spec.md`

## Summary

Implement shop-specific flower type configuration and farmer-crop associations to enable smart flower suggestions during daily entry. The system will auto-select flowers for farmers with single crop associations and prioritize associated flowers in dropdowns for multi-crop farmers.

## Technical Context

**Language/Version**: Python 3.11 (Backend), JavaScript ES6+ (Frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0 async, React 18, Vite, TailwindCSS, i18next
**Storage**: PostgreSQL (primary), Redis (cache), IndexedDB (offline)
**Testing**: pytest (backend HTTP-based), Playwright (frontend e2e)
**Target Platform**: PWA - Web (mobile-first), Linux server
**Project Type**: Web application (frontend + backend)
**Performance Goals**: Flower suggestions < 200ms, offline-capable
**Constraints**: Must work offline, bilingual (English/Tamil)
**Scale/Scope**: 50+ farmers, 10-20 flower types

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **PASS** - No violations detected:
- Uses existing patterns (soft delete, UUID strings, async SQLAlchemy)
- Extends existing models rather than creating new architecture
- Follows existing API response envelope format
- Uses existing offline store infrastructure

## Project Structure

### Documentation (this feature)

```text
specs/002-flower-farmer-mapping/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file
├── data-model.md        # Database schema changes
├── quickstart.md        # Implementation guide
└── checklists/
    └── requirements.md  # Quality checklist (complete)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── models/
│   │   ├── flower_type.py       # EXISTING - add deleted_at field
│   │   └── farmer_product.py    # NEW - farmer-flower associations
│   ├── api/
│   │   ├── farmers.py           # MODIFY - add crop endpoints
│   │   ├── flower_types.py      # EXISTING - already has is_active
│   │   └── farmer_products.py   # NEW - association CRUD
│   └── schemas/
│       └── all_schemas.py       # MODIFY - add FarmerProduct schemas
└── tests/
    └── test_api/
        └── test_farmer_products.py  # NEW - association tests

frontend/
├── src/
│   ├── components/
│   │   ├── entry/
│   │   │   └── EntryGridArctic.jsx    # MODIFY - smart suggestions
│   │   └── farmers/
│   │       └── FarmerCropSelector.jsx # NEW - crop checkbox UI
│   ├── pages/
│   │   └── FarmerFormPage.jsx         # MODIFY - add crop section
│   ├── services/
│   │   └── farmerProductService.js    # NEW - API client
│   └── store/
│       └── offlineStore.js            # MODIFY - add crop cache
└── tests/
    └── farmer-crop-association.spec.js # NEW - e2e tests
```

**Structure Decision**: Web application with existing backend/frontend split. New `farmer_products` model for associations. Extend existing offline store for caching.

## Complexity Tracking

No violations to justify - implementation follows existing patterns.

---

## Phase 1: Data Model

### 1.1 New Model: FarmerProduct

**File**: `backend/app/models/farmer_product.py`

```python
"""Farmer-Flower association model."""

class FarmerProduct(Base):
    """
    Associates farmers with the flower types they typically supply.
    Used for smart suggestions during daily entry.
    """
    __tablename__ = "farmer_products"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
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
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Unique constraint to prevent duplicates
    __table_args__ = (
        UniqueConstraint('farmer_id', 'flower_type_id', name='uq_farmer_flower'),
        Index('ix_farmer_products_farmer_flower', 'farmer_id', 'flower_type_id'),
    )
```

### 1.2 Modify Existing: FlowerType

**File**: `backend/app/models/flower_type.py`

Add `deleted_at` field for soft delete consistency (currently missing):

```python
deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
```

### 1.3 Add Relationships

**File**: `backend/app/models/farmer.py`

Add relationship to farmer_products:

```python
farmer_products = relationship(
    "FarmerProduct",
    back_populates="farmer",
    cascade="all, delete-orphan"
)
```

---

## Phase 2: API Endpoints

### 2.1 New Endpoints: Farmer Products

**File**: `backend/app/api/farmer_products.py`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/farmers/{farmer_id}/products` | Get farmer's associated flowers |
| POST | `/farmers/{farmer_id}/products` | Add flower association |
| DELETE | `/farmers/{farmer_id}/products/{flower_id}` | Remove association |
| GET | `/farmers/{farmer_id}/suggested-flower` | Get auto-suggest flower |

### 2.2 Modified Endpoints: Farmers

**File**: `backend/app/api/farmers.py`

- Modify `GET /farmers/{farmer_id}` to include `flower_ids` array
- Modify `PUT /farmers/{farmer_id}` to accept `flower_ids` for bulk update

### 2.3 Response Schemas

```python
# FarmerProductResponse
{
    "id": "uuid",
    "farmer_id": "uuid",
    "flower_type_id": "uuid",
    "flower_name": "Jasmine",
    "flower_name_ta": "மல்லிகை"
}

# FarmerWithProductsResponse (extends FarmerResponse)
{
    ...FarmerResponse,
    "flower_ids": ["uuid1", "uuid2"],
    "flowers": [
        {"id": "uuid", "name": "Jasmine", "name_ta": "மல்லிகை"}
    ]
}

# SuggestedFlowerResponse
{
    "farmer_id": "uuid",
    "suggested_flower_id": "uuid" | null,
    "suggestion_type": "auto_select" | "prioritize" | "none",
    "associated_flowers": [...],
    "all_active_flowers": [...]
}
```

---

## Phase 3: Frontend Implementation

### 3.1 New Component: FarmerCropSelector

**File**: `frontend/src/components/farmers/FarmerCropSelector.jsx`

Multi-select checkbox component for farmer profile:
- Fetches active flowers from `GET /flower-types/active`
- Displays bilingual labels (English/Tamil)
- Shows selected crops as checked
- Supports bulk selection/deselection

### 3.2 Modify: EntryGridArctic

**File**: `frontend/src/components/entry/EntryGridArctic.jsx`

Smart suggestion logic:
1. On farmer selection, call `GET /farmers/{id}/suggested-flower`
2. If `suggestion_type === "auto_select"`: pre-select flower
3. If `suggestion_type === "prioritize"`: sort dropdown with associated first
4. If `suggestion_type === "none"`: show all flowers alphabetically

### 3.3 New Service: farmerProductService

**File**: `frontend/src/services/farmerProductService.js`

```javascript
// API client for farmer-product associations
export const getFarmerProducts = (farmerId) => ...
export const addFarmerProduct = (farmerId, flowerId) => ...
export const removeFarmerProduct = (farmerId, flowerId) => ...
export const getSuggestedFlower = (farmerId) => ...
```

### 3.4 Modify: Offline Store

**File**: `frontend/src/store/offlineStore.js`

Add new store for farmer-crop associations:

```javascript
export const STORES = {
  ...existing,
  FARMER_PRODUCTS_CACHE: 'farmer_products_cache',
};

// New functions
export const cacheFarmerProducts = async (products) => ...
export const getCachedFarmerProducts = async (farmerId) => ...
```

---

## Phase 4: Prompt for New Associations

### 4.1 Toast/Prompt Component

When staff selects a flower not in farmer's associations:
1. Show non-blocking toast: "Add Tuberose to Ramesh's profile?"
2. "Yes" button → calls `POST /farmers/{id}/products`
3. "No" button → dismisses toast
4. Queue action for offline sync if offline

### 4.2 Offline Handling

- Cache associations on app load
- Queue new association requests in `SYNC_QUEUE`
- Process queue when online

---

## Phase 5: Testing

### 5.1 Backend Tests

**File**: `backend/tests/test_api/test_farmer_products.py`

- Test creating association
- Test duplicate prevention
- Test cascade delete when farmer deleted
- Test cascade delete when flower deactivated
- Test suggestion logic (single, multiple, none)

### 5.2 Frontend Tests

**File**: `frontend/tests/farmer-crop-association.spec.js`

- Test crop selector UI in farmer form
- Test auto-selection in entry grid
- Test prioritized dropdown
- Test prompt for new association
- Test offline caching

---

## Implementation Order

| Phase | Task | Priority | Estimated Effort |
|-------|------|----------|------------------|
| 1 | Create FarmerProduct model + migration | P1 | 2h |
| 1 | Add deleted_at to FlowerType | P1 | 0.5h |
| 2 | Farmer products API endpoints | P1 | 3h |
| 2 | Suggestion endpoint logic | P2 | 2h |
| 3 | FarmerCropSelector component | P1 | 2h |
| 3 | EntryGridArctic smart suggestions | P2 | 3h |
| 3 | Offline store updates | P2 | 1h |
| 4 | New association prompt | P3 | 2h |
| 5 | Backend tests | P1 | 2h |
| 5 | Frontend e2e tests | P2 | 2h |

**Total Estimated Effort**: ~19.5 hours

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Offline sync conflicts | Last-write-wins for associations; show toast on conflict |
| Performance with many farmers | Cache associations; lazy load per farmer |
| Data migration | Seed existing farmers with flowers from their entry history |
| UI complexity | Keep prompt non-blocking; one-tap dismiss or confirm |

---

## Dependencies

- No new external dependencies required
- Uses existing: idb (IndexedDB), React, FastAPI, SQLAlchemy
