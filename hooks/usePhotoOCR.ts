import { useState, useCallback, useMemo } from 'react';
import TextRecognition, { TextBlock } from '@react-native-ml-kit/text-recognition';
import { LoggingService } from '@/services/LoggingService';

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

  const toLocalISOString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const monthMap: { [key: string]: number } = {
    'GEN': 1, 'FEB': 2, 'MAR': 3, 'APR': 4, 'MAG': 5, 'GIU': 6,
    'LUG': 7, 'AGO': 8, 'SET': 9, 'OTT': 10, 'NOV': 11, 'DIC': 12,
    'JAN': 1, 'MAY': 5, 'JUN': 6, 'JUL': 7, 'AUG': 8, 'SEP': 9, 'OCT': 10, 'DEC': 12
  };

  const datePatterns = useMemo(() => [
    // Pattern standard DD/MM/YYYY o DD-MM-YYYY
    /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.](\d{4}|\d{2}))\b/g,
    // Pattern con parole chiave
    /(?:scad|exp|best before|use by|expires?|valido fino)[\s\:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.](\d{4}|\d{2}))/gi,
    // Pattern con spazi "dd mm yyyy"
    /\b(\d{1,2}\s+\d{1,2}\s+\d{4})\b/g,
  ], []);

  const monthYearPattern = /\b(0?[1-9]|1[0-2])[\/\-\.](\d{4}|\d{2})\b/g;
  const sequencePattern = /\b(\d{8}|\d{6})\b/g;

  // Nuovo pattern per mesi testuali (es. 12 DIC 2024 o 12 DIC 24)
  const textualMonthPattern = /\b(\d{1,2})\s+([A-Z]{3})\s+(\d{4}|\d{2})\b/gi;

  const normalizeDate = useCallback((match: string, isSequence: boolean = false, isMonthYear: boolean = false, isTextual: boolean = false): string | null => {
    let day: number, month: number, year: number;

    if (isTextual) {
      // Formato: DD MMM YYYY
      const parts = match.toUpperCase().split(/\s+/);
      if (parts.length !== 3) return null;

      day = parseInt(parts[0], 10);
      const monthStr = parts[1];
      year = parseInt(parts[2], 10);

      month = monthMap[monthStr];
      if (!month) return null; // Mese non valido

    } else if (isMonthYear) {
      const parts = match.replace(/[\/\-\.]/g, '/').split('/');
      if (parts.length !== 2) return null;

      month = parseInt(parts[0], 10);
      year = parseInt(parts[1], 10);

      if (year < 100) {
        year += year < 50 ? 2000 : 1900; // Assumi 20xx per anni < 50
      }

      // Calcola l'ultimo giorno del mese. new Date(y, m, 0) restituisce l'ultimo giorno del mese m-1.
      // Poiché il nostro mese è 1-12, passando `month` direttamente otteniamo l'ultimo giorno del mese corretto.
      const lastDayOfMonth = new Date(year, month, 0).getDate();
      day = lastDayOfMonth;

    } else if (isSequence) {
      if (match.length === 8) { // DDMMYYYY
        day = parseInt(match.substring(0, 2), 10);
        month = parseInt(match.substring(2, 4), 10);
        year = parseInt(match.substring(4, 8), 10);
      } else { // DDMMYY
        day = parseInt(match.substring(0, 2), 10);
        month = parseInt(match.substring(2, 4), 10);
        year = parseInt(match.substring(4, 6), 10);
      }
    } else {
      const cleaned = match.replace(/[\.\-\s]/g, '/');
      const parts = cleaned.split('/');

      if (parts.length !== 3) return null;

      const [first, second, third] = parts.map(p => parseInt(p, 10));
      const currentMonth = new Date().getMonth() + 1;

      // FORZA FORMATO ITALIANO: DD/MM/YYYY (giorno prima)
      day = first; month = second; year = third;
    }

    if (day < 1 || day > 31 || month < 1 || month > 12) return null;

    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }

    const currentYear = new Date().getFullYear();
    const maxAllowedYear = currentYear + 20;

    // Strict validation: Reject dates before 2020
    if (year < 2020) {
      LoggingService.debug('normalizeDate', `Scartata data troppo vecchia (< 2020): ${day}/${month}/${year}`);
      return null;
    }

    // Permetti date fino a 20 anni nel futuro
    if (year > maxAllowedYear) {
      return null;
    }

    const parsedDate = new Date(year, month - 1, day);
    if (parsedDate.getFullYear() !== year || parsedDate.getMonth() !== month - 1 || parsedDate.getDate() !== day) {
      return null;
    }

    // Rilassa il filtro delle date - solo se è più di 1 anno fa la consideriamo sospetta
    const oneYearAgo = new Date();
    oneYearAgo.setHours(0, 0, 0, 0);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    if (parsedDate < oneYearAgo) {
      // Log della data scartata per debugging
      LoggingService.debug('normalizeDate', `Scartata data troppo vecchia (filtro oneYearAgo): ${match} -> ${toLocalISOString(parsedDate)}`);
      return null;
    }

    return toLocalISOString(parsedDate);
  }, []);

  const extractExpirationDate = useCallback(async (imageUri: string): Promise<OCRResult> => {
    const TAG = 'PhotoOCR';
    LoggingService.info(TAG, 'Starting OCR extraction');
    setOcrProgress({ isProcessing: true, progress: 0, currentStep: 'Inizializzazione...' });

    // Timeout di sicurezza per evitare che l'OCR rimanga bloccato
    const timeoutId = setTimeout(() => {
      LoggingService.error(TAG, 'Timeout OCR - resetting progress');
      setOcrProgress({ isProcessing: false, progress: 0, currentStep: '' });
    }, 15000); // Ridotto a 15 secondi

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
        // .replace(/[IL]/g, '1') // Removed to avoid breaking textual months like 'LUG' or 'LIG'
        .replace(/S/g, '5')
        .replace(/B/g, '8');

      LoggingService.debug(TAG, 'Testo grezzo:', rawText);
      LoggingService.debug(TAG, 'Testo pulito:', cleanedText);

      const allMatches: { value: string, isSequence: boolean, isMonthYear: boolean, isTextual: boolean }[] = [];

      // Strategia 0: Pattern Testuale (DD MMM YYYY)
      const textualMatches = cleanedText.match(textualMonthPattern);
      if (textualMatches) {
        allMatches.push(...textualMatches.map(m => ({ value: m, isSequence: false, isMonthYear: false, isTextual: true })));
      }

      // Strategia 1: Pattern standard
      for (const pattern of datePatterns) {
        const matches = cleanedText.match(pattern);
        if (matches) {
          allMatches.push(...matches.map(m => ({ value: m, isSequence: false, isMonthYear: false, isTextual: false })));
        }
      }

      // Strategia 2: Pattern Mese/Anno
      const monthYearMatches = cleanedText.match(monthYearPattern);
      if (monthYearMatches) {
        allMatches.push(...monthYearMatches.map(m => ({ value: m, isSequence: false, isMonthYear: true, isTextual: false })));
      }

      // Strategia 3: Pattern a sequenza
      const spacelessText = cleanedText.replace(/[\s\.\-\/]/g, '');
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

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const futureDates = validDates
        .map(date => new Date(date))
        .filter(date => date >= today)
        .sort((a, b) => a.getTime() - b.getTime());

      if (futureDates.length === 0) {
        return { success: false, extractedDate: null, confidence: 0, rawText, error: 'Nessuna data futura trovata' };
      }

      // Filtro date che potrebbero essere interpretate male (solo date chiaramente errate)
      const filteredDates = futureDates.filter(date => {
        // Evita date con giorno 31 per mesi che non lo hanno (es. 31 Febbraio)
        if (date.getDate() === 31 && (date.getMonth() === 1 || date.getMonth() === 3 || date.getMonth() === 5 || date.getMonth() === 8 || date.getMonth() === 10)) {
          LoggingService.debug(TAG, `Filtrata data impossibile: ${toLocalISOString(date)}`);
          return false;
        }
        return true;
      });

      // Usa la prima data valida (la più prossima)
      const chosenDate = filteredDates.length > 0 ? filteredDates[0] : futureDates[0];
      const finalDate = toLocalISOString(chosenDate);

      setOcrProgress(prev => ({ ...prev, progress: 100, currentStep: 'Completato!' }));
      LoggingService.info(TAG, `Data di scadenza estratta: ${finalDate}`);

      const ocrResult = {
        success: true,
        extractedDate: finalDate,
        confidence: 0.9, // Confidence è ora fissa, dato che il match è più euristico
        rawText,
      };

      LoggingService.info(TAG, 'OCR extraction completed successfully');
      return ocrResult;

    } catch (error) {
      LoggingService.error(TAG, 'Errore OCR:', error);
      setOcrProgress({ isProcessing: false, progress: 0, currentStep: '' });
      return { success: false, extractedDate: null, confidence: 0, rawText: '', error: error instanceof Error ? error.message : 'Errore sconosciuto' };
    } finally {
      // Pulisci il timeout
      clearTimeout(timeoutId);
      // Reset immediato del progresso con un piccolo delay per permettere al UI di aggiornarsi
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
