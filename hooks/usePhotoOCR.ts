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

  const datePatterns = useMemo(() => [
    // Pattern standard DD/MM/YYYY o DD-MM-YYYY
    /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.](\d{4}|\d{2}))\b/g,
    // Pattern MM/DD/YYYY (US format)
    /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.](\d{4}|\d{2}))\b/g,
    // Pattern con parole chiave
    /(?:scad|exp|best before|use by|expires?|valido fino)[\s\:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.](\d{4}|\d{2}))/gi,
    // Pattern italiano "gg/mm/aaaa"
    /\b(\d{1,2}[\/]\d{1,2}[\/]\d{4})\b/g,
    // Pattern con spazi "dd mm yyyy"
    /\b(\d{1,2}\s+\d{1,2}\s+\d{4})\b/g,
  ], []);

  const normalizeDate = useCallback((match: string): string | null => {
    const cleaned = match.replace(/[\.\-\s]/g, '/');
    const parts = cleaned.split('/');

    if (parts.length !== 3) return null;

    const [first, second, third] = parts.map(p => parseInt(p, 10));

    // Determina se è DD/MM/YYYY o MM/DD/YYYY
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    let day: number, month: number, year: number;

    // Se il primo numero è > 12, probabilmente è DD/MM
    if (first > 12) {
      day = first;
      month = second;
      year = third;
    } else if (second > 12) {
      day = second;
      month = first;
      year = third;
    } else {
      // Ambiguo, usa euristica basata sulla vicinanza al mese corrente
      const diff1 = Math.abs(first - currentMonth);
      const diff2 = Math.abs(second - currentMonth);

      if (diff1 <= diff2) {
        month = first;
        day = second;
        year = third;
      } else {
        month = second;
        day = first;
        year = third;
      }
    }

    // Validazione
    if (day < 1 || day > 31 || month < 1 || month > 12) return null;

    // Normalizza anno a 4 cifre
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }

    // Verifica che la data sia futura (non più vecchia di 2 giorni)
    const parsedDate = new Date(year, month - 1, day);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    if (parsedDate < twoDaysAgo) return null;

    return parsedDate.toISOString().split('T')[0];
  }, []);

  const extractExpirationDate = useCallback(async (imageUri: string): Promise<OCRResult> => {
    const TAG = 'PhotoOCR';
    setOcrProgress({ isProcessing: true, progress: 0, currentStep: 'Inizializzazione...' });

    try {
      setOcrProgress(prev => ({ ...prev, progress: 25, currentStep: 'Riconoscimento testo...' }));

      const result = await TextRecognition.recognize(imageUri);

      if (!result || result.blocks.length === 0) {
        LoggingService.debug(TAG, 'Nessun blocco di testo trovato.');
        return {
          success: false,
          extractedDate: null,
          confidence: 0,
          rawText: '',
          error: 'Nessun testo rilevato nell\'immagine'
        };
      }

      setOcrProgress(prev => ({ ...prev, progress: 50, currentStep: 'Analisi testo...' }));

      const allText = result.blocks
        .map((block: TextBlock) => block.text)
        .join(' ')
        .replace(/\n/g, ' ')
        .toLowerCase();

      LoggingService.debug(TAG, 'Testo grezzo rilevato:', allText);

      // Trova tutte le corrispondenze con i pattern
      const allMatches: string[] = [];
      for (const pattern of datePatterns) {
        const matches = allText.match(pattern);
        if (matches) {
          allMatches.push(...matches);
        }
      }

      if (allMatches.length === 0) {
        LoggingService.debug(TAG, 'Nessuna data trovata con i pattern.');
        return {
          success: false,
          extractedDate: null,
          confidence: 0,
          rawText: allText,
          error: 'Nessuna data rilevata nel testo'
        };
      }

      setOcrProgress(prev => ({ ...prev, progress: 75, currentStep: 'Validazione date...' }));

      // Trova la data migliore
      const validDates: string[] = [];
      for (const match of allMatches) {
        const normalized = normalizeDate(match);
        if (normalized) {
          validDates.push(normalized);
        }
      }

      if (validDates.length === 0) {
        LoggingService.debug(TAG, 'Nessuna data valida trovata dopo la normalizzazione.');
        return {
          success: false,
          extractedDate: null,
          confidence: 0,
          rawText: allText,
          error: 'Nessuna data valida trovata'
        };
      }

      // Seleziona la data più vicina nel futuro
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const futureDates = validDates
        .map(date => new Date(date))
        .filter(date => date >= today)
        .sort((a, b) => a.getTime() - b.getTime());

      if (futureDates.length === 0) {
        LoggingService.debug(TAG, 'Nessuna data futura trovata.');
        return {
          success: false,
          extractedDate: null,
          confidence: 0,
          rawText: allText,
          error: 'Nessuna data futura valida trovata'
        };
      }

      const bestDate = futureDates[0];
      const finalDate = bestDate.toISOString().split('T')[0];

      setOcrProgress(prev => ({ ...prev, progress: 100, currentStep: 'Completato!' }));

      LoggingService.info(TAG, `Data di scadenza estratta: ${finalDate}`);

      return {
        success: true,
        extractedDate: finalDate,
        confidence: 0.9,
        rawText: allText
      };

    } catch (error) {
      LoggingService.error(TAG, 'Errore durante l\'OCR:', error);
      return {
        success: false,
        extractedDate: null,
        confidence: 0,
        rawText: '',
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      };
    } finally {
      setTimeout(() => {
        setOcrProgress({ isProcessing: false, progress: 0, currentStep: '' });
      }, 1000);
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