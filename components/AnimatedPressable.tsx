import React from 'react';
import { Pressable, PressableProps, Animated, GestureResponderEvent } from 'react-native';
import { LoggingService } from '@/services/LoggingService';
import { AccessibilityAttributes } from '@/utils/accessibility';

interface AnimatedPressableProps extends PressableProps {
  children: React.ReactNode;
  accessibilityProps?: Partial<AccessibilityAttributes>;
}

export function AnimatedPressable({
  children,
  style,
  accessibilityProps,
  accessible = true,
  accessibilityRole = 'button',
  accessibilityLabel,
  accessibilityHint,
  ...props
}: AnimatedPressableProps) {
  const animatedValue = new Animated.Value(1);

  const handlePressIn = (_event: GestureResponderEvent) => {
    Animated.timing(animatedValue, {
      toValue: 0.96,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (_event: GestureResponderEvent) => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const animatedStyle = {
    transform: [{ scale: animatedValue }],
  };

  // Combina le proprietà di accessibilità passate direttamente con quelle in accessibilityProps
  const combinedAccessibilityProps = {
    accessible: accessibilityProps?.accessible ?? accessible,
    accessibilityRole: accessibilityProps?.accessibilityRole ?? accessibilityRole,
    accessibilityLabel: accessibilityProps?.accessibilityLabel ?? accessibilityLabel,
    accessibilityHint: accessibilityProps?.accessibilityHint ?? accessibilityHint,
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...combinedAccessibilityProps}
      {...props}
    >
      {({ pressed }) => (
        <Animated.View 
          style={[
            typeof style === 'function' ? style({ pressed }) : style,
            animatedStyle
          ]}
        >
          {children}
        </Animated.View>
      )}
    </Pressable>
  );
}
