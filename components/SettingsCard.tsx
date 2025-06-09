import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface SettingsCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  rightElement: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'danger';
}

export function SettingsCard({
  title,
  description,
  icon,
  rightElement,
  onPress,
  variant = 'default',
}: SettingsCardProps) {
  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[
        styles.card,
        variant === 'danger' && styles.dangerCard,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <View style={styles.content}>
        <Text style={[
          styles.title,
          variant === 'danger' && styles.dangerTitle,
        ]}>
          {title}
        </Text>
        <Text style={[
          styles.description,
          variant === 'danger' && styles.dangerDescription,
        ]}>
          {description}
        </Text>
      </View>
      <View style={styles.rightElement}>
        {rightElement}
      </View>
    </CardComponent>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dangerCard: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  iconContainer: {
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 4,
  },
  dangerTitle: {
    color: '#DC2626',
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    lineHeight: 20,
  },
  dangerDescription: {
    color: '#B91C1C',
  },
  rightElement: {
    marginLeft: 12,
  },
});