import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface EmailVerificationBannerProps {
  visible: boolean;
  onHide: () => void;
}

export const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({
  visible,
  onHide
}) => {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (visible) {
      // Nascondi automaticamente dopo 8 secondi
      const timer = setTimeout(() => {
        onHide();
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [visible, onHide]);

  if (!visible) return null;

  return (
    <View style={[styles.successContainer, isDarkMode && styles.darkContainer]}>
      <FontAwesome name="check-circle" size={20} color="#28a745" />
      <Text style={[styles.successText, isDarkMode && styles.darkText]}>
        Account verificato! Effettua il Login per accedere.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  darkContainer: {
    backgroundColor: '#1e3a1e',
    borderColor: '#2d5a2d',
  },
  successText: {
    color: '#155724',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '600',
    flex: 1,
  },
  darkText: {
    color: '#90EE90',
  },
});