// VersionPressHandler.tsx — VersionPressHandler module.
//
// exports: VersionPressHandlerProps
// used_by: app\(tabs)\settings.tsx
// rules:   - The diagnostic activation logic and tap count state must remain externally managed via the `useDiagnosticGesture` hook, not implemented internally within this component
//          - The `onActivate` callback and `REQUIRED_TAPS` constant are the sole interface for triggering the diagnostic panel and configuring tap sensitivity
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

﻿import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { useTheme } from '@/context/ThemeContext';
import { useDiagnosticGesture } from '@/hooks/useDiagnosticGesture';
import { scaleFont } from '@/utils/scaleFont';

/**
 * @file components/settings/VersionPressHandler.tsx
 * @description Component that handles the tap gesture on version text
 * to activate the diagnostic panel. Requires 5 taps within 3 seconds.
 */

export interface VersionPressHandlerProps {
  onActivate: () => void;
}

const REQUIRED_TAPS = 5;

export function VersionPressHandler({
  onActivate,
}: VersionPressHandlerProps): React.ReactElement {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  const { tapCount, handleTap } = useDiagnosticGesture({
    onActivate,
    requiredTaps: REQUIRED_TAPS,
  });

  const handlePress = useCallback(() => {
    handleTap();
  }, [handleTap]);

  return (
    <>
      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handlePress}
          accessibilityLabel="Versione applicazione"
          accessibilityHint={`Tocca ${REQUIRED_TAPS} volte per attivare la diagnostica`}
        >
          <Text style={styles.versionText}>
            MyFrigo v{Constants.expoConfig?.version}
          </Text>
        </TouchableOpacity>
      </View>

      {tapCount > 0 && (
        <View style={styles.tapOverlay}>
          <Text style={styles.tapText}>
            Altri {REQUIRED_TAPS - tapCount} tap per la diagnostica
          </Text>
        </View>
      )}
    </>
  );
}

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
    tapOverlay: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      right: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderRadius: 10,
      padding: 10,
      alignItems: 'center',
    },
    tapText: {
      color: 'white',
      fontSize: scaleFont(14),
      fontFamily: 'Inter-Regular',
    },
  });