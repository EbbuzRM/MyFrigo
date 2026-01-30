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

  const datePatterns = useMemo(() => [
    /\b(\d{1,2}[/\-.]\d{1,2}[/\-.](\d{4}|\d{2}))\b/g,
    /(?:scad|exp|best before|use by|expires?|valido fino)[\s:]*(\d{1,2}[/\-.]\d{1,2}[/\-.](\d{4}|\d{2}))/gi,
    /\b(\d{1,2}\s+\d{1,2}\s+\d{4})\b/g,
  ], []);

  const monthYearPattern = /\b(0?[1-9]|1[0-2])[/\-.](\d{4}|\d{2})\b/g;
  const sequencePattern = /\b(\d{8}|\d{6})\b/g;
  const textualMonthPattern = /\b(\d{1,2})\s+([A-Z]{3})\s+(\d{4}|\d{2})\b/gi;

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

      const cleanedText = rawText
        .toUpperCase()
        .replace(/O/g, '0')
        .replace(/S/g, '5')
        .replace(/B/g, '8');

      LoggingService.debug(TAG, 'Testo grezzo:', rawText);
      LoggingService.debug(TAG, 'Testo pulito:', cleanedText);

      const allMatches: { value: string, isSequence: boolean, isMonthYear: boolean, isTextual: boolean }[] = [];

      const textualMatches = cleanedText.match(textualMonthPattern);
      if (textualMatches) {
        allMatches.push(...textualMatches.map(m => ({ value: m, isSequence: false, isMonthYear: false, isTextual: true })));
      }

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

      const ocrResult = {
        success: true,
        extractedDate: finalDate,
        confidence: DATE_CONSTANTS.MIN_CONFIDENCE,
        rawText,
      };

      LoggingService.info(TAG, 'OCR extraction completed successfully');
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
