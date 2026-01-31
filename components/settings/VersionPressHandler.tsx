import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Constants from 'expo-constants';
import { useTheme } from '@/context/ThemeContext';
import { useDiagnosticGesture } from '@/hooks/useDiagnosticGesture';
import { scaleFont } from '@/utils/scaleFont';

/**
 * @file components/settings/VersionPressHandler.tsx
 * @description Component that handles the long press gesture on version text
 * to activate the diagnostic panel. Includes visual progress feedback.
 *
 * @example
 * ```tsx
 * <VersionPressHandler
 *   onActivate={() => setShowDiagnosticPanel(true)}
 *   onShowVersionInfo={() => Alert.alert('Version', appVersion)}
 * />
 * ```
 */

/**
 * Props for VersionPressHandler component
 */
export interface VersionPressHandlerProps {
  /** Callback when long press is completed and diagnostic should show */
  onActivate: () => void;
  /** Callback when short press occurs (show version info) */
  onShowVersionInfo: () => void;
}

/**
 * VersionPressHandler component
 *
 * Wraps the version text with long press detection for diagnostic panel access.
 * Shows visual progress feedback during the long press gesture.
 *
 * @param props - Component props
 * @returns VersionPressHandler component
 */
export function VersionPressHandler({
  onActivate,
  onShowVersionInfo,
}: VersionPressHandlerProps): React.ReactElement {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  const { progress, isActive, handlers } = useDiagnosticGesture({
    onActivate,
  });

  const handlePress = useCallback(() => {
    if (!isActive) {
      onShowVersionInfo();
    }
  }, [isActive, onShowVersionInfo]);

  return (
    <>
      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handlePress}
          onPressIn={handlers.onPressIn}
          onPressOut={handlers.onPressOut}
          accessibilityLabel="Versione applicazione"
          accessibilityHint="Tieni premuto per 5 secondi per attivare la diagnostica"
        >
          <Text style={styles.versionText}>
            MyFrigo v{Constants.expoConfig?.version}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress indicator overlay */}
      {isActive && (
        <View style={styles.progressOverlay}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
          <Text style={styles.progressText}>
            {progress < 100
              ? `Tieni premuto per attivare la diagnostica (${Math.round(progress)}%)`
              : 'Rilascia per attivare la diagnostica'}
          </Text>
        </View>
      )}
    </>
  );
}

/**
 * Styles for the VersionPressHandler component
 */
const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    footer: {
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
    },
    versionText: {
      fontSize: scaleFont(14),
      fontFamily: 'Inter-Medium',
      color: isDarkMode ? '#8b949e' : '#94a3b8',
    },
    progressOverlay: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      right: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderRadius: 10,
      padding: 10,
      alignItems: 'center',
    },
    progressBar: {
      height: 4,
      backgroundColor: '#4f46e5',
      borderRadius: 2,
      alignSelf: 'stretch',
      marginBottom: 8,
    },
    progressText: {
      color: 'white',
      fontSize: scaleFont(14),
      fontFamily: 'Inter-Regular',
    },
  });
