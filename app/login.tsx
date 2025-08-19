import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  View,
  TextInput,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  BackHandler,
} from 'react-native';
import { supabase } from '@/services/supabaseClient';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { LoggingService } from '@/services/LoggingService';
import { validatePassword } from '../utils/authValidation';
import { authLogger } from '@/utils/AuthLogger';
import { GoogleAuthRetryManager } from '@/utils/GoogleAuthRetryManager';
import { useAuth } from '@/context/AuthContext';

interface ValidationCheckProps {
  isValid: boolean;
  text: string;
}

const ValidationCheck: React.FC<ValidationCheckProps> = ({ isValid, text }) => (
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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
  });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [googleRetryInProgress, setGoogleRetryInProgress] = useState(false);
  const [retryAttemptNumber, setRetryAttemptNumber] = useState(0);
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false);

  const router = useRouter();
  const { session, user, profile } = useAuth();

  // Inizializza Google Sign-In
  useEffect(() => {
    try {
      const webClientId = Constants.expoConfig?.extra?.googleWebClientId;
      if (!webClientId) {
        throw new Error("Google Web Client ID not found in app.json's extra config");
      }
      
      // Log per verificare la configurazione
      LoggingService.info('Login', 'Google Sign-In configuration', {
        webClientId: webClientId ? 'Present' : 'Missing',
        expoConstants: Constants.expoConfig ? 'Present' : 'Missing',
        expoExtra: Constants.expoConfig?.extra ? 'Present' : 'Missing',
        isRunningInExpoGo: Constants.appOwnership === 'expo',
        isDevelopmentClient: Constants.appOwnership !== 'expo',
        installationId: Constants.installationId,
        sessionId: Constants.sessionId,
        deviceName: Constants.deviceName,
        platform: Platform.OS
      });
      
      GoogleSignin.configure({
        webClientId,
        offlineAccess: true,
        hostedDomain: '',
        forceCodeForRefreshToken: false,
        iosClientId: '', // Aggiungi se necessario per iOS
        googleServicePlistPath: '' // Aggiungi se necessario
      });
      
      LoggingService.info('Login', 'Google Sign-In configured successfully');
    } catch (error) {
      LoggingService.error('Login', 'Failed to configure Google Sign-In', error);
      
      // Mostra un alert specifico per l'errore di Google Sign-In
      Alert.alert(
        'Errore di Configurazione',
        'Non è stato possibile configurare Google Sign-In. Potrebbe essere necessario utilizzare un custom development client invece di Expo Go.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  // Mostra messaggio di successo se l'utente arriva dalla conferma email
  useEffect(() => {
    // Controlla se l'utente arriva da una conferma email
    const checkEmailVerificationSuccess = () => {
      // Mostra il messaggio per 5 secondi quando l'utente arriva al login
      // (presumibilmente dopo aver confermato l'email)
      const urlParams = new URLSearchParams(window.location?.search || '');
      const fromEmailConfirmation = urlParams.get('verified') === 'true';
      
      if (fromEmailConfirmation) {
        setShowVerificationSuccess(true);
        LoggingService.info('Login', 'User arrived from email verification');
        
        // Nascondi il messaggio dopo 8 secondi
        setTimeout(() => {
          setShowVerificationSuccess(false);
        }, 8000);
      }
    };

    checkEmailVerificationSuccess();
  }, []);

  // Monitora i cambiamenti del profilo per gestire il retry automatico di Google
  useEffect(() => {
    const handleGoogleRetryCheck = async () => {
      if (!session || !user || !profile || !googleRetryInProgress) return;

      try {
        LoggingService.info('Login', 'Controllo retry Google necessario', {
          userId: user.id,
          email: user.email,
          profile
        });

        const retryResult = await GoogleAuthRetryManager.analyzeRetryNeed(
          user.id,
          user.email || '',
          profile
        );

        LoggingService.info('Login', 'Risultato analisi retry', retryResult);

        if (retryResult.shouldRetry) {
          setRetryAttemptNumber(retryResult.attemptNumber);
          
          if (retryResult.message) {
            GoogleAuthRetryManager.showRetryFeedback(retryResult.attemptNumber);
          }

          // Attendi un momento prima del retry
          setTimeout(async () => {
            LoggingService.info('Login', `Esecuzione retry automatico ${retryResult.attemptNumber}/3`);
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
            LoggingService.info('Login', 'Profilo Google recuperato con successo');
          }
        }

      } catch (error) {
        LoggingService.error('Login', 'Errore durante il controllo retry Google', error);
        setGoogleRetryInProgress(false);
        setRetryAttemptNumber(0);
      }
    };

    handleGoogleRetryCheck();
  }, [session, user, profile, googleRetryInProgress]);

  // Gestisce la validazione della password
  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
    setPasswordValidation(validatePassword(text));
  }, []);

  // Gestisce il login con email e password
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLogin = async () => {
    try {
      setLoginError(null);
      setLoading(true);
      
      if (!validateEmail(email)) {
        throw new Error('Formato email non valido');
      }
      
      if (!email || !password) {
        authLogger.errorStep('LOGIN_VALIDATION', new Error('Email e password sono richieste'));
        throw new Error('Email e password sono richieste');
      }
      
      authLogger.endStep('LOGIN_VALIDATION');
      authLogger.startStep('SUPABASE_LOGIN');
      
      LoggingService.info('Login', 'Attempting direct Supabase login', { email });
      
      const startTime = Date.now();
      
      // Login diretto con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      const duration = Date.now() - startTime;
      
      if (error) {
        authLogger.errorStep('SUPABASE_LOGIN', error);
        
        // Controlla se l'errore è dovuto a email non confermata
        if (error.message?.includes('Email not confirmed') || error.message?.includes('email_not_confirmed')) {
          LoggingService.warning('Login', 'Login failed - email not confirmed', {
            duration,
            errorMessage: error.message,
            email: email
          });
          
          Alert.alert(
            'Email non confermata',
            'Per favore controlla la tua email e clicca sul link di conferma prima di accedere.',
            [{ text: 'OK' }]
          );
        } else {
          LoggingService.error('Login', 'Login failed', {
            duration,
            errorMessage: error.message,
            email: email
          });
        }
        
        throw new Error(error.message || 'Login fallito');
      }
      
      authLogger.endStep('SUPABASE_LOGIN', { duration });
      LoggingService.info('Login', 'Login successful', {
        duration,
        userId: data.user?.id,
        email: data.user?.email,
        emailConfirmed: data.user?.email_confirmed_at,
        emailVerified: data.user?.email_confirmed_at ? true : false,
        userMetadata: data.user?.user_metadata,
        session: data.session ? 'exists' : 'null'
      });
      
      // Aggiungiamo un listener per il pulsante indietro per evitare che l'utente
      // torni alla schermata di login dopo aver effettuato l'accesso
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        return true; // Impedisce il comportamento predefinito
      });
      
      // Rimuoviamo il listener dopo 3 secondi (quando l'utente dovrebbe essere già reindirizzato)
      setTimeout(() => {
        backHandler.remove();
      }, 3000);
      
      authLogger.completeAuth(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      LoggingService.error('Login', 'Login failed', error);
      setLoginError(errorMessage);
      Alert.alert('Errore nel Login', errorMessage);
      authLogger.completeAuth(false);
    } finally {
      setLoading(false);
    }
  };

  // Gestisce il reindirizzamento alla schermata di registrazione
  const handleSignUpRedirect = () => {
    router.push('/signup');
  };

  // Funzione interna per eseguire il sign-in con Google
  const performGoogleSignIn = async (isRetry: boolean = false) => {
    try {
      if (!isRetry) {
        setLoginError(null);
        authLogger.startAuth();
      }
      
      authLogger.startStep('GOOGLE_LOGIN_VALIDATION');
      
      if (Platform.OS !== 'android') {
        authLogger.errorStep('GOOGLE_LOGIN_VALIDATION', new Error('Piattaforma non supportata'));
        Alert.alert('Supporto Piattaforma', 'Il login con Google è attualmente supportato solo su Android.');
        return;
      }
      
      if (!isRetry) {
        setLoading(true);
      }
      authLogger.endStep('GOOGLE_LOGIN_VALIDATION');
      
      // Verifica che i servizi Google Play siano disponibili
      authLogger.startStep('GOOGLE_PLAY_SERVICES_CHECK');
      try {
        // Log per verificare lo stato di GoogleSignin prima di controllare i servizi
        LoggingService.info('Login', 'Checking Google Play Services', {
          isGoogleSigninAvailable: typeof GoogleSignin !== 'undefined',
          hasPlayServicesMethod: typeof GoogleSignin.hasPlayServices === 'function',
          platform: Platform.OS
        });
        
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
        // Log per verificare lo stato di GoogleSignin prima del login
        LoggingService.info('Login', 'Starting Google Sign-In', {
          isGoogleSigninAvailable: typeof GoogleSignin !== 'undefined',
          signInMethodAvailable: typeof GoogleSignin.signIn === 'function',
          platform: Platform.OS,
          appOwnership: Constants.appOwnership
        });
        
        const result = await GoogleSignin.signIn();
        LoggingService.info('Login', 'Google Sign-In result', {
          hasResult: !!result,
          hasIdToken: !!result.idToken,
          hasUser: !!result.user,
          userEmail: result.user?.email
        });
        
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
      
      // Autenticazione Google diretta con Supabase
      authLogger.startStep('SUPABASE_GOOGLE_AUTH');
      const startTime = Date.now();
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      const duration = Date.now() - startTime;

      if (error) {
        authLogger.errorStep('SUPABASE_GOOGLE_AUTH', error);
        throw new Error(error.message || 'Google login fallito');
      }
      
      authLogger.endStep('SUPABASE_GOOGLE_AUTH', { duration });
      LoggingService.info('Login', 'Google login successful', { duration, isRetry });
      
      if (!isRetry) {
        // Aggiungiamo un listener per il pulsante indietro per evitare che l'utente
        // torni alla schermata di login dopo aver effettuato l'accesso
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
          return true; // Impedisce il comportamento predefinito
        });
        
        // Rimuoviamo il listener dopo 3 secondi (quando l'utente dovrebbe essere già reindirizzato)
        setTimeout(() => {
          backHandler.remove();
        }, 3000);
        
        // Inizia il processo di retry se necessario
        setGoogleRetryInProgress(true);
      }
      
      authLogger.completeAuth(true);
      // Il listener onAuthStateChange in AuthContext gestirà il reindirizzamento
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      LoggingService.error('Login', 'Google login failed', error);
      
      // Gestione specifica per l'errore del modulo nativo di Google Sign-In
      if (errorMessage.includes('RN GoogleSignin native module is not correctly linked')) {
        LoggingService.error('Login', 'Google Sign-In native module error detected', {
          errorMessage,
          appOwnership: Constants.appOwnership,
          platform: Platform.OS
        });
        
        if (!isRetry) {
          Alert.alert(
            'Errore di Configurazione Google Sign-In',
            'Il modulo nativo di Google Sign-In non è correttamente collegato. Questo problema si verifica solitamente quando si utilizza Expo Go invece di un custom development client.\n\nPer risolvere questo problema:\n1. Crea un custom development client con EAS\n2. Esegui l\'app con il comando: npx expo start --dev-client\n3. Installa l\'app sul tuo dispositivo e avviala',
            [
              {
                text: 'OK',
                onPress: () => {
                  LoggingService.info('Login', 'User acknowledged Google Sign-In configuration error');
                }
              }
            ]
          );
          setGoogleRetryInProgress(false);
          setRetryAttemptNumber(0);
        }
      } else if (!isRetry) {
        Alert.alert('Errore di Autenticazione', errorMessage);
        setGoogleRetryInProgress(false);
        setRetryAttemptNumber(0);
      }
      
      authLogger.completeAuth(false);
      throw error;
    } finally {
      if (!isRetry) {
        setLoading(false);
      }
    }
  };

  // Gestisce il login con Google
  const handleGoogleLogin = async () => {
    try {
      await performGoogleSignIn(false);
    } catch (error) {
      // L'errore è già gestito in performGoogleSignIn
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.header}>MyFrigo</Text>
      <Text style={styles.subtitle}>Accedi o inserisci i tuoi dati per registrarti.</Text>

      {/* Messaggio di successo per verifica email */}
      {showVerificationSuccess && (
        <View style={styles.successContainer}>
          <FontAwesome name="check-circle" size={20} color="#28a745" />
          <Text style={styles.successText}>
            Account verificato! Effettua il Login per accedere.
          </Text>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={handlePasswordChange}
          secureTextEntry={!isPasswordVisible}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
        >
          <FontAwesome name={isPasswordVisible ? 'eye' : 'eye-slash'} size={20} color="#6c757d" />
        </TouchableOpacity>
      </View>

      {password.length > 0 && (
        <View style={styles.validationContainer}>
          <ValidationCheck isValid={passwordValidation.minLength} text="Almeno 6 caratteri" />
          <ValidationCheck isValid={passwordValidation.hasLower} text="Una lettera minuscola" />
          <ValidationCheck isValid={passwordValidation.hasUpper} text="Una lettera maiuscola" />
          <ValidationCheck isValid={passwordValidation.hasNumber} text="Un numero" />
        </View>
      )}

      {loginError && (
        <Text style={styles.errorText}>{loginError}</Text>
      )}

      {googleRetryInProgress && retryAttemptNumber > 0 && (
        <View style={styles.retryContainer}>
          <ActivityIndicator size="small" color="#007bff" />
          <Text style={styles.retryText}>
            Tentativo {retryAttemptNumber}/3: Recupero profilo Google...
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={handleSignUpRedirect}
        disabled={loading}
      >
        <Text style={styles.secondaryButtonText}>Registrati</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/forgot-password')}>
        <Text style={styles.forgotPasswordText}>Hai dimenticato la password?</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity
        style={[styles.button, styles.socialButton]}
        onPress={handleGoogleLogin}
        disabled={loading}
      >
        <FontAwesome name="google" size={20} color="#fff" style={styles.socialIcon} />
        <Text style={styles.buttonText}>Accedi con Google</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ------------- Styles ------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff'
  },
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
    paddingRight: 50, // Aggiunto spazio per l'icona
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
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 20
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#db4437',
  },
  socialIcon: {
    marginRight: 10
  },
  testButton: {
    backgroundColor: '#6c757d', // Colore diverso per il pulsante di test
    marginTop: 10,
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
  retryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  retryText: {
    color: '#1976d2',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  successText: {
    color: '#155724',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '600',
    flex: 1,
  }
});
