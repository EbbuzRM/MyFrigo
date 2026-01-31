import { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';

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
 * @param {number} index - Index of the card for staggered animation timing
 * @returns {{ animatedStyle: Animated.AnimatedStyle, opacity: Animated.SharedValue, translateY: Animated.SharedValue }}
 */
export function useCardAnimation(index: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(
      index * STAGGER_DELAY,
      withTiming(1, { duration: ANIMATION_DURATION })
    );
    translateY.value = withDelay(
      index * STAGGER_DELAY,
      withTiming(0, { duration: ANIMATION_DURATION })
    );
  }, [index, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return { animatedStyle, opacity, translateY };
}
