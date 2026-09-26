import { format, isValid, parseISO } from 'date-fns';
import { enGB, it } from 'date-fns/locale';
import type { SupportedLanguage } from './types';

const numberFormatters: Record<SupportedLanguage, Intl.NumberFormat> = {
  it: new Intl.NumberFormat('it-IT'),
  en: new Intl.NumberFormat('en-GB'),
};

export function formatDisplayDate(
  value: string | Date,
  language: SupportedLanguage,
  pattern = 'dd/MM/yyyy',
): string | null {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return isValid(date) ? format(date, pattern, { locale: language === 'it' ? it : enGB }) : null;
}

export function formatDisplayNumber(
  value: number,
  language: SupportedLanguage,
  options?: Intl.NumberFormatOptions,
): string {
  if (options) {
    return new Intl.NumberFormat(language === 'it' ? 'it-IT' : 'en-GB', options).format(value);
  }
  return numberFormatters[language].format(value);
}
