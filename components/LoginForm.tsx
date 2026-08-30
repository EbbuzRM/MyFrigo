// LoginForm.tsx — LoginForm module.
//
// exports: LoginForm
// used_by: app\login.tsx
// rules:   - All authentication flows must use `useEmailAuth` and `usePasswordValidation` hooks, never direct `AuthService` calls
//          - Theme-aware styling must use `useTheme()` context hook, not hardcoded colors or manual dark mode checks
//          - Login form state (password visibility, verification success) must be managed locally, not in external state
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Constants from 'expo-constants';
import ConfirmHcaptcha from '@hcaptcha/react-native-hcaptcha';
import { useTheme } from '@/context/ThemeContext';
import { useEmailAuth } from '@/hooks/useEmailAuth';
import { usePasswordValidation } from '@/hooks/usePasswordValidation';
import { PasswordValidationDisplay } from './PasswordValidationDisplay';
import { EmailVerificationBanner } from './EmailVerificationBanner';

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
  const [captchaToken, setCaptchaToken] = useState<string>();
  const captchaRef = useRef<ConfirmHcaptcha>(null);
  const emailAuth = useEmailAuth();
  const passwordValidation = usePasswordValidation();

  const sitekey = Constants.expoConfig?.extra?.hcaptchaSitekey;

  const submitLogin = async (token?: string) => {
    const result = await emailAuth.handleLogin(passwordValidation.password, token);

    if (result.success) {
      onLoginSuccess?.();
    } else {
      onLoginError?.(result.error || 'Errore durante il login');
      setCaptchaToken(undefined);
      captchaRef.current?.hide();
    }
  };

  const onCaptchaMessage = (event: { nativeEvent: { data: string }; success: boolean }) => {
    if (event.success) {
      const token = event.nativeEvent.data;
      setCaptchaToken(token);
      captchaRef.current?.hide();
      submitLogin(token);
    } else if (event.nativeEvent.data === 'error') {
      captchaRef.current?.hide();
    } else if (event.nativeEvent.data === 'challenge-closed') {
      captchaRef.current?.hide();
    }
  };

  // Controlla se l'utente arriva da una conferma email
  useEffect(() => {
    const checkEmailVerificationSuccess = () => {
      // In React Native, i parametri URL vengono gestiti tramite linking configuration
      // o tramite l'uso di expo-linking per intercettare l'URL di apertura.
      // Poiché il LoginForm è tipicamente una vista di accesso, l'utente 
      // che ha già verificato l'email dovrebbe essere reindirizzato automaticamente 
      // alla home o a una pagina di successo se l'auth state è già attivo.
      setShowVerificationSuccess(false);
    };

    checkEmailVerificationSuccess();
  }, []);

  const handleLogin = async () => {
    if (emailAuth.isRateLimited) {
      const minutes = Math.ceil((emailAuth.remainingMs || 0) / 60000);
      onLoginError?.(`Troppi tentativi di login. Riprova tra ${minutes} minuti.`);
      return;
    }
    if (!passwordValidation.password) {
      onLoginError?.('Inserisci la password');
      return;
    }

    if (sitekey && sitekey !== 'YOUR_HCAPTCHA_SITEKEY' && !captchaToken) {
      captchaRef.current?.show();
      return;
    }

    await submitLogin(captchaToken);
  };

  const styles = getStyles(isDarkMode);
  const isBlocked = !!emailAuth.isRateLimited;
  const blockedMinutes = isBlocked ? Math.ceil((emailAuth.remainingMs || 0) / 60000) : 0;
  const isLoginDisabled = emailAuth.loading || isBlocked;

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
        />
        <TouchableOpacity
          accessibilityLabel="Mostra password"
          accessibilityRole="button"
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

      {isBlocked && (
        <View testID="rate-limit-warning" style={styles.rateLimitBox} accessibilityRole="alert">
          <Text style={styles.rateLimitText}>
            Troppi tentativi. Riprova tra {blockedMinutes} {blockedMinutes === 1 ? 'minuto' : 'minuti'}.
          </Text>
          <TouchableOpacity testID="rate-limit-recover-link" onPress={onForgotPasswordPress} accessibilityLabel="Recupera password" accessibilityRole="link">
            <Text style={styles.rateLimitLink}>Recupera password</Text>
          </TouchableOpacity>
        </View>
      )}

      {emailAuth.attemptsLeft != null && !isBlocked && emailAuth.attemptsLeft <= 2 && emailAuth.attemptsLeft > 0 && (
        <Text testID="attempts-left-hint" style={styles.hintText}>
          Tentativi rimasti: {emailAuth.attemptsLeft}
        </Text>
      )}

      <TouchableOpacity
        testID="login-button"
        accessibilityLabel="Accedi"
        accessibilityRole="button"
        style={[styles.button, isLoginDisabled && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isLoginDisabled}
      >
        {emailAuth.loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isBlocked ? `Bloccato (${blockedMinutes}m)` : 'Login'}</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        testID="signup-button"
        accessibilityLabel="Registrati"
        accessibilityRole="button"
        style={[styles.button, styles.secondaryButton]}
        onPress={onRegisterPress}
        disabled={emailAuth.loading}
      >
        <Text style={styles.secondaryButtonText}>Registrati</Text>
      </TouchableOpacity>

      <TouchableOpacity testID="forgot-password-link" accessibilityLabel="Hai dimenticato la password?" accessibilityRole="link" onPress={onForgotPasswordPress}>
        <Text style={styles.forgotPasswordText}>Hai dimenticato la password?</Text>
      </TouchableOpacity>

      {sitekey && sitekey !== 'YOUR_HCAPTCHA_SITEKEY' && (
        <ConfirmHcaptcha
          ref={captchaRef}
          siteKey={sitekey}
          baseUrl="https://hcaptcha.com"
          onMessage={onCaptchaMessage}
          size="normal"
        />
      )}
    </View>
  );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: isDarkMode ? '#ffffff' : '#212529',
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
     width: 44,
     height: 44,
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
  rateLimitBox: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffc107',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    alignItems: 'center',
  },
  rateLimitText: {
    color: '#856404',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 6,
  },
  rateLimitLink: {
    color: '#007bff',
    textAlign: 'center',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  hintText: {
    color: '#856404',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 13,
  },
});