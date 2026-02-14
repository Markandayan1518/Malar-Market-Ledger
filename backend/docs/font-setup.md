# Font Setup Guide for PDF Generation

This guide explains how to set up Tamil fonts for PDF generation in the Malar Market Digital Ledger.

## Overview

The PDF generation system requires Tamil fonts to properly render Tamil text in reports. The system supports multiple Tamil fonts with automatic fallback.

## Supported Tamil Fonts

The system supports the following Tamil fonts in order of preference:

1. **Noto Sans Tamil** (Primary - Open Source)
   - Best quality and character support
   - Open source, freely available
   - Recommended for production use

2. **Latha** (Windows System Font)
   - Built-in Windows font
   - Good Tamil support
   - Automatically detected if available

3. **Vijaya** (Windows System Font)
   - Built-in Windows font
   - Good Tamil support
   - Automatically detected if available

4. **Nirmala UI** (Windows 8+ System Font)
   - Built-in Windows font
   - Good Tamil support
   - Automatically detected if available

5. **Arial Unicode MS** (Fallback)
   - Last resort fallback
   - Limited Tamil support
   - Only used if no other fonts available

## Installation Instructions

### Option 1: Using Noto Sans Tamil (Recommended)

#### Linux/Ubuntu

```bash
# Install Noto Sans Tamil fonts
sudo apt-get update
sudo apt-get install fonts-noto-core fonts-noto-extra

# Or download from Google Fonts
wget https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansTamil-Regular.ttf
wget https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansTamil-Bold.ttf

# Copy to project fonts directory
mkdir -p backend/app/fonts
cp NotoSansTamil-*.ttf backend/app/fonts/
```

#### macOS

```bash
# Using Homebrew
brew install font-noto-sans-tamil

# Or download from Google Fonts
curl -L https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansTamil-Regular.ttf -o backend/app/fonts/NotoSansTamil-Regular.ttf
curl -L https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansTamil-Bold.ttf -o backend/app/fonts/NotoSansTamil-Bold.ttf
```

#### Windows

1. Download fonts from Google Fonts:
   - https://fonts.google.com/noto/specimen/Noto+Sans+Tamil
   - Click "Download family"
   - Extract the ZIP file

2. Copy font files to project directory:
   ```
   backend/app/fonts/NotoSansTamil-Regular.ttf
   backend/app/fonts/NotoSansTamil-Bold.ttf
   ```

### Option 2: Using System Fonts (Windows)

If deploying on Windows, the system will automatically detect and use Latha, Vijaya, or Nirmala UI fonts. No additional setup required.

### Option 3: Docker Deployment

For Docker deployments, add the font installation to your Dockerfile:

```dockerfile
# Add to backend/Dockerfile

# Install system fonts
RUN apt-get update && apt-get install -y \
    fonts-noto-core \
    fonts-noto-extra \
    fontconfig

# Copy project fonts
COPY backend/app/fonts /app/backend/app/fonts/

# Update font cache
RUN fc-cache -fv
```

## Font Directory Structure

```
backend/app/fonts/
├── NotoSansTamil-Regular.ttf
├── NotoSansTamil-Bold.ttf
├── Latha.ttf              # Optional - Windows system font
├── Vijaya.ttf             # Optional - Windows system font
└── README.md              # Font documentation
```

## Verification

To verify that fonts are properly installed:

1. **Check Font Manager Info:**
   ```bash
   curl http://localhost:8000/api/v1/reports/font-info \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Expected Response:**
   ```json
   {
     "registered_fonts": ["NotoSansTamil", "NotoSansTamil-Bold"],
     "font_chain": ["NotoSansTamil", "Latha", "Vijaya", "NirmalaUI", "ArialUnicodeMS"],
     "available_font": "NotoSansTamil",
     "font_directory": "/path/to/backend/app/fonts"
   }
   ```

3. **Test PDF Generation:**
   ```bash
   curl http://localhost:8000/api/v1/reports/farmer-statement/{farmer_id}/1/2024?language=ta&format=pdf \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -o test_report.pdf
   ```

## Troubleshooting

### Fonts Not Rendering Correctly

**Problem:** Tamil text appears as boxes or question marks.

**Solutions:**
1. Verify font files are in the correct directory
2. Check file permissions: `ls -la backend/app/fonts/`
3. Restart the application to reload fonts
4. Check application logs for font registration errors

### Font Not Available

**Problem:** Font manager reports no Tamil fonts available.

**Solutions:**
1. Install Noto Sans Tamil (see Option 1 above)
2. Verify font files are valid TTF files
3. Check font file names match expected names

### Performance Issues

**Problem:** PDF generation is slow.

**Solutions:**
1. Use caching (enabled by default)
2. Generate reports during off-peak hours
3. Consider async generation for large reports
4. Optimize database queries

## Best Practices

1. **Use Noto Sans Tamil** for best results
2. **Embed fonts** in PDFs for consistent rendering
3. **Test with sample data** before production
4. **Monitor cache hit rates** for performance
5. **Keep fonts updated** to latest versions
6. **Use appropriate font sizes** for readability

## Tamil Text Testing

Test Tamil text rendering with these sample strings:

```
விவசாயி சந்திரங்கள்
மலர் சந்திரங்கள்
பூக்கள் வகைக்கள்
மலர் வகைக்கள்
```

## Unicode Support

The system supports Tamil Unicode range: U+0B80 to U+0BFF

Common Tamil characters tested:
- அ (a) to ஔ (au) - Vowels
- க், ங், ச், ஞ், ட், ண், த், ந், ப், ற், ன் - Consonants
- ஃ, ஂ, ா, ் - Special characters
- ௦, ௧, ௨, ௰, ௱, ௲ - Tamil numerals

## Additional Resources

- [Google Fonts - Noto Sans Tamil](https://fonts.google.com/noto/specimen/Noto+Sans+Tamil)
- [Noto Fonts GitHub](https://github.com/googlefonts/noto-fonts)
- [Tamil Unicode Chart](https://www.unicode.org/charts/PDF/U0B80.pdf)
- [ReportLab Documentation](https://reportlab.com/documentation/)

## Support

For issues with font setup or PDF generation:
1. Check application logs: `tail -f backend/logs/app.log`
2. Review font manager info endpoint
3. Test with simple PDF generation first
4. Contact support with error logs and system information
