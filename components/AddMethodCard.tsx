import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { AnimatedPressable } from './AnimatedPressable';

interface AddMethodCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
  variant: 'barcode' | 'manual';
}

const getColors = (isDarkMode: boolean, variant: 'barcode' | 'manual') => {
  const barcode = {
    light: { bg: '#EFF6FF', border: '#DBEAFE', icon: '#3B82F6', title: '#1E3A8A', desc: '#3B82F6' },
    dark: { bg: '#1E3A8A', border: '#2563EB', icon: '#93C5FD', title: '#DBEAFE', desc: '#93C5FD' },
  };
  const manual = {
    light: { bg: '#EEF2FF', border: '#C7D2FE', icon: '#6366F1', title: '#4338CA', desc: '#4F46E5' },
    dark: { bg: '#3730A3', border: '#4F46E5', icon: '#A5B4FC', title: '#E0E7FF', desc: '#A5B4FC' },
  };
  
  const themeColors = isDarkMode ? 'dark' : 'light';
  return variant === 'barcode' ? barcode[themeColors] : manual[themeColors];
};

export function AddMethodCard({
  title,
  description,
  icon,
  onPress,
  variant,
}: AddMethodCardProps) {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode, variant);
  const styles = getStyles(isDarkMode, colors);

  return (
    <AnimatedPressable
      style={[styles.card, { backgroundColor: colors.bg, borderColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        {React.cloneElement(icon as React.ReactElement, { color: colors.icon })}
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <View style={styles.chevronContainer}>
        <ChevronRight size={20} color={isDarkMode ? '#8b949e' : '#94a3b8'} />
      </View>
    </AnimatedPressable>
  );
}

const getStyles = (isDarkMode: boolean, colors: any) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  iconContainer: {
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.title,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.desc,
    lineHeight: 20,
  },
  chevronContainer: {
    marginLeft: 16,
  },
});
