/**
 * Date formatting and utility functions.
 * @module dateUtils/formatters
 */

import { format, startOfToday, isAfter, isBefore, subYears } from 'date-fns';
import { DATE_CONSTANTS } from './constants';

/**
 * Check if a date is today or in the future.
 *
 * @param date - Date to check
 * @returns True if date is today or future
 */
export function isDateInFuture(date: Date): boolean {
  const today = startOfToday();
  return isAfter(date, today) || date.getTime() === today.getTime();
}

/**
 * Check if a date is older than the configured past date filter.
 *
 * @param date - Date to check
 * @returns True if date is too old
 */
export function isDateTooOld(date: Date): boolean {
  const cutoffDate = subYears(startOfToday(), DATE_CONSTANTS.PAST_DATE_FILTER_YEARS);
  return isBefore(date, cutoffDate);
}

/**
 * Convert date to local ISO string format (yyyy-MM-dd).
 *
 * @param date - Date to format
 * @returns Formatted date string
 */
export function toLocalISOString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Check if a date falls on the 31st of a short month
 * (months with only 30 days).
 *
 * @param date - Date to check
 * @returns True if day is 31 in a 30-day month
 */
export function isDateWith31InShortMonth(date: Date): boolean {
  const shortMonths = [3, 5, 8, 10]; // April, June, September, November (0-indexed)
  const day = date.getDate();
  const month = date.getMonth();
  return day === 31 && shortMonths.includes(month);
}

/**
 * Sort dates in ascending chronological order.
 *
 * @param dates - Array of dates to sort
 * @returns New array with dates sorted oldest to newest
 */
export function sortDatesAscending(dates: Date[]): Date[] {
  return [...dates].sort((a, b) => a.getTime() - b.getTime());
}
