import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { scaleFont } from '@/utils/scaleFont';

interface PasswordInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  showPassword: boolean;
  onToggleVisibility: () => void;
  isDarkMode: boolean;
  error?: string;
  placeholder?: string;
  testID?: string;
}

export function PasswordInput({
  label,
  value,
  onChangeText,
  showPassword,
  onToggleVisibility,
  isDarkMode,
  error,
  placeholder = 'Inserisci password',
  testID,
}: PasswordInputProps): React.ReactElement {
  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[styles.inputWrapper, error && styles.inputWrapperError]}
      >
        <FontAwesome
          name="lock"
          size={16}
          color={isDarkMode ? '#8b949e' : '#64748B'}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={isDarkMode ? '#8b949e' : '#94a3b8'}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
          autoCorrect={false}
          testID={testID}
        />
        <TouchableOpacity
          onPress={onToggleVisibility}
          style={styles.eyeButton}
          accessibilityLabel={showPassword ? 'Nascondi password' : 'Mostra password'}
          accessibilityRole="button"
        >
          <FontAwesome
            name={showPassword ? 'eye' : 'eye-slash'}
            size={18}
            color={isDarkMode ? '#8b949e' : '#64748B'}
          />
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      marginBottom: 12,
    },
    label: {
      fontSize: scaleFont(14),
      fontFamily: 'Inter-SemiBold',
      color: isDarkMode ? '#c9d1d9' : '#374151',
      marginBottom: 6,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
      borderRadius: 8,
      paddingHorizontal: 12,
      backgroundColor: isDarkMode ? '#0d1117' : '#ffffff',
    },
    inputWrapperError: {
      borderColor: '#dc2626',
    },
    inputIcon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      paddingVertical: 12,
      fontSize: scaleFont(16),
      fontFamily: 'Inter-Regular',
      color: isDarkMode ? '#c9d1d9' : '#1e293b',
    },
    eyeButton: {
      padding: 4,
    },
    errorText: {
      fontSize: scaleFont(12),
      fontFamily: 'Inter-Regular',
      color: '#dc2626',
      marginTop: 4,
    },
  });
