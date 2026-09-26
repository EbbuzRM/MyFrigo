import { format } from 'date-fns';
import { enGB, it } from 'date-fns/locale';
import { LocaleConfig } from 'react-native-calendars';
import type { SupportedLanguage } from './types';

for (const [language, locale] of [['it', it], ['en', enGB]] as const) {
  LocaleConfig.locales[language] = {
    monthNames: Array.from({ length: 12 }, (_, month) => format(new Date(2020, month, 1), 'LLLL', { locale })),
    monthNamesShort: Array.from({ length: 12 }, (_, month) => format(new Date(2020, month, 1), 'LLL', { locale })),
    dayNames: Array.from({ length: 7 }, (_, day) => format(new Date(2020, 0, 5 + day), 'EEEE', { locale })),
    dayNamesShort: Array.from({ length: 7 }, (_, day) => format(new Date(2020, 0, 5 + day), 'EEEEEE', { locale })),
    today: language === 'it' ? 'Oggi' : 'Today',
  };
}

export function setCalendarLocale(language: SupportedLanguage): void {
  LocaleConfig.defaultLocale = language;
}
