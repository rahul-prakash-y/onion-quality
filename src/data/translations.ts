import enTranslations from '../locales/en.json';
import hiTranslations from '../locales/hi.json';

export type TranslationKey = keyof typeof enTranslations;

export const TRANSLATIONS = {
  en: enTranslations,
  hi: hiTranslations,
};

export default TRANSLATIONS;
