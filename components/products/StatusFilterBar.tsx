import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { LoggingService } from '@/services/LoggingService';
import { 
  STATUS_FILTERS, 
  ProductStatusFilter 
} from '@/constants/productFilters';

/**
 * Props for StatusFilterBar component
 */
interface StatusFilterBarProps {
  /** Currently selected status filter */
  selectedStatus: ProductStatusFilter;
  /** Callback when status filter changes */
  onStatusChange: (status: ProductStatusFilter) => void;
  /** Optional test ID for testing */
  testID?: string;
}

/**
 * Status filter bar component
 * Displays filter buttons for product status (all, fresh, expiring, expired)
 * 
 * @param props - Component props
 * @returns StatusFilterBar component
 */
export function StatusFilterBar({
  selectedStatus,
  onStatusChange,
  testID,
}: StatusFilterBarProps): React.ReactElement {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  const handleStatusPress = useCallback((status: ProductStatusFilter) => {
    if (status !== selectedStatus) {
      LoggingService.info('StatusFilterBar', `Status filter changed to: ${status}`);
      onStatusChange(status);
    }
  }, [selectedStatus, onStatusChange]);

  return (
    <View style={styles.filtersContainer} testID={testID}>
      <View style={styles.statusFilters}>
        {STATUS_FILTERS.map((status) => (
          <TouchableOpacity
            key={status.key}
            style={[
              styles.statusFilter,
              selectedStatus === status.key && styles.statusFilterActive
            ]}
            onPress={() => handleStatusPress(status.key)}
            accessibilityLabel={status.accessibilityLabel}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedStatus === status.key }}
            accessibilityHint={`Filtra per ${status.label.toLowerCase()}`}
          >
            <Text style={[
              styles.statusFilterText,
              selectedStatus === status.key && styles.statusFilterTextActive
            ]}>
              {status.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  statusFilters: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: isDarkMode ? '#21262d' : '#f1f5f9',
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  statusFilterActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  statusFilterText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: isDarkMode ? '#8b949e' : '#64748b',
  },
  statusFilterTextActive: {
    color: '#ffffff',
  },
});
