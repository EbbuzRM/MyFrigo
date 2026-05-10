// BrandInput.tsx — BrandInput module.
//
// exports: BrandInput
// used_by: components\ProductFormHeader.tsx
// rules:   - The module exports a single memoized React component (`BrandInput`) as default; any re-export or additional exports must maintain backward compatibility
//          - The component depends on `useTheme` from `@/context/ThemeContext` and `getInputStyles` from `./ProductFormHeader.styles` — these imports must remain valid and unchanged unless the theme system is globally refactored
//          - Props interface (`BrandInputProps`) defines the public API; adding required props will break existing consumers
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { useCallback } from 'react';
import { TextInput, Text } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { getInputStyles } from './ProductFormHeader.styles';

/**
 * Props for BrandInput component
 */
interface BrandInputProps {
  /** Current brand value */
  value: string;
  /** Callback when text changes */
  onChangeText: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Test ID for testing */
  testID?: string;
}

/**
 * BrandInput - A specialized input for product brand
 * 
 * Features:
 * - Consistent styling with form theme
 * - Optional placeholder with example
 * - Accessibility support
 * 
 * @example
 * <BrandInput
 *   value={brand}
 *   onChangeText={setBrand}
 * />
 */
const BrandInput = React.memo(({
  value,
  onChangeText,
  placeholder = 'Es. Granarolo',
  accessibilityLabel = 'Product brand input',
  testID = 'brand-input',
}: BrandInputProps) => {
  const { isDarkMode } = useTheme();
  const styles = getInputStyles(isDarkMode);

  const handleChangeText = useCallback((text: string) => {
    onChangeText(text);
  }, [onChangeText]);

  return (
    <>
      <Text style={styles.placeholder}>Marca</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDarkMode ? '#8b949e' : '#64748b'}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Optional field"
        testID={testID}
        autoCapitalize="words"
        maxLength={50}
      />
    </>
  );
});

BrandInput.displayName = 'BrandInput';

export default BrandInput;
