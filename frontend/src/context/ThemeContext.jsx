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
  const [theme, setTheme] = useState('light');

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

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const value = {
    language,
    theme,
    toggleLanguage,
    toggleTheme,
    setLanguage,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
