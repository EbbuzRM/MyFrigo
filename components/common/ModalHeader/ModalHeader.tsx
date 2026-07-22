import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { scaleFont } from '@/utils/scaleFont';

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  isDarkMode: boolean;
}

export function ModalHeader({
  title,
  onClose,
  isDarkMode,
}: ModalHeaderProps): React.ReactElement {
  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.header}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <TouchableOpacity
        onPress={onClose}
        accessibilityLabel="Chiudi modal"
        accessibilityHint="Tocca per chiudere"
        accessibilityRole="button"
        style={styles.closeButton}
      >
        <FontAwesome
          name="times"
          size={20}
          color={isDarkMode ? '#8b949e' : '#64748B'}
        />
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: scaleFont(18),
      fontFamily: 'Inter-Bold',
      color: isDarkMode ? '#c9d1d9' : '#1e293b',
    },
    closeButton: {
      padding: 4,
    },
  });
