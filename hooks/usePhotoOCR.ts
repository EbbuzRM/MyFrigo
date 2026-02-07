import { useState, useCallback, useMemo } from 'react';
import TextRecognition, { TextBlock } from '@react-native-ml-kit/text-recognition';
import { LoggingService } from '@/services/LoggingService';
import {
  DATE_CONSTANTS,
  parseDateFromString,
  parseTextualMonthDate,
  parseSequenceDate,
  parseMonthYearDate,
  isDateInFuture,
  isDateTooOld,
  toLocalISOString,
  isDateWith31InShortMonth,
  sortDatesAscending,
  DateParseResult,
} from '@/utils/dateUtils';
import {
  STANDARD_DATE_PATTERNS,
  MONTH_YEAR_PATTERN,
  MONTH_YEAR_SPACE_PATTERN,
  SEQUENCE_PATTERN,
  TEXTUAL_MONTH_PATTERN,
  FUZZY_DATE_PATTERN,
  PARTIAL_DATE_PATTERN,
  type MatchType,
} from '@/utils/datePatterns';
import {
  calculateConfidence,
  hasExpirationKeyword,
} from '@/utils/ocrConfidence';

export interface OCRResult {
  success: boolean;
  extractedDate: string | null;
  confidence: number;
  rawText: string;
  error?: string;
}

export interface OCRProgress {
  isProcessing: boolean;
  progress: number;
  currentStep: string;
}

export const usePhotoOCR = () => {
  const [ocrProgress, setOcrProgress] = useState<OCRProgress>({
    isProcessing: false,
    progress: 0,
    currentStep: ''
  });

  // Use centralized patterns from datePatterns module
  const datePatterns = useMemo(() => STANDARD_DATE_PATTERNS.map(p => new RegExp(p.source, p.flags)), []);
  const monthYearPattern = useMemo(() => new RegExp(MONTH_YEAR_PATTERN.source, MONTH_YEAR_PATTERN.flags), []);
  const monthYearSpacePattern = useMemo(() => new RegExp(MONTH_YEAR_SPACE_PATTERN.source, MONTH_YEAR_SPACE_PATTERN.flags), []);
  const sequencePattern = useMemo(() => new RegExp(SEQUENCE_PATTERN.source, SEQUENCE_PATTERN.flags), []);
  const textualMonthPattern = useMemo(() => new RegExp(TEXTUAL_MONTH_PATTERN.source, TEXTUAL_MONTH_PATTERN.flags), []);
  const fuzzyDatePattern = useMemo(() => new RegExp(FUZZY_DATE_PATTERN.source, FUZZY_DATE_PATTERN.flags), []);
  const partialDatePattern = useMemo(() => new RegExp(PARTIAL_DATE_PATTERN.source, PARTIAL_DATE_PATTERN.flags), []);

  const normalizeDate = useCallback((match: string, isSequence: boolean = false, isMonthYear: boolean = false, isTextual: boolean = false): string | null => {
    let result: DateParseResult;

    if (isTextual) {
      result = parseTextualMonthDate(match);
    } else if (isMonthYear) {
      result = parseMonthYearDate(match);
    } else if (isSequence) {
      result = parseSequenceDate(match);
    } else {
      result = parseDateFromString(match);
    }

    if (!result.success || !result.date) {
      return null;
    }

    if (isDateTooOld(result.date)) {
      LoggingService.debug('normalizeDate', `Scartata data troppo vecchia (filtro oneYearAgo): ${match} -> ${result.formattedDate}`);
      return null;
    }

    return result.formattedDate;
  }, []);

  const extractExpirationDate = useCallback(async (imageUri: string): Promise<OCRResult> => {
    const TAG = 'PhotoOCR';
    LoggingService.info(TAG, 'Starting OCR extraction');
    setOcrProgress({ isProcessing: true, progress: 0, currentStep: 'Inizializzazione...' });

    const timeoutId = setTimeout(() => {
      LoggingService.error(TAG, 'Timeout OCR - resetting progress');
      setOcrProgress({ isProcessing: false, progress: 0, currentStep: '' });
    }, DATE_CONSTANTS.TIMEOUT_MS);

    try {
      setOcrProgress(prev => ({ ...prev, progress: 25, currentStep: 'Riconoscimento testo...' }));
      LoggingService.info(TAG, 'Starting text recognition');

      const textRecognitionResult = await TextRecognition.recognize(imageUri);
      LoggingService.info(TAG, 'Text recognition completed');

      if (!textRecognitionResult || textRecognitionResult.blocks.length === 0) {
        LoggingService.error(TAG, 'No text blocks found');
        return { success: false, extractedDate: null, confidence: 0, rawText: '', error: 'Nessun testo rilevato' };
      }

      setOcrProgress(prev => ({ ...prev, progress: 50, currentStep: 'Pulizia e analisi testo...' }));

      const rawText = textRecognitionResult.blocks.map((block: TextBlock) => block.text).join(' ').replace(/\n/g, ' ');
      const rawUpperText = rawText.toUpperCase();

      LoggingService.debug(TAG, 'Testo grezzo:', rawText);

      const allMatches: { value: string, isSequence: boolean, isMonthYear: boolean, isTextual: boolean }[] = [];

      // IMPORTANT: Extract textual dates FIRST from raw text (before OCR character substitution)
      // This preserves month names like "OTT", "SET", "FEB" that would be destroyed by O→0, S→5, B→8
      const textualMatches = rawUpperText.match(textualMonthPattern);
      if (textualMatches) {
        allMatches.push(...textualMatches.map(m => ({ value: m, isSequence: false, isMonthYear: false, isTextual: true })));
        LoggingService.debug(TAG, 'Date testuali trovate (pre-cleaning):', textualMatches);
      }

      // Apply OCR character substitution only in numeric contexts
      // This fixes common OCR errors where 0→O, 5→S, 8→B without breaking month names
      const cleanedText = rawUpperText
        .replace(/(?<=\d)O(?=\d)|(?<=\d)O\b|\bO(?=\d)/g, '0')  // O→0 only adjacent to digits
        .replace(/(?<=\d)S(?=\d)|(?<=\d)S\b|\bS(?=\d)/g, '5')  // S→5 only adjacent to digits
        .replace(/(?<=\d)B(?=\d)|(?<=\d)B\b|\bB(?=\d)/g, '8'); // B→8 only adjacent to digits

      LoggingService.debug(TAG, 'Testo pulito (OCR fix):', cleanedText);

      for (const pattern of datePatterns) {
        const matches = cleanedText.match(pattern);
        if (matches) {
          allMatches.push(...matches.map(m => ({ value: m, isSequence: false, isMonthYear: false, isTextual: false })));
        }
      }

      const monthYearMatches = cleanedText.match(monthYearPattern);
      if (monthYearMatches) {
        allMatches.push(...monthYearMatches.map(m => ({ value: m, isSequence: false, isMonthYear: true, isTextual: false })));
      }

      // Match month/year with space separator (e.g., "FINE: 08 2026" or "08 26")
      const monthYearSpaceMatches = cleanedText.match(monthYearSpacePattern);
      if (monthYearSpaceMatches) {
        // Convert space-separated to slash-separated for consistent parsing
        const normalizedMatches = monthYearSpaceMatches.map(m => {
          const parts = m.replace(/FINE[:\s]*/gi, '').trim().split(/\s+/);
          if (parts.length === 2) {
            return `${parts[0]}/${parts[1]}`;
          }
          return m;
        });
        allMatches.push(...normalizedMatches.map(m => ({ value: m, isSequence: false, isMonthYear: true, isTextual: false })));
        LoggingService.debug(TAG, `Month/year con spazio trovate: ${monthYearSpaceMatches.join(', ')} -> ${normalizedMatches.join(', ')}`);
      }

      // Gestione date con punto mancante (es: "14.012027" -> "14.01.2027")
      const fuzzyMatches = cleanedText.match(fuzzyDatePattern);
      if (fuzzyMatches) {
        for (const match of fuzzyMatches) {
          const fuzzyRegex = /(\d{1,2})[./-](\d{1,2})(\d{4})/;
          const fuzzyResult = match.match(fuzzyRegex);
          if (fuzzyResult) {
            const [, day, month, year] = fuzzyResult;
            const reconstructedDate = `${day}.${month}.${year}`;
            allMatches.push({ value: reconstructedDate, isSequence: false, isMonthYear: false, isTextual: false });
            LoggingService.debug(TAG, `Data fuzzy ricostruita: ${match} -> ${reconstructedDate}`);
          }
        }
      }

      // Gestione date parziali (es: "30/08" senza anno) - generate only likely dates
      const partialMatches = cleanedText.match(partialDatePattern);
      if (partialMatches) {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        for (const match of partialMatches) {
          const partialRegex = /(\d{1,2})[/\-.](0?[1-9]|1[0-2])/;
          const partialResult = match.match(partialRegex);
          if (partialResult) {
            const [, dayStr, monthStr] = partialResult;
            const day = parseInt(dayStr, 10);
            const month = parseInt(monthStr, 10);

            // Only valid day/month combinations
            if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
              // Add date for current year and next year (expiration dates are typically in the future)
              for (const year of [currentYear, currentYear + 1]) {
                const testDate = `${day}.${month.toString().padStart(2, '0')}.${year}`;
                allMatches.push({ value: testDate, isSequence: false, isMonthYear: false, isTextual: false });
              }
              LoggingService.debug(TAG, `Data parziale: ${match} (provando ${currentYear} e ${currentYear + 1})`);
            }
          }
        }
      }

      const spacelessText = cleanedText.replace(/[\s.\-/]/g, '');
      const sequenceMatches = spacelessText.match(sequencePattern);
      if (sequenceMatches) {
        allMatches.push(...sequenceMatches.map(m => ({ value: m, isSequence: true, isMonthYear: false, isTextual: false })));
      }

      if (allMatches.length === 0) {
        return { success: false, extractedDate: null, confidence: 0, rawText, error: 'Nessuna data rilevata' };
      }

      setOcrProgress(prev => ({ ...prev, progress: 75, currentStep: 'Validazione date trovate...' }));

      const validDates: string[] = [];
      const rejectedDates: string[] = [];

      for (const match of allMatches) {
        const normalized = normalizeDate(match.value, match.isSequence, match.isMonthYear, match.isTextual);
        if (normalized) {
          validDates.push(normalized);
          LoggingService.debug(TAG, `Data valida trovata: ${match.value} -> ${normalized}`);
        } else {
          rejectedDates.push(match.value);
          LoggingService.debug(TAG, `Data scartata: ${match.value}`);
        }
      }

      LoggingService.info(TAG, `Trovate ${validDates.length} date valide, scartate ${rejectedDates.length} date non valide`);

      if (validDates.length === 0) {
        return { success: false, extractedDate: null, confidence: 0, rawText, error: 'Nessuna data valida trovata' };
      }

      const futureDates = validDates
        .map(date => new Date(date))
        .filter(isDateInFuture);

      if (futureDates.length === 0) {
        return { success: false, extractedDate: null, confidence: 0, rawText, error: 'Nessuna data futura trovata' };
      }

      const filteredDates = futureDates.filter(date => {
        if (isDateWith31InShortMonth(date)) {
          LoggingService.debug(TAG, `Filtrata data impossibile: ${toLocalISOString(date)}`);
          return false;
        }
        return true;
      });

      const sortedDates = sortDatesAscending(filteredDates.length > 0 ? filteredDates : futureDates);
      const chosenDate = sortedDates[0];
      const finalDate = toLocalISOString(chosenDate);

      setOcrProgress(prev => ({ ...prev, progress: 100, currentStep: 'Completato!' }));
      LoggingService.info(TAG, `Data di scadenza estratta: ${finalDate}`);

      // Calculate dynamic confidence based on match quality
      const winningMatch = allMatches.find(m => {
        const normalized = normalizeDate(m.value, m.isSequence, m.isMonthYear, m.isTextual);
        return normalized === finalDate;
      });

      const detectedMatchType: MatchType = winningMatch?.isTextual ? 'textual'
        : winningMatch?.isSequence ? 'sequence'
          : winningMatch?.isMonthYear ? 'monthYear'
            : 'standard';

      const dynamicConfidence = calculateConfidence({
        matchType: detectedMatchType,
        validDatesCount: validDates.length,
        rejectedDatesCount: rejectedDates.length,
        wasReconstructed: false,
        hasKeywordContext: hasExpirationKeyword(rawText),
      });

      const ocrResult = {
        success: true,
        extractedDate: finalDate,
        confidence: dynamicConfidence,
        rawText,
      };

      LoggingService.info(TAG, `OCR extraction completed (confidence: ${dynamicConfidence})`);
      return ocrResult;

    } catch (error) {
      LoggingService.error(TAG, 'Errore OCR:', error);
      setOcrProgress({ isProcessing: false, progress: 0, currentStep: '' });
      return { success: false, extractedDate: null, confidence: 0, rawText: '', error: error instanceof Error ? error.message : 'Errore sconosciuto' };
    } finally {
      clearTimeout(timeoutId);
      setTimeout(() => {
        setOcrProgress({ isProcessing: false, progress: 0, currentStep: '' });
        LoggingService.info(TAG, 'OCR progress reset');
      }, 500);
    }
  }, [datePatterns, normalizeDate]);

  const resetProgress = useCallback(() => {
    setOcrProgress({ isProcessing: false, progress: 0, currentStep: '' });
  }, []);

  return {
    extractExpirationDate,
    ocrProgress,
    resetProgress
  };
};
