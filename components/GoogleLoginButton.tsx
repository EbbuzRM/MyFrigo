import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface GoogleLoginButtonProps {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  retryInProgress?: boolean;
  retryAttemptNumber?: number;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onPress,
  disabled = false,
  loading = false,
  retryInProgress = false,
  retryAttemptNumber = 0
}) => {
  const { isDarkMode } = useTheme();

  const getButtonContent = () => {
    if (loading) {
      return <ActivityIndicator color="#fff" />;
    }

    if (retryInProgress && retryAttemptNumber > 0) {
      return (
        <View style={styles.buttonContent}>
          <ActivityIndicator size="small" color="#fff" style={styles.loadingIcon} />
          <Text style={styles.buttonText}>
            Tentativo {retryAttemptNumber}/3
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.buttonContent}>
        <FontAwesome name="google" size={20} color="#fff" style={styles.socialIcon} />
        <Text style={styles.buttonText}>Accedi con Google</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles.socialButton,
        disabled && styles.buttonDisabled,
        isDarkMode && styles.darkButton
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {getButtonContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  darkButton: {
    backgroundColor: '#1a1a1a',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#db4437',
  },
  socialIcon: {
    marginRight: 10,
  },
  loadingIcon: {
    marginRight: 8,
  },
});