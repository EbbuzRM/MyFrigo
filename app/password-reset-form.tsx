// password-reset-form.tsx — password-reset-form module.
//
// exports: PasswordResetForm | function
// used_by: none
// rules:   - The module expects a valid Supabase session to be established via `supabase.auth.getSession()` or server confirmation before allowing password reset; always verify `session` is not null before rendering form.
//          - Password validation must use `validatePassword` and `isPasswordValid` from `@/utils/authValidation`; never bypass or inline custom validation logic.
//          - The `serverConfirmed` ref must be checked to avoid race conditions between session recovery and user interaction.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/services/supabaseClient';
import { LoggingService } from '@/services/LoggingService';
import { useRouter } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { FontAwesome } from '@expo/vector-icons';
import { validatePassword, isPasswordValid } from '@/utils/authValidation';

// Componente per il check di validazione
const ValidationCheck = ({ text, isValid }: { text: string; isValid: boolean }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
    <FontAwesome name={isValid ? 'check-circle' : 'times-circle'} size={16} color={isValid ? 'green' : 'red'} />
    <Text style={{ marginLeft: 8, color: isValid ? 'green' : 'red' }}>{text}</Text>
  </View>
);

export default function PasswordResetForm() {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const router = useRouter();

  // Track if we received a confirmation event from the server
  const serverConfirmed = React.useRef(false);

  const passwordValidation = validatePassword(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword !== '';

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error) {
          LoggingService.error('PasswordResetForm', 'Error getting session', error);
          Alert.alert(t('auth.alertTitles_error'), t('auth.errors_sessionCheckError'));
          router.replace('/login');
          return;
        }

        if (!currentSession) {
          LoggingService.error('PasswordResetForm', 'No active session found');
          Alert.alert(t('auth.alertTitles_error'), t('auth.errors_noActiveSession'));
          router.replace('/login');
          return;
        }

        // Refresh session to Ensure we have the latest flags (like is_resetting_password)
        const { error: refreshError } = await supabase.auth.refreshSession();
        let currentSessionToCheck: Session | null;
        if (refreshError) {
          LoggingService.warning('PasswordResetForm', 'Session refresh failed, using original session', refreshError);
          currentSessionToCheck = currentSession;
        } else {
          const { data: { session: refreshedSession } } = await supabase.auth.getSession();
          // If the session is explicitly null after a successful refresh (no errors), it has expired
          if (!refreshedSession) {
            LoggingService.error('PasswordResetForm', 'Session expired after refresh.');
            Alert.alert(t('auth.alertTitles_error'), t('auth.errors_sessionExpired'));
            router.replace('/login');
            return;
          }
          currentSessionToCheck = refreshedSession;
        }

        if (!currentSessionToCheck) {
          LoggingService.error('PasswordResetForm', 'Critical: No session available.');
          Alert.alert(t('auth.alertTitles_error'), t('auth.errors_sessionExpired'));
          router.replace('/login');
          return;
        }

        setSession(currentSessionToCheck);
        LoggingService.info('PasswordResetForm', 'Session verified successfully', { userId: currentSessionToCheck.user.id });

  } catch (error) {
    LoggingService.error('PasswordResetForm', 'Unexpected error checking session', error);
  } finally {
    setIsReady(true);
  }
};

checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (event === 'SIGNED_OUT' || !currentSession) {
        LoggingService.info('PasswordResetForm', 'User signed out or session lost');
        router.replace('/login');
      } else if (event === 'USER_UPDATED') {
        LoggingService.info('PasswordResetForm', 'USER_UPDATED event received from server listener');
        serverConfirmed.current = true;
        setSession(currentSession);


      }
    });

  return () => {
    authListener.subscription.unsubscribe();
  };
  }, [router]);

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert(t('auth.alertTitles_error'), t('auth.errors_insertAndConfirmPassword'));
      return;
    }

    if (!isPasswordValid(newPassword) || !passwordsMatch) {
      Alert.alert(t('auth.alertTitles_error'), t('auth.errors_passwordRequirementsMismatch'));
      return;
    }

    setLoading(true);
    serverConfirmed.current = false; // Reset tracker
    LoggingService.info('PasswordResetForm', 'Starting password update process');

    try {
      // ATOMIC UPDATE: Password + Metadata Clear in one single request
      LoggingService.info('PasswordResetForm', 'Sending atomic update request (20s timeout)...');

      const updatePromise = supabase.auth.updateUser({
        password: newPassword,
        data: { is_resetting_password: false }
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 20000)
      );

      try {
        const result = await Promise.race([updatePromise, timeoutPromise]) as { data: { user: unknown } | null; error: { message: string } | null } | undefined;
        LoggingService.info('PasswordResetForm', 'Atomic update request resolved normally');
        if (result && result.error) {
          throw result.error;
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String(err.message) : String(err));
        if (errorMessage === 'TIMEOUT' && serverConfirmed.current) {
          LoggingService.info('PasswordResetForm', 'Request timed out locally but server confirmed success via event. Both password and flag updated.');
        } else {
          throw err;
        }
      }

      Alert.alert(
        t('auth.successTitle'),
        t('auth.successMessage'),
        [{ text: t('auth.ok'), onPress: () => router.replace('/(tabs)') }]
      );
    } catch (error: unknown) {
      LoggingService.error('PasswordResetForm', 'Error during password update', error);
      let errorMessageKey: 'auth.errors_unknownError' | 'auth.errors_serverTimeout' | 'auth.errors_newPasswordDifferent' = 'auth.errors_unknownError';
      let rawMessage = '';
      if (error instanceof Error) {
        rawMessage = error.message;
      } else if (error && typeof error === 'object' && 'message' in error) {
        rawMessage = String(error.message);
      }

      if (rawMessage === 'TIMEOUT') {
        errorMessageKey = 'auth.errors_serverTimeout';
      } else if (rawMessage.includes('New password should be different')) {
        errorMessageKey = 'auth.errors_newPasswordDifferent';
      }

      Alert.alert(t('auth.alertTitles_error'), t(errorMessageKey));
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled = loading || !isPasswordValid(newPassword) || !passwordsMatch;

  if (!isReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>{t('auth.verifyingSession')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('auth.resetPasswordTitle')}</Text>
      <Text style={styles.subtitle}>
        {t('auth.resetPasswordGreeting', { email: session?.user.email })}
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          testID="new-password-input"
          style={styles.input}
          placeholder={t('auth.newPasswordPlaceholder')}
          secureTextEntry={!isPasswordVisible}
          value={newPassword}
          onChangeText={setNewPassword}
          editable={!loading}
        />
        <TouchableOpacity accessibilityLabel={t('auth.showHidePasswordLabel')} accessibilityRole="button" onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
          <FontAwesome name={isPasswordVisible ? 'eye-slash' : 'eye'} size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          testID="confirm-password-input"
          style={styles.input}
          placeholder={t('auth.confirmPasswordPlaceholder')}
          secureTextEntry={!isConfirmPasswordVisible}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!loading}
        />
        <TouchableOpacity accessibilityLabel={t('auth.showHidePasswordLabel')} accessibilityRole="button" onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)} style={styles.eyeIcon}>
          <FontAwesome name={isConfirmPasswordVisible ? 'eye-slash' : 'eye'} size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.validationContainer}>
        <ValidationCheck text={t('auth.minLengthRequirement')} isValid={passwordValidation.minLength} />
        <ValidationCheck text={t('auth.hasUpperRequirement')} isValid={passwordValidation.hasUpper} />
        <ValidationCheck text={t('auth.hasLowerRequirement')} isValid={passwordValidation.hasLower} />
        <ValidationCheck text={t('auth.hasNumberRequirement')} isValid={passwordValidation.hasNumber} />
        <ValidationCheck text={t('auth.passwordsMatchRequirement')} isValid={passwordsMatch} />
      </View>

      <TouchableOpacity
        testID="confirm-reset-button"
        accessibilityLabel={t('auth.updatePasswordButton')}
        accessibilityRole="button"
        style={[
          styles.button,
          isButtonDisabled ? styles.buttonDisabled : styles.buttonEnabled
        ]}
        onPress={handleUpdatePassword}
        disabled={isButtonDisabled}
      >
        <Text style={styles.buttonText}>
          {loading ? t('auth.updatingPassword') : t('auth.updatePasswordButton')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonEnabled: {
    backgroundColor: '#000', // Nero quando attivo
  },
  buttonDisabled: {
    backgroundColor: '#ccc', // Grigio quando disabilitato
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    paddingRight: 40, // Spazio per l'icona
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  validationContainer: {
    marginBottom: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 8,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
