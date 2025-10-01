import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { LoginForm } from '@/components/LoginForm';
import { GoogleLoginButton } from '@/components/GoogleLoginButton';
import { LoggingService } from '@/services/LoggingService';

export default function LoginScreen() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const googleAuth = useGoogleAuth();

  const handleLoginSuccess = () => {
    LoggingService.info('LoginScreen', 'Login successful');
    // Il reindirizzamento sarà gestito da AuthContext
  };

  const handleLoginError = (error: string) => {
    LoggingService.error('LoginScreen', 'Login failed', { error });
    Alert.alert('Errore nel Login', error);
  };

  const handleGoogleLoginError = (error: string) => {
    LoggingService.error('LoginScreen', 'Google login failed', { error });
    Alert.alert('Errore di Autenticazione', error);
  };

  const handleSignUpRedirect = () => {
    router.push('/signup');
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container} testID="login-screen">
      <LoginForm
        onLoginSuccess={handleLoginSuccess}
        onLoginError={handleLoginError}
        onRegisterPress={handleSignUpRedirect}
        onForgotPasswordPress={handleForgotPassword}
      />

      <View style={styles.divider} />

      <GoogleLoginButton
        onPress={googleAuth.performGoogleSignIn}
        disabled={googleAuth.loading || !!googleAuth.configError}
        loading={googleAuth.loading}
        retryInProgress={googleAuth.googleRetryInProgress}
        retryAttemptNumber={googleAuth.retryAttemptNumber}
      />

      {googleAuth.configError && (
        <Text style={styles.errorText}>{googleAuth.configError}</Text>
      )}

      <Text style={styles.comingSoonText}>Disponibile nei prossimi aggiornamenti</Text>
    </View>
  );
}

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: isDarkMode ? '#0d1117' : '#fff'
  },
  divider: {
    height: 1,
    backgroundColor: isDarkMode ? '#30363d' : '#e9ecef',
    marginVertical: 20
  },
  errorText: {
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 15,
  },
  comingSoonText: {
    fontSize: 14,
    color: isDarkMode ? '#8b949e' : '#6c757d',
    textAlign: 'center',
    marginTop: -5,
    marginBottom: 10,
  },
});
