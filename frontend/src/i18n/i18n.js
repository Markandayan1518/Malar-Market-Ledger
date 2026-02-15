import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslations from './en.json';
import taTranslations from './ta.json';

const resources = {
  en: { translation: enTranslations },
  ta: { translation: taTranslations },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    debug: import.meta.env.DEV,

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
