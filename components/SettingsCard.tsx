// SettingsCard.tsx — SettingsCard module.
//
// exports: SettingsCard
// used_by: components\settings\AccountSettingsSection.tsx
//                   components\settings\DiagnosticSettingsSection.tsx
//                   components\settings\UpdateSettingsSection.tsx
// rules:   - All components must accept and handle `onLongPress` prop with `GestureResponderEvent` type for accessibility support
//          - Theme consistency must be maintained through `useTheme` hook and dynamic styles based on `isDarkMode`
//          - Custom accessibility props from `getSettingsCardAccessibilityProps` utility must be applied to all interactive elements
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, GestureResponderEvent } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { LoggingService } from '@/services/LoggingService';
import { getSettingsCardAccessibilityProps } from '@/utils/accessibility';
import { scaleFont } from '@/utils/scaleFont';

interface SettingsCardProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  onPress?: () => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  control?: React.ReactNode;
  testID?: string;
  /** Custom accessibility label, overrides auto-generated one */
  accessibilityLabel?: string;
  /** Custom accessibility hint, overrides auto-generated one */
  accessibilityHint?: string;
}

/**
 * @component SettingsCard
 * @description Un componente riutilizzabile per visualizzare una singola opzione nelle impostazioni.
 * Progettato per essere flessibile, può mostrare un'icona, un titolo, una descrizione e un controllo a destra (es. uno Switch o una freccia).
 * @param {React.ReactNode} icon - L'icona da visualizzare a sinistra.
 * @param {string} title - Il titolo dell'impostazione.
 * @param {string} [description] - Una descrizione opzionale.
 * @param {() => void} [onPress] - Funzione da eseguire al tocco. Se presente, la card diventa cliccabile.
 * @param {React.ReactNode} [control] - Un componente da visualizzare a destra, come uno Switch.
 */
export function SettingsCard({ icon, title, description, onPress, onLongPress, control, testID, accessibilityLabel, accessibilityHint }: SettingsCardProps) {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  const CardContent = () => (
    <>
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      <View style={styles.controlContainer}>
        {control ? control : onPress ? <ChevronRight size={24} color={styles.chevron.color} /> : null}
      </View>
    </>
  );

  // Build accessibility props: use custom label/hint if provided, otherwise auto-generate
  const buildAccessibilityProps = (hasControl: boolean) => {
    const autoProps = getSettingsCardAccessibilityProps(title, description, hasControl);
    return {
      ...autoProps,
      ...(accessibilityLabel !== undefined ? { accessibilityLabel } : {}),
      ...(accessibilityHint !== undefined ? { accessibilityHint } : {}),
    };
  };

  // Se c'è un controllo (come lo Switch), rendiamo la card come una View non cliccabile
  // per evitare di intercettare gli eventi destinati allo Switch.
  if (control) {
    return (
      <View
        style={styles.card}
        testID={testID}
        {...buildAccessibilityProps(true)}
      >
        <CardContent />
      </View>
    );
  }

  // Se c'è un onPress (e non un controllo), la rendiamo cliccabile.
  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.card}
        testID={testID}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
        {...buildAccessibilityProps(false)}
      >
        <CardContent />
      </TouchableOpacity>
    );
  }

  // Fallback per card puramente informative (senza onPress o control)
    return (
      <View
        style={styles.card}
        testID={testID}
        {...buildAccessibilityProps(false)}
      >
        <CardContent />
      </View>
    );
}

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#30363d' : '#f1f5f9',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: scaleFont(16),
    fontFamily: 'Inter-SemiBold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  description: {
    fontSize: scaleFont(14),
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
    marginTop: 2,
  },
  controlContainer: {
    marginLeft: 16,
  },
  chevron: {
    color: isDarkMode ? '#8b949e' : '#9ca3af',
  }
});
