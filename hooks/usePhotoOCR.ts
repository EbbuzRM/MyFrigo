import { useState, useCallback, useRef } from 'react';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { LoggingService } from '@/services/LoggingService';
import { DATE_CONSTANTS } from '@/utils/dateUtils';
import { OCRResult, OCRProgress } from '@/utils/ocr/types';

export type { OCRResult, OCRProgress };
import { findAllMatches } from '@/utils/ocr/parsing';
import { findSpatiallyAnchoredMatches } from '@/utils/ocr/spatial';
import { selectBestDate } from '@/utils/ocr/scoring';

export const usePhotoOCR = () => {
  const [ocrProgress, setOcrProgress] = useState<OCRProgress>({
    isProcessing: false,
    progress: 0,
    currentStep: ''
  });

  // Refs per timer cleanup
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetProgressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup function da chiamare nei finally
  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (resetProgressTimeoutRef.current) {
      clearTimeout(resetProgressTimeoutRef.current);
      resetProgressTimeoutRef.current = null;
    }
  }, []);

  const extractExpirationDate = useCallback(async (imageUri: string): Promise<OCRResult> => {
    const TAG = 'PhotoOCR';
    LoggingService.info(TAG, 'Starting OCR extraction');
    setOcrProgress({ isProcessing: true, progress: 0, currentStep: 'Inizializzazione...' });

    timeoutRef.current = setTimeout(() => {
      LoggingService.error(TAG, 'Timeout OCR - resetting progress');
      setOcrProgress({ isProcessing: false, progress: 0, currentStep: '' });
    }, DATE_CONSTANTS.TIMEOUT_MS);

    try {
      setOcrProgress(prev => ({ ...prev, progress: 25, currentStep: 'Riconoscimento testo...' }));

      const textRecognitionResult = await TextRecognition.recognize(imageUri);

      if (!textRecognitionResult || !textRecognitionResult.blocks || textRecognitionResult.blocks.length === 0) {
        LoggingService.warning(TAG, 'No text blocks found - OCR returned empty result');
        clearTimers();
        return { success: false, extractedDate: null, confidence: 0, rawText: '', error: 'Nessun testo rilevato' };
      }

      const totalBlocks = textRecognitionResult.blocks.length;
      LoggingService.info(TAG, `OCR successful - Found ${totalBlocks} text blocks`);

      // Log all detected blocks for debugging
      textRecognitionResult.blocks.forEach((block, index) => {
        LoggingService.debug(TAG, `Block ${index + 1}: "${block.text}"`);
      });

      setOcrProgress(prev => ({ ...prev, progress: 50, currentStep: 'Pulizia e analisi testo...' }));

      // 1. Parsing: Find all potential dates and anchors
      const { matches, anchors } = findAllMatches(textRecognitionResult.blocks);
      const rawText = textRecognitionResult.blocks.map(b => b.text).join(' ');

      if (matches.length === 0) {
        LoggingService.info(TAG, `No date matches found in ${totalBlocks} blocks`);
        clearTimers();
        return { success: false, extractedDate: null, confidence: 0, rawText, error: 'Nessuna data rilevata' };
      }

      LoggingService.info(TAG, `Found ${matches.length} potential date matches`);

      setOcrProgress(prev => ({ ...prev, progress: 75, currentStep: 'Analisi spaziale...' }));

      // 2. Spatial Analysis: Link dates to anchors
      const anchoredValues = findSpatiallyAnchoredMatches(matches, anchors);

      // 3. Scoring & Selection: Pick the best date
      const result = selectBestDate(matches, anchoredValues, rawText);

      setOcrProgress(prev => ({ ...prev, progress: 100, currentStep: 'Completato!' }));
      clearTimers();
      return result;

    } catch (error) {
      LoggingService.error(TAG, 'Errore OCR:', error);
      setOcrProgress({ isProcessing: false, progress: 0, currentStep: '' });
      clearTimers();
      return { success: false, extractedDate: null, confidence: 0, rawText: '', error: error instanceof Error ? error.message : 'Errore sconosciuto' };
    } finally {
      clearTimers();
      resetProgressTimeoutRef.current = setTimeout(() => {
        setOcrProgress({ isProcessing: false, progress: 0, currentStep: '' });
      }, 500);
    }
  }, [clearTimers]);

  const resetProgress = useCallback(() => {
    setOcrProgress({ isProcessing: false, progress: 0, currentStep: '' });
  }, []);

  return {
    extractExpirationDate,
    ocrProgress,
    resetProgress
  };
};
