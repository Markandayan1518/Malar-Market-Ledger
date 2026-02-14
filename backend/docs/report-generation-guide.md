# Report Generation System - Implementation Summary

## Overview

The Malar Market Digital Ledger now includes a comprehensive PDF and Excel generation system with full Tamil font support for generating monthly statements, reports, and summaries.

## Implemented Components

### 1. Font Management (`backend/app/services/font_manager.py`)

**Purpose:** Manages Tamil fonts for PDF generation with automatic fallback support.

**Features:**
- Automatic font detection from multiple sources
- Font fallback chain: Noto Sans Tamil → Latha → Vijaya → Nirmala UI → Arial Unicode MS
- Font embedding in PDFs for consistent rendering
- Tamil text detection for appropriate font selection
- Cross-platform support (Linux, macOS, Windows)

**Key Functions:**
- `register_font()` - Register fonts with ReportLab
- `get_available_font()` - Get first available Tamil font
- `get_bold_font()` - Get bold variant of available font
- `is_tamil_text()` - Detect Tamil characters in text
- `get_font_for_text()` - Select appropriate font based on content

### 2. Report Templates (`backend/app/services/report_templates.py`)

**Purpose:** Centralized styling and text templates for reports.

**Features:**
- Color scheme matching app theme (magenta, purple, emerald, crimson)
- PDF layout configurations (A4, margins, typography)
- Excel styling constants (fonts, colors, borders)
- Bilingual text templates (English and Tamil)
- Month name localization
- Status text localization
- Currency and weight formatting

**Key Classes:**
- `ColorScheme` - App color palette
- `PDFLayout` - PDF page dimensions and margins
- `PDFTypography` - Font sizes and styles
- `PDFTableStyle` - Table formatting
- `ExcelStyle` - Excel cell formatting
- `TamilText` - Tamil text templates
- `EnglishText` - English text templates
- `ReportTemplates` - Main template manager

### 3. PDF Generation Service (`backend/app/services/pdf_service.py`)

**Purpose:** Generate professional PDF reports with Tamil font support.

**Features:**
- Individual farmer monthly statements
- Master monthly reports
- Daily summaries
- Settlement reports
- Custom reports with filters
- Professional layout with headers, tables, and footers
- A4 paper size with 1-inch margins
- Alternating row colors in tables
- Page numbering
- Generated timestamp
- Digital signature placeholder

**Key Methods:**
- `generate_farmer_statement()` - Generate farmer monthly statement PDF
- `generate_monthly_report()` - Generate master monthly report PDF
- `generate_daily_summary()` - Generate daily summary PDF
- `generate_settlement_report()` - Generate settlement report PDF

**PDF Sections:**
- Header with title and date
- Farmer details (name, ID, village, phone)
- Summary table (weight, gross, commission, fees, advances, net)
- Daily entries table (date, flower type, weight, rate, total)
- Cash advances table (date, amount, reason, status)
- Payment details section
- Footer with page number and timestamp

### 4. Excel Generation Service (`backend/app/services/excel_service.py`)

**Purpose:** Generate professional Excel reports with multiple sheets.

**Features:**
- Multiple sheets per workbook
- Professional formatting with headers and borders
- Auto-fit column widths
- Freeze header rows
- Indian number formatting (₹, lakhs, crores)
- Currency format with ₹ symbol
- Date format: DD-MM-YYYY
- Alternate row colors
- Bold headers with background colors

**Key Methods:**
- `generate_monthly_report()` - Generate master monthly report Excel
- `generate_farmer_statement()` - Generate individual farmer statement Excel
- `generate_daily_summary()` - Generate daily summary Excel

**Excel Sheets:**
1. **Summary** - Overall statistics
2. **Farmers** - All farmer summaries
3. **Daily Entries** - All daily entries
4. **Cash Advances** - All cash advances
5. **Settlements** - All settlements

### 5. Report Aggregation Service (`backend/app/services/report_aggregator.py`)

**Purpose:** Fetch and aggregate data from database for reports.

**Features:**
- Farmer monthly data aggregation
- Monthly report data aggregation
- Daily summary data aggregation
- Settlement report data aggregation
- Custom report data with filters
- Time-based rate application to historical entries
- Date range filtering
- Flower type filtering
- Village filtering
- Total and subtotal calculations
- Graceful handling of missing data

**Key Methods:**
- `get_farmer_monthly_data()` - Get farmer data for a month
- `get_monthly_report_data()` - Get monthly report data
- `get_daily_summary_data()` - Get daily summary data
- `get_settlement_report_data()` - Get settlement report data
- `get_custom_report_data()` - Get custom report with filters

### 6. Cache Service (`backend/app/services/cache_service.py`)

**Purpose:** Cache generated reports to improve performance.

**Features:**
- Redis-based caching
- 1-hour TTL for reports
- Deterministic cache key generation
- Pattern-based cache invalidation
- Farmer-specific cache invalidation
- Month-specific cache invalidation
- Date-specific cache invalidation
- Cache statistics tracking

**Key Methods:**
- `get()` - Get cached report
- `set()` - Cache report data
- `delete()` - Delete specific cache
- `invalidate_pattern()` - Invalidate matching caches
- `invalidate_farmer_cache()` - Invalidate all farmer caches
- `invalidate_month_cache()` - Invalidate all month caches
- `get_stats()` - Get cache statistics

### 7. API Routes (`backend/app/api/reports.py`)

**Purpose:** REST API endpoints for report generation.

**Endpoints:**

1. **GET `/api/v1/reports/farmer-statement/{farmer_id}/{month}/{year}`**
   - Generate individual farmer monthly statement
   - Query params: `language` (en/ta), `format` (pdf/excel)
   - Returns: PDF or Excel file

2. **GET `/api/v1/reports/monthly-report/{month}/{year}`**
   - Generate master monthly report for all farmers
   - Query params: `format` (pdf/excel), `flower_type_id`, `village`
   - Returns: PDF or Excel file

3. **GET `/api/v1/reports/daily-summary/{date}`**
   - Generate daily summary report
   - Query params: `format` (pdf/excel)
   - Returns: PDF or Excel file

4. **GET `/api/v1/reports/settlement-report/{settlement_id}`**
   - Generate settlement report
   - Query params: `format` (pdf)
   - Returns: PDF file

5. **POST `/api/v1/reports/custom`**
   - Generate custom report with filters
   - Query params: `format` (pdf/excel), `farmer_id`, `flower_type_id`, `village`
   - Returns: PDF or Excel file

6. **GET `/api/v1/reports/font-info`**
   - Get information about available fonts
   - Returns: Font information

**Security:**
- Role-based access (Admin/Staff only)
- Token-based authentication
- Input validation
- Error handling

### 8. Test Utilities (`backend/app/services/report_test_utils.py`)

**Purpose:** Test data generation and test runners for report generation.

**Features:**
- Test data generators for all report types
- Tamil text rendering tests
- PDF generation tests
- Excel generation tests
- Monthly report tests
- Comprehensive test runner

**Key Classes:**
- `ReportTestData` - Test data generator
- `ReportTestRunner` - Test execution runner

## Dependencies Added

```txt
# PDF & Excel Generation
reportlab==4.0.7
openpyxl==3.1.2
Pillow==10.1.0
```

## API Usage Examples

### Generate Farmer Statement (English PDF)

```bash
curl -X GET "http://localhost:8000/api/v1/reports/farmer-statement/{farmer_id}/1/2024?language=en&format=pdf" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o farmer_statement.pdf
```

### Generate Farmer Statement (Tamil PDF)

```bash
curl -X GET "http://localhost:8000/api/v1/reports/farmer-statement/{farmer_id}/1/2024?language=ta&format=pdf" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o farmer_statement_tamil.pdf
```

### Generate Monthly Report (Excel)

```bash
curl -X GET "http://localhost:8000/api/v1/reports/monthly-report/1/2024?format=excel" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o monthly_report.xlsx
```

### Generate Daily Summary

```bash
curl -X GET "http://localhost:8000/api/v1/reports/daily-summary/2024-01-15?format=pdf" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o daily_summary.pdf
```

### Generate Custom Report

```bash
curl -X POST "http://localhost:8000/api/v1/reports/custom?start_date=2024-01-01&end_date=2024-01-31&format=excel&village=TestVillage" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o custom_report.xlsx
```

### Check Font Information

```bash
curl -X GET "http://localhost:8000/api/v1/reports/font-info" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Font Setup

See [`backend/docs/font-setup.md`](font-setup.md) for detailed font installation instructions.

### Quick Start

1. **Download Noto Sans Tamil:**
   ```bash
   # Linux
   sudo apt-get install fonts-noto-core fonts-noto-extra
   
   # macOS
   brew install font-noto-sans-tamil
   
   # Windows
   # Download from https://fonts.google.com/noto/specimen/Noto+Sans+Tamil
   ```

2. **Copy to project fonts directory:**
   ```bash
   mkdir -p backend/app/fonts
   cp NotoSansTamil-*.ttf backend/app/fonts/
   ```

3. **Verify fonts:**
   ```bash
   curl http://localhost:8000/api/v1/reports/font-info \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## Testing

### Run All Tests

```bash
cd backend
python -m app.services.report_test_utils
```

### Test Specific Report Type

```python
from app.services.report_test_utils import ReportTestRunner

runner = ReportTestRunner()
runner.test_pdf_generation(language="en")
runner.test_excel_generation(language="ta")
runner.test_monthly_report()
```

## Caching

Reports are cached automatically with a 1-hour TTL. Cache keys are generated based on:
- Report type
- Farmer ID
- Month/Year
- Date range
- Filters applied

### Manual Cache Invalidation

```python
from app.services.cache_service import get_cache_service

cache_service = get_cache_service()

# Invalidate all caches for a farmer
await cache_service.invalidate_farmer_cache(farmer_id="farmer-123")

# Invalidate all caches for a month
await cache_service.invalidate_month_cache(month=1, year=2024)

# Invalidate all caches for a date
await cache_service.invalidate_date_cache(date_str="2024-01-15")

# Clear all report caches
await cache_service.clear_all()

# Get cache statistics
stats = await cache_service.get_stats()
print(stats)
```

## Performance Considerations

1. **Caching:** Reports are cached for 1 hour to improve performance
2. **Large Reports:** Monthly reports with many farmers may take time
3. **Database Queries:** Optimized with proper indexing and eager loading
4. **PDF Generation:** ReportLab is efficient for most use cases
5. **Excel Generation:** openpyxl is fast for typical report sizes
6. **Memory:** Large reports may require more memory

## Error Handling

The system handles errors gracefully:

1. **Font Loading Errors:** Falls back to system fonts
2. **Missing Data:** Returns empty tables with appropriate messages
3. **Invalid Parameters:** Returns 400 Bad Request
4. **Database Errors:** Returns 500 Internal Server Error
5. **Cache Errors:** Logs warnings but continues operation

## Security

1. **Authentication:** All endpoints require valid JWT token
2. **Role-Based Access:** Admin and Staff roles only
3. **Input Validation:** All parameters validated
4. **SQL Injection:** Protected by SQLAlchemy ORM
5. **XSS:** Data sanitized before rendering

## Troubleshooting

### Tamil Text Not Rendering

**Problem:** Tamil text appears as boxes or question marks.

**Solutions:**
1. Verify fonts are installed in `backend/app/fonts/`
2. Check font manager info endpoint
3. Restart application to reload fonts
4. Check application logs for font registration errors

### PDF Generation Fails

**Problem:** PDF generation fails with error.

**Solutions:**
1. Check application logs: `tail -f backend/logs/app.log`
2. Verify ReportLab is installed: `pip list | grep reportlab`
3. Test with simple PDF generation first
4. Check memory availability for large reports

### Excel Generation Fails

**Problem:** Excel generation fails with error.

**Solutions:**
1. Check application logs
2. Verify openpyxl is installed: `pip list | grep openpyxl`
3. Test with small dataset first
4. Check disk space for file generation

## Next Steps

1. **Install Fonts:** Follow font setup guide
2. **Run Tests:** Execute test utilities to verify functionality
3. **Update Frontend:** Integrate report generation in frontend
4. **Deploy:** Deploy to production environment
5. **Monitor:** Monitor cache hit rates and performance

## Additional Resources

- [ReportLab Documentation](https://reportlab.com/documentation/)
- [openpyxl Documentation](https://openpyxl.readthedocs.io/)
- [Google Fonts - Noto Sans Tamil](https://fonts.google.com/noto/specimen/Noto+Sans+Tamil)
- [Tamil Unicode Chart](https://www.unicode.org/charts/PDF/U0B80.pdf)

## Support

For issues or questions:
1. Check application logs
2. Review font setup guide
3. Run test utilities
4. Contact development team with error details
