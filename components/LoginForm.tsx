import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useEmailAuth } from '@/hooks/useEmailAuth';
import { usePasswordValidation } from '@/hooks/usePasswordValidation';
import { PasswordValidationDisplay } from './PasswordValidationDisplay';
import { EmailVerificationBanner } from './EmailVerificationBanner';
import { AuthService } from '@/services/AuthService';

interface LoginFormProps {
  onLoginSuccess?: () => void;
  onLoginError?: (error: string) => void;
  onRegisterPress?: () => void;
  onForgotPasswordPress?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
  onLoginError,
  onRegisterPress,
  onForgotPasswordPress
}) => {
  const { isDarkMode } = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false);

  const emailAuth = useEmailAuth();
  const passwordValidation = usePasswordValidation();

  // Controlla se l'utente arriva da una conferma email
  useEffect(() => {
    const checkEmailVerificationSuccess = () => {
      // In React Native, i parametri URL vengono gestiti diversamente
      // Per ora disabilitiamo questa funzionalità
      // TODO: Implementare con react-navigation o linking
      setShowVerificationSuccess(false);
    };

    checkEmailVerificationSuccess();
  }, []);

  const handleLogin = async () => {
    if (!passwordValidation.password) {
      onLoginError?.('Inserisci la password');
      return;
    }

    const result = await emailAuth.handleLogin(passwordValidation.password);

    if (result.success) {
      onLoginSuccess?.();
    } else {
      onLoginError?.(result.error || 'Errore durante il login');
    }
  };

  const styles = getStyles(isDarkMode);

  return (
    <View>
      <Text style={styles.header}>MyFrigo</Text>
      <Text style={styles.subtitle}>Accedi o clicca su Registrati.</Text>

      <EmailVerificationBanner
        visible={showVerificationSuccess}
        onHide={() => setShowVerificationSuccess(false)}
      />

      <TextInput
        testID="email-input"
        style={styles.input}
        placeholder="Email"
        value={emailAuth.email}
        onChangeText={emailAuth.setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          testID="password-input"
          style={styles.input}
          placeholder="Password"
          value={passwordValidation.password}
          onChangeText={(value) => {
            passwordValidation.handlePasswordChange(value);
          }}
          secureTextEntry={!isPasswordVisible}
        />        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
        >
          <FontAwesome name={isPasswordVisible ? 'eye' : 'eye-slash'} size={20} color="#6c757d" />
        </TouchableOpacity>
      </View>

      <PasswordValidationDisplay
        validation={passwordValidation.validation}
        visible={passwordValidation.password.length > 0}
      />

      {emailAuth.error && (
        <Text style={styles.errorText}>{emailAuth.error}</Text>
      )}

      <TouchableOpacity
        testID="login-button"
        style={[styles.button, emailAuth.loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={emailAuth.loading}
      >
        {emailAuth.loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={onRegisterPress}
        disabled={emailAuth.loading}
      >
        <Text style={styles.secondaryButtonText}>Registrati</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onForgotPasswordPress}>
        <Text style={styles.forgotPasswordText}>Hai dimenticato la password?</Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 30
  },
  input: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    paddingHorizontal: 15,
    paddingRight: 50,
    borderRadius: 8,
    color: '#212529',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ced4da',
    width: '100%',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007bff',
  },
  secondaryButtonText: {
    color: '#007bff',
    fontWeight: 'bold'
  },
  forgotPasswordText: {
    color: '#007bff',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 5,
  },
  errorText: {
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 15,
  },
});