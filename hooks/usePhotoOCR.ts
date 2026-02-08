import { useState, useCallback } from 'react';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { LoggingService } from '@/services/LoggingService';
import { DATE_CONSTANTS } from '@/utils/dateUtils';
import { OCRResult, OCRProgress } from '@/utils/ocr/types';
import { findAllMatches } from '@/utils/ocr/parsing';
import { findSpatiallyAnchoredMatches } from '@/utils/ocr/spatial';
import { selectBestDate } from '@/utils/ocr/scoring';

export const usePhotoOCR = () => {
  const [ocrProgress, setOcrProgress] = useState<OCRProgress>({
    isProcessing: false,
    progress: 0,
    currentStep: ''
  });

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

      if (!textRecognitionResult || !textRecognitionResult.blocks || textRecognitionResult.blocks.length === 0) {
        LoggingService.error(TAG, 'No text blocks found');
        return { success: false, extractedDate: null, confidence: 0, rawText: '', error: 'Nessun testo rilevato' };
      }

      LoggingService.info(TAG, 'Text recognition completed');
      setOcrProgress(prev => ({ ...prev, progress: 50, currentStep: 'Pulizia e analisi testo...' }));

      // 1. Parsing: Find all potential dates and anchors
      const { matches, anchors } = findAllMatches(textRecognitionResult.blocks);
      const rawText = textRecognitionResult.blocks.map(b => b.text).join(' ');

      if (matches.length === 0) {
        return { success: false, extractedDate: null, confidence: 0, rawText, error: 'Nessuna data rilevata' };
      }

      setOcrProgress(prev => ({ ...prev, progress: 75, currentStep: 'Analisi spaziale...' }));

      // 2. Spatial Analysis: Link dates to anchors
      const anchoredValues = findSpatiallyAnchoredMatches(matches, anchors);

      // 3. Scoring & Selection: Pick the best date
      const result = selectBestDate(matches, anchoredValues, rawText);

      setOcrProgress(prev => ({ ...prev, progress: 100, currentStep: 'Completato!' }));
      return result;

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
  }, []);

  const resetProgress = useCallback(() => {
    setOcrProgress({ isProcessing: false, progress: 0, currentStep: '' });
  }, []);

  return {
    extractExpirationDate,
    ocrProgress,
    resetProgress
  };
};
