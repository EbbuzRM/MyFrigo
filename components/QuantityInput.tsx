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
