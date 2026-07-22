// PasswordValidationDisplay.tsx — PasswordValidationDisplay module.
//
// exports: PasswordValidationDisplay
// used_by: components\LoginForm.tsx
//                   components\settings\ChangePasswordModal.tsx
// rules:   - Password validation display components must remain presentational only, receiving validation state via props and not managing any validation logic internally
//          - All password validation criteria (minLength, hasLower, hasUpper, hasNumber) must be displayed as individual ValidationCheck components following the established icon+text pattern
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { PasswordValidation } from '@/hooks/usePasswordValidation';
import { useTheme } from '@/context/ThemeContext';

interface ValidationCheckProps {
  isValid: boolean;
  text: string;
}

const ValidationCheck: React.FC<ValidationCheckProps> = ({ isValid, text }) => {
  const { isDarkMode } = useTheme();

  return (
    <View style={styles.validationCheckContainer}>
      <FontAwesome
        name={isValid ? 'check-circle' : 'circle-o'}
        size={16}
        color={isValid ? '#28a745' : '#6c757d'}
      />
      <Text style={[
        styles.validationText,
        { color: isValid ? '#28a745' : '#6c757d' }
      ]}>
        {text}
      </Text>
    </View>
  );
};

interface PasswordValidationDisplayProps {
  validation: PasswordValidation;
  visible: boolean;
}

export const PasswordValidationDisplay: React.FC<PasswordValidationDisplayProps> = ({
  validation,
  visible
}) => {
  const { isDarkMode } = useTheme();

  if (!visible) return null;

  return (
    <View style={styles.validationContainer}>
      <ValidationCheck isValid={validation.minLength} text="Almeno 8 caratteri" />
      <ValidationCheck isValid={validation.hasLower} text="Una lettera minuscola" />
      <ValidationCheck isValid={validation.hasUpper} text="Una lettera maiuscola" />
      <ValidationCheck isValid={validation.hasNumber} text="Un numero" />
    </View>
  );
};

const styles = StyleSheet.create({
  validationContainer: {
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  validationCheckContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  validationText: {
    marginLeft: 8,
  },
});