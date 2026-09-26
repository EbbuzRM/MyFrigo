import { useTranslation } from 'react-i18next';
import type { SupportedLanguage } from './types';

export function useAppLanguage(): SupportedLanguage {
  const { i18n } = useTranslation();
  return i18n.language?.startsWith('it') ? 'it' : 'en';
}
