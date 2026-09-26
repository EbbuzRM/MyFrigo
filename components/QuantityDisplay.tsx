// QuantityDisplay.tsx — QuantityDisplay module.
//
// exports: QuantityDisplay
// used_by: components\ExpirationCardDetails.tsx
//                   components\HistoryCardDetails.tsx
//                   components\ProductCardDetails.tsx
// rules:   - All React Native components must use `React.memo` with a `displayName` for performance and debugging consistency
//          - Component props must include JSDoc comments for all optional parameters with default values documented
//          - Non-optional props must use TypeScript interfaces exported from the component file
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { useMemo } from 'react';
import { Text } from 'react-native';
import { Quantity } from '@/types/Product';
import { useAppLanguage } from '@/i18n/useAppLanguage';
import { formatDisplayNumber } from '@/i18n/format';
import { getUnitLabel } from '@/i18n/units';

interface QuantityDisplayProps {
  /** Array of quantities to display */
  quantities: Quantity[] | undefined;
  /** Style for the text component */
  style?: object;
  /** Text to show when no quantities are available */
  fallbackText?: string;
}

/**
 * Default unit when not specified
 */
const DEFAULT_UNIT = 'pz';

/**
 * QuantityDisplay Component
 * @description Reusable component for displaying product quantities.
 * Formats single or multiple quantities with their units.
 * Used by ProductCard, HistoryCard, and ExpirationCard.
 */
export const QuantityDisplay = React.memo(({
  quantities,
  style,
  fallbackText = 'N/A',
}: QuantityDisplayProps) => {
  const language = useAppLanguage();
  const displayText = useMemo(() => {
    if (!Array.isArray(quantities) || quantities.length === 0) {
      return fallbackText;
    }

    if (quantities.length === 1) {
      const { quantity, unit } = quantities[0];
      return `${formatDisplayNumber(quantity, language)} ${getUnitLabel(unit || DEFAULT_UNIT, language)}`;
    }

    return quantities
      .map((q) => `${formatDisplayNumber(q.quantity, language)} ${getUnitLabel(q.unit || DEFAULT_UNIT, language)}`)
      .join(', ');
  }, [quantities, fallbackText, language]);

  return <Text style={style}>{displayText}</Text>;
});

QuantityDisplay.displayName = 'QuantityDisplay';
