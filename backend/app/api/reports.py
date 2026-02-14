"""API routes for report generation."""

import logging
from datetime import datetime, date
from typing import Optional
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.auth import get_current_user
from app.models.user import User, UserRole
from app.services.report_aggregator import ReportAggregator
from app.services.pdf_service import PDFService
from app.services.excel_service import ExcelService
from app.services.font_manager import init_fonts

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])

# Initialize fonts on module load
try:
    init_fonts()
    logger.info("Report fonts initialized successfully")
except Exception as e:
    logger.warning(f"Failed to initialize fonts: {e}")


@router.get("/farmer-statement/{farmer_id}/{month}/{year}")
async def get_farmer_statement(
    farmer_id: str,
    month: int,
    year: int,
    language: str = Query("en", regex="^(en|ta)$"),
    format: str = Query("pdf", regex="^(pdf|excel)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate individual farmer monthly statement.
    
    Args:
        farmer_id: Farmer ID
        month: Month (1-12)
        year: Year
        language: Language code ('en' or 'ta')
        format: Output format ('pdf' or 'excel')
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        PDF or Excel file
    """
    # Validate month
    if month < 1 or month > 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid month. Must be between 1 and 12."
        )
    
    # Validate year
    if year < 2000 or year > 2100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid year."
        )
    
    try:
        # Check access permissions
        if current_user.role == UserRole.STAFF:
            # Staff can only view their assigned farmers
            # For now, allow all farmers (implement assignment logic as needed)
            pass
        
        # Aggregate data
        aggregator = ReportAggregator(db)
        data = await aggregator.get_farmer_monthly_data(farmer_id, month, year)
        
        # Generate report
        if format == "pdf":
            pdf_service = PDFService(language=language)
            pdf_bytes = pdf_service.generate_farmer_statement(
                farmer_data=data['farmer'],
                summary_data=data['summary'],
                entries=data['entries'],
                advances=data['advances']
            )
            
            filename = f"farmer_statement_{farmer_id}_{month}_{year}.pdf"
            media_type = "application/pdf"
            
            return StreamingResponse(
                iter([pdf_bytes]),
                media_type=media_type,
                headers={
                    "Content-Disposition": f"attachment; filename={filename}"
                }
            )
        else:  # excel
            excel_service = ExcelService(language=language)
            excel_bytes = excel_service.generate_farmer_statement(
                farmer_data=data['farmer'],
                summary_data=data['summary'],
                entries=data['entries'],
                advances=data['advances']
            )
            
            filename = f"farmer_statement_{farmer_id}_{month}_{year}.xlsx"
            media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            
            return StreamingResponse(
                iter([excel_bytes]),
                media_type=media_type,
                headers={
                    "Content-Disposition": f"attachment; filename={filename}"
                }
            )
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error generating farmer statement: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate report"
        )


@router.get("/monthly-report/{month}/{year}")
async def get_monthly_report(
    month: int,
    year: int,
    format: str = Query("excel", regex="^(pdf|excel)$"),
    flower_type_id: Optional[str] = Query(None),
    village: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate master monthly report for all farmers.
    
    Args:
        month: Month (1-12)
        year: Year
        format: Output format ('pdf' or 'excel')
        flower_type_id: Optional flower type filter
        village: Optional village filter
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        PDF or Excel file
    """
    # Validate month
    if month < 1 or month > 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid month. Must be between 1 and 12."
        )
    
    # Validate year
    if year < 2000 or year > 2100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid year."
        )
    
    try:
        # Aggregate data
        aggregator = ReportAggregator(db)
        data = await aggregator.get_monthly_report_data(
            month=month,
            year=year,
            flower_type_id=flower_type_id,
            village=village
        )
        
        # Generate report
        if format == "pdf":
            pdf_service = PDFService(language="en")
            pdf_bytes = pdf_service.generate_monthly_report(
                report_data=data['summary'],
                farmer_summaries=data['farmer_summaries'],
                daily_entries=data['entries']
            )
            
            filename = f"monthly_report_{month}_{year}.pdf"
            media_type = "application/pdf"
            
            return StreamingResponse(
                iter([pdf_bytes]),
                media_type=media_type,
                headers={
                    "Content-Disposition": f"attachment; filename={filename}"
                }
            )
        else:  # excel
            excel_service = ExcelService(language="en")
            excel_bytes = excel_service.generate_monthly_report(
                summary_data=data['summary'],
                farmer_summaries=data['farmer_summaries'],
                daily_entries=data['entries'],
                cash_advances=data['advances'],
                settlements=data['settlements']
            )
            
            filename = f"monthly_report_{month}_{year}.xlsx"
            media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            
            return StreamingResponse(
                iter([excel_bytes]),
                media_type=media_type,
                headers={
                    "Content-Disposition": f"attachment; filename={filename}"
                }
            )
    
    except Exception as e:
        logger.error(f"Error generating monthly report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate report"
        )


@router.get("/daily-summary/{report_date}")
async def get_daily_summary(
    report_date: str,
    format: str = Query("excel", regex="^(pdf|excel)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate daily summary report.
    
    Args:
        report_date: Date in YYYY-MM-DD format
        format: Output format ('pdf' or 'excel')
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        PDF or Excel file
    """
    try:
        # Parse date
        parsed_date = datetime.strptime(report_date, "%Y-%m-%d").date()
        
        # Aggregate data
        aggregator = ReportAggregator(db)
        data = await aggregator.get_daily_summary_data(parsed_date)
        
        # Generate report
        if format == "pdf":
            pdf_service = PDFService(language="en")
            pdf_bytes = pdf_service.generate_daily_summary(
                date=parsed_date,
                summary_data=data['summary'],
                entries=data['entries']
            )
            
            filename = f"daily_summary_{report_date}.pdf"
            media_type = "application/pdf"
            
            return StreamingResponse(
                iter([pdf_bytes]),
                media_type=media_type,
                headers={
                    "Content-Disposition": f"attachment; filename={filename}"
                }
            )
        else:  # excel
            excel_service = ExcelService(language="en")
            excel_bytes = excel_service.generate_daily_summary(
                date=parsed_date,
                summary_data=data['summary'],
                entries=data['entries']
            )
            
            filename = f"daily_summary_{report_date}.xlsx"
            media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            
            return StreamingResponse(
                iter([excel_bytes]),
                media_type=media_type,
                headers={
                    "Content-Disposition": f"attachment; filename={filename}"
                }
            )
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD."
        )
    except Exception as e:
        logger.error(f"Error generating daily summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate report"
        )


@router.get("/settlement-report/{settlement_id}")
async def get_settlement_report(
    settlement_id: str,
    format: str = Query("pdf", regex="^(pdf|excel)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate settlement report.
    
    Args:
        settlement_id: Settlement ID
        format: Output format ('pdf' or 'excel')
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        PDF or Excel file
    """
    try:
        # Aggregate data
        aggregator = ReportAggregator(db)
        data = await aggregator.get_settlement_report_data(settlement_id)
        
        # Generate report
        if format == "pdf":
            pdf_service = PDFService(language="en")
            pdf_bytes = pdf_service.generate_settlement_report(
                settlement_data=data['settlement'],
                items=data['items']
            )
            
            filename = f"settlement_report_{settlement_id}.pdf"
            media_type = "application/pdf"
            
            return StreamingResponse(
                iter([pdf_bytes]),
                media_type=media_type,
                headers={
                    "Content-Disposition": f"attachment; filename={filename}"
                }
            )
        else:  # excel
            # For settlements, use PDF format as default (Excel can be added if needed)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Excel format not supported for settlement reports. Use PDF format."
            )
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error generating settlement report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate report"
        )


@router.post("/custom")
async def get_custom_report(
    start_date: str,
    end_date: str,
    format: str = Query("excel", regex="^(pdf|excel)$"),
    farmer_id: Optional[str] = Query(None),
    flower_type_id: Optional[str] = Query(None),
    village: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate custom report with filters.
    
    Args:
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format
        format: Output format ('pdf' or 'excel')
        farmer_id: Optional farmer filter
        flower_type_id: Optional flower type filter
        village: Optional village filter
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        PDF or Excel file
    """
    try:
        # Parse dates
        parsed_start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        parsed_end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        # Validate date range
        if parsed_start_date > parsed_end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Start date must be before or equal to end date."
            )
        
        # Aggregate data
        aggregator = ReportAggregator(db)
        data = await aggregator.get_custom_report_data(
            start_date=parsed_start_date,
            end_date=parsed_end_date,
            farmer_id=farmer_id,
            flower_type_id=flower_type_id,
            village=village
        )
        
        # Generate report
        if format == "pdf":
            pdf_service = PDFService(language="en")
            pdf_bytes = pdf_service.generate_daily_summary(
                date=parsed_start_date,
                summary_data=data['summary'],
                entries=data['entries']
            )
            
            filename = f"custom_report_{start_date}_{end_date}.pdf"
            media_type = "application/pdf"
            
            return StreamingResponse(
                iter([pdf_bytes]),
                media_type=media_type,
                headers={
                    "Content-Disposition": f"attachment; filename={filename}"
                }
            )
        else:  # excel
            excel_service = ExcelService(language="en")
            excel_bytes = excel_service.generate_daily_summary(
                date=parsed_start_date,
                summary_data=data['summary'],
                entries=data['entries']
            )
            
            filename = f"custom_report_{start_date}_{end_date}.xlsx"
            media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            
            return StreamingResponse(
                iter([excel_bytes]),
                media_type=media_type,
                headers={
                    "Content-Disposition": f"attachment; filename={filename}"
                }
            )
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD."
        )
    except Exception as e:
        logger.error(f"Error generating custom report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate report"
        )


@router.get("/font-info")
async def get_font_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get information about available fonts.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Font information
    """
    from app.services.font_manager import get_font_manager
    
    font_manager = get_font_manager()
    return font_manager.get_font_info()
