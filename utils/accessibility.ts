/**
 * Accessibility utilities barrel export
 * @module utils/accessibility
 * 
 * This module provides accessibility helpers for React Native components.
 * All functions follow WCAG guidelines and support screen readers.
 * 
 * @example
 * ```tsx
 * import { 
 *   getButtonAccessibilityProps, 
 *   getProductCardAccessibilityProps,
 *   getInputAccessibilityProps 
 * } from '@/utils/accessibility';
 * ```
 */

// Core types and generic function
export {
  createAccessibilityProps,
  type AccessibilityAttributes,
  type CreateAccessibilityPropsOptions,
} from './accessibility/buttons';

// Button accessibility
export {
  getButtonAccessibilityProps,
  getDeleteButtonAccessibilityProps,
  getActionButtonAccessibilityProps,
  getAnimatedPressableAccessibilityProps,
  getCategoryFilterAccessibilityProps,
} from './accessibility/buttons';

// Card accessibility
export {
  getProductCardAccessibilityProps,
  getSettingsCardAccessibilityProps,
  getStatsCardAccessibilityProps,
  getExpirationCardAccessibilityProps,
  type ExpirationStatus,
} from './accessibility/cards';

// Input accessibility
export {
  getInputAccessibilityProps,
  getListItemAccessibilityProps,
  getImageAccessibilityProps,
  getTextAccessibilityProps,
} from './accessibility/inputs';
