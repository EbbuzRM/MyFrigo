import { parse, isValid, isAfter, isBefore, format, getYear, startOfToday, subYears } from 'date-fns';
import { LoggingService } from '@/services/LoggingService';

export const DATE_CONSTANTS = {
  MIN_YEAR: 2020,
  MAX_YEAR_OFFSET: 20,
  TIMEOUT_MS: 15000,
  MIN_CONFIDENCE: 0.9,
  PAST_DATE_FILTER_YEARS: 1,
} as const;

export interface DateParseResult {
  success: boolean;
  date: Date | null;
  formattedDate: string | null;
  error?: string;
}

const monthMap: { [key: string]: number } = {
  'GEN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAG': 4, 'GIU': 5,
  'LUG': 6, 'AGO': 7, 'SET': 8, 'OTT': 9, 'NOV': 10, 'DIC': 11,
  'JAN': 0, 'MAY': 4, 'JUN': 5, 'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'DEC': 11
};

const dateFormats = [
  'dd/MM/yyyy',
  'dd-MM-yyyy',
  'dd.MM.yyyy',
  'dd MM yyyy',
  'dd/MM/yy',
  'dd-MM-yy',
  'dd.MM.yy',
  'dd MM yy',
  'MM/yyyy',
  'MM-yyyy',
  'MM.yyyy',
  'MM/yy',
  'MM-yy',
  'MM.yy',
];

export function parseDateFromString(dateString: string): DateParseResult {
  const TAG = 'DateUtils';
  
  if (!dateString || typeof dateString !== 'string') {
    return { success: false, date: null, formattedDate: null, error: 'Invalid input' };
  }

  const trimmedInput = dateString.trim();
  
  for (const dateFormat of dateFormats) {
    const parsedDate = parse(trimmedInput, dateFormat, new Date());
    
    if (isValid(parsedDate)) {
      const year = getYear(parsedDate);
      const currentYear = getYear(new Date());
      const maxAllowedYear = currentYear + DATE_CONSTANTS.MAX_YEAR_OFFSET;
      
      if (year < DATE_CONSTANTS.MIN_YEAR) {
        LoggingService.debug(TAG, `Date rejected: year ${year} is before ${DATE_CONSTANTS.MIN_YEAR}`);
        continue;
      }
      
      if (year > maxAllowedYear) {
        LoggingService.debug(TAG, `Date rejected: year ${year} is too far in the future`);
        continue;
      }
      
      return {
        success: true,
        date: parsedDate,
        formattedDate: format(parsedDate, 'yyyy-MM-dd'),
      };
    }
  }

  return { success: false, date: null, formattedDate: null, error: 'Unable to parse date' };
}

export function parseTextualMonthDate(dateString: string): DateParseResult {
  const TAG = 'DateUtils';
  
  const parts = dateString.toUpperCase().trim().split(/\s+/);
  
  if (parts.length !== 3) {
    return { success: false, date: null, formattedDate: null, error: 'Invalid format' };
  }

  const day = parseInt(parts[0], 10);
  const monthStr = parts[1];
  let year = parseInt(parts[2], 10);

  const month = monthMap[monthStr];
  if (month === undefined) {
    return { success: false, date: null, formattedDate: null, error: 'Unknown month' };
  }

  if (isNaN(day) || day < 1 || day > 31) {
    return { success: false, date: null, formattedDate: null, error: 'Invalid day' };
  }

  if (year < 100) {
    year += year < 50 ? 2000 : 1900;
  }

  const currentYear = getYear(new Date());
  const maxAllowedYear = currentYear + DATE_CONSTANTS.MAX_YEAR_OFFSET;

  if (year < DATE_CONSTANTS.MIN_YEAR) {
    LoggingService.debug(TAG, `Textual date rejected: year ${year} is before ${DATE_CONSTANTS.MIN_YEAR}`);
    return { success: false, date: null, formattedDate: null, error: 'Year too old' };
  }

  if (year > maxAllowedYear) {
    return { success: false, date: null, formattedDate: null, error: 'Year too far in future' };
  }

  const parsedDate = new Date(year, month, day);
  
  if (!isValid(parsedDate) || parsedDate.getDate() !== day || parsedDate.getMonth() !== month) {
    return { success: false, date: null, formattedDate: null, error: 'Invalid date' };
  }

  return {
    success: true,
    date: parsedDate,
    formattedDate: format(parsedDate, 'yyyy-MM-dd'),
  };
}

export function parseSequenceDate(sequence: string): DateParseResult {
  const TAG = 'DateUtils';
  
  if (!/^\d{6}$|^\d{8}$/.test(sequence)) {
    return { success: false, date: null, formattedDate: null, error: 'Invalid sequence format' };
  }

  let day: number, month: number, year: number;

  if (sequence.length === 8) {
    day = parseInt(sequence.substring(0, 2), 10);
    month = parseInt(sequence.substring(2, 4), 10) - 1;
    year = parseInt(sequence.substring(4, 8), 10);
  } else {
    day = parseInt(sequence.substring(0, 2), 10);
    month = parseInt(sequence.substring(2, 4), 10) - 1;
    year = parseInt(sequence.substring(4, 6), 10);
    year += year < 50 ? 2000 : 1900;
  }

  const currentYear = getYear(new Date());
  const maxAllowedYear = currentYear + DATE_CONSTANTS.MAX_YEAR_OFFSET;

  if (year < DATE_CONSTANTS.MIN_YEAR) {
    LoggingService.debug(TAG, `Sequence date rejected: year ${year} is before ${DATE_CONSTANTS.MIN_YEAR}`);
    return { success: false, date: null, formattedDate: null, error: 'Year too old' };
  }

  if (year > maxAllowedYear) {
    return { success: false, date: null, formattedDate: null, error: 'Year too far in future' };
  }

  const parsedDate = new Date(year, month, day);
  
  if (!isValid(parsedDate) || parsedDate.getDate() !== day || parsedDate.getMonth() !== month) {
    return { success: false, date: null, formattedDate: null, error: 'Invalid date' };
  }

  return {
    success: true,
    date: parsedDate,
    formattedDate: format(parsedDate, 'yyyy-MM-dd'),
  };
}

export function parseMonthYearDate(dateString: string): DateParseResult {
  const TAG = 'DateUtils';
  
  const cleaned = dateString.replace(/[/.-]/g, '/');
  const parts = cleaned.split('/');
  
  if (parts.length !== 2) {
    return { success: false, date: null, formattedDate: null, error: 'Invalid format' };
  }

  const month = parseInt(parts[0], 10) - 1;
  let year = parseInt(parts[1], 10);

  if (month < 0 || month > 11) {
    return { success: false, date: null, formattedDate: null, error: 'Invalid month' };
  }

  if (year < 100) {
    year += year < 50 ? 2000 : 1900;
  }

  const currentYear = getYear(new Date());
  const maxAllowedYear = currentYear + DATE_CONSTANTS.MAX_YEAR_OFFSET;

  if (year < DATE_CONSTANTS.MIN_YEAR) {
    LoggingService.debug(TAG, `Month/year date rejected: year ${year} is before ${DATE_CONSTANTS.MIN_YEAR}`);
    return { success: false, date: null, formattedDate: null, error: 'Year too old' };
  }

  if (year > maxAllowedYear) {
    return { success: false, date: null, formattedDate: null, error: 'Year too far in future' };
  }

  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const parsedDate = new Date(year, month, lastDayOfMonth);

  if (!isValid(parsedDate)) {
    return { success: false, date: null, formattedDate: null, error: 'Invalid date' };
  }

  return {
    success: true,
    date: parsedDate,
    formattedDate: format(parsedDate, 'yyyy-MM-dd'),
  };
}

export function isDateInFuture(date: Date): boolean {
  const today = startOfToday();
  return isAfter(date, today) || date.getTime() === today.getTime();
}

export function isDateTooOld(date: Date): boolean {
  const cutoffDate = subYears(startOfToday(), DATE_CONSTANTS.PAST_DATE_FILTER_YEARS);
  return isBefore(date, cutoffDate);
}

export function toLocalISOString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function isDateWith31InShortMonth(date: Date): boolean {
  const shortMonths = [1, 3, 5, 8, 10];
  const day = date.getDate();
  const month = date.getMonth();
  return day === 31 && shortMonths.includes(month);
}

export function sortDatesAscending(dates: Date[]): Date[] {
  return [...dates].sort((a, b) => a.getTime() - b.getTime());
}
