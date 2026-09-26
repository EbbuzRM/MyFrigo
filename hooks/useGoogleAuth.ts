// useGoogleAuth.ts — useGoogleAuth module.
//
// exports: useGoogleAuth
// used_by: app\login.tsx
// rules:   - This hook depends on `GoogleAuthStorage`, `AuthAttemptRepository`, and `createGoogleAuthRetryManager` which must remain instantiated via `useMemo` with stable dependencies to preserve retry state across renders.
//          - All exported functions must check `isMountedRef.current` before performing state updates to prevent memory leaks and state updates on unmounted components.
//          - The `loading`, `googleRetryInProgress`, and `retryAttemptNumber` states must be managed through the `useGoogleAuthFeedback` handler for consistent UX feedback.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Alert, Platform, BackHandler } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { LoggingService } from '@/services/LoggingService';
import { AuthService, AuthResult, AUTH_ERROR_CODES } from '@/services/AuthService';
import { translateAuthError } from '@/utils/authErrorI18n';
import { authLogger } from '@/utils/AuthLogger';
import { createGoogleAuthRetryManager } from '@/utils/GoogleAuthRetryManager';
import { GoogleAuthStorage, AuthAttemptRepository } from '@/utils/GoogleAuthStorage';
import { DEFAULT_RETRY_CONFIG } from '@/types/auth';
import { useAuth } from '@/context/AuthContext';
import { useGoogleAuthFeedback } from '@/components/GoogleAuthFeedback';

/**
 * Hook per la gestione dell'autenticazione Google
 */
export const useGoogleAuth = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [googleRetryInProgress, setGoogleRetryInProgress] = useState(false);
  const [retryAttemptNumber, setRetryAttemptNumber] = useState(0);
  const [configError, setConfigError] = useState<string | null>(null);

  const { session, user, profile } = useAuth();

  // Create retry manager instance with dependencies
  const retryManager = useMemo(() => {
    const storage = new GoogleAuthStorage();
    const repository = new AuthAttemptRepository(storage, DEFAULT_RETRY_CONFIG.retryWindowMs);
    return createGoogleAuthRetryManager(repository, DEFAULT_RETRY_CONFIG);
  }, []);

  // Create feedback handler
  const feedback = useGoogleAuthFeedback();

  // Ref to track if component is still mounted
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Refs for timer cleanup
  const backHandlerRef = useRef<{ remove: () => void } | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (backHandlerRef.current) {
        backHandlerRef.current.remove();
        backHandlerRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, []);

  // Configura Google Sign-In all'inizializzazione
  useEffect(() => {
    const configureGoogleSignIn = async () => {
      try {
        const webClientId = Constants.expoConfig?.extra?.googleWebClientId;
        if (!webClientId) {
          throw new Error("Google Web Client ID not found in app.json's extra config");
        }

        GoogleSignin.configure({
          webClientId,
          offlineAccess: true,
          hostedDomain: '',
          forceCodeForRefreshToken: false,
          iosClientId: '',
          googleServicePlistPath: ''
        });
      } catch {
        // Stable code (never a user-facing string): login.tsx maps it to the
        // `auth.errors_googleConfigError` catalog text at the UI boundary.
        setConfigError(AUTH_ERROR_CODES.GOOGLE_CONFIG_ERROR);
      }
    };

    configureGoogleSignIn();
  }, []);

  // Monitora il profilo per gestire il retry automatico di Google
  useEffect(() => {
    const handleGoogleRetryCheck = async () => {
      if (!session || !user || !profile || !googleRetryInProgress) return;

      try {
        const retryResult = await retryManager.analyzeRetryNeed(
          user.id,
          user.email || '',
          { first_name: profile?.first_name || null, last_name: profile?.last_name || null }
        );

if (retryResult.shouldRetry) {
           setRetryAttemptNumber(retryResult.attemptNumber);

           if (retryResult.message) {
             feedback.showRetryFeedback(retryResult.attemptNumber, DEFAULT_RETRY_CONFIG.maxRetryAttempts, retryResult.message);
           }

           // Attendi un momento prima del retry - con cleanup appropriato
           retryTimeoutRef.current = setTimeout(async () => {
             if (isMountedRef.current) {
               await performGoogleSignIn(true); // true indica che è un retry
             }
           }, 2000);
         } else if (retryResult.shouldShowError) {
          setGoogleRetryInProgress(false);
          setRetryAttemptNumber(0);
          feedback.showMaxAttemptsError();

        } else {
          // Successo o non necessario
          setGoogleRetryInProgress(false);
          setRetryAttemptNumber(0);
        }

      } catch {
        setGoogleRetryInProgress(false);
        setRetryAttemptNumber(0);
      }
    };

    handleGoogleRetryCheck();
  }, [session, user, profile, googleRetryInProgress]);

  const performGoogleSignIn = useCallback(async (isRetry: boolean = false): Promise<AuthResult> => {
    try {
      if (!isRetry) {
        setConfigError(null);
        authLogger.startAuth();
        LoggingService.info('useGoogleAuth', 'Google auth started');
      }

      authLogger.startStep('GOOGLE_LOGIN_VALIDATION');

      if (Platform.OS !== 'android') {
        authLogger.errorStep('GOOGLE_LOGIN_VALIDATION', new Error('Piattaforma non supportata'));
        Alert.alert(t('auth.platformUnsupportedTitle'), t('auth.errors_platformUnsupported'));
        return { success: false, error: AUTH_ERROR_CODES.GOOGLE_FAILED };
      }

      if (!isRetry) {
        setLoading(true);
      }
      authLogger.endStep('GOOGLE_LOGIN_VALIDATION');

      // Verifica che i servizi Google Play siano disponibili
      authLogger.startStep('GOOGLE_PLAY_SERVICES_CHECK');
      try {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        authLogger.endStep('GOOGLE_PLAY_SERVICES_CHECK');
      } catch (error) {
        authLogger.errorStep('GOOGLE_PLAY_SERVICES_CHECK', error);
        throw error;
      }

      // Esegue il login con Google
      authLogger.startStep('GOOGLE_SIGNIN');
      let idToken;
      try {
        const result = await GoogleSignin.signIn() as unknown as { idToken: string; user: { email: string } };
        idToken = result.idToken;
        authLogger.endStep('GOOGLE_SIGNIN');
      } catch (error) {
        authLogger.errorStep('GOOGLE_SIGNIN', error);
        throw error;
      }

      if (!idToken) {
        const error = new Error(AUTH_ERROR_CODES.GOOGLE_FAILED);
        authLogger.errorStep('GOOGLE_SIGNIN_TOKEN', error);
        throw error;
      }

      // Autenticazione con Supabase
      const authResult = await AuthService.signInWithGoogle(idToken);

      if (authResult.success) {
        if (!isRetry) {
          // Aggiungiamo un listener per il pulsante indietro - con cleanup appropriato
          backHandlerRef.current = BackHandler.addEventListener('hardwareBackPress', () => {
            return true;
          });

          // Il backHandler viene rimosso nel cleanup del useEffect in alto
          // Inizia il processo di retry se necessario
          setGoogleRetryInProgress(true);
        }

        LoggingService.info('useGoogleAuth', 'Google login successful', { isRetry });
      } else {
        // authResult.error is a stable code: a native-module misconfiguration
        // surfaces via the thrown error path below, not via AuthService.
        if (authResult.error === AUTH_ERROR_CODES.GOOGLE_CONFIG_ERROR) {
          return AuthService.handleGoogleSignInConfigurationError();
        }

        if (!isRetry) {
          Alert.alert(
            t('auth.loginErrorTitle'),
            translateAuthError(t, authResult.error, authResult.errorParams)
          );
        }
        setGoogleRetryInProgress(false);
        setRetryAttemptNumber(0);
      }

      return authResult;

    } catch (error) {
      const rawMessage = error instanceof Error
        ? error.message
        : '';
      LoggingService.error('useGoogleAuth', 'Google login failed', error);

      // Gestione errore configurazione
      if (
        rawMessage.includes(
          'RN GoogleSignin native module is not correctly linked'
        )
      ) {
        return AuthService.handleGoogleSignInConfigurationError();
      }

      if (!isRetry) {
        Alert.alert(t('auth.loginErrorTitle'), t('auth.errors_googleLoginFailed'));
      }
      setGoogleRetryInProgress(false);
      setRetryAttemptNumber(0);
      return {
        success: false,
        error: AUTH_ERROR_CODES.GOOGLE_FAILED
      };
    } finally {
      if (!isRetry) {
        setLoading(false);
      }
    }
  }, [t]);

  const clearErrors = useCallback(() => {
    setConfigError(null);
    setGoogleRetryInProgress(false);
    setRetryAttemptNumber(0);
  }, []);

  return {
    loading,
    configError,
    googleRetryInProgress,
    retryAttemptNumber,
    performGoogleSignIn,
    clearErrors,
  };
};