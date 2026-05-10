// QuantityValidationMessage.tsx — QuantityValidationMessage module.
//
// exports: QuantityValidationMessage
// used_by: components\ConsumeQuantityModal.tsx
// rules:   - Components with accessibility properties must preserve `accessibilityLabel`, `accessibilityRole`, and `accessibilityLiveRegion` on interactive/alert elements
//          - All exported components must use `React.memo` with a `displayName` set for debugging and performance
//          - Components must return `null` when no data/error is present instead of rendering empty or hidden elements
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React from 'react';
import { Text, TextStyle } from 'react-native';

/**
 * Props for QuantityValidationMessage component
 */
interface QuantityValidationMessageProps {
  /** Error message to display */
  error: string;
  /** Style for the error text */
  errorStyle: TextStyle;
  /** Accessibility label */
  accessibilityLabel?: string;
}

/**
 * QuantityValidationMessage Component
 * @description Displays validation error message for quantity input
 * with accessibility support. Only renders when there's an error.
 */
export const QuantityValidationMessage = React.memo(({
  error,
  errorStyle,
  accessibilityLabel = 'Messaggio di errore',
}: QuantityValidationMessageProps) => {
  if (!error) {
    return null;
  }

  return (
    <Text
      style={errorStyle}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      testID="quantity-error-message"
    >
      {error}
    </Text>
  );
});

QuantityValidationMessage.displayName = 'QuantityValidationMessage';
