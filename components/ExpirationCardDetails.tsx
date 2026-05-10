// ExpirationCardDetails.tsx — ExpirationCardDetails module.
//
// exports: ExpirationCardDetails
// used_by: components\ExpirationCard.tsx
// rules:   - All new UI components in this module must use `React.memo()` for performance optimization
//          - Style definitions must use `useMemo()` with proper dependency arrays to prevent unnecessary re-renders
//          - All date formatting must use the 'it-IT' locale for consistency across the module
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar, Package } from 'lucide-react-native';
import { QuantityDisplay } from './QuantityDisplay';
import { Quantity } from '@/types/Product';
import { scaleFont } from '@/utils/scaleFont';

/**
 * Props for the ExpirationCardDetails component
 */
interface ExpirationCardDetailsProps {
  /** Array of quantities to display */
  quantities: Quantity[] | undefined;
  /** Expiration date to display */
  expirationDate: Date | string;
  /** Whether dark mode is enabled */
  isDarkMode: boolean;
}

/**
 * ExpirationCardDetails Component
 * @description Displays the details section of an expiration card with
 * quantity information and formatted expiration date.
 */
export const ExpirationCardDetails = React.memo(({
  quantities,
  expirationDate,
  isDarkMode,
}: ExpirationCardDetailsProps) => {
  const formattedDate = useMemo(() => {
    const date = expirationDate instanceof Date ? expirationDate : new Date(expirationDate);
    return date.toLocaleDateString('it-IT');
  }, [expirationDate]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        details: {
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        detailItem: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        detailText: {
          fontSize: scaleFont(14),
          fontFamily: 'Inter-Regular',
          color: isDarkMode ? '#8b949e' : '#64748B',
          marginLeft: 6,
        },
      }),
    [isDarkMode]
  );

  const textColor = isDarkMode ? '#8b949e' : '#64748B';

  return (
    <View style={styles.details}>
      <View style={styles.detailItem}>
        <Package size={16} color="#64748B" />
        <QuantityDisplay 
          quantities={quantities} 
          style={styles.detailText}
          fallbackText="N/A"
        />
      </View>
      <View style={[styles.detailItem, { marginLeft: 8 }]}>
        <Calendar size={16} color="#64748B" />
        <Text style={styles.detailText}>{formattedDate}</Text>
      </View>
    </View>
  );
});

ExpirationCardDetails.displayName = 'ExpirationCardDetails';
