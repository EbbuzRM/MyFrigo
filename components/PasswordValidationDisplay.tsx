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
      <ValidationCheck isValid={validation.minLength} text="Almeno 6 caratteri" />
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