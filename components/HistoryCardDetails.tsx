import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, Package, RotateCcw } from 'lucide-react-native';
import { Quantity } from '@/types/Product';
import { useTheme } from '@/context/ThemeContext';
import { QuantityDisplay } from './QuantityDisplay';
import { scaleFont } from '@/utils/scaleFont';

interface HistoryCardDetailsProps {
  quantities: Quantity[] | undefined;
  statusText: string;
  formattedDate: string;
  statusColor: string;
  type: 'consumed' | 'expired';
  onRestore?: () => void;
}

const SPACING = { xs: 4, sm: 8, md: 12 };

/** HistoryCardDetails - Displays quantity, date, and restore button */
export const HistoryCardDetails = React.memo(({
  quantities, statusText, formattedDate, statusColor, type, onRestore,
}: HistoryCardDetailsProps) => {
  const { isDarkMode } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    details: { gap: SPACING.md },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    detailItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    detailText: {
      fontSize: scaleFont(14), fontFamily: 'Inter-Regular',
      color: isDarkMode ? '#8b949e' : '#64748B',
    },
    dateText: {
      fontSize: scaleFont(14), fontFamily: 'Inter-Medium',
      color: isDarkMode ? '#c9d1d9' : '#334155',
    },
    restoreButton: {
      padding: SPACING.sm, alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    },
    restoreText: { fontFamily: 'Inter-Medium', fontSize: scaleFont(14), color: statusColor },
  }), [isDarkMode, statusColor]);

  const iconColor = isDarkMode ? '#8b949e' : '#64748B';

  return (
    <View style={styles.details}>
      <View style={styles.detailRow}>
        <View style={styles.detailItem}>
          <Package size={16} color={iconColor} />
          <QuantityDisplay quantities={quantities} style={styles.detailText} />
        </View>
        <View style={styles.detailItem}>
          <Calendar size={16} color={iconColor} />
          <Text style={styles.dateText}>{statusText}: {formattedDate}</Text>
        </View>
      </View>
      {type === 'consumed' && onRestore && (
        <TouchableOpacity
          testID="restore-button" style={styles.restoreButton} onPress={onRestore}
          accessibilityRole="button" accessibilityLabel="Ripristina prodotto"
        >
          <RotateCcw size={20} color={statusColor} />
          <Text style={styles.restoreText}>Ripristina</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

HistoryCardDetails.displayName = 'HistoryCardDetails';
