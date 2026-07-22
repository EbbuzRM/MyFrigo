// scaleFont.ts — scaleFont module.
//
// exports: scaleFont
// used_by: components\CategoryIcon.tsx
//                   components\ExpirationCard.styles.ts
//                   components\ExpirationCardDetails.tsx
//                   components\ExpirationCardHeader.tsx
//                   components\HistoryCard.styles.ts
//                   components\HistoryCardDetails.tsx
//                   components\HistoryCardHeader.tsx
//                   components\ProductCard.styles.ts
//                   components\ProductCardDetails.tsx
//                   components\ProductCardHeader.tsx
//                   components\ProductDetailInfo.tsx
//                   components\SettingsCard.tsx
//                   components\StatsCard.tsx
//                   components\SuggestionCard.tsx
//                   components\settings\ChangePasswordModal.tsx
//                   components\settings\NotificationDaysModal.tsx
//                   components\settings\SettingsSection.tsx
//                   components\settings\VersionPressHandler.tsx
// rules:   This is a pure utility function with no side effects, dependencies, or state — the only constraint is to preserve its stateless, synchronous signature.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { PixelRatio } from 'react-native';

/**
 * Scale font size based on the device's font scale (Accessibility setting).
 * This returns a rounded size to avoid subpixel issues.
 */
export function scaleFont(size: number): number {
  const fontScale = PixelRatio.getFontScale ? PixelRatio.getFontScale() : 1;
  return Math.round(size * fontScale);
}

export default scaleFont;