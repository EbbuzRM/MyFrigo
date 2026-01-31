import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, AccessibilityProps } from 'react-native';
import QuantityInputRow from './QuantityInputRow';
import { Quantity as FormQuantity } from '@/context/ManualEntryContext';
import { getStyles } from './ProductFormFooter.styles';

interface QuantityHandlers {
  updateQuantity: (id: string, field: 'quantity' | 'unit', value: string) => void;
  addQuantity: () => void;
  removeQuantity: (id: string) => void;
}

interface QuantitySectionProps extends AccessibilityProps {
  quantities: FormQuantity[];
  handlers: QuantityHandlers;
  isDarkMode: boolean;
}

export const QuantitySection: React.FC<QuantitySectionProps> = React.memo(
  ({ quantities, handlers, isDarkMode, accessible = true, accessibilityLabel }) => {
    const styles = getStyles(isDarkMode);

    const handleAddQuantity = useCallback(() => {
      handlers.addQuantity();
    }, [handlers]);

    const totalQuantitiesText = React.useMemo(() => {
      if (quantities.length <= 1) return null;
      return quantities.map((q) => `${q.quantity} ${q.unit}`).join(', ');
    }, [quantities]);

    return (
      <View accessible={accessible} accessibilityLabel={accessibilityLabel || 'Quantity management section'}>
        {quantities.map((item) => (
          <QuantityInputRow
            key={item.id}
            item={item}
            updateQuantity={handlers.updateQuantity}
            removeQuantity={handlers.removeQuantity}
            isOnlyOne={quantities.length === 1}
          />
        ))}

        {quantities.length > 1 && (
          <View style={styles.quantitiesSummary}>
            <Text style={styles.quantitiesSummaryText}>
              Quantità totali: {totalQuantitiesText}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddQuantity}
          accessible={true}
          accessibilityLabel="Add quantity"
          accessibilityRole="button"
          accessibilityHint="Adds a new quantity entry"
        >
          <Text style={styles.addButtonText}>Aggiungi quantità</Text>
        </TouchableOpacity>
      </View>
    );
  }
);

QuantitySection.displayName = 'QuantitySection';
