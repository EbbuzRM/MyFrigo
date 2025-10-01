
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '@/context/ThemeContext';
import { AnimatedPressable } from './AnimatedPressable';
import { Quantity as FormQuantity } from '@/context/ManualEntryContext';

interface QuantityInputRowProps {
  item: FormQuantity;
  updateQuantity: (id: string, field: 'quantity' | 'unit', value: string) => void;
  removeQuantity: (id: string) => void;
  isOnlyOne: boolean;
}

const COMMON_UNITS = [
  { id: 'pz', name: 'pz (pezzi)' },
  { id: 'kg', name: 'kg (chilogrammi)' },
  { id: 'g', name: 'g (grammi)' },
  { id: 'L', name: 'L (litri)' },
  { id: 'ml', name: 'ml (millilitri)' },
  { id: 'conf', name: 'conf. (confezione)' },
  { id: 'barattolo', name: 'barattolo' },
  { id: 'bottiglia', name: 'bottiglia' },
  { id: 'vasetto', name: 'vasetto' },
];

const QuantityInputRow = React.memo(({
  item,
  updateQuantity,
  removeQuantity,
  isOnlyOne,
}: QuantityInputRowProps) => {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.row}>
      <View style={styles.column}>
        <Text style={styles.label}>Quantità*</Text>
        <View style={styles.quantityContainer}>
          <AnimatedPressable
            onPress={() => {
              const currentVal = parseFloat(item.quantity.replace(',', '.')) || 0;
              const newValue = String(Math.max(0, currentVal - 1));
              updateQuantity(item.id, 'quantity', newValue);
            }}
            style={styles.quantityButton}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </AnimatedPressable>
          <TextInput
            style={styles.quantityInput}
            value={item.quantity}
            onChangeText={(text) => updateQuantity(item.id, 'quantity', text.replace(',', '.'))}
            keyboardType="decimal-pad"
            placeholderTextColor={styles.placeholder.color}
          />
          <AnimatedPressable
            onPress={() => {
              const currentVal = parseFloat(item.quantity.replace(',', '.')) || 0;
              const newValue = String(currentVal + 1);
              updateQuantity(item.id, 'quantity', newValue);
            }}
            style={styles.quantityButton}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </AnimatedPressable>
        </View>
      </View>
      <View style={styles.column}>
        <Text style={styles.label}>Unità*</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={item.unit}
            style={styles.picker}
            onValueChange={(itemValue) => updateQuantity(item.id, 'unit', itemValue)}
            dropdownIconColor={styles.picker.color}
          >
            {COMMON_UNITS.map((u) => (
              <Picker.Item key={u.id} label={u.name} value={u.id} />
            ))}
          </Picker>
        </View>
      </View>
      {!isOnlyOne && (
        <TouchableOpacity onPress={() => removeQuantity(item.id)} style={styles.removeButton}>
          <Text style={styles.removeButtonText}>-</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    column: {
        flex: 1,
        marginHorizontal: 4,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
        color: isDarkMode ? '#c9d1d9' : '#1e293b',
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
        borderRadius: 8,
        backgroundColor: isDarkMode ? '#21262d' : '#ffffff',
    },
    quantityButton: {
        padding: 12,
        backgroundColor: isDarkMode ? '#30363d' : '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 44,
    },
    quantityButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: isDarkMode ? '#c9d1d9' : '#1e293b',
    },
    quantityInput: {
        flex: 1,
        textAlign: 'center',
        fontSize: 16,
        padding: 12,
        color: isDarkMode ? '#c9d1d9' : '#1e293b',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
        borderRadius: 8,
        backgroundColor: isDarkMode ? '#21262d' : '#ffffff',
    },
    picker: {
        color: isDarkMode ? '#c9d1d9' : '#1e293b',
    },
    removeButton: {
        backgroundColor: isDarkMode ? '#440c0c' : '#fee2e2',
        justifyContent: 'center',
        alignItems: 'center',
        width: 44,
        height: 44,
        borderRadius: 22,
        marginLeft: 8,
        alignSelf: 'center',
    },
    removeButtonText: {
        color: isDarkMode ? '#ff7b72' : '#ef4444',
        fontSize: 20,
        fontWeight: 'bold',
    },
    placeholder: {
        color: isDarkMode ? '#8b949e' : '#64748b',
    },
});

export default QuantityInputRow;
