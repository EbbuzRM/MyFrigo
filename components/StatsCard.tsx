import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  backgroundColor: string;
  onPress?: () => void;
}

export function StatsCard({ title, value, icon, backgroundColor, onPress }: StatsCardProps) {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent 
      style={[styles.card, { backgroundColor }]} 
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <View style={styles.content}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </CardComponent>
  );
}

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  card: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    marginBottom: 8,
  },
  content: {
    alignItems: 'flex-start',
  },
  value: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: isDarkMode ? '#000000' : '#1e293b', // Nero per dark mode
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: isDarkMode ? '#000000' : '#64748B', // Nero per dark mode
  },
});
