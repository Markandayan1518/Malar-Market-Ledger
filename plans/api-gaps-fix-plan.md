# API Gaps Fix Plan - PRD Compliance

## Executive Summary

Analysis of the current API implementation against the PRD verification report reveals that **3 of 6 reported gaps are already implemented**. This plan addresses the **3 remaining gaps** that require code changes.

---

## Gap Analysis Results

| Gap | Description | Status | Action Required |
|-----|-------------|--------|-----------------|
| #1 | Manual Adjustments in Daily Entries | ❌ MISSING | Add fields to model + schema |
| #2 | Farmer ↔ Flower Association | ✅ IMPLEMENTED | None - see [`farmers.py:538-840`](backend/app/api/farmers.py:538) |
| #3 | Farmer Financial Configuration | ❌ MISSING | Add fields to model + schema |
| #4 | Data Import & Export | ⚠️ PARTIAL | Add import endpoints |
| #5 | WhatsApp Webhook Receiver | ✅ IMPLEMENTED | None - see [`whatsapp.py:88-138`](backend/app/api/whatsapp.py:88) |
| #6 | Offline Sync (Bulk Entry) | ✅ IMPLEMENTED | None - see [`daily_entries.py:421`](backend/app/api/daily_entries.py:421) |

---

## Implementation Plan

### Gap #1: Manual Adjustments in Daily Entries

**Problem:** Staff need to quickly deduct amounts for "Late Arrival" or "Wet Flowers" during entry.

**Solution:** Add adjustment fields to `DailyEntry` model and schemas.

#### Files to Modify

1. **[`backend/app/models/daily_entry.py`](backend/app/models/daily_entry.py)**
   ```python
   # Add after notes field (line 90)
   manual_adj_amount: Mapped[Optional[float]] = mapped_column(
       Numeric(10, 2),
       nullable=True,
       default=0.00
   )
   
   adj_reason_code: Mapped[Optional[str]] = mapped_column(
       String(20),
       nullable=True
   )
   ```

2. **[`backend/app/schemas/all_schemas.py`](backend/app/schemas/all_schemas.py)**
   - Add to `DailyEntryBase`:
     ```python
     manual_adj_amount: Optional[Decimal] = Field(default=0.00)
     adj_reason_code: Optional[str] = None
     ```
   - Add to `DailyEntryCreate`:
     ```python
     manual_adj_amount: Optional[Decimal] = Field(default=0.00)
     adj_reason_code: Optional[str] = None
     ```

3. **[`backend/app/api/daily_entries.py`](backend/app/api/daily_entries.py)**
   - Update `net_amount` calculation to include adjustment:
     ```python
     net_amount = total_amount - commission_amount + (entry_data.manual_adj_amount or 0)
     ```

4. **Add Enum for Reason Codes** (new file or in schemas):
   ```python
   class AdjustmentReasonCode(str, Enum):
       LATE = "LATE"        # Late arrival deduction
       WET = "WET"          # Wet flowers deduction
       QUALITY = "QUALITY"  # Quality issue deduction
       BONUS = "BONUS"      # Bonus payment
       OTHER = "OTHER"      # Other adjustment
   ```

---

### Gap #3: Farmer Financial Configuration

**Problem:** Settlement calculations require farmer-specific commission % and flat monthly fee.

**Solution:** Add financial fields to `Farmer` model.

#### Files to Modify

1. **[`backend/app/models/farmer.py`](backend/app/models/farmer.py)**
   ```python
   # Add after total_settlements field (line 83)
   commission_pct: Mapped[float] = mapped_column(
       Numeric(5, 2),
       nullable=False,
       default=10.00  # Default 10% commission
   )
   
   flat_fee_monthly: Mapped[float] = mapped_column(
       Numeric(10, 2),
       nullable=False,
       default=0.00
   )
   ```

2. **[`backend/app/schemas/all_schemas.py`](backend/app/schemas/all_schemas.py)**
   - Add to `FarmerBase`, `FarmerCreate`, `FarmerUpdate`, `FarmerResponse`:
     ```python
     commission_pct: Decimal = Field(default=10.00, ge=0, le=100)
     flat_fee_monthly: Decimal = Field(default=0.00, ge=0)
     ```

3. **[`backend/app/api/farmers.py`](backend/app/api/farmers.py)**
   - Update `FarmerResponse` construction to include new fields

4. **[`backend/app/api/settlements.py`](backend/app/api/settlements.py)**
   - Update settlement calculation to use farmer's `commission_pct` instead of global rate

---

### Gap #4: Data Import Endpoints

**Problem:** PRD requires bulk uploading 50+ farmers via Excel/CSV.

**Solution:** Create new import endpoint with file processing.

#### Files to Create/Modify

1. **Create [`backend/app/api/data_import.py`](backend/app/api/data_import.py)**
   ```python
   from fastapi import APIRouter, UploadFile, File, Depends
   from sqlalchemy.ext.asyncio import AsyncSession
   import pandas as pd
   import io
   
   router = APIRouter(prefix="/import", tags=["Data Import"])
   
   @router.post("/farmers", status_code=status.HTTP_201_CREATED)
   async def import_farmers(
       file: UploadFile = File(...),
       db: DatabaseSession = Depends(get_db),
       current_user: CurrentAdminUser = Depends(require_admin)
   ):
       """
       Bulk import farmers from Excel/CSV file.
       
       Accepts: .xlsx, .xls, .csv
       Columns: name, phone, village, whatsapp_number, address, commission_pct, flat_fee_monthly
       """
       # Validate file type
       if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
           raise HTTPException(400, "Invalid file type")
       
       # Read file
       content = await file.read()
       if file.filename.endswith('.csv'):
           df = pd.read_csv(io.BytesIO(content))
       else:
           df = pd.read_excel(io.BytesIO(content))
       
       # Validate columns
       required = ['name', 'phone']
       missing = [c for c in required if c not in df.columns]
       if missing:
           raise HTTPException(400, f"Missing columns: {missing}")
       
       # Process rows
       created = 0
       errors = []
       for idx, row in df.iterrows():
           try:
               farmer = Farmer(
                   id=str(uuid.uuid4()),
                   farmer_code=generate_farmer_code(),
                   name=row['name'],
                   phone=row['phone'],
                   village=row.get('village'),
                   whatsapp_number=row.get('whatsapp_number'),
                   address=row.get('address'),
                   commission_pct=row.get('commission_pct', 10.00),
                   flat_fee_monthly=row.get('flat_fee_monthly', 0.00),
               )
               db.add(farmer)
               created += 1
           except Exception as e:
               errors.append({"row": idx + 2, "error": str(e)})
       
       await db.commit()
       
       return {
           "success": True,
           "created": created,
           "errors": errors,
           "total_rows": len(df)
       }
   ```

2. **Update [`backend/app/api/routes.py`](backend/app/api/routes.py)**
   ```python
   from app.api.data_import import router as data_import_router
   api_router.include_router(data_import_router, prefix="/data")
   ```

---

## Database Migration

After model changes, create migration:

```bash
# Generate migration
cd backend
alembic revision --autogenerate -m "Add adjustment fields and farmer financial config"

# Apply migration
alembic upgrade head
```

### Migration SQL Preview

```sql
-- DailyEntry adjustments
ALTER TABLE daily_entries 
ADD COLUMN manual_adj_amount NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN adj_reason_code VARCHAR(20);

-- Farmer financial config
ALTER TABLE farmers
ADD COLUMN commission_pct NUMERIC(5, 2) DEFAULT 10.00,
ADD COLUMN flat_fee_monthly NUMERIC(10, 2) DEFAULT 0.00;
```

---

## API Endpoint Summary After Fixes

### New Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/data/import/farmers` | Bulk import farmers from Excel/CSV |

### Modified Endpoints

| Method | Path | Changes |
|--------|------|---------|
| POST | `/api/daily-entries` | Accepts `manual_adj_amount`, `adj_reason_code` |
| POST | `/api/daily-entries/bulk` | Accepts adjustment fields per entry |
| GET | `/api/farmers` | Returns `commission_pct`, `flat_fee_monthly` |
| POST | `/api/farmers` | Accepts financial config fields |
| PUT | `/api/farmers/{id}` | Accepts financial config fields |

---

## Testing Checklist

- [ ] Test manual adjustment with negative amount (deduction)
- [ ] Test manual adjustment with positive amount (bonus)
- [ ] Test each reason code: LATE, WET, QUALITY, BONUS, OTHER
- [ ] Test farmer import with valid Excel file
- [ ] Test farmer import with invalid file type
- [ ] Test farmer import with missing required columns
- [ ] Verify settlement calculation uses farmer-specific commission
- [ ] Verify net_amount includes manual adjustment

---

## Files Changed Summary

| File | Change Type |
|------|-------------|
| `backend/app/models/daily_entry.py` | MODIFY - Add adjustment fields |
| `backend/app/models/farmer.py` | MODIFY - Add financial config fields |
| `backend/app/schemas/all_schemas.py` | MODIFY - Add new fields to schemas |
| `backend/app/api/daily_entries.py` | MODIFY - Update calculation logic |
| `backend/app/api/farmers.py` | MODIFY - Include new fields in response |
| `backend/app/api/settlements.py` | MODIFY - Use farmer-specific commission |
| `backend/app/api/data_import.py` | CREATE - New import endpoints |
| `backend/app/api/routes.py` | MODIFY - Register import router |
| `docs/api-design.md` | MODIFY - Document new endpoints |

---

## Architecture Diagram

```mermaid
flowchart TB
    subgraph Already Implemented
        FP[GET/POST /farmers/id/products]
        SF[GET /farmers/id/suggested-flower]
        WH[POST /whatsapp/webhook]
        BE[POST /daily-entries/bulk]
    end
    
    subgraph Gap Fixes Required
        MA[Manual Adjustments]
        FC[Financial Config]
        DI[Data Import]
    end
    
    subgraph Database Changes
        DE[daily_entries table]
        FM[farmers table]
    end
    
    MA --> DE
    FC --> FM
    DI --> FM
    
    FP --> |Smart Suggestions| UI[Frontend UI]
    SF --> UI
    WH --> |Bot Commands| BOT[bot_handler.py]
    BE --> |Offline Sync| IDB[IndexedDB]
