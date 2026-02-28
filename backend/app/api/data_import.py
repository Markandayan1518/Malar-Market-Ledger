"""Data import API routes for bulk operations."""

import io
import uuid
import logging
from datetime import datetime
from typing import Optional, List

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.dependencies import DatabaseSession, CurrentAdminUser
from app.models.farmer import Farmer
from app.models.flower_type import FlowerType
from app.schemas.common import create_success_response, create_paginated_response, PaginationMeta

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/import", tags=["Data Import"])


def generate_farmer_code() -> str:
    """Generate a unique farmer code."""
    import random
    import string
    prefix = "F"
    suffix = ''.join(random.choices(string.digits, k=4))
    return f"{prefix}{suffix}"


@router.post("/farmers", status_code=status.HTTP_201_CREATED)
async def import_farmers(
    file: UploadFile = File(...),
    db: DatabaseSession = Depends(get_db),
    current_user: CurrentAdminUser = None
):
    """
    Bulk import farmers from Excel/CSV file.
    
    Accepts: .xlsx, .xls, .csv
    
    Required columns:
    - name: Farmer name
    - phone: Phone number (10-20 digits)
    
    Optional columns:
    - village: Village name
    - whatsapp_number: WhatsApp number
    - address: Full address
    - commission_pct: Commission percentage (0-100, default: 10)
    - flat_fee_monthly: Monthly flat fee (default: 0)
    
    Returns:
    - created: Number of farmers created
    - errors: List of row-level errors
    - total_rows: Total rows processed
    """
    # Validate file type
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "NO_FILENAME", "message": "No filename provided"}
        )
    
    valid_extensions = ('.xlsx', '.xls', '.csv')
    if not file.filename.lower().endswith(valid_extensions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_FILE_TYPE",
                "message": f"Invalid file type. Accepted: {', '.join(valid_extensions)}"
            }
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Parse based on file type
        if file.filename.lower().endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
        
    except Exception as e:
        logger.error(f"Error reading file: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "FILE_READ_ERROR", "message": f"Could not read file: {str(e)}"}
        )
    
    # Validate required columns
    required_columns = ['name', 'phone']
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "MISSING_COLUMNS",
                "message": f"Missing required columns: {', '.join(missing_columns)}",
                "required": required_columns
            }
        )
    
    # Process rows
    created = 0
    skipped = 0
    errors = []
    
    for idx, row in df.iterrows():
        row_num = idx + 2  # Excel row number (1-indexed + header)
        
        try:
            # Get required fields
            name = str(row['name']).strip() if pd.notna(row['name']) else None
            phone = str(row['phone']).strip() if pd.notna(row['phone']) else None
            
            # Validate required fields
            if not name or len(name) < 2:
                errors.append({
                    "row": row_num,
                    "error": "Name must be at least 2 characters"
                })
                continue
            
            if not phone or len(phone) < 10:
                errors.append({
                    "row": row_num,
                    "error": "Phone must be at least 10 digits"
                })
                continue
            
            # Check for duplicate phone
            existing = await db.execute(
                select(Farmer).where(
                    Farmer.phone == phone,
                    Farmer.deleted_at == None
                )
            )
            if existing.scalar_one_or_none():
                skipped += 1
                errors.append({
                    "row": row_num,
                    "error": f"Phone number {phone} already exists"
                })
                continue
            
            # Get optional fields with defaults
            village = str(row['village']).strip() if 'village' in df.columns and pd.notna(row['village']) else None
            whatsapp_number = str(row['whatsapp_number']).strip() if 'whatsapp_number' in df.columns and pd.notna(row['whatsapp_number']) else None
            address = str(row['address']).strip() if 'address' in df.columns and pd.notna(row['address']) else None
            
            # Financial config with defaults
            commission_pct = 10.00
            if 'commission_pct' in df.columns and pd.notna(row['commission_pct']):
                try:
                    commission_pct = float(row['commission_pct'])
                    if commission_pct < 0 or commission_pct > 100:
                        commission_pct = 10.00
                except (ValueError, TypeError):
                    pass
            
            flat_fee_monthly = 0.00
            if 'flat_fee_monthly' in df.columns and pd.notna(row['flat_fee_monthly']):
                try:
                    flat_fee_monthly = float(row['flat_fee_monthly'])
                    if flat_fee_monthly < 0:
                        flat_fee_monthly = 0.00
                except (ValueError, TypeError):
                    pass
            
            # Generate unique farmer code
            farmer_code = generate_farmer_code()
            code_attempts = 0
            while code_attempts < 10:
                existing_code = await db.execute(
                    select(Farmer).where(Farmer.farmer_code == farmer_code)
                )
                if not existing_code.scalar_one_or_none():
                    break
                farmer_code = generate_farmer_code()
                code_attempts += 1
            
            # Create farmer
            farmer = Farmer(
                id=str(uuid.uuid4()),
                farmer_code=farmer_code,
                name=name,
                village=village,
                phone=phone,
                whatsapp_number=whatsapp_number,
                address=address,
                current_balance=0.00,
                total_advances=0.00,
                total_settlements=0.00,
                commission_pct=commission_pct,
                flat_fee_monthly=flat_fee_monthly,
                is_active=True,
            )
            
            db.add(farmer)
            created += 1
            
        except Exception as e:
            logger.error(f"Error processing row {row_num}: {e}")
            errors.append({
                "row": row_num,
                "error": str(e)
            })
    
    # Commit all changes
    try:
        await db.commit()
    except Exception as e:
        logger.error(f"Error committing changes: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "COMMIT_ERROR", "message": "Failed to save farmers"}
        )
    
    return create_success_response(
        data={
            "created": created,
            "skipped": skipped,
            "errors": errors,
            "total_rows": len(df),
            "success_rate": round(created / len(df) * 100, 1) if len(df) > 0 else 0
        },
        message=f"Import complete: {created} farmers created, {skipped} skipped"
    )


@router.post("/farmers/template")
async def download_import_template(
    current_user: CurrentAdminUser = None
):
    """
    Download a template file for farmer import.
    
    Returns an Excel template with the correct column headers.
    """
    from fastapi.responses import StreamingResponse
    
    # Create template DataFrame
    template_data = {
        'name': ['Example Farmer 1', 'Example Farmer 2'],
        'phone': ['9876543210', '9876543211'],
        'village': ['Village A', 'Village B'],
        'whatsapp_number': ['9876543210', '9876543211'],
        'address': ['123 Main St, Village A', '456 Oak St, Village B'],
        'commission_pct': [10.0, 12.5],
        'flat_fee_monthly': [200.0, 150.0]
    }
    
    df = pd.DataFrame(template_data)
    
    # Write to Excel
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Farmers')
    
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.read()),
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={
            'Content-Disposition': 'attachment; filename=farmer_import_template.xlsx'
        }
    )


@router.get("/farmers/preview")
async def preview_import(
    file: UploadFile = File(...),
    rows: int = Query(5, ge=1, le=20, description="Number of rows to preview"),
    current_user: CurrentAdminUser = None
):
    """
    Preview the first few rows of an import file.
    
    Returns parsed data without actually importing.
    """
    # Validate file type
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "NO_FILENAME", "message": "No filename provided"}
        )
    
    valid_extensions = ('.xlsx', '.xls', '.csv')
    if not file.filename.lower().endswith(valid_extensions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_FILE_TYPE",
                "message": f"Invalid file type. Accepted: {', '.join(valid_extensions)}"
            }
        )
    
    try:
        content = await file.read()
        
        if file.filename.lower().endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content), nrows=rows)
        else:
            df = pd.read_excel(io.BytesIO(content), nrows=rows)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "FILE_READ_ERROR", "message": f"Could not read file: {str(e)}"}
        )
    
    # Convert to list of dicts for JSON response
    preview_data = df.fillna('').to_dict(orient='records')
    
    return create_success_response(
        data={
            "columns": list(df.columns),
            "rows": preview_data,
            "total_columns": len(df.columns),
            "preview_rows": len(preview_data)
        },
        message=f"Preview of {len(preview_data)} rows"
    )
