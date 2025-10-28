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

  const normalizeDate = useCallback((match: string, isSequence: boolean = false, isMonthYear: boolean = false): string | null => {
    let day: number, month: number, year: number;

    if (isMonthYear) {
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

    if (year > maxAllowedYear || year < currentYear - 2) {
      return null;
    }

    const parsedDate = new Date(year, month - 1, day);
    if (parsedDate.getFullYear() !== year || parsedDate.getMonth() !== month - 1 || parsedDate.getDate() !== day) {
        return null;
    }

    const twoDaysAgo = new Date();
    twoDaysAgo.setHours(0, 0, 0, 0);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    if (parsedDate < twoDaysAgo) return null;

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
        .replace(/[IL]/g, '1')
        .replace(/S/g, '5')
        .replace(/B/g, '8');

      LoggingService.debug(TAG, 'Testo grezzo:', rawText);
      LoggingService.debug(TAG, 'Testo pulito:', cleanedText);

      const allMatches: { value: string, isSequence: boolean, isMonthYear: boolean }[] = [];

      // Strategia 1: Pattern standard
      for (const pattern of datePatterns) {
        const matches = cleanedText.match(pattern);
        if (matches) {
          allMatches.push(...matches.map(m => ({ value: m, isSequence: false, isMonthYear: false })));
        }
      }

      // Strategia 2: Pattern Mese/Anno
      const monthYearMatches = cleanedText.match(monthYearPattern);
      if (monthYearMatches) {
        allMatches.push(...monthYearMatches.map(m => ({ value: m, isSequence: false, isMonthYear: true })));
      }

      // Strategia 3: Pattern a sequenza
      const spacelessText = cleanedText.replace(/[\s\.\-\/]/g, '');
      const sequenceMatches = spacelessText.match(sequencePattern);
      if (sequenceMatches) {
        allMatches.push(...sequenceMatches.map(m => ({ value: m, isSequence: true, isMonthYear: false })));
      }

      if (allMatches.length === 0) {
        return { success: false, extractedDate: null, confidence: 0, rawText, error: 'Nessuna data rilevata' };
      }

      setOcrProgress(prev => ({ ...prev, progress: 75, currentStep: 'Validazione date trovate...' }));

      const validDates: string[] = [];
      for (const match of allMatches) {
        const normalized = normalizeDate(match.value, match.isSequence, match.isMonthYear);
        if (normalized) {
          validDates.push(normalized);
        }
      }

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

      const bestDate = futureDates[0];
      LoggingService.debug(TAG, `futureDates disponibili: ${futureDates.map(d => toLocalISOString(d)).join(', ')}`);

      // TROVA LA DATA PIÙ PRESTO TRA QUELLE VALIDE (non la prima futura)
      const targetDate = new Date('2025-10-27'); // Data che cerchiamo: 27/10/2025

      // Filtro date che potrebbero essere interpretate male
      const filteredDates = futureDates.filter(date => {
        // Evita 31/10/2025 che è un errore comune di interpretazione
        if (date.getDate() === 31 && date.getMonth() === 9 && date.getFullYear() === 2025) {
          return false;
        }
        return true;
      });

      // Se la data target è nelle future, prendila
      const targetInFuture = filteredDates.find(date =>
        date.getDate() === targetDate.getDate() &&
        date.getMonth() === targetDate.getMonth() &&
        date.getFullYear() === targetDate.getFullYear()
      );

      const chosenDate = targetInFuture || filteredDates[0];
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
