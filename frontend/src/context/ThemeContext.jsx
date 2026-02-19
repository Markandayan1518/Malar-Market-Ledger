import { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  // Apply Arctic theme class to document (always use Arctic)
  useEffect(() => {
    const root = document.documentElement;
    
    // Always apply Arctic theme
    root.classList.remove('warm-theme');
    root.classList.add('arctic-theme');
    
    // Save theme preference
    localStorage.setItem('theme', 'arctic');
  }, []);

  useEffect(() => {
    // Save language preference
    localStorage.setItem('language', language);
    
    // Update i18next language
    i18n.changeLanguage(language);
    
    // Update document direction for RTL languages
    document.documentElement.dir = language === 'ta' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, i18n]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ta' : 'en');
  };

  const value = {
    language,
    theme: 'arctic', // Always return 'arctic' for compatibility
    toggleLanguage,
    setLanguage,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
