import React, { useCallback } from 'react';
import { Text, StyleSheet } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { useTheme } from '@/context/ThemeContext';

type ButtonOperation = 'increment' | 'decrement';

interface QuantityButtonProps {
  operation: ButtonOperation;
  onPress: () => void;
  disabled?: boolean;
}

export const QuantityButton = React.memo(({
  operation,
  onPress,
  disabled = false,
}: QuantityButtonProps) => {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  const handlePress = useCallback(() => {
    if (!disabled) onPress();
  }, [disabled, onPress]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[styles.button, disabled && styles.disabled]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={operation === 'increment' ? 'Aumenta quantità' : 'Diminuisci quantità'}
      accessibilityState={{ disabled }}
      disabled={disabled}
    >
      <Text style={[styles.text, disabled && styles.disabledText]}>
        {operation === 'increment' ? '+' : '-'}
      </Text>
    </AnimatedPressable>
  );
});

QuantityButton.displayName = 'QuantityButton';

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    button: {
      padding: 12,
      backgroundColor: isDarkMode ? '#30363d' : '#e2e8f0',
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 44,
      minHeight: 44,
    },
    disabled: {
      opacity: 0.5,
      backgroundColor: isDarkMode ? '#21262d' : '#f1f5f9',
    },
    text: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDarkMode ? '#c9d1d9' : '#1e293b',
    },
    disabledText: {
      color: isDarkMode ? '#8b949e' : '#94a3b8',
    },
  });
