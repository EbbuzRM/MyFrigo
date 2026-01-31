import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  AccessibilityProps,
} from 'react-native';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CustomDatePicker } from './CustomDatePicker';
import { getStyles } from './ProductFormFooter.styles';

interface DateHandlers {
  setShowPurchaseDatePicker: (value: boolean) => void;
  setShowExpirationDatePicker: (value: boolean) => void;
  onChangePurchaseDate: (event: DateTimePickerEvent, selectedDate?: Date) => void;
  onChangeExpirationDate: (event: DateTimePickerEvent, selectedDate?: Date) => void;
}

interface DatePickerRowProps extends AccessibilityProps {
  purchaseDate: string;
  expirationDate: string;
  showPurchaseDatePicker: boolean;
  showExpirationDatePicker: boolean;
  handlers: DateHandlers;
  isDarkMode: boolean;
  renderPhotoButton?: React.ReactNode;
}

export const DatePickerRow: React.FC<DatePickerRowProps> = React.memo(
  ({
    purchaseDate,
    expirationDate,
    showPurchaseDatePicker,
    showExpirationDatePicker,
    handlers,
    isDarkMode,
    renderPhotoButton,
    accessible = true,
    accessibilityLabel = 'Date selection section',
  }) => {
    const styles = getStyles(isDarkMode);

    const handlePurchaseDatePress = useCallback(() => {
      handlers.setShowPurchaseDatePicker(true);
    }, [handlers]);

    const handleExpirationDatePress = useCallback(() => {
      handlers.setShowExpirationDatePicker(true);
    }, [handlers]);

    const handlePurchaseDateClose = useCallback(() => {
      handlers.setShowPurchaseDatePicker(false);
    }, [handlers]);

    const handleExpirationDateClose = useCallback(() => {
      handlers.setShowExpirationDatePicker(false);
    }, [handlers]);

    const formatDate = useCallback((date: string | null): string => {
      return date ? new Date(date).toLocaleDateString('it-IT') : 'Seleziona Data';
    }, []);

    return (
      <View accessible={accessible} accessibilityLabel={accessibilityLabel}>
        <Text style={styles.label}>Data di Acquisto*</Text>
        <TouchableOpacity
          onPress={handlePurchaseDatePress}
          style={styles.dateInputTouchable}
          accessible={true}
          accessibilityLabel="Purchase date"
          accessibilityRole="button"
          accessibilityHint="Opens date picker for purchase date"
        >
          <Text style={styles.dateTextValue}>{formatDate(purchaseDate)}</Text>
        </TouchableOpacity>

        {showPurchaseDatePicker && (
          <CustomDatePicker
            value={new Date(purchaseDate || Date.now())}
            onChange={handlers.onChangePurchaseDate}
            onClose={handlePurchaseDateClose}
            maximumDate={new Date()}
          />
        )}

        <View style={styles.labelRow}>
          <Text style={styles.label}>Data di Scadenza*</Text>
          {renderPhotoButton}
        </View>

        <TouchableOpacity
          onPress={handleExpirationDatePress}
          style={styles.dateInputTouchable}
          accessible={true}
          accessibilityLabel="Expiration date"
          accessibilityRole="button"
          accessibilityHint="Opens date picker for expiration date"
        >
          <Text style={styles.dateTextValue}>{formatDate(expirationDate)}</Text>
        </TouchableOpacity>

        {showExpirationDatePicker && (
          <CustomDatePicker
            value={new Date(expirationDate || Date.now())}
            onChange={handlers.onChangeExpirationDate}
            onClose={handleExpirationDateClose}
            minimumDate={new Date()}
          />
        )}
      </View>
    );
  }
);

DatePickerRow.displayName = 'DatePickerRow';
