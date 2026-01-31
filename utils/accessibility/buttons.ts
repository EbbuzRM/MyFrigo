/**
 * Button accessibility utilities for React Native
 * @module utils/accessibility/buttons
 * 
 * @example
 * ```tsx
 * import { createAccessibilityProps, getButtonAccessibilityProps } from '@/utils/accessibility/buttons';
 * 
 * // Using the generic function directly
 * const props = createAccessibilityProps('button', 'Save', 'Double tap to save');
 * 
 * // Using specialized button helper
 * const buttonProps = getButtonAccessibilityProps('Submit', 'Double tap to submit form');
 * ```
 */

import { AccessibilityProps, AccessibilityRole, AccessibilityState } from 'react-native';

/**
 * Extended accessibility attributes interface
 * @interface
 */
export interface AccessibilityAttributes extends AccessibilityProps {
  accessible: boolean;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
}

/**
 * Configuration options for creating accessibility props
 * @interface
 */
export interface CreateAccessibilityPropsOptions {
  /** Whether the element is accessible to screen readers */
  accessible?: boolean;
  /** The accessibility role of the element */
  role: AccessibilityRole;
  /** The label read by screen readers */
  label: string;
  /** Optional hint providing additional context */
  hint?: string;
  /** Optional accessibility state (selected, disabled, etc.) */
  state?: AccessibilityState;
}

/**
 * Creates standardized accessibility props for any component type.
 * This is the core generic function that eliminates 90% of code duplication.
 * 
 * @param options - Configuration options for accessibility props
 * @returns Standardized AccessibilityAttributes object
 * 
 * @example
 * ```tsx
 * const props = createAccessibilityProps({
 *   role: 'button',
 *   label: 'Save Product',
 *   hint: 'Double tap to save the product'
 * });
 * ```
 */
export function createAccessibilityProps(
  options: CreateAccessibilityPropsOptions
): AccessibilityAttributes {
  const { accessible = true, role, label, hint, state } = options;
  
  const props: AccessibilityAttributes = {
    accessible,
    accessibilityRole: role,
    accessibilityLabel: label,
  };

  if (hint !== undefined) {
    props.accessibilityHint = hint;
  }

  if (state !== undefined) {
    props.accessibilityState = state;
  }

  return props;
}

/**
 * Creates accessibility props for a standard button
 * 
 * @param label - Button label text
 * @param hint - Optional action hint for screen readers
 * @returns AccessibilityAttributes for button component
 * 
 * @example
 * ```tsx
 * <TouchableOpacity {...getButtonAccessibilityProps('Delete', 'Double tap to delete item')}>
 *   <Text>Delete</Text>
 * </TouchableOpacity>
 * ```
 */
export function getButtonAccessibilityProps(
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
 * Creates accessibility props for a delete button
 * 
 * @param itemName - Name of the item being deleted
 * @returns AccessibilityAttributes for delete button
 * 
 * @example
 * ```tsx
 * <TouchableOpacity {...getDeleteButtonAccessibilityProps('Milk')}>
 *   <Icon name="trash" />
 * </TouchableOpacity>
 * // Screen reader: "Elimina Milk. Tocca per eliminare Milk"
 * ```
 */
export function getDeleteButtonAccessibilityProps(itemName: string): AccessibilityAttributes {
  return createAccessibilityProps({
    role: 'button',
    label: `Elimina ${itemName}`,
    hint: `Tocca per eliminare ${itemName}`,
  });
}

/**
 * Creates accessibility props for an action button
 * 
 * @param action - Action name (e.g., 'Edit', 'Share', 'Archive')
 * @param itemName - Name of the item being acted upon
 * @returns AccessibilityAttributes for action button
 * 
 * @example
 * ```tsx
 * <TouchableOpacity {...getActionButtonAccessibilityProps('Edit', 'Product')}>
 *   <Icon name="edit" />
 * </TouchableOpacity>
 * // Screen reader: "Edit Product. Tocca per edit Product"
 * ```
 */
export function getActionButtonAccessibilityProps(
  action: string,
  itemName: string
): AccessibilityAttributes {
  return createAccessibilityProps({
    role: 'button',
    label: `${action} ${itemName}`,
    hint: `Tocca per ${action.toLowerCase()} ${itemName}`,
  });
}

/**
 * Creates accessibility props for an animated pressable component
 * 
 * @param label - Component label
 * @param hint - Optional action hint
 * @param role - Accessibility role (defaults to 'button')
 * @returns AccessibilityAttributes for animated pressable
 * 
 * @example
 * ```tsx
 * <AnimatedPressable {...getAnimatedPressableAccessibilityProps('Card', 'Double tap to open', 'button')}>
 *   <CardContent />
 * </AnimatedPressable>
 * ```
 */
export function getAnimatedPressableAccessibilityProps(
  label: string,
  hint?: string,
  role: AccessibilityRole = 'button'
): AccessibilityAttributes {
  return createAccessibilityProps({
    role,
    label,
    hint,
  });
}

/**
 * Creates accessibility props for a category filter button
 * 
 * @param categoryName - Name of the category
 * @param count - Number of items in the category
 * @param isSelected - Whether the category is currently selected
 * @returns AccessibilityAttributes for category filter
 * 
 * @example
 * ```tsx
 * <TouchableOpacity {...getCategoryFilterAccessibilityProps('Dairy', 5, true)}>
 *   <Text>Dairy (5)</Text>
 * </TouchableOpacity>
 * // Screen reader: "Categoria Dairy, 5 prodotti. Categoria già selezionata"
 * ```
 */
export function getCategoryFilterAccessibilityProps(
  categoryName: string,
  count: number,
  isSelected: boolean
): AccessibilityAttributes {
  const label = `Categoria ${categoryName}, ${count} ${count === 1 ? 'prodotto' : 'prodotti'}`;
  const hint = isSelected
    ? `Categoria già selezionata`
    : `Tocca per filtrare i prodotti per categoria ${categoryName}`;

  return createAccessibilityProps({
    role: 'button',
    label,
    hint,
    state: { selected: isSelected },
  });
}
