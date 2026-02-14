"""Test utilities for report generation services."""

import logging
from datetime import datetime, date
from typing import Dict, List, Any
from decimal import Decimal

logger = logging.getLogger(__name__)


class ReportTestData:
    """Test data generator for report testing."""
    
    @staticmethod
    def get_test_farmer_data() -> Dict[str, Any]:
        """Get test farmer data."""
        return {
            'id': 'test-farmer-001',
            'farmer_code': 'FAR001',
            'name': 'Test Farmer',
            'name_ta': 'சோதி விவசாயி',
            'village': 'Test Village',
            'village_ta': 'சோதி கிராமம்',
            'phone': '9876543210',
            'whatsapp_number': '9876543210',
            'address': '123 Test Street, Test City',
            'current_balance': Decimal('15000.00'),
            'total_advances': Decimal('5000.00'),
            'total_settlements': Decimal('10000.00'),
            'is_active': True
        }
    
    @staticmethod
    def get_test_summary_data(month: int = 1, year: int = 2024) -> Dict[str, Any]:
        """Get test summary data."""
        return {
            'month': month,
            'year': year,
            'period_start': f"{year}-{month:02d}-01",
            'period_end': f"{year}-{month:02d}-28",
            'total_entries': 25,
            'total_quantity': Decimal('125.50'),
            'gross_amount': Decimal('125500.00'),
            'total_commission': Decimal('6275.00'),
            'total_fees': Decimal('100.00'),
            'total_advances': Decimal('5000.00'),
            'net_payable': Decimal('114125.00')
        }
    
    @staticmethod
    def get_test_daily_entries(count: int = 10) -> List[Dict[str, Any]]:
        """Get test daily entries."""
        entries = []
        flower_types = ['Jasmine', 'Rose', 'Marigold', 'Chrysanthemum']
        
        for i in range(count):
            entry_date = date(2024, 1, (i % 28) + 1)
            entries.append({
                'id': f'entry-{i+1}',
                'entry_date': entry_date.strftime("%Y-%m-%d"),
                'entry_time': f"{8 + (i % 10)}:{(i * 5) % 60:02d}",
                'flower_name': flower_types[i % len(flower_types)],
                'flower_code': flower_types[i % len(flower_types)][:3].upper(),
                'quantity': float(Decimal(f"{(i % 5) + 1}.{(i % 10) * 10}")),
                'rate_per_unit': float(Decimal(f"{1000 + (i * 50)}")),
                'total_amount': float(Decimal(f"{1000 + (i * 50)}") * Decimal(f"{(i % 5) + 1}.{(i % 10) * 10}")),
                'commission_rate': float(5.0),
                'commission_amount': float(Decimal(f"{1000 + (i * 50)}") * Decimal(f"{(i % 5) + 1}.{(i % 10) * 10}") * Decimal('0.05')),
                'net_amount': float(Decimal(f"{1000 + (i * 50)}") * Decimal(f"{(i % 5) + 1}.{(i % 10) * 10}") * Decimal('0.95')),
                'notes': f'Test entry {i+1}'
            })
        
        return entries
    
    @staticmethod
    def get_test_cash_advances(count: int = 5) -> List[Dict[str, Any]]:
        """Get test cash advances."""
        advances = []
        reasons = [
            'Seed purchase',
            'Fertilizer',
            'Labor costs',
            'Equipment',
            'Other expenses'
        ]
        
        for i in range(count):
            advance_date = date(2024, 1, (i * 5) + 1)
            advances.append({
                'id': f'advance-{i+1}',
                'advance_date': advance_date.strftime("%Y-%m-%d"),
                'amount': float(Decimal(f"{(i + 1) * 1000}")),
                'reason': reasons[i % len(reasons)],
                'status': ['approved', 'pending', 'rejected'][i % 3],
                'approved_by': 'Admin User' if i % 2 == 0 else None,
                'approved_at': advance_date.strftime("%Y-%m-%d %H:%M") if i % 2 == 0 else '',
                'notes': f'Test advance {i+1}'
            })
        
        return advances
    
    @staticmethod
    def get_test_settlement_data() -> Dict[str, Any]:
        """Get test settlement data."""
        return {
            'id': 'settlement-001',
            'settlement_number': 'SET-2024-001',
            'settlement_date': '2024-01-31',
            'farmer_code': 'FAR001',
            'farmer_name': 'Test Farmer',
            'village': 'Test Village',
            'phone': '9876543210',
            'period_start': '2024-01-01',
            'period_end': '2024-01-31',
            'total_entries': 25,
            'total_quantity': Decimal('125.50'),
            'gross_amount': Decimal('125500.00'),
            'total_commission': Decimal('6275.00'),
            'total_fees': Decimal('100.00'),
            'total_advances': Decimal('5000.00'),
            'net_payable': Decimal('114125.00'),
            'status': 'approved',
            'notes': 'Monthly settlement for January 2024'
        }
    
    @staticmethod
    def get_test_settlement_items(count: int = 10) -> List[Dict[str, Any]]:
        """Get test settlement items."""
        items = []
        flower_types = ['Jasmine', 'Rose', 'Marigold', 'Chrysanthemum']
        
        for i in range(count):
            entry_date = date(2024, 1, (i % 28) + 1)
            items.append({
                'id': f'item-{i+1}',
                'entry_date': entry_date.strftime("%Y-%m-%d"),
                'flower_type': flower_types[i % len(flower_types)],
                'quantity': float(Decimal(f"{(i % 5) + 1}.{(i % 10) * 10}")),
                'rate_per_unit': float(Decimal(f"{1000 + (i * 50)}")),
                'total_amount': float(Decimal(f"{1000 + (i * 50)}") * Decimal(f"{(i % 5) + 1}.{(i % 10) * 10}")),
                'commission_amount': float(Decimal(f"{1000 + (i * 50)}") * Decimal(f"{(i % 5) + 1}.{(i % 10) * 10}") * Decimal('0.05')),
                'net_amount': float(Decimal(f"{1000 + (i * 50)}") * Decimal(f"{(i % 5) + 1}.{(i % 10) * 10}") * Decimal('0.95'))
            })
        
        return items


class ReportTestRunner:
    """Test runner for report generation services."""
    
    def __init__(self):
        """Initialize test runner."""
        self.test_data = ReportTestData()
    
    def test_pdf_generation(self, language: str = "en"):
        """
        Test PDF generation with test data.
        
        Args:
            language: Language code ('en' or 'ta')
        """
        try:
            from app.services.pdf_service import PDFService
            
            logger.info(f"Testing PDF generation with language: {language}")
            
            pdf_service = PDFService(language=language)
            
            # Test farmer statement
            farmer_data = self.test_data.get_test_farmer_data()
            summary_data = self.test_data.get_test_summary_data()
            entries = self.test_data.get_test_daily_entries(15)
            advances = self.test_data.get_test_cash_advances(5)
            
            pdf_bytes = pdf_service.generate_farmer_statement(
                farmer_data=farmer_data,
                summary_data=summary_data,
                entries=entries,
                advances=advances
            )
            
            logger.info(f"PDF generated successfully: {len(pdf_bytes)} bytes")
            
            # Save test PDF
            test_filename = f"test_farmer_statement_{language}.pdf"
            with open(test_filename, 'wb') as f:
                f.write(pdf_bytes)
            
            logger.info(f"Test PDF saved to: {test_filename}")
            return True
            
        except Exception as e:
            logger.error(f"PDF generation test failed: {e}")
            return False
    
    def test_excel_generation(self, language: str = "en"):
        """
        Test Excel generation with test data.
        
        Args:
            language: Language code ('en' or 'ta')
        """
        try:
            from app.services.excel_service import ExcelService
            
            logger.info(f"Testing Excel generation with language: {language}")
            
            excel_service = ExcelService(language=language)
            
            # Test farmer statement
            farmer_data = self.test_data.get_test_farmer_data()
            summary_data = self.test_data.get_test_summary_data()
            entries = self.test_data.get_test_daily_entries(15)
            advances = self.test_data.get_test_cash_advances(5)
            
            excel_bytes = excel_service.generate_farmer_statement(
                farmer_data=farmer_data,
                summary_data=summary_data,
                entries=entries,
                advances=advances
            )
            
            logger.info(f"Excel generated successfully: {len(excel_bytes)} bytes")
            
            # Save test Excel
            test_filename = f"test_farmer_statement_{language}.xlsx"
            with open(test_filename, 'wb') as f:
                f.write(excel_bytes)
            
            logger.info(f"Test Excel saved to: {test_filename}")
            return True
            
        except Exception as e:
            logger.error(f"Excel generation test failed: {e}")
            return False
    
    def test_monthly_report(self):
        """Test monthly report generation."""
        try:
            from app.services.pdf_service import PDFService
            from app.services.excel_service import ExcelService
            
            logger.info("Testing monthly report generation")
            
            # Prepare test data
            summary_data = {
                'month': 1,
                'year': 2024,
                'period_start': '2024-01-01',
                'period_end': '2024-01-31',
                'total_farmers': 10,
                'total_entries': 250,
                'total_weight': 1250.50,
                'total_gross': 1255000.00,
                'total_commission': 62750.00,
                'total_net': 1192250.00
            }
            
            farmer_summaries = []
            for i in range(10):
                farmer_summaries.append({
                    'farmer_id': f'farmer-{i+1}',
                    'farmer_code': f'FAR{i+1:03d}',
                    'name': f'Farmer {i+1}',
                    'village': f'Village {i+1}',
                    'phone': f'98765432{i:02d}0',
                    'total_entries': 25,
                    'total_quantity': 125.50,
                    'gross_amount': 125500.00,
                    'total_commission': 6275.00,
                    'total_advances': 5000.00,
                    'net_payable': 114125.00
                })
            
            daily_entries = self.test_data.get_test_daily_entries(50)
            cash_advances = self.test_data.get_test_cash_advances(20)
            
            settlements = []
            for i in range(5):
                settlements.append({
                    'id': f'settlement-{i+1}',
                    'settlement_number': f'SET-2024-{i+1:03d}',
                    'settlement_date': f'2024-01-{(i * 5) + 5:02d}',
                    'farmer_code': f'FAR{i+1:03d}',
                    'farmer_name': f'Farmer {i+1}',
                    'period_start': '2024-01-01',
                    'period_end': '2024-01-31',
                    'total_entries': 25,
                    'total_quantity': 125.50,
                    'gross_amount': 125500.00,
                    'total_commission': 6275.00,
                    'net_payable': 114125.00,
                    'status': 'approved'
                })
            
            # Test PDF
            pdf_service = PDFService(language="en")
            pdf_bytes = pdf_service.generate_monthly_report(
                report_data=summary_data,
                farmer_summaries=farmer_summaries[:10],  # Limit to 10 for PDF
                daily_entries=daily_entries[:50]  # Limit to 50 for PDF
            )
            
            logger.info(f"Monthly PDF generated: {len(pdf_bytes)} bytes")
            
            # Test Excel
            excel_service = ExcelService(language="en")
            excel_bytes = excel_service.generate_monthly_report(
                summary_data=summary_data,
                farmer_summaries=farmer_summaries,
                daily_entries=daily_entries,
                cash_advances=cash_advances,
                settlements=settlements
            )
            
            logger.info(f"Monthly Excel generated: {len(excel_bytes)} bytes")
            
            # Save test files
            with open("test_monthly_report.pdf", 'wb') as f:
                f.write(pdf_bytes)
            
            with open("test_monthly_report.xlsx", 'wb') as f:
                f.write(excel_bytes)
            
            logger.info("Test monthly reports saved successfully")
            return True
            
        except Exception as e:
            logger.error(f"Monthly report test failed: {e}")
            return False
    
    def test_tamil_text_rendering(self):
        """Test Tamil text rendering in PDF."""
        try:
            from app.services.pdf_service import PDFService
            from app.services.font_manager import get_font_manager
            
            logger.info("Testing Tamil text rendering")
            
            font_manager = get_font_manager()
            logger.info(f"Available fonts: {font_manager.get_font_info()}")
            
            # Test Tamil text
            tamil_text = "விவசாயி சந்திரங்கள் மலர் சந்திரங்கள்"
            
            pdf_service = PDFService(language="ta")
            
            # Create simple test PDF
            from reportlab.platypus import SimpleDocTemplate, Paragraph
            from reportlab.lib.pagesizes import A4
            from reportlab.lib.units import inch
            
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=A4,
                rightMargin=1*inch,
                leftMargin=1*inch,
                topMargin=1*inch,
                bottomMargin=1*inch
            )
            
            # Add Tamil text
            styles = pdf_service.styles
            doc.append(Paragraph(tamil_text, styles['CustomBody']))
            doc.build()
            
            pdf_bytes = buffer.getvalue()
            buffer.close()
            
            logger.info(f"Tamil PDF generated: {len(pdf_bytes)} bytes")
            
            # Save test file
            with open("test_tamil_text.pdf", 'wb') as f:
                f.write(pdf_bytes)
            
            logger.info("Tamil text test PDF saved successfully")
            return True
            
        except Exception as e:
            logger.error(f"Tamil text rendering test failed: {e}")
            return False
    
    def run_all_tests(self):
        """Run all report generation tests."""
        logger.info("=" * 50)
        logger.info("Starting Report Generation Tests")
        logger.info("=" * 50)
        
        results = {
            'pdf_generation_en': self.test_pdf_generation(language="en"),
            'pdf_generation_ta': self.test_pdf_generation(language="ta"),
            'excel_generation_en': self.test_excel_generation(language="en"),
            'excel_generation_ta': self.test_excel_generation(language="ta"),
            'monthly_report': self.test_monthly_report(),
            'tamil_text_rendering': self.test_tamil_text_rendering()
        }
        
        logger.info("=" * 50)
        logger.info("Test Results Summary:")
        logger.info("=" * 50)
        
        for test_name, result in results.items():
            status = "✓ PASSED" if result else "✗ FAILED"
            logger.info(f"{test_name}: {status}")
        
        passed = sum(1 for r in results.values() if r)
        total = len(results)
        
        logger.info("=" * 50)
        logger.info(f"Tests Passed: {passed}/{total}")
        logger.info("=" * 50)
        
        return results


def main():
    """Run report generation tests."""
    runner = ReportTestRunner()
    results = runner.run_all_tests()
    return results


if __name__ == "__main__":
    import io
    main()
