import { Language, Translations } from './types';
import { hiTranslations } from './hi';
import { enTranslations } from './en';

export * from './types';
export { hiTranslations } from './hi';
export { enTranslations } from './en';

export const translations: Record<Language, Translations> = {
  hi: hiTranslations,
  en: enTranslations,
};

export const getTranslation = (lang: Language): Translations => {
  return translations[lang] || hiTranslations;
};
