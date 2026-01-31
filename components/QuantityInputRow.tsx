import React, { useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Quantity as FormQuantity } from '@/context/ManualEntryContext';
import { useQuantityInput } from '@/hooks/useQuantityInput';
import { QuantityButton } from './QuantityButton';
import { QuantityUnitSelector } from './QuantityUnitSelector';
import { getStyles } from './QuantityInputRow.styles';

interface QuantityInputRowProps {
  item: FormQuantity;
  updateQuantity: (id: string, field: 'quantity' | 'unit', value: string) => void;
  removeQuantity: (id: string) => void;
  isOnlyOne: boolean;
}

/**
 * Renders a row with quantity input (+/- buttons), unit selector, and optional remove button
 */
const QuantityInputRow = React.memo(({
  item,
  updateQuantity,
  removeQuantity,
  isOnlyOne,
}: QuantityInputRowProps) => {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const handleQuantityUpdate = useCallback((value: string) => updateQuantity(item.id, 'quantity', value), [item.id, updateQuantity]);
  const handleUnitUpdate = useCallback((value: string) => updateQuantity(item.id, 'unit', value), [item.id, updateQuantity]);
  const { handleIncrement, handleDecrement, handleQuantityChange, isAtMin } = useQuantityInput({
    quantity: item.quantity,
    onUpdate: handleQuantityUpdate,
  });

  return (
    <View style={styles.container}>
      <View style={styles.mainRow}>
        <View style={[styles.column, !isOnlyOne && styles.columnWithRemove]}>
          <Text style={styles.label}>Quantità*</Text>
          <View style={styles.quantityContainer}>
            <QuantityButton operation="decrement" onPress={handleDecrement} disabled={isAtMin} />
            <TextInput
              style={styles.quantityInput}
              value={item.quantity}
              onChangeText={handleQuantityChange}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={isDarkMode ? '#8b949e' : '#64748b'}
              accessibilityLabel="Quantità"
              accessibilityHint="Inserisci la quantità del prodotto"
              testID={`quantity-input-${item.id}`}
            />
            <QuantityButton operation="increment" onPress={handleIncrement} />
          </View>
        </View>

        <QuantityUnitSelector
          selectedValue={item.unit}
          onValueChange={handleUnitUpdate}
          containerStyle={!isOnlyOne ? { marginHorizontal: 2 } : undefined}
          testID={`unit-selector-${item.id}`}
        />

        {!isOnlyOne && (
          <TouchableOpacity
            onPress={() => removeQuantity(item.id)}
            style={styles.removeButton}
            accessibilityLabel="Rimuovi quantità"
            accessibilityHint="Rimuovi questa riga di quantità"
            testID={`remove-quantity-${item.id}`}
          >
            <Text style={styles.removeButtonText}>-</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

QuantityInputRow.displayName = 'QuantityInputRow';
export default QuantityInputRow;
