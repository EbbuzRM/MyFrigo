import React, { useState, useEffect, useMemo } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { LoggingService } from '@/services/LoggingService';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  type?: 'success' | 'error';
  testID?: string; // Aggiunto per la testabilità
}

export function Toast({ message, visible, onDismiss, type = 'success', testID }: ToastProps) {
  const { isDarkMode } = useTheme();
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => getStyles(isDarkMode), [isDarkMode]);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      if (reducedMotion) {
        // Skip animation, show instantly and dismiss after timeout
        fadeAnim.setValue(1);
        const timer = setTimeout(() => {
          fadeAnim.setValue(0);
          onDismiss();
        }, 2000);
        return () => clearTimeout(timer);
      }
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
  }, [visible, reducedMotion]);

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
