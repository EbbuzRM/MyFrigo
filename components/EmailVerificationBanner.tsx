// EmailVerificationBanner.tsx — EmailVerificationBanner module.
//
// exports: EmailVerificationBanner
// used_by: components\LoginForm.tsx
// rules:   - Theme context must be used consistently across all components via `useTheme()` hook from `@/context/ThemeContext`
//          - Dark mode variants must be implemented using conditional style merging with `isDarkMode` flag for both containers and text elements
//          - Auto-dismiss timers in notification components must clean up with `clearTimeout` in useEffect return
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

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