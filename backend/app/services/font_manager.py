"""Font management service for Tamil font support in PDF generation."""

import os
import logging
from pathlib import Path
from typing import Optional, Dict, List
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.fonts import addMapping

logger = logging.getLogger(__name__)


class FontManager:
    """Manages Tamil fonts for PDF generation with fallback support."""
    
    def __init__(self, font_dir: Optional[str] = None):
        """
        Initialize font manager.
        
        Args:
            font_dir: Directory containing font files. If None, uses default paths.
        """
        self.font_dir = Path(font_dir) if font_dir else self._get_default_font_dir()
        self.registered_fonts: Dict[str, bool] = {}
        self.font_chain: List[str] = [
            "NotoSansTamil",
            "Latha",
            "Vijaya",
            "NirmalaUI",
            "ArialUnicodeMS"
        ]
        self._ensure_font_directory()
    
    def _get_default_font_dir(self) -> Path:
        """Get default font directory based on OS."""
        # Check common font directories
        possible_dirs = [
            Path("/usr/share/fonts/truetype/noto"),  # Linux
            Path("/System/Library/Fonts"),  # macOS
            Path("C:/Windows/Fonts"),  # Windows
            Path.home() / ".fonts",  # User fonts
            Path("backend/app/fonts"),  # Project fonts
        ]
        
        for dir_path in possible_dirs:
            if dir_path.exists():
                return dir_path
        
        # Create project fonts directory
        project_fonts = Path("backend/app/fonts")
        project_fonts.mkdir(parents=True, exist_ok=True)
        return project_fonts
    
    def _ensure_font_directory(self):
        """Ensure font directory exists."""
        self.font_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Font directory: {self.font_dir}")
    
    def register_font(self, font_name: str, font_path: str) -> bool:
        """
        Register a font with ReportLab.
        
        Args:
            font_name: Name to register the font as
            font_path: Path to the font file
            
        Returns:
            True if registration successful, False otherwise
        """
        try:
            if font_name in self.registered_fonts:
                logger.debug(f"Font {font_name} already registered")
                return True
            
            if not os.path.exists(font_path):
                logger.warning(f"Font file not found: {font_path}")
                return False
            
            pdfmetrics.registerFont(TTFont(font_name, font_path))
            self.registered_fonts[font_name] = True
            logger.info(f"Successfully registered font: {font_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to register font {font_name}: {e}")
            return False
    
    def register_tamil_fonts(self):
        """Register all available Tamil fonts."""
        # Noto Sans Tamil (primary choice)
        noto_paths = [
            self.font_dir / "NotoSansTamil-Regular.ttf",
            self.font_dir / "NotoSansTamil-Bold.ttf",
            Path("/usr/share/fonts/truetype/noto/NotoSansTamil-Regular.ttf"),
            Path("/System/Library/Fonts/NotoSansTamil-Regular.ttf"),
        ]
        
        for font_path in noto_paths:
            if font_path.exists():
                self.register_font("NotoSansTamil", str(font_path))
                # Try to register bold variant
                bold_path = font_path.parent / font_path.name.replace("Regular", "Bold")
                if bold_path.exists():
                    self.register_font("NotoSansTamil-Bold", str(bold_path))
                break
        
        # Latha (Windows system font)
        latha_paths = [
            Path("C:/Windows/Fonts/latha.ttf"),
            Path("C:/Windows/Fonts/lathab.ttf"),
        ]
        
        for font_path in latha_paths:
            if font_path.exists():
                self.register_font("Latha", str(font_path))
                break
        
        # Vijaya (Windows system font)
        vijaya_paths = [
            Path("C:/Windows/Fonts/vijaya.ttf"),
            Path("C:/Windows/Fonts/vijayab.ttf"),
        ]
        
        for font_path in vijaya_paths:
            if font_path.exists():
                self.register_font("Vijaya", str(font_path))
                break
        
        # Nirmala UI (Windows 8+)
        nirmala_paths = [
            Path("C:/Windows/Fonts/Nirmala.ttf"),
            Path("C:/Windows/Fonts/NirmalaB.ttf"),
        ]
        
        for font_path in nirmala_paths:
            if font_path.exists():
                self.register_font("NirmalaUI", str(font_path))
                break
        
        # Arial Unicode MS (fallback)
        arial_paths = [
            Path("C:/Windows/Fonts/arialuni.ttf"),
            Path("/System/Library/Fonts/Arial Unicode.ttf"),
        ]
        
        for font_path in arial_paths:
            if font_path.exists():
                self.register_font("ArialUnicodeMS", str(font_path))
                break
        
        logger.info(f"Registered fonts: {list(self.registered_fonts.keys())}")
    
    def get_available_font(self) -> str:
        """
        Get the first available Tamil font from the font chain.
        
        Returns:
            Name of the first available font, or 'Helvetica' as fallback
        """
        for font_name in self.font_chain:
            if font_name in self.registered_fonts:
                return font_name
        
        logger.warning("No Tamil fonts available, using Helvetica")
        return "Helvetica"
    
    def get_bold_font(self) -> str:
        """
        Get the bold variant of the available Tamil font.
        
        Returns:
            Name of the bold font, or 'Helvetica-Bold' as fallback
        """
        base_font = self.get_available_font()
        
        # Try bold variants
        bold_variants = {
            "NotoSansTamil": "NotoSansTamil-Bold",
            "Latha": "Latha-Bold",
            "Vijaya": "Vijaya-Bold",
            "NirmalaUI": "NirmalaUI-Bold",
            "ArialUnicodeMS": "ArialUnicodeMS-Bold",
        }
        
        if base_font in bold_variants:
            bold_font = bold_variants[base_font]
            if bold_font in self.registered_fonts:
                return bold_font
        
        return "Helvetica-Bold"
    
    def is_tamil_text(self, text: str) -> bool:
        """
        Check if text contains Tamil characters.
        
        Args:
            text: Text to check
            
        Returns:
            True if text contains Tamil characters
        """
        # Tamil Unicode range: U+0B80 to U+0BFF
        for char in text:
            if 0x0B80 <= ord(char) <= 0x0BFF:
                return True
        return False
    
    def get_font_for_text(self, text: str) -> str:
        """
        Get appropriate font for text (Tamil or English).
        
        Args:
            text: Text to render
            
        Returns:
            Font name suitable for the text
        """
        if self.is_tamil_text(text):
            return self.get_available_font()
        return "Helvetica"
    
    def get_bold_font_for_text(self, text: str) -> str:
        """
        Get appropriate bold font for text (Tamil or English).
        
        Args:
            text: Text to render
            
        Returns:
            Bold font name suitable for the text
        """
        if self.is_tamil_text(text):
            return self.get_bold_font()
        return "Helvetica-Bold"
    
    def download_noto_sans_tamil(self) -> bool:
        """
        Download Noto Sans Tamil font if not available.
        Note: This is a placeholder. In production, you would:
        1. Download from Google Fonts
        2. Save to font directory
        3. Register the font
        
        Returns:
            True if successful, False otherwise
        """
        logger.info("Noto Sans Tamil download not implemented. Please manually download:")
        logger.info("https://fonts.google.com/noto/specimen/Noto+Sans+Tamil")
        return False
    
    def get_font_info(self) -> Dict[str, any]:
        """
        Get information about registered fonts.
        
        Returns:
            Dictionary with font information
        """
        return {
            "registered_fonts": list(self.registered_fonts.keys()),
            "font_chain": self.font_chain,
            "available_font": self.get_available_font(),
            "font_directory": str(self.font_dir),
        }


# Global font manager instance
_font_manager: Optional[FontManager] = None


def get_font_manager() -> FontManager:
    """
    Get or create the global font manager instance.
    
    Returns:
        FontManager instance
    """
    global _font_manager
    if _font_manager is None:
        _font_manager = FontManager()
        _font_manager.register_tamil_fonts()
    return _font_manager


def init_fonts():
    """Initialize fonts for the application."""
    font_manager = get_font_manager()
    logger.info("Fonts initialized successfully")
    return font_manager
