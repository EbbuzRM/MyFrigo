// QuantityInput.tsx — QuantityInput module.
//
// exports: QuantityInput
// used_by: components\ConsumeQuantityModal.tsx
// rules:   - The component is memoized with `React.memo` and uses `useCallback`/`useMemo` hooks; all props passed to this component must remain referentially stable to prevent unnecessary re-renders.
//          - Input validation must strictly allow only numeric characters (`0-9`) via the existing regex pattern; no other character filtering or format modifications should be introduced.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { useCallback, useMemo } from 'react';
import { TextInput, View, TextStyle, ViewStyle } from 'react-native';

interface QuantityInputProps {
  value: string;
  onChangeText: (text: string) => void;
  totalQuantity: number;
  hasError: boolean;
  maxLength: number;
  isDarkMode: boolean;
  inputStyle: TextStyle;
  containerStyle: ViewStyle;
  placeholderTextColor: string;
}

export const QuantityInput = React.memo(({
  value, onChangeText, totalQuantity, hasError, maxLength, isDarkMode,
  inputStyle, containerStyle, placeholderTextColor,
}: QuantityInputProps) => {
  const placeholder = useMemo(() => totalQuantity > 1 ? `Es. 1-${totalQuantity}` : String(totalQuantity), [totalQuantity]);
  const handleChangeText = useCallback((text: string) => onChangeText(text.replace(/[^0-9]/g, '')), [onChangeText]);
  const borderColor = hasError ? '#ef4444' : (isDarkMode ? '#30363d' : '#e2e8f0');

  return (
    <View style={containerStyle}>
      <TextInput
        style={[inputStyle, { borderColor }]}
        value={value}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        keyboardType="numeric"
        maxLength={maxLength}
        accessible
        accessibilityLabel="Quantità da consumare"
        accessibilityRole="text"
        autoFocus
        testID="quantity-input"
      />
    </View>
  );
});

QuantityInput.displayName = 'QuantityInput';
