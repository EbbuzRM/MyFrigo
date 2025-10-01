import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform, BackHandler } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { LoggingService } from '@/services/LoggingService';
import { AuthService, AuthResult } from '@/services/AuthService';
import { authLogger } from '@/utils/AuthLogger';
import { GoogleAuthRetryManager } from '@/utils/GoogleAuthRetryManager';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook per la gestione dell'autenticazione Google
 */
export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const [googleRetryInProgress, setGoogleRetryInProgress] = useState(false);
  const [retryAttemptNumber, setRetryAttemptNumber] = useState(0);
  const [configError, setConfigError] = useState<string | null>(null);

  const { session, user, profile } = useAuth();

  // Configura Google Sign-In all'inizializzazione
  useEffect(() => {
    const configureGoogleSignIn = async () => {
      try {
        const webClientId = Constants.expoConfig?.extra?.googleWebClientId;
        if (!webClientId) {
          throw new Error("Google Web Client ID not found in app.json's extra config");
        }

        LoggingService.info('useGoogleAuth', 'Google Sign-In configuration', {
          webClientId: webClientId ? 'Present' : 'Missing',
          platform: Platform.OS
        });

        GoogleSignin.configure({
          webClientId,
          offlineAccess: true,
          hostedDomain: '',
          forceCodeForRefreshToken: false,
          iosClientId: '',
          googleServicePlistPath: ''
        });

        LoggingService.info('useGoogleAuth', 'Google Sign-In configured successfully');
      } catch (error) {
        LoggingService.error('useGoogleAuth', 'Failed to configure Google Sign-In', error);
        setConfigError('Errore di configurazione Google Sign-In');
      }
    };

    configureGoogleSignIn();
  }, []);

  // Monitora il profilo per gestire il retry automatico di Google
  useEffect(() => {
    const handleGoogleRetryCheck = async () => {
      if (!session || !user || !profile || !googleRetryInProgress) return;

      try {
        LoggingService.info('useGoogleAuth', 'Controllo retry Google necessario', {
          userId: user.id,
          email: user.email,
          profile
        });

        const retryResult = await GoogleAuthRetryManager.analyzeRetryNeed(
          user.id,
          user.email || '',
          { first_name: profile?.first_name || null, last_name: profile?.last_name || null }
        );

        LoggingService.info('useGoogleAuth', 'Risultato analisi retry', retryResult);

        if (retryResult.shouldRetry) {
          setRetryAttemptNumber(retryResult.attemptNumber);

          if (retryResult.message) {
            GoogleAuthRetryManager.showRetryFeedback(retryResult.attemptNumber);
          }

          // Attendi un momento prima del retry
          setTimeout(async () => {
            LoggingService.info('useGoogleAuth', `Esecuzione retry automatico ${retryResult.attemptNumber}/3`);
            await performGoogleSignIn(true); // true indica che è un retry
          }, 2000);

        } else if (retryResult.shouldShowError) {
          setGoogleRetryInProgress(false);
          setRetryAttemptNumber(0);
          GoogleAuthRetryManager.showMaxAttemptsError();

        } else {
          // Successo o non necessario
          setGoogleRetryInProgress(false);
          setRetryAttemptNumber(0);
          if (retryResult.isExistingUser) {
            LoggingService.info('useGoogleAuth', 'Profilo Google recuperato con successo');
          }
        }

      } catch (error) {
        LoggingService.error('useGoogleAuth', 'Errore durante il controllo retry Google', error);
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
      }

      authLogger.startStep('GOOGLE_LOGIN_VALIDATION');

      if (Platform.OS !== 'android') {
        authLogger.errorStep('GOOGLE_LOGIN_VALIDATION', new Error('Piattaforma non supportata'));
        Alert.alert('Supporto Piattaforma', 'Il login con Google è attualmente supportato solo su Android.');
        return { success: false, error: 'Piattaforma non supportata' };
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
        const error = new Error('Impossibile ottenere il token da Google');
        authLogger.errorStep('GOOGLE_SIGNIN_TOKEN', error);
        throw error;
      }

      // Autenticazione con Supabase
      const authResult = await AuthService.signInWithGoogle(idToken);

      if (authResult.success) {
        if (!isRetry) {
          // Aggiungiamo un listener per il pulsante indietro
          const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            return true;
          });

          setTimeout(() => {
            backHandler.remove();
          }, 3000);

          // Inizia il processo di retry se necessario
          setGoogleRetryInProgress(true);
        }

        LoggingService.info('useGoogleAuth', 'Google login successful', { isRetry });
      } else {
        // Gestione errori specifici
        if (authResult.error?.includes('RN GoogleSignin native module is not correctly linked')) {
          return AuthService.handleGoogleSignInConfigurationError();
        }

        if (!isRetry) {
          Alert.alert(
            'Errore di Autenticazione',
            authResult.error || 'Errore sconosciuto'
          );
        }
        setGoogleRetryInProgress(false);
        setRetryAttemptNumber(0);
      }

      return authResult;

    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Errore sconosciuto';
      LoggingService.error('useGoogleAuth', 'Google login failed', error);

      // Gestione errore configurazione
      if (
        errorMessage.includes(
          'RN GoogleSignin native module is not correctly linked'
        )
      ) {
        return AuthService.handleGoogleSignInConfigurationError();
      }

      if (!isRetry) {
        Alert.alert('Errore di Autenticazione', errorMessage);
      }
      setGoogleRetryInProgress(false);
      setRetryAttemptNumber(0);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      if (!isRetry) {
        setLoading(false);
      }
    }
  }, []);

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