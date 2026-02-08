import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { LoggingService } from '@/services/LoggingService';

interface ToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  type?: 'success' | 'error';
  testID?: string; // Aggiunto per la testabilità
}

export function Toast({ message, visible, onDismiss, type = 'success', testID }: ToastProps) {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(onDismiss);
        }, 2000);
      });
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      testID={testID} // Applicato per Maestro
      style={[
        styles.container,
        type === 'success' ? styles.success : styles.error,
        { opacity: fadeAnim },
      ]}
    >
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 50,
      left: 20,
      right: 20,
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000000,
      elevation: 1000000,
    },
    success: {
      backgroundColor: isDarkMode ? '#10B981' : '#D1FAE5',
    },
    error: {
      backgroundColor: isDarkMode ? '#EF4444' : '#FEE2E2',
    },
    message: {
      color: isDarkMode ? '#ffffff' : '#1F2937',
      fontSize: 16,
      fontFamily: 'Inter-Medium',
    },
  });
