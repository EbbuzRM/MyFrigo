import React, { useMemo } from 'react';
import { Text } from 'react-native';
import { Quantity } from '@/types/Product';

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
  const displayText = useMemo(() => {
    if (!Array.isArray(quantities) || quantities.length === 0) {
      return fallbackText;
    }

    if (quantities.length === 1) {
      const { quantity, unit } = quantities[0];
      return `${quantity} ${unit || DEFAULT_UNIT}`;
    }

    return quantities
      .map((q) => `${q.quantity} ${q.unit || DEFAULT_UNIT}`)
      .join(', ');
  }, [quantities, fallbackText]);

  return <Text style={style}>{displayText}</Text>;
});

QuantityDisplay.displayName = 'QuantityDisplay';
