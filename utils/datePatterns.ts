/**
 * Date patterns for OCR extraction.
 * @module utils/datePatterns
 */

/**
 * Standard date patterns (dd/mm/yyyy, dd-mm-yyyy, etc.)
 * Allows optional spaces around separators.
 */
export const STANDARD_DATE_PATTERNS = [
    /\b(\d{1,2}\s*[/\\\-.]\s*\d{1,2}\s*[/\\\-.]\s*(\d{4}|\d{2}))\b/g,
    /(?:scad|exp|best before|use by|expires?|valido fino)[\s:]*(\d{1,2}\s*[/\\\-.]\s*\d{1,2}\s*[/\\\-.]\s*(\d{4}|\d{2}))/gi,
    /\b(\d{1,2})\s+(\d{1,2})\s+(\d{4}|\d{2})\b/g,
    /\b(\d{1,2})\s*[/\\\-.]\s*(\d{1,2})\s*[/\\\-.]\s*(\d{4}|\d{2})\b/g,
] as const;

/**
 * Month/Year pattern (MM/yyyy or MM/yy with separators)
 */
export const MONTH_YEAR_PATTERN = /\b(0?[1-9]|1[0-2])\s*[/\\\-.]\s*(\d{4}|\d{2})\b/g;

/**
 * Month/Year with space separator (e.g., "08 2026", "08 26")
 * Also matches contextual patterns like "FINE: 08 2026" or "ENTRO FINE: 08 26"
 */
export const MONTH_YEAR_SPACE_PATTERN = /(?:FINE[:\s]*)?(?:\b)(0?[1-9]|1[0-2])\s+(\d{4}|\d{2})\b/gi;

/**
 * Numeric sequence pattern (6 or 8 digits like 150125 or 15012025)
 * Also supports spaces (e.g., "2911 2038")
 */
export const SEQUENCE_PATTERN = /\b(\d{2})\s*(\d{2})\s*(\d{4}|\d{2})\b/g;

/**
 * Textual month pattern (DD MMM YYYY like "15 GEN 2025" or "15 OTT 26")
 */
export const TEXTUAL_MONTH_PATTERN = /\b(\d{1,2})\s+([A-Z]{3,9})\s+(\d{4}|\d{2})\b/gi;

/**
 * Fuzzy date pattern (missing separator, e.g., "14.012027" -> "14.01.2027")
 */
export const FUZZY_DATE_PATTERN = /\b(\d{1,2})[./-](\d{1,2})(\d{4})\b/g;

/**
 * Partial date pattern (e.g., "30/08" without year)
 */
export const PARTIAL_DATE_PATTERN = /\b(\d{1,2})\s*[/\\\-.]\s*(1[0-2]|0?[1-9])\b/g;

/**
 * Type for match type categories
 */
export type MatchType = 'standard' | 'textual' | 'sequence' | 'monthYear' | 'fuzzy' | 'partial';

/**
 * Type definition for match metadata
 */
export interface DateMatch {
    value: string;
    type: MatchType;
    confidence: number;
}

/**
 * Confidence weights by match type.
 * Higher values indicate more reliable matches.
 */
export const MATCH_CONFIDENCE_WEIGHTS: Record<MatchType, number> = {
    standard: 0.95,      // Full date with separators (most reliable)
    textual: 0.90,       // Date with month name
    monthYear: 0.80,     // Only month/year (assumes last day of month)
    sequence: 0.75,      // Numeric sequence (ambiguous)
    fuzzy: 0.70,         // Reconstructed date
    partial: 0.60,       // Partial date with guessed year
};
