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