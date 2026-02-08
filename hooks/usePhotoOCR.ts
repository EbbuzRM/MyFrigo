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
import {
  calculateDistance,
  isRightOf,
  isBelow,
  isAbove,
} from '@/utils/ocrGeometry';
import { isExpirationAnchor } from '@/utils/ocrKeywords';

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

      // --- SPATIAL ANALYSIS START ---

      const allMatches: {
        value: string,
        isSequence: boolean,
        isMonthYear: boolean,
        isTextual: boolean,
        isDerived: boolean,
        frame?: TextBlock['frame']
      }[] = [];

      const anchors: TextBlock[] = [];

      // Iterate over blocks to preserve spatial context (Frame)
      for (const block of textRecognitionResult.blocks) {
        const blockText = block.text.replace(/\n/g, ' ');
        const blockUpper = blockText.toUpperCase();

        // 1. Check for Anchors
        if (isExpirationAnchor(blockUpper)) {
          anchors.push(block);
          LoggingService.debug(TAG, `Anchor found: "${blockText}" at ${JSON.stringify(block.frame)}`);
        }

        // 2. Clean Text (OCR Fixes) - applied per block
        const cleanedBlockText = blockUpper
          .replace(/(?<=\d)O(?=\d)|(?<=\d)O\b|\bO(?=\d)/g, '0')
          .replace(/(?<=\d)S(?=\d)|(?<=\d)S\b|\bS(?=\d)/g, '5')
          .replace(/(?<=\d)B(?=\d)|(?<=\d)B\b|\bB(?=\d)/g, '8');

        // 3. Extract Dates from Block

        // Textual Matches
        const textualMatches = cleanedBlockText.match(textualMonthPattern);
        if (textualMatches) {
          allMatches.push(...textualMatches.map(m => ({
            value: m, isSequence: false, isMonthYear: false, isTextual: true, isDerived: false, frame: block.frame
          })));
        }

        // Standard Patterns
        for (const pattern of datePatterns) {
          const matches = cleanedBlockText.match(pattern);
          if (matches) {
            allMatches.push(...matches.map(m => ({
              value: m, isSequence: false, isMonthYear: false, isTextual: false, isDerived: false, frame: block.frame
            })));
          }
        }

        // Month/Year Patterns
        const monthYearMatches = cleanedBlockText.match(monthYearPattern);
        if (monthYearMatches) {
          allMatches.push(...monthYearMatches.map(m => ({
            value: m, isSequence: false, isMonthYear: true, isTextual: false, isDerived: false, frame: block.frame
          })));
        }

        // Month/Year Space
        const monthYearSpaceMatches = cleanedBlockText.match(monthYearSpacePattern);
        if (monthYearSpaceMatches) {
          const normalizedMatches = monthYearSpaceMatches.map(m => {
            const parts = m.replace(/FINE[:\s]*/gi, '').trim().split(/\s+/);
            return parts.length === 2 ? `${parts[0]}/${parts[1]}` : m;
          });
          allMatches.push(...normalizedMatches.map(m => ({
            value: m, isSequence: false, isMonthYear: true, isTextual: false, isDerived: false, frame: block.frame
          })));
        }

        // Fuzzy Dates
        const fuzzyMatches = cleanedBlockText.match(fuzzyDatePattern);
        if (fuzzyMatches) {
          for (const match of fuzzyMatches) {
            const fuzzyRegex = /(\d{1,2})[./-](\d{1,2})(\d{4})/;
            const fuzzyResult = match.match(fuzzyRegex);
            if (fuzzyResult) {
              const [, day, month, year] = fuzzyResult;
              allMatches.push({
                value: `${day}.${month}.${year}`, isSequence: false, isMonthYear: false, isTextual: false, isDerived: true, frame: block.frame
              });
            }
          }
        }

        // Partial Dates
        const partialMatches = cleanedBlockText.match(partialDatePattern);
        if (partialMatches) {
          const currentYear = new Date().getFullYear();
          for (const match of partialMatches) {
            const partialRegex = /(\d{1,2})\s*[/\\\-.]\s*(1[0-2]|0?[1-9])/i;
            const partialResult = match.match(partialRegex);
            if (partialResult) {
              const [, dayStr, monthStr] = partialResult;
              const day = parseInt(dayStr, 10);
              const month = parseInt(monthStr, 10);
              if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
                for (const year of [currentYear, currentYear + 1]) {
                  const testDate = `${day}.${month.toString().padStart(2, '0')}.${year}`;
                  allMatches.push({
                    value: testDate, isSequence: false, isMonthYear: false, isTextual: false, isDerived: true, frame: block.frame
                  });
                }
              }
            }
          }
        }

        // Numeric Sequences
        const spacelessText = cleanedBlockText.replace(/[\s.\-/]/g, '');
        let seqMatch;
        const currentSeqPattern = new RegExp(sequencePattern.source, sequencePattern.flags);
        while ((seqMatch = currentSeqPattern.exec(spacelessText)) !== null) { // Apply to spaceless for sequence check
          // Note: sequence detection on spaceless text loses accurate frame association if we use block.frame
          // but it's acceptable for now as sequences are usually self-contained.
          const [full, d, m, y] = seqMatch;
          allMatches.push({
            value: `${d}.${m}.${y}`, isSequence: true, isMonthYear: false, isTextual: false, isDerived: false, frame: block.frame
          });
        }
      }

      // --- SPATIAL LINKING ---

      const spatiallyAnchoredMatches = new Set<string>(); // Set of match values that are anchored

      for (const match of allMatches) {
        if (!match.frame) continue;

        for (const anchor of anchors) {
          if (!anchor.frame) continue;

          // Check spatial relationship: Right, Below, or Above
          // We use a relatively generous tolerance for "nearby"
          // Distance < 150 (approx pixels, adjustable)
          const dist = calculateDistance(match.frame, anchor.frame);

          if (dist < 200) { // Within reasonable proximity
            const right = isRightOf(anchor.frame, match.frame);
            const below = isBelow(anchor.frame, match.frame);
            const above = isAbove(anchor.frame, match.frame); // As requested by user

            if (right || below || above) {
              LoggingService.debug(TAG, `SPATIAL MATCH: Date ${match.value} linked to Anchor "${anchor.text}" (Dist: ${dist.toFixed(0)}, R:${right} B:${below} A:${above})`);
              spatiallyAnchoredMatches.add(match.value);
            }
          }
        }
      }

      const rawText = textRecognitionResult.blocks.map(b => b.text).join(' '); // Reconstruct for legacy return

      if (allMatches.length === 0) {
        return { success: false, extractedDate: null, confidence: 0, rawText, error: 'Nessuna data rilevata' };
      }

      setOcrProgress(prev => ({ ...prev, progress: 75, currentStep: 'Validazione date trovate...' }));

      const validDates: string[] = [];
      const rejectedDates: string[] = [];
      const matchingContexts = new Map<string, boolean>(); // Store if a valid date was spatially anchored

      for (const match of allMatches) {
        const normalized = normalizeDate(match.value, match.isSequence, match.isMonthYear, match.isTextual);
        if (normalized) {
          validDates.push(normalized);
          // If this match was spatially anchored, record it for the normalized date
          if (spatiallyAnchoredMatches.has(match.value)) {
            matchingContexts.set(normalized, true);
          }
          LoggingService.debug(TAG, `Data valida trovata: ${match.value} -> ${normalized}`);
        } else {
          rejectedDates.push(match.value);
        }
      }

      LoggingService.info(TAG, `Trovate ${validDates.length} date valide`);

      if (validDates.length === 0) {
        return { success: false, extractedDate: null, confidence: 0, rawText, error: 'Nessuna data valida trovata' };
      }

      const futureDates = validDates
        .map(date => new Date(date))
        .filter(isDateInFuture);

      if (futureDates.length === 0) {
        return { success: false, extractedDate: null, confidence: 0, rawText, error: 'Nessuna data futura trovata' };
      }

      const filteredDates = futureDates.filter(date => !isDateWith31InShortMonth(date));

      // Prioritize dates with Spatial Intelligence

      const prioritizedDates = filteredDates.length > 0 ? filteredDates : futureDates;

      const scoredDates = prioritizedDates.map(date => {
        const dateStr = toLocalISOString(date);
        let score = 0;

        const match = allMatches.find(m => {
          const norm = normalizeDate(m.value, m.isSequence, m.isMonthYear, m.isTextual);
          return norm === dateStr;
        });

        // 1. SPATIAL BOOST (The Game Changer)
        // If this date is geometrically linked to "SCAD", "EXP", etc.
        if (matchingContexts.get(dateStr)) {
          score += 200; // Massive boost, practically guarantees selection
          LoggingService.debug(TAG, `Spatial Boost (+200) for ${dateStr}`);
        }

        // 2. 4-Digit Year Boost
        if (match && /\d{4}/.test(match.value) && !match.isDerived) {
          score += 100;
        }

        // 3. Authentic vs Derived
        if (match) {
          if (match.isDerived) {
            score -= 100;
          } else if (!match.isSequence) {
            score += 50;
          }
        }

        // 4. Textual Month
        if (match?.isTextual) {
          score += 30;
        }

        return { date, score };
      });

      // Sort by score (descending) then by date (ascending)
      const finalSorted = scoredDates.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.date.getTime() - b.date.getTime();
      });

      const chosenDate = finalSorted[0].date;
      const finalDate = toLocalISOString(chosenDate);
      const finalScore = finalSorted[0].score;

      setOcrProgress(prev => ({ ...prev, progress: 100, currentStep: 'Completato!' }));
      LoggingService.info(TAG, `Data scelta (punteggio ${finalScore}): ${finalDate}`);

      // Calculate dynamic confidence
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
        hasKeywordContext: matchingContexts.get(finalDate) || hasExpirationKeyword(rawText), // Use spatial anchor or text fallback
      });

      const ocrResult = {
        success: true,
        extractedDate: finalDate,
        confidence: Math.min(1, dynamicConfidence + (matchingContexts.get(finalDate) ? 0.1 : 0)), // Bonus confidence for spatial link
        rawText,
      };

      LoggingService.info(TAG, `OCR extraction completed (confidence: ${ocrResult.confidence})`);
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
