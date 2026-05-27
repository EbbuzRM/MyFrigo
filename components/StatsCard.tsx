// StatsCard.tsx — StatsCard module.
//
// exports: StatsCard
// used_by: app\(tabs)\index.tsx
//         components\HistoryStats.tsx
// rules:   This component must remain a `React.memo` wrapped functional component using named export only. All style definitions must be computed dynamically via the `getStyles` function based on `isDarkMode` to support theme switching.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { LoggingService } from '@/services/LoggingService';
import { getStatsCardAccessibilityProps } from '@/utils/accessibility';
import { scaleFont } from '@/utils/scaleFont';

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  lightBackgroundColor: string;
  darkBackgroundColor: string;
  onPress?: () => void;
  valueTestId?: string;
}

export const StatsCard = React.memo(function StatsCard({ title, value, icon, lightBackgroundColor, darkBackgroundColor, onPress, valueTestId }: StatsCardProps) {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const CardComponent = onPress ? TouchableOpacity : View;
  const backgroundColor = isDarkMode ? darkBackgroundColor : lightBackgroundColor;

  return (
    <CardComponent
      testID={`stats-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
      style={[styles.card, { backgroundColor }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      {...getStatsCardAccessibilityProps(title, value, !!onPress)}
    >
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <View style={styles.content}>
        <Text style={styles.value} testID={valueTestId}>{value}</Text>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </View>
    </CardComponent>
  );
});

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  card: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: isDarkMode ? 'transparent' : '#d1d5db',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  content: {
    alignItems: 'flex-start',
  },
  value: {
    fontSize: scaleFont(20),
    fontFamily: 'Inter-Bold',
    color: isDarkMode ? '#ffffff' : '#1e293b',
    marginBottom: 2,
  },
  title: {
    fontSize: scaleFont(14),
    fontFamily: 'Inter-Medium',
    color: isDarkMode ? '#d1d5db' : '#64748B',
  },
});
