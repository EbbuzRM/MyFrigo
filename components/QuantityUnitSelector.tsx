import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '@/context/ThemeContext';
import { COMMON_UNITS, UnitOption } from '@/constants/quantities';

interface QuantityUnitSelectorProps {
  selectedValue: string;
  onValueChange: (value: string) => void;
  units?: UnitOption[];
  containerStyle?: object;
  testID?: string;
}

export const QuantityUnitSelector = React.memo(({
  selectedValue,
  onValueChange,
  units = COMMON_UNITS,
  containerStyle,
  testID,
}: QuantityUnitSelectorProps) => {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  const handleChange = useCallback((value: string | number) => {
    onValueChange(String(value));
  }, [onValueChange]);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>Unità*</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedValue}
          style={styles.picker}
          onValueChange={handleChange}
          dropdownIconColor={isDarkMode ? '#c9d1d9' : '#1e293b'}
          testID={testID}
          accessibilityLabel="Seleziona unità di misura"
        >
          {units.map((unit) => (
            <Picker.Item key={unit.id} label={unit.name} value={unit.id} />
          ))}
        </Picker>
      </View>
    </View>
  );
});

QuantityUnitSelector.displayName = 'QuantityUnitSelector';

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      marginHorizontal: 4,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 8,
      color: isDarkMode ? '#c9d1d9' : '#1e293b',
    },
    pickerWrapper: {
      borderWidth: 1,
      borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#21262d' : '#ffffff',
      overflow: 'hidden',
    },
    picker: {
      color: isDarkMode ? '#c9d1d9' : '#1e293b',
    },
  });
