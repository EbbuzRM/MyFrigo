import React, { useCallback } from 'react';
import { TextInput, Text } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { getInputStyles } from './ProductFormHeader.styles';

/**
 * Props for ProductNameInput component
 */
interface ProductNameInputProps {
  /** Current name value */
  value: string;
  /** Callback when text changes */
  onChangeText: (value: string) => void;
  /** Optional array of suggestions for autocomplete */
  suggestions?: string[];
  /** Placeholder text */
  placeholder?: string;
  /** Whether the input is required */
  required?: boolean;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Test ID for testing */
  testID?: string;
}

/**
 * ProductNameInput - A specialized input for product names
 * 
 * Features:
 * - Consistent styling with form theme
 * - Placeholder with example
 * - Accessibility support
 * 
 * @example
 * <ProductNameInput
 *   value={name}
 *   onChangeText={setName}
 *   required={true}
 * />
 */
const ProductNameInput = React.memo(({
  value,
  onChangeText,
  placeholder = 'Es. Latte Parzialmente Scremato',
  required = true,
  accessibilityLabel = 'Product name input',
  testID = 'product-name-input',
}: ProductNameInputProps) => {
  const { isDarkMode } = useTheme();
  const styles = getInputStyles(isDarkMode);

  const handleChangeText = useCallback((text: string) => {
    onChangeText(text);
  }, [onChangeText]);

  return (
    <>
      <Text style={styles.placeholder}>
        Nome Prodotto{required ? '*' : ''}
      </Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDarkMode ? '#8b949e' : '#64748b'}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={required ? 'Required field' : 'Optional field'}
        testID={testID}
        autoCapitalize="words"
        maxLength={100}
      />
    </>
  );
});

ProductNameInput.displayName = 'ProductNameInput';

export default ProductNameInput;
