// useDiagnosticGesture.ts — useDiagnosticGesture module.
//
// exports: UseDiagnosticGestureOptions | UseDiagnosticGestureReturn | useDiagnosticGesture
// used_by: components\settings\VersionPressHandler.tsx
// rules:   - The diagnostic gesture activation logic must maintain a strict tap-counting mechanism with a configurable required taps count and time window, resetting after activation or window expiry
//          - Haptic feedback and logging must be consistently applied at each tap interaction and upon activation
//          - The hook must be self-cleaning, clearing timers and resetting state on unmount via the useEffect cleanup
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

﻿import { useState, useRef, useCallback, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { LoggingService } from '@/services/LoggingService';

/**
 * @file hooks/useDiagnosticGesture.ts
 * @description Custom hook to manage the tap gesture for diagnostic panel activation.
 * Requires 5 taps within a time window to activate the diagnostic panel.
 */

export interface UseDiagnosticGestureOptions {
  onActivate: () => void;
  requiredTaps?: number;
  tapWindow?: number;
}

export interface UseDiagnosticGestureReturn {
  tapCount: number;
  handleTap: () => void;
  reset: () => void;
}

export function useDiagnosticGesture(
  options: UseDiagnosticGestureOptions
): UseDiagnosticGestureReturn {
  const { onActivate, requiredTaps = 5, tapWindow = 3000 } = options;

  const [tapCount, setTapCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setTapCount(0);
  }, [clearTimer]);

  const handleTap = useCallback(() => {
    setTapCount((prev) => {
      const newCount = prev + 1;

      clearTimer();

      if (newCount >= requiredTaps) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        LoggingService.info('Settings', `Pannello diagnostico attivato dopo ${requiredTaps} tap`);
        setTimeout(() => onActivate(), 0);
        setTimeout(() => setTapCount(0), 100);
        return 0;
      }

      timerRef.current = setTimeout(() => {
        LoggingService.debug('Settings', `Finestra tap scaduta, reset (aveva ${newCount} tap)`);
        setTapCount(0);
      }, tapWindow);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      return newCount;
    });
  }, [requiredTaps, tapWindow, onActivate, clearTimer]);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    tapCount,
    handleTap,
    reset,
  };
}