// Toast.tsx — Toast module.
//
// exports: Toast
// used_by: app\_layout.tsx
//                   app\feedback.tsx
// rules:   - Use `useReducedMotion` hook to conditionally disable opacity animations; always respect reduced motion preferences.
//          - All toast components must accept `testID` prop for Maestro testability.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { useState, useEffect, useMemo } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
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
    let dismissTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    if (!visible) {
      fadeAnim.stopAnimation();
      fadeAnim.setValue(0);
      return undefined;
    }

    const dismiss = () => {
      if (cancelled) return;
      fadeAnim.setValue(0);
      onDismiss();
    };

    if (reducedMotion) {
      fadeAnim.setValue(1);
      dismissTimer = setTimeout(dismiss, 2000);
    } else {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || cancelled) return;
        dismissTimer = setTimeout(() => {
          if (cancelled) return;
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(({ finished: fadeFinished }) => {
            if (fadeFinished) dismiss();
          });
        }, 2000);
      });
    }

    return () => {
      cancelled = true;
      if (dismissTimer !== undefined) clearTimeout(dismissTimer);
      fadeAnim.stopAnimation();
    };
  }, [fadeAnim, onDismiss, reducedMotion, visible]);

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
