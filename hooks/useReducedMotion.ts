// useReducedMotion.ts — useReducedMotion module.
//
// exports: useReducedMotion
// used_by: components\AnimatedPressable.tsx
//         components\AnimatedTabItem.tsx
//         components\GlobalUpdateModal.tsx
//         components\HistoryCard.tsx
//         components\Toast.tsx
//         hooks\useCardAnimation.ts
//         hooks\useReducedMotion.test.ts
// rules:   Do not remove or modify the `useReducedMotion` hook without also updating every importing component listed in the `used_by` comment to handle the accessibility setting appropriately.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { useState, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Hook that detects whether the user has enabled the "Reduce Motion"
 * accessibility setting on their device.
 *
 * When `reduceMotion` is `true`, animations should be skipped or simplified
 * to respect the user's preference (WCAG 2.3.3 / iOS Accessibility / Android Accessibility).
 *
 * @returns `true` if the user prefers reduced motion, `false` otherwise
 *
 * @example
 * ```tsx
 * const reducedMotion = useReducedMotion();
 * // If reducedMotion is true, skip or simplify animations
 * if (!reducedMotion) {
 *   Animated.timing(value, { toValue: 1, duration: 300 }).start();
 * } else {
 *   value.setValue(1); // instant
 * }
 * ```
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion
    );
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    return () => subscription.remove();
  }, []);

  return reducedMotion;
}
