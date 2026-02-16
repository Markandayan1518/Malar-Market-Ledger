"""Report aggregation service for fetching and processing report data."""

import logging
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Any
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload

from app.models import (
    Farmer, DailyEntry, CashAdvance, Settlement, 
    FlowerType, MarketRate, TimeSlot
)
from app.database import get_db

logger = logging.getLogger(__name__)


class ReportAggregator:
    """Service for aggregating data for reports."""
    
    def __init__(self, db: AsyncSession):
        """
        Initialize report aggregator.
        
        Args:
            db: Database session
        """
        self.db = db
    
    async def get_farmer_monthly_data(
        self,
        farmer_id: str,
        month: int,
        year: int
    ) -> Dict[str, Any]:
        """
        Get farmer data for a specific month.
        
        Args:
            farmer_id: Farmer ID
            month: Month (1-12)
            year: Year
            
        Returns:
            Dictionary with farmer data
        """
        # Get farmer details
        result = await self.db.execute(
            select(Farmer).where(Farmer.id == farmer_id)
        )
        farmer = result.scalar_one_or_none()
        
        if not farmer:
            raise ValueError(f"Farmer not found: {farmer_id}")
        
        # Calculate date range
        period_start = date(year, month, 1)
        if month == 12:
            period_end = date(year + 1, 1, 1)
        else:
            period_end = date(year, month + 1, 1)
        
        # Get daily entries for the period
        entries_result = await self.db.execute(
            select(DailyEntry)
            .options(selectinload(DailyEntry.flower_type))
            .options(selectinload(DailyEntry.time_slot))
            .where(
                and_(
                    DailyEntry.farmer_id == farmer_id,
                    DailyEntry.entry_date >= period_start,
                    DailyEntry.entry_date < period_end
                )
            )
            .order_by(DailyEntry.entry_date, DailyEntry.entry_time)
        )
        entries = entries_result.scalars().all()
        
        # Get cash advances for the period
        advances_result = await self.db.execute(
            select(CashAdvance)
            .where(
                and_(
                    CashAdvance.farmer_id == farmer_id,
                    CashAdvance.advance_date >= period_start,
                    CashAdvance.advance_date < period_end
                )
            )
            .order_by(CashAdvance.advance_date)
        )
        advances = advances_result.scalars().all()
        
        # Calculate totals
        total_quantity = Decimal('0')
        gross_amount = Decimal('0')
        total_commission = Decimal('0')
        total_advances = Decimal('0')
        
        for entry in entries:
            total_quantity += entry.quantity
            gross_amount += entry.total_amount
            total_commission += entry.commission_amount
        
        for advance in advances:
            if advance.status == 'approved':
                total_advances += advance.amount
        
        # Calculate net amount
        total_fees = Decimal('0')  # Can be calculated based on business rules
        net_payable = gross_amount - total_commission - total_fees - total_advances
        
        # Build farmer data
        farmer_data = {
            'id': farmer.id,
            'farmer_code': farmer.farmer_code,
            'name': farmer.name,
            'village': farmer.village,
            'phone': farmer.phone,
            'whatsapp_number': farmer.whatsapp_number,
            'address': farmer.address,
            'current_balance': float(farmer.current_balance),
            'total_advances': float(farmer.total_advances),
            'total_settlements': float(farmer.total_settlements),
            'is_active': farmer.is_active
        }
        
        # Build summary data
        summary_data = {
            'month': month,
            'year': year,
            'period_start': period_start.strftime("%Y-%m-%d"),
            'period_end': (period_end - timedelta(days=1)).strftime("%Y-%m-%d"),
            'total_entries': len(entries),
            'total_quantity': float(total_quantity),
            'gross_amount': float(gross_amount),
            'total_commission': float(total_commission),
            'total_fees': float(total_fees),
            'total_advances': float(total_advances),
            'net_payable': float(net_payable)
        }
        
        # Build entries data
        entries_data = []
        for entry in entries:
            entries_data.append({
                'id': entry.id,
                'entry_date': entry.entry_date.strftime("%Y-%m-%d"),
                'entry_time': entry.entry_time.strftime("%H:%M"),
                'flower_name': entry.flower_type.name if entry.flower_type else '',
                'flower_code': entry.flower_type.code if entry.flower_type else '',
                'quantity': float(entry.quantity),
                'rate_per_unit': float(entry.rate_per_unit),
                'total_amount': float(entry.total_amount),
                'commission_rate': float(entry.commission_rate),
                'commission_amount': float(entry.commission_amount),
                'net_amount': float(entry.net_amount),
                'notes': entry.notes
            })
        
        # Build advances data
        advances_data = []
        for advance in advances:
            advances_data.append({
                'id': advance.id,
                'advance_date': advance.advance_date.strftime("%Y-%m-%d"),
                'amount': float(advance.amount),
                'reason': advance.reason,
                'status': advance.status,
                'approved_by': advance.approved_by,
                'approved_at': advance.approved_at.strftime("%Y-%m-%d %H:%M") if advance.approved_at else '',
                'notes': advance.notes
            })
        
        return {
            'farmer': farmer_data,
            'summary': summary_data,
            'entries': entries_data,
            'advances': advances_data
        }
    
    async def get_monthly_report_data(
        self,
        month: int,
        year: int,
        flower_type_id: Optional[str] = None,
        village: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get data for monthly master report.
        
        Args:
            month: Month (1-12)
            year: Year
            flower_type_id: Optional flower type filter
            village: Optional village filter
            
        Returns:
            Dictionary with report data
        """
        # Calculate date range
        period_start = date(year, month, 1)
        if month == 12:
            period_end = date(year + 1, 1, 1)
        else:
            period_end = date(year, month + 1, 1)
        
        # Build query filters
        entry_filters = [
            DailyEntry.entry_date >= period_start,
            DailyEntry.entry_date < period_end
        ]
        
        if flower_type_id:
            entry_filters.append(DailyEntry.flower_type_id == flower_type_id)
        
        # Get all entries for the period
        entries_query = select(DailyEntry).options(
            selectinload(DailyEntry.farmer),
            selectinload(DailyEntry.flower_type)
        ).where(and_(*entry_filters))
        
        entries_result = await self.db.execute(entries_query)
        all_entries = entries_result.scalars().all()
        
        # Filter by village if specified
        if village:
            all_entries = [
                e for e in all_entries 
                if e.farmer and e.farmer.village == village
            ]
        
        # Get all cash advances for the period
        advances_result = await self.db.execute(
            select(CashAdvance).options(
                selectinload(CashAdvance.farmer)
            ).where(
                and_(
                    CashAdvance.advance_date >= period_start,
                    CashAdvance.advance_date < period_end
                )
            )
        )
        all_advances = advances_result.scalars().all()
        
        # Get all settlements for the period
        settlements_result = await self.db.execute(
            select(Settlement).options(
                selectinload(Settlement.farmer)
            ).where(
                and_(
                    Settlement.settlement_date >= period_start,
                    Settlement.settlement_date < period_end
                )
            )
        )
        all_settlements = settlements_result.scalars().all()
        
        # Calculate overall totals
        total_weight = Decimal('0')
        total_gross = Decimal('0')
        total_commission = Decimal('0')
        total_net = Decimal('0')
        
        for entry in all_entries:
            total_weight += entry.quantity
            total_gross += entry.total_amount
            total_commission += entry.commission_amount
            total_net += entry.net_amount
        
        # Group entries by farmer
        farmer_data = {}
        for entry in all_entries:
            farmer_id = entry.farmer_id
            if farmer_id not in farmer_data:
                farmer_data[farmer_id] = {
                    'farmer_id': farmer_id,
                    'farmer_code': entry.farmer.farmer_code if entry.farmer else '',
                    'name': entry.farmer.name if entry.farmer else '',
                    'village': entry.farmer.village if entry.farmer else '',
                    'phone': entry.farmer.phone if entry.farmer else '',
                    'total_entries': 0,
                    'total_quantity': Decimal('0'),
                    'gross_amount': Decimal('0'),
                    'total_commission': Decimal('0'),
                    'total_advances': Decimal('0'),
                    'net_payable': Decimal('0')
                }
            
            farmer_data[farmer_id]['total_entries'] += 1
            farmer_data[farmer_id]['total_quantity'] += entry.quantity
            farmer_data[farmer_id]['gross_amount'] += entry.total_amount
            farmer_data[farmer_id]['total_commission'] += entry.commission_amount
            farmer_data[farmer_id]['net_payable'] += entry.net_amount
        
        # Add advances to farmer data
        for advance in all_advances:
            farmer_id = advance.farmer_id
            if farmer_id in farmer_data and advance.status == 'approved':
                farmer_data[farmer_id]['total_advances'] += advance.amount
                farmer_data[farmer_id]['net_payable'] -= advance.amount
        
        # Build summary data
        summary_data = {
            'month': month,
            'year': year,
            'period_start': period_start.strftime("%Y-%m-%d"),
            'period_end': (period_end - timedelta(days=1)).strftime("%Y-%m-%d"),
            'total_farmers': len(farmer_data),
            'total_entries': len(all_entries),
            'total_weight': float(total_weight),
            'total_gross': float(total_gross),
            'total_commission': float(total_commission),
            'total_net': float(total_net)
        }
        
        # Build farmer summaries list
        farmer_summaries = list(farmer_data.values())
        farmer_summaries.sort(key=lambda x: x['name'])
        
        # Build entries data
        entries_data = []
        for entry in all_entries:
            entries_data.append({
                'id': entry.id,
                'entry_date': entry.entry_date.strftime("%Y-%m-%d"),
                'entry_time': entry.entry_time.strftime("%H:%M"),
                'farmer_code': entry.farmer.farmer_code if entry.farmer else '',
                'farmer_name': entry.farmer.name if entry.farmer else '',
                'flower_name': entry.flower_type.name if entry.flower_type else '',
                'quantity': float(entry.quantity),
                'rate_per_unit': float(entry.rate_per_unit),
                'total_amount': float(entry.total_amount),
                'commission_amount': float(entry.commission_amount),
                'net_amount': float(entry.net_amount)
            })
        
        # Build advances data
        advances_data = []
        for advance in all_advances:
            advances_data.append({
                'id': advance.id,
                'advance_date': advance.advance_date.strftime("%Y-%m-%d"),
                'farmer_code': advance.farmer.farmer_code if advance.farmer else '',
                'farmer_name': advance.farmer.name if advance.farmer else '',
                'amount': float(advance.amount),
                'reason': advance.reason,
                'status': advance.status,
                'approved_by': advance.approved_by
            })
        
        # Build settlements data
        settlements_data = []
        for settlement in all_settlements:
            settlements_data.append({
                'id': settlement.id,
                'settlement_number': settlement.settlement_number,
                'settlement_date': settlement.settlement_date.strftime("%Y-%m-%d"),
                'farmer_code': settlement.farmer.farmer_code if settlement.farmer else '',
                'farmer_name': settlement.farmer.name if settlement.farmer else '',
                'period_start': settlement.period_start.strftime("%Y-%m-%d"),
                'period_end': settlement.period_end.strftime("%Y-%m-%d"),
                'total_entries': settlement.total_entries,
                'total_quantity': float(settlement.total_quantity),
                'gross_amount': float(settlement.gross_amount),
                'total_commission': float(settlement.total_commission),
                'net_payable': float(settlement.net_payable),
                'status': settlement.status
            })
        
        return {
            'summary': summary_data,
            'farmer_summaries': farmer_summaries,
            'entries': entries_data,
            'advances': advances_data,
            'settlements': settlements_data
        }
    
    async def get_daily_summary_data(
        self,
        report_date: date
    ) -> Dict[str, Any]:
        """
        Get data for daily summary report.
        
        Args:
            report_date: Date to generate summary for
            
        Returns:
            Dictionary with summary data
        """
        # Get entries for the date
        entries_result = await self.db.execute(
            select(DailyEntry)
            .options(selectinload(DailyEntry.farmer))
            .options(selectinload(DailyEntry.flower_type))
            .where(DailyEntry.entry_date == report_date)
            .order_by(DailyEntry.entry_time)
        )
        entries = entries_result.scalars().all()
        
        # Calculate totals
        total_entries = len(entries)
        total_weight = Decimal('0')
        gross_amount = Decimal('0')
        total_commission = Decimal('0')
        net_amount = Decimal('0')
        
        for entry in entries:
            total_weight += entry.quantity
            gross_amount += entry.total_amount
            total_commission += entry.commission_amount
            net_amount += entry.net_amount
        
        # Build summary data
        summary_data = {
            'date': report_date.strftime("%Y-%m-%d"),
            'total_entries': total_entries,
            'total_weight': float(total_weight),
            'gross_amount': float(gross_amount),
            'total_commission': float(total_commission),
            'net_amount': float(net_amount)
        }
        
        # Build entries data
        entries_data = []
        for entry in entries:
            entries_data.append({
                'id': entry.id,
                'entry_time': entry.entry_time.strftime("%H:%M"),
                'farmer_code': entry.farmer.farmer_code if entry.farmer else '',
                'farmer_name': entry.farmer.name if entry.farmer else '',
                'flower_name': entry.flower_type.name if entry.flower_type else '',
                'quantity': float(entry.quantity),
                'rate_per_unit': float(entry.rate_per_unit),
                'total_amount': float(entry.total_amount),
                'commission_amount': float(entry.commission_amount),
                'net_amount': float(entry.net_amount)
            })
        
        return {
            'summary': summary_data,
            'entries': entries_data
        }
    
    async def get_settlement_report_data(
        self,
        settlement_id: str
    ) -> Dict[str, Any]:
        """
        Get data for settlement report.
        
        Args:
            settlement_id: Settlement ID
            
        Returns:
            Dictionary with settlement data
        """
        # Get settlement with farmer
        result = await self.db.execute(
            select(Settlement)
            .options(selectinload(Settlement.farmer))
            .where(Settlement.id == settlement_id)
        )
        settlement = result.scalar_one_or_none()
        
        if not settlement:
            raise ValueError(f"Settlement not found: {settlement_id}")
        
        # Get settlement items
        items_result = await self.db.execute(
            select(DailyEntry)
            .options(selectinload(DailyEntry.flower_type))
            .where(
                and_(
                    DailyEntry.farmer_id == settlement.farmer_id,
                    DailyEntry.entry_date >= settlement.period_start,
                    DailyEntry.entry_date <= settlement.period_end
                )
            )
            .order_by(DailyEntry.entry_date, DailyEntry.entry_time)
        )
        items = items_result.scalars().all()
        
        # Build settlement data
        settlement_data = {
            'id': settlement.id,
            'settlement_number': settlement.settlement_number,
            'settlement_date': settlement.settlement_date.strftime("%Y-%m-%d"),
            'farmer_code': settlement.farmer.farmer_code if settlement.farmer else '',
            'farmer_name': settlement.farmer.name if settlement.farmer else '',
            'village': settlement.farmer.village if settlement.farmer else '',
            'phone': settlement.farmer.phone if settlement.farmer else '',
            'period_start': settlement.period_start.strftime("%Y-%m-%d"),
            'period_end': settlement.period_end.strftime("%Y-%m-%d"),
            'total_entries': settlement.total_entries,
            'total_quantity': float(settlement.total_quantity),
            'gross_amount': float(settlement.gross_amount),
            'total_commission': float(settlement.total_commission),
            'total_fees': float(settlement.total_fees),
            'total_advances': float(settlement.total_advances),
            'net_payable': float(settlement.net_payable),
            'status': settlement.status,
            'notes': settlement.notes
        }
        
        # Build items data
        items_data = []
        for item in items:
            items_data.append({
                'id': item.id,
                'entry_date': item.entry_date.strftime("%Y-%m-%d"),
                'flower_type': item.flower_type.name if item.flower_type else '',
                'quantity': float(item.quantity),
                'rate_per_unit': float(item.rate_per_unit),
                'total_amount': float(item.total_amount),
                'commission_amount': float(item.commission_amount),
                'net_amount': float(item.net_amount)
            })
        
        return {
            'settlement': settlement_data,
            'items': items_data
        }
    
    async def get_custom_report_data(
        self,
        start_date: date,
        end_date: date,
        farmer_id: Optional[str] = None,
        flower_type_id: Optional[str] = None,
        village: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get data for custom report with filters.
        
        Args:
            start_date: Start date
            end_date: End date
            farmer_id: Optional farmer filter
            flower_type_id: Optional flower type filter
            village: Optional village filter
            
        Returns:
            Dictionary with report data
        """
        # Build query filters
        entry_filters = [
            DailyEntry.entry_date >= start_date,
            DailyEntry.entry_date <= end_date
        ]
        
        if farmer_id:
            entry_filters.append(DailyEntry.farmer_id == farmer_id)
        
        if flower_type_id:
            entry_filters.append(DailyEntry.flower_type_id == flower_type_id)
        
        # Get entries
        entries_query = select(DailyEntry).options(
            selectinload(DailyEntry.farmer),
            selectinload(DailyEntry.flower_type)
        ).where(and_(*entry_filters))
        
        entries_result = await self.db.execute(entries_query)
        entries = entries_result.scalars().all()
        
        # Filter by village if specified
        if village:
            entries = [
                e for e in entries 
                if e.farmer and e.farmer.village == village
            ]
        
        # Calculate totals
        total_entries = len(entries)
        total_weight = Decimal('0')
        gross_amount = Decimal('0')
        total_commission = Decimal('0')
        net_amount = Decimal('0')
        
        for entry in entries:
            total_weight += entry.quantity
            gross_amount += entry.total_amount
            total_commission += entry.commission_amount
            net_amount += entry.net_amount
        
        # Build summary data
        summary_data = {
            'start_date': start_date.strftime("%Y-%m-%d"),
            'end_date': end_date.strftime("%Y-%m-%d"),
            'total_entries': total_entries,
            'total_weight': float(total_weight),
            'gross_amount': float(gross_amount),
            'total_commission': float(total_commission),
            'net_amount': float(net_amount)
        }
        
        # Build entries data
        entries_data = []
        for entry in entries:
            entries_data.append({
                'id': entry.id,
                'entry_date': entry.entry_date.strftime("%Y-%m-%d"),
                'entry_time': entry.entry_time.strftime("%H:%M"),
                'farmer_code': entry.farmer.farmer_code if entry.farmer else '',
                'farmer_name': entry.farmer.name if entry.farmer else '',
                'village': entry.farmer.village if entry.farmer else '',
                'flower_name': entry.flower_type.name if entry.flower_type else '',
                'quantity': float(entry.quantity),
                'rate_per_unit': float(entry.rate_per_unit),
                'total_amount': float(entry.total_amount),
                'commission_amount': float(entry.commission_amount),
                'net_amount': float(entry.net_amount)
            })
        
        return {
            'summary': summary_data,
            'entries': entries_data
        }
