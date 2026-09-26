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
import { useTranslation } from 'react-i18next';
import { FontAwesome } from '@expo/vector-icons';
import Constants from 'expo-constants';
import ConfirmHcaptcha from '@hcaptcha/react-native-hcaptcha';
import { useTheme } from '@/context/ThemeContext';
import { useEmailAuth } from '@/hooks/useEmailAuth';
import { usePasswordValidation } from '@/hooks/usePasswordValidation';
import { translateAuthError } from '@/utils/authErrorI18n';
import { PasswordValidationDisplay } from './PasswordValidationDisplay';
import { EmailVerificationBanner } from './EmailVerificationBanner';

interface LoginFormProps {
  onLoginSuccess?: () => void;
  onLoginError?: (error: string) => void;
  onRegisterPress?: () => void;
  onForgotPasswordPress?: () => void;
}

type CaptchaMessageEvent = {
  nativeEvent: { data: string };
  success: boolean;
  markUsed?: () => void;
};

export const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
  onLoginError,
  onRegisterPress,
  onForgotPasswordPress
}) => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>();
  const captchaRef = useRef<ConfirmHcaptcha>(null);
  const captchaSubmissionInFlight = useRef(false);
  const emailAuth = useEmailAuth();
  const passwordValidation = usePasswordValidation();

  const sitekey = Constants.expoConfig?.extra?.hcaptchaSitekey;

  const submitLogin = async (token?: string) => {
    // hCaptcha responses are single-use. Clear the token before the request
    // so a failed Auth response can never be retried with the same passcode.
    setCaptchaToken(undefined);
    const result = await emailAuth.handleLogin(passwordValidation.password, token);

    if (result.success) {
      onLoginSuccess?.();
    } else {
      // Boundary: map the stable AuthService/hook code to the localized text.
      // onLoginError always receives the final user-facing message.
      onLoginError?.(translateAuthError(t, result.error, result.errorParams));
      captchaRef.current?.hide();
    }
  };

  const onCaptchaMessage = (event: CaptchaMessageEvent) => {
    if (event.success) {
      const token = event.nativeEvent.data.trim();
      // The native package marks its "open" notification as successful too;
      // only an actual hCaptcha passcode (>35 chars) may reach Supabase.
      if (token.length <= 35 || captchaSubmissionInFlight.current) return;

      captchaSubmissionInFlight.current = true;
      setCaptchaToken(undefined);
      captchaRef.current?.hide();
      void submitLogin(token).finally(() => {
        event.markUsed?.();
        captchaSubmissionInFlight.current = false;
      });
    } else if (event.nativeEvent.data === 'error') {
      setCaptchaToken(undefined);
      captchaRef.current?.hide();
    } else if (event.nativeEvent.data === 'challenge-closed') {
      setCaptchaToken(undefined);
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
      onLoginError?.(t('auth.errors_rateLimitLogin', { count: minutes }));
      return;
    }
    if (!passwordValidation.password) {
      onLoginError?.(t('auth.errors_emptyPassword'));
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
      <Text style={styles.header}>{t('auth.loginHeader')}</Text>
      <Text style={styles.subtitle}>{t('auth.loginSubtitle')}</Text>

      <EmailVerificationBanner
        visible={showVerificationSuccess}
        onHide={() => setShowVerificationSuccess(false)}
      />

      <TextInput
        testID="email-input"
        style={styles.input}
        placeholder={t('auth.emailPlaceholder')}
        value={emailAuth.email}
        onChangeText={emailAuth.setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          testID="password-input"
          style={styles.input}
          placeholder={t('auth.passwordPlaceholder')}
          value={passwordValidation.password}
          onChangeText={(value) => {
            passwordValidation.handlePasswordChange(value);
          }}
          secureTextEntry={!isPasswordVisible}
        />
        <TouchableOpacity
          accessibilityLabel={t('auth.showHidePasswordLabel')}
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
        <Text style={styles.errorText}>{translateAuthError(t, emailAuth.error, emailAuth.errorParams)}</Text>
      )}

      {isBlocked && (
        <View testID="rate-limit-warning" style={styles.rateLimitBox} accessibilityRole="alert">
          <Text style={styles.rateLimitText}>
            {t('auth.errors_rateLimitLogin', { count: blockedMinutes })}
          </Text>
          <TouchableOpacity testID="rate-limit-recover-link" onPress={onForgotPasswordPress} accessibilityLabel={t('auth.recoverPasswordLink')} accessibilityRole="link">
            <Text style={styles.rateLimitLink}>{t('auth.recoverPasswordLink')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {emailAuth.attemptsLeft != null && !isBlocked && emailAuth.attemptsLeft <= 2 && emailAuth.attemptsLeft > 0 && (
        <Text testID="attempts-left-hint" style={styles.hintText}>
          {t('auth.attemptsLeftHint', { count: emailAuth.attemptsLeft })}
        </Text>
      )}

      <TouchableOpacity
        testID="login-button"
        accessibilityLabel={t('auth.signIn')}
        accessibilityRole="button"
        style={[styles.button, isLoginDisabled && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isLoginDisabled}
      >
        {emailAuth.loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isBlocked ? t('auth.blockedSuffix') + ` (${blockedMinutes}m)` : t('auth.login')}</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        testID="signup-button"
        accessibilityLabel={t('auth.signUp')}
        accessibilityRole="button"
        style={[styles.button, styles.secondaryButton]}
        onPress={onRegisterPress}
        disabled={emailAuth.loading}
      >
        <Text style={styles.secondaryButtonText}>{t('auth.signUp')}</Text>
      </TouchableOpacity>

      <TouchableOpacity testID="forgot-password-link" accessibilityLabel={t('auth.forgotPassword')} accessibilityRole="link" onPress={onForgotPasswordPress}>
        <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
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
