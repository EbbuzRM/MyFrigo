// accessibility.ts — accessibility module.
//
// exports: createAccessibilityProps | AccessibilityAttributes | CreateAccessibilityPropsOptions | getButtonAccessibilityProps | getDeleteButtonAccessibilityProps | getActionButtonAccessibilityProps | getAnimatedPressableAccessibilityProps | getCategoryFilterAccessibilityProps | getProductCardAccessibilityProps | getSettingsCardAccessibilityProps | getStatsCardAccessibilityProps | getExpirationCardAccessibilityProps | ExpirationStatus | getInputAccessibilityProps | getListItemAccessibilityProps | getImageAccessibilityProps | getTextAccessibilityProps
// used_by: .backup\AddMethodCard.tsx
//                   components\AddMethodCard.tsx
//                   components\AnimatedPressable.tsx
//                   components\CategoryFilter.tsx
//                   components\CategoryIcon.tsx
//                   components\ExpirationCard.tsx
//                   components\ProductCard.tsx
//                   components\ProductCardHeader.tsx
//                   components\SettingsCard.tsx
//                   components\StatsCard.tsx
// rules:   Module architecture must maintain the barrel export pattern: all public functions and types are re-exported from this index file, and no new imports or exports should bypass this centralized export point.
//          All accessibility functions must accept and return the standardized `AccessibilityAttributes` type to ensure consistent screen reader support across components.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

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
