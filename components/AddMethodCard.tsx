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
  backgroundColor: string;
  borderColor: string;
}

export function AddMethodCard({
  title,
  description,
  icon,
  onPress,
  backgroundColor,
  borderColor,
}: AddMethodCardProps) {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  return (
    <AnimatedPressable
      style={[styles.card, { backgroundColor, borderColor }]}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        {icon}
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

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
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
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
    title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: isDarkMode ? '#000000' : '#1e293b',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#000000' : '#64748B',
    lineHeight: 20,
  },
  chevronContainer: {
    marginLeft: 16,
  },
});
