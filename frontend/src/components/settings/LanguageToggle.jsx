import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Language Toggle Component
 * 
 * Allows switching between English and Tamil languages.
 * Stores preference in localStorage for persistence.
 */
const LanguageToggle = ({ compact = false }) => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const currentLang = i18n.language || 'en';

  if (compact) {
    return (
      <button
        onClick={() => changeLanguage(currentLang === 'en' ? 'ta' : 'en')}
        className="flex items-center gap-2 px-3 py-2 rounded-lg
                   bg-white/10 hover:bg-white/20 
                   border border-white/20 
                   transition-all duration-200
                   text-sm font-medium text-warm-charcoal dark:text-white"
        title={t('settings.language')}
      >
        <span className="text-base">
          {currentLang === 'en' ? '🇬🇧' : '🇮🇳'}
        </span>
        <span className="hidden sm:inline">
          {currentLang === 'en' ? 'EN' : 'தமிழ்'}
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-warm-charcoal dark:text-white/80">
        {t('settings.language')}:
      </span>
      <div className="flex rounded-lg overflow-hidden border border-warm-taupe/30 dark:border-white/20">
        <button
          onClick={() => changeLanguage('en')}
          className={`px-4 py-2 text-sm font-medium transition-all duration-200
            ${currentLang === 'en'
              ? 'bg-arctic-glacier text-arctic-night dark:bg-frostbite-pink dark:text-white'
              : 'bg-white/50 text-warm-taupe hover:bg-white/80 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20'
            }`}
        >
          <span className="flex items-center gap-2">
            <span>English</span>
          </span>
        </button>
        <button
          onClick={() => changeLanguage('ta')}
          className={`px-4 py-2 text-sm font-medium transition-all duration-200
            ${currentLang === 'ta'
              ? 'bg-arctic-glacier text-arctic-night dark:bg-frostbite-pink dark:text-white'
              : 'bg-white/50 text-warm-taupe hover:bg-white/80 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20'
            }`}
        >
          <span className="flex items-center gap-2">
            <span>தமிழ்</span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default LanguageToggle;
