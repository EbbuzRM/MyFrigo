import { useState, useRef, useCallback, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { LoggingService } from '@/services/LoggingService';
import {
  DIAGNOSTIC_LONG_PRESS_DURATION,
  DIAGNOSTIC_PROGRESS_INTERVAL,
} from '@/constants/settings';

/**
 * @file hooks/useDiagnosticGesture.ts
 * @description Custom hook to manage the long press gesture for diagnostic panel activation.
 * Encapsulates the complex timer and progress logic that was previously inline in the component.
 *
 * @example
 * ```tsx
 * const { progress, isActive, handlers } = useDiagnosticGesture({
 *   onActivate: () => setShowDiagnostic(true),
 *   duration: 5000,
 * });
 *
 * <TouchableOpacity {...handlers}>
 *   <Text>Version {version}</Text>
 *   {isActive && <ProgressBar progress={progress} />}
 * </TouchableOpacity>
 * ```
 */

/**
 * Configuration options for the diagnostic gesture hook
 */
export interface UseDiagnosticGestureOptions {
  /** Callback fired when long press is successfully completed */
  onActivate: () => void;
  /** Duration in milliseconds to trigger activation (default: 5000ms) */
  duration?: number;
  /** Interval in milliseconds for progress updates (default: 100ms) */
  progressInterval?: number;
  /** Optional callback for when press is cancelled */
  onCancel?: () => void;
  /** Optional callback for when press starts */
  onStart?: () => void;
}

/**
 * Return type for the diagnostic gesture hook
 */
export interface UseDiagnosticGestureReturn {
  /** Current progress percentage (0-100) */
  progress: number;
  /** Whether the long press gesture is currently active */
  isActive: boolean;
  /** Event handlers to spread on the touchable component */
  handlers: {
    onPressIn: () => void;
    onPressOut: () => void;
  };
  /** Manual reset function (rarely needed, but useful for edge cases) */
  reset: () => void;
}

/**
 * Hook to manage long press gesture with progress indication for diagnostic panel
 *
 * This hook encapsulates the complex timer logic required to detect a 5-second long press
 * on the version text, showing visual progress feedback and triggering the diagnostic
 * panel when completed.
 *
 * @param options - Configuration options
 * @returns Progress state and event handlers
 */
export function useDiagnosticGesture(
  options: UseDiagnosticGestureOptions
): UseDiagnosticGestureReturn {
  const { onActivate, duration = DIAGNOSTIC_LONG_PRESS_DURATION, progressInterval = DIAGNOSTIC_PROGRESS_INTERVAL, onCancel, onStart } = options;

  const [progress, setProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Use a ref to store the timer and interval IDs to properly clean them up
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Cleanup function to clear all timers
   */
  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Reset the gesture state and clear timers
   */
  const reset = useCallback(() => {
    clearTimers();
    setProgress(0);
    setIsActive(false);
  }, [clearTimers]);

  /**
   * Handle press start - initialize timers and progress
   */
  const handlePressIn = useCallback(() => {
    LoggingService.info('Settings', 'Inizio pressione su versione app');

    setIsActive(true);
    setProgress(0);
    onStart?.();

    // Calculate progress increment per interval
    const progressIncrement = 100 / (duration / progressInterval);

    // Create progress interval
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + progressIncrement;
        if (newProgress >= 100) {
          // Progress complete, interval will be cleared by the timer callback
          return 100;
        }
        return newProgress;
      });
    }, progressInterval);

    // Create main timer for activation
    timerRef.current = setTimeout(() => {
      // Success! Long press completed
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      LoggingService.info('Settings', 'Pannello diagnostico attivato dopo 5 secondi di pressione');

      // Clear timers before activating
      clearTimers();

      // Reset state
      setProgress(0);
      setIsActive(false);

      // Trigger activation
      onActivate();
    }, duration);
  }, [duration, progressInterval, onActivate, onStart, clearTimers]);

  /**
   * Handle press end - cancel if not completed
   */
  const handlePressOut = useCallback(() => {
    if (timerRef.current) {
      LoggingService.info('Settings', 'Pressione rilasciata prima del timeout');

      // Cancel everything
      clearTimers();
      setProgress(0);
      setIsActive(false);
      onCancel?.();
    }
  }, [clearTimers, onCancel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    progress,
    isActive,
    handlers: {
      onPressIn: handlePressIn,
      onPressOut: handlePressOut,
    },
    reset,
  };
}
