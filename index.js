

/**
 * Entry point: prepare global environment, enable proper font scaling for accessibility,
 * and import expo-router entry.
 *
 * Notes:
 * - We enable `allowFontScaling` globally for Text components so the UI respects
 *   the user's system font-size preference (useful for accessibility).
 * - We log accessibility info using LoggingService (best-effort).
 */

import React from 'react';
import { Text, PixelRatio, Dimensions } from 'react-native';

// Configure the global Expo object
if (typeof global !== 'undefined' && !global.Expo) {
  global.Expo = {};
}

// Enable font scaling globally for Text components
Text.defaultProps = {
  ...(Text.defaultProps || {}),
  allowFontScaling: true,
  // Optionally tune maxFontSizeMultiplier here if needed:
  // maxFontSizeMultiplier: 2.0,
};

// Best-effort accessibility logging
try {
  let LoggingService = null;
  try {
    const ls = require('./services/LoggingService');
    LoggingService = (ls && (ls.LoggingService || ls.default || ls)) || null;
  } catch (e) {
    LoggingService = null;
  }

  const fontScale = PixelRatio.getFontScale ? PixelRatio.getFontScale() : 1;
  const { width, height } = Dimensions.get('window');

  if (LoggingService && typeof LoggingService.info === 'function') {
    LoggingService.info('Accessibility', 'startupFontScale', { fontScale });
    LoggingService.info('Accessibility', 'windowDimensions', { width, height });
  } else if (typeof console !== 'undefined' && console.log) {
    console.log('Accessibility startupFontScale', { fontScale, width, height });
  }
} catch (e) {
  // Don't crash the app if logging fails
  try { console.warn('Accessibility logging failed', e); } catch {}
}

// Importa expo-router dopo che l'ambiente è stato preparato
import 'expo-router/entry';
