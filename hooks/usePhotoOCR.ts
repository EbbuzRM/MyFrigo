// usePhotoOCR.ts — usePhotoOCR module.
//
// exports: OCRResult | OCRProgress | usePhotoOCR
// used_by: hooks\usePhotoActions.ts
// rules:   Cannot call hooks outside of React component functions or custom hooks; `usePhotoOCR` return type and internal `parseBlocksForDate` signature must remain unchanged as they are consumed by `usePhotoActions`.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { useState, useCallback, useRef } from 'react';
import TextRecognition, { TextRecognitionScript, TextBlock } from '@react-native-ml-kit/text-recognition';
import { LoggingService } from '@/services/LoggingService';
import { DATE_CONSTANTS } from '@/utils/dateUtils';
import { OCRResult, OCRProgress } from '@/utils/ocr/types';

export type { OCRResult, OCRProgress };
import { findAllMatches } from '@/utils/ocr/parsing';
import { findSpatiallyAnchoredMatches } from '@/utils/ocr/spatial';
import { selectBestDate } from '@/utils/ocr/scoring';
import { ocrSpaceRecognize, convertOcrSpaceToTextBlocks } from '@/utils/ocr/ocrSpaceService';

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

  /**
   * Runs the full parsing pipeline on TextBlocks: findAllMatches → spatial → scoring.
   * Returns null if no valid date is found.
   */
  const parseBlocksForDate = useCallback((blocks: TextBlock[], rawText: string): OCRResult | null => {
    const TAG = 'PhotoOCR';

    const { matches, anchors } = findAllMatches(blocks);

    if (matches.length === 0) {
      LoggingService.info(TAG, 'No date matches found in blocks');
      return null;
    }

    LoggingService.info(TAG, `Found ${matches.length} potential date matches`);

    const anchoredValues = findSpatiallyAnchoredMatches(matches, anchors);
    const result = selectBestDate(matches, anchoredValues, rawText);

    if (result.success && result.extractedDate) {
      return result;
    }

    return null;
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

        const textRecognitionResult = await TextRecognition.recognize(imageUri, TextRecognitionScript.LATIN);

      if (!textRecognitionResult || !textRecognitionResult.blocks || textRecognitionResult.blocks.length === 0) {
        LoggingService.warning(TAG, 'No text blocks found by ML Kit — trying ocr.space fallback for dot matrix');
      } else {
        const totalBlocks = textRecognitionResult.blocks.length;
        LoggingService.info(TAG, `ML Kit successful - Found ${totalBlocks} text blocks`);

        // Log all detected blocks for debugging
        textRecognitionResult.blocks.forEach((block, index) => {
          LoggingService.debug(TAG, `Block ${index + 1}: "${block.text}"`);
        });

        setOcrProgress(prev => ({ ...prev, progress: 50, currentStep: 'Pulizia e analisi testo...' }));

        const rawText = textRecognitionResult.blocks.map(b => b.text).join(' ');
        const mlKitResult = parseBlocksForDate(textRecognitionResult.blocks, rawText);

        if (mlKitResult) {
          // ML Kit found a valid date — use it, no fallback needed
          setOcrProgress(prev => ({ ...prev, progress: 100, currentStep: 'Completato!' }));
          clearTimers();
          return mlKitResult;
        }

        // ML Kit found text but no valid dates — fall through to ocr.space
        LoggingService.info(TAG, 'ML Kit found text but no valid dates — trying ocr.space fallback');
      }

      // === OCR.space fallback for dot-matrix text ===
      setOcrProgress(prev => ({ ...prev, progress: 55, currentStep: 'Fallback dot-matrix...' }));

      const ocrSpaceResponse = await ocrSpaceRecognize(imageUri);

      if (ocrSpaceResponse) {
        const ocrSpaceBlocks = convertOcrSpaceToTextBlocks(ocrSpaceResponse);

        if (ocrSpaceBlocks.length > 0) {
          LoggingService.info(TAG, `ocr.space found ${ocrSpaceBlocks.length} text blocks`);

          setOcrProgress(prev => ({ ...prev, progress: 75, currentStep: 'Analisi testo dot-matrix...' }));

          const rawText = ocrSpaceBlocks.map(b => b.text).join(' ');
          const fallbackResult = parseBlocksForDate(ocrSpaceBlocks, rawText);

          if (fallbackResult) {
            LoggingService.info(TAG, 'ocr.space fallback found a valid date');
            setOcrProgress(prev => ({ ...prev, progress: 100, currentStep: 'Completato!' }));
            clearTimers();
            return fallbackResult;
          }

          LoggingService.info(TAG, 'ocr.space fallback found text but no valid dates');
        }
      }

      // Both ML Kit and ocr.space failed to find a date
      LoggingService.info(TAG, 'No date found by either ML Kit or ocr.space');
      clearTimers();
      return { success: false, extractedDate: null, confidence: 0, rawText: '', error: 'Nessuna data rilevata' };

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
  }, [clearTimers, parseBlocksForDate]);

  const resetProgress = useCallback(() => {
    setOcrProgress({ isProcessing: false, progress: 0, currentStep: '' });
  }, []);

  return {
    extractExpirationDate,
    ocrProgress,
    resetProgress
  };
};

