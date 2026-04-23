import { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Animation duration for card entry animation in milliseconds
 */
const ANIMATION_DURATION = 400;

/**
 * Stagger delay between cards in milliseconds
 */
const STAGGER_DELAY = 100;

/**
 * @hook useCardAnimation
 * @description Hook to handle card press and entry animations.
 * Provides animated values for opacity and translateY with staggered entry.
 * Respects the user's Reduce Motion preference by skipping animations.
 * @param {number} index - Index of the card for staggered animation timing
 * @returns {{ animatedStyle: Animated.AnimatedStyle, opacity: Animated.SharedValue, translateY: Animated.SharedValue }}
 */
export function useCardAnimation(index: number) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const translateY = useSharedValue(reducedMotion ? 0 : 20);

  useEffect(() => {
    if (reducedMotion) return;
    opacity.value = withDelay(
      index * STAGGER_DELAY,
      withTiming(1, { duration: ANIMATION_DURATION })
    );
    translateY.value = withDelay(
      index * STAGGER_DELAY,
      withTiming(0, { duration: ANIMATION_DURATION })
    );
  }, [index, opacity, translateY, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    if (reducedMotion) {
      return {};
    }
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return { animatedStyle, opacity, translateY };
}
