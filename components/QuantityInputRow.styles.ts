import { StyleSheet, TextStyle, ViewStyle } from 'react-native';

/**
 * Interface for picker style (Picker uses text color property)
 */
interface PickerStyle {
  color: string;
}

/**
 * Interface for all styles used in QuantityInputRow component
 */
interface QuantityInputRowStyles {
  container: ViewStyle;
  mainRow: ViewStyle;
  column: ViewStyle;
  columnWithRemove: ViewStyle;
  label: TextStyle;
  quantityContainer: ViewStyle;
  quantityButton: ViewStyle;
  quantityButtonText: TextStyle;
  quantityInput: TextStyle;
  pickerContainer: ViewStyle;
  picker: PickerStyle;
  removeButton: ViewStyle;
  removeButtonText: TextStyle;
  placeholder: TextStyle;
}

/**
 * Get styles for QuantityInputRow based on theme
 *
 * @param isDarkMode - Whether dark mode is enabled
 * @returns StyleSheet styles for the component
 */
export const getStyles = (isDarkMode: boolean): QuantityInputRowStyles =>
  StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    mainRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    column: {
      flex: 1,
      marginHorizontal: 4,
    },
    columnWithRemove: {
      flex: 1,
      marginHorizontal: 2,
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
      overflow: 'hidden',
    },
    quantityButton: {
      padding: 12,
      backgroundColor: isDarkMode ? '#30363d' : '#e2e8f0',
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 44,
      minHeight: 44,
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
      minHeight: 44,
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#21262d' : '#ffffff',
      overflow: 'hidden',
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
      marginTop: 26,
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
