// useUpdateAnimation.ts — useUpdateAnimation module.
//
// exports: useUpdateAnimation
// used_by: components\UpdateModal.tsx
// rules:   This module exports a single custom hook that manages two independent animated values (progress and fade), both using `useNativeDriver: false` — any changes must preserve this constraint as the values drive style properties not supported by the native driver.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { useRef, useCallback } from 'react';
import { Animated, Easing } from 'react-native';

interface UseUpdateAnimationReturn {
  progressAnimation: Animated.Value;
  fadeAnimation: Animated.Value;
  animateProgress: (progress: number, duration?: number) => void;
  animateFadeIn: (duration?: number) => void;
  resetAnimations: () => void;
}

export const useUpdateAnimation = (): UseUpdateAnimationReturn => {
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  const animateProgress = useCallback((progress: number, duration: number = 200) => {
    Animated.timing(progressAnimation, {
      toValue: progress,
      duration,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [progressAnimation]);

  const animateFadeIn = useCallback((duration: number = 300) => {
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [fadeAnimation]);

  const resetAnimations = useCallback(() => {
    progressAnimation.setValue(0);
    fadeAnimation.setValue(0);
  }, [progressAnimation, fadeAnimation]);

  return {
    progressAnimation,
    fadeAnimation,
    animateProgress,
    animateFadeIn,
    resetAnimations,
  };
};
