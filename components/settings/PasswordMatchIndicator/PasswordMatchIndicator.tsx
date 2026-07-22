import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { scaleFont } from '@/utils/scaleFont';
import {
  validatePassword,
  validatePasswordMatch,
} from '@/utils/validation/passwordValidationRules';

interface PasswordMatchIndicatorProps {
  newPassword: string;
  confirmPassword: string;
  isDarkMode: boolean;
}

export function PasswordMatchIndicator({
  newPassword,
  confirmPassword,
  isDarkMode,
}: PasswordMatchIndicatorProps): React.ReactElement | null {
  if (!newPassword) return null;

  const { validation } = validatePassword(newPassword);
  const passwordsMatch = validatePasswordMatch(newPassword, confirmPassword);

  const styles = getStyles(isDarkMode);
  const criteria = [
    { label: 'Minimo 8 caratteri', valid: validation.minLength },
    { label: 'Una maiuscola', valid: validation.hasUpperCase },
    { label: 'Una minuscola', valid: validation.hasLowerCase },
    { label: 'Un numero', valid: validation.hasNumber },
    { label: 'Un carattere speciale', valid: validation.hasSpecialChar },
    { label: 'Password coincidono', valid: passwordsMatch },
  ];

  return (
    <View style={styles.container}>
      {criteria.map((criterion, index) => (
        <View key={index} style={styles.criterionRow}>
          <FontAwesome
            name={criterion.valid ? 'check-circle' : 'circle-o'}
            size={14}
            color={criterion.valid ? '#22c55e' : '#94a3b8'}
            style={styles.icon}
          />
          <Text
            style={[
              styles.criterionText,
              criterion.valid && styles.criterionTextValid,
            ]}
          >
            {criterion.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.05)' : 'rgba(34, 197, 94, 0.03)',
      borderRadius: 8,
      padding: 12,
      marginVertical: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#22c55e',
    },
    criterionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 4,
    },
    icon: {
      marginRight: 8,
      width: 16,
    },
    criterionText: {
      fontSize: scaleFont(13),
      fontFamily: 'Inter-Regular',
      color: isDarkMode ? '#8b949e' : '#64748B',
    },
    criterionTextValid: {
      color: '#22c55e',
      fontFamily: 'Inter-SemiBold',
    },
  });
