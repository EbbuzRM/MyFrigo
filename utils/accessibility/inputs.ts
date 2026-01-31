/**
 * Input accessibility utilities for React Native
 * @module utils/accessibility/inputs
 * 
 * @example
 * ```tsx
 * import { getInputAccessibilityProps, getImageAccessibilityProps } from '@/utils/accessibility/inputs';
 * 
 * // Text input
 * <TextInput {...getInputAccessibilityProps('Product Name', 'Enter the product name')} />
 * 
 * // Image
 * <Image {...getImageAccessibilityProps('Product photo showing a milk carton')} source={...} />
 * ```
 */

import { createAccessibilityProps, AccessibilityAttributes } from './buttons';

/**
 * Creates accessibility props for a text input field
 * 
 * @param label - Input field label
 * @param hint - Optional hint for expected input
 * @returns AccessibilityAttributes for input field
 * 
 * @example
 * ```tsx
 * <TextInput
 *   {...getInputAccessibilityProps('Product Name', 'Enter the name of the product')}
 *   value={name}
 *   onChangeText={setName}
 * />
 * // Screen reader: "Product Name. Enter the name of the product"
 * ```
 */
export function getInputAccessibilityProps(
  label: string,
  hint?: string
): AccessibilityAttributes {
  return createAccessibilityProps({
    role: 'text',
    label,
    hint,
  });
}

/**
 * Creates accessibility props for a list item
 * 
 * @param label - Item label
 * @param hint - Optional action hint
 * @returns AccessibilityAttributes for list item
 * 
 * @example
 * ```tsx
 * <TouchableOpacity {...getListItemAccessibilityProps('Milk - 1L', 'Double tap to edit')}>
 *   <ListItemContent name="Milk" quantity="1L" />
 * </TouchableOpacity>
 * ```
 */
export function getListItemAccessibilityProps(
  label: string,
  hint?: string
): AccessibilityAttributes {
  return createAccessibilityProps({
    role: 'button',
    label,
    hint,
  });
}

/**
 * Creates accessibility props for an image
 * 
 * @param description - Descriptive text for the image content
 * @returns AccessibilityAttributes for image
 * 
 * @example
 * ```tsx
 * <Image
 *   {...getImageAccessibilityProps('Photo of milk carton showing expiration date')}
 *   source={require('./milk.jpg')}
 * />
 * // Screen reader reads the description to visually impaired users
 * ```
 */
export function getImageAccessibilityProps(description: string): AccessibilityAttributes {
  return createAccessibilityProps({
    role: 'image',
    label: description,
  });
}

/**
 * Creates accessibility props for a text element
 * 
 * @param text - Text content to be read by screen reader
 * @returns AccessibilityAttributes for text element
 * 
 * @example
 * ```tsx
 * <Text {...getTextAccessibilityProps('Product expires in 3 days')}>
 *   Expires in 3 days
 * </Text>
 * ```
 */
export function getTextAccessibilityProps(text: string): AccessibilityAttributes {
  return createAccessibilityProps({
    role: 'text',
    label: text,
  });
}
