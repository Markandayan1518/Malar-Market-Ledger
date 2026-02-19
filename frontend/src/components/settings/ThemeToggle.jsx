import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Theme Toggle Component
 * 
 * Allows switching between Arctic Frost and Warm Classic themes.
 * Stores preference in localStorage for persistence.
 * Applies theme class to document root.
 */
const ThemeToggle = ({ compact = false }) => {
  const { t } = useTranslation();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'arctic';
  });

  useEffect(() => {
    // Apply theme class to document
    const root = document.documentElement;
    root.classList.remove('theme-arctic', 'theme-warm');
    root.classList.add(`theme-${theme}`);
    
    // Store preference
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'arctic' ? 'warm' : 'arctic');
  };

  if (compact) {
    return (
      <button
        onClick={toggleTheme}
        className="flex items-center gap-2 px-3 py-2 rounded-lg
                   bg-white/10 hover:bg-white/20 
                   border border-white/20 
                   transition-all duration-200
                   text-sm font-medium text-warm-charcoal dark:text-white"
        title={t('theme.switchTheme')}
      >
        <span className="text-lg">
          {theme === 'arctic' ? '❄️' : '🌻'}
        </span>
        <span className="hidden sm:inline">
          {theme === 'arctic' ? t('theme.arctic') : t('theme.warm')}
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-warm-charcoal dark:text-white/80">
        {t('settings.theme')}:
      </span>
      <div className="flex rounded-lg overflow-hidden border border-warm-taupe/30 dark:border-white/20">
        <button
          onClick={() => setTheme('arctic')}
          className={`px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2
            ${theme === 'arctic'
              ? 'bg-arctic-glacier text-arctic-night dark:bg-frostbite-pink dark:text-white'
              : 'bg-white/50 text-warm-taupe hover:bg-white/80 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20'
            }`}
        >
          <span className="text-base">❄️</span>
          <span>{t('theme.arctic')}</span>
        </button>
        <button
          onClick={() => setTheme('warm')}
          className={`px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2
            ${theme === 'warm'
              ? 'bg-warm-sand text-warm-charcoal'
              : 'bg-white/50 text-warm-taupe hover:bg-white/80 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20'
            }`}
        >
          <span className="text-base">🌻</span>
          <span>{t('theme.warm')}</span>
        </button>
      </div>
    </div>
  );
};

export default ThemeToggle;
