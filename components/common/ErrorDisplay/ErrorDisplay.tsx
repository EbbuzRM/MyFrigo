import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { scaleFont } from '@/utils/scaleFont';

interface ErrorDisplayProps {
  error?: string | null;
  isDarkMode: boolean;
}

export function ErrorDisplay({
  error,
  isDarkMode,
}: ErrorDisplayProps): React.ReactElement | null {
  if (!error) return null;

  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container} accessibilityRole="alert">
      <FontAwesome
        name="exclamation-circle"
        size={16}
        color="#dc2626"
        style={styles.icon}
      />
      <Text style={styles.errorText}>{error}</Text>
    </View>
  );
}

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)',
      borderRadius: 8,
      padding: 12,
      marginVertical: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#dc2626',
    },
    icon: {
      marginRight: 8,
    },
    errorText: {
      flex: 1,
      fontSize: scaleFont(14),
      fontFamily: 'Inter-Regular',
      color: '#dc2626',
    },
  });
