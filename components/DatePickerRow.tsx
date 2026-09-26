// DatePickerRow.tsx — DatePickerRow module.
//
// exports: DatePickerRow
// used_by: components\ProductFormFooter.tsx
// rules:   - All date picker visibility states must be managed externally via the `DateHandlers` interface; components must not maintain internal toggle state for date picker modals.
//          - Component styling must use `getStyles(isDarkMode)` to apply theme-consistent styles; direct style overrides or inline styles are prohibited.
//          - Accessibility props (`accessible`, `accessibilityLabel`) must be supported via the component interface and default to accessible date selection sections.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

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
import { useTranslation } from 'react-i18next';
import { useAppLanguage } from '@/i18n/useAppLanguage';
import { formatDisplayDate } from '@/i18n/format';
import { parseISO } from 'date-fns';

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
    accessibilityLabel,
  }) => {
    const { t } = useTranslation();
    const language = useAppLanguage();
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
      return date ? formatDisplayDate(date, language) ?? t('products.dateInvalid') : t('products.selectDate');
    }, [language, t]);

    return (
      <View accessible={accessible} accessibilityLabel={accessibilityLabel ?? t('products.dateSelectionLabel')}>
        <Text style={styles.label}>{t('products.purchaseDateRequired')}</Text>
        <TouchableOpacity
          testID="purchase-date-button"
          onPress={handlePurchaseDatePress}
          style={styles.dateInputTouchable}
          accessible={true}
          accessibilityLabel={t('products.purchaseDateLabel')}
          accessibilityRole="button"
          accessibilityHint={t('products.openPurchaseDateHint')}
        >
          <Text style={styles.dateTextValue}>{formatDate(purchaseDate)}</Text>
        </TouchableOpacity>

        {showPurchaseDatePicker && (
          <CustomDatePicker
            value={purchaseDate ? parseISO(purchaseDate) : new Date()}
            onChange={handlers.onChangePurchaseDate}
            onClose={handlePurchaseDateClose}
            maximumDate={new Date()}
          />
        )}

        <View style={styles.labelRow}>
          <Text style={styles.label}>{t('products.expirationDateRequired')}</Text>
          {renderPhotoButton}
        </View>
        <TouchableOpacity
          testID="expiration-date-button"
          onPress={handleExpirationDatePress}
          style={styles.dateInputTouchable}
          accessible={true}
          accessibilityLabel={t('products.expirationDateLabel')}
          accessibilityRole="button"
          accessibilityHint={t('products.openExpirationDateHint')}
        >
          <Text style={styles.dateTextValue}>{formatDate(expirationDate)}</Text>
        </TouchableOpacity>

        {showExpirationDatePicker && (
          <CustomDatePicker
            value={expirationDate ? parseISO(expirationDate) : new Date()}
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
