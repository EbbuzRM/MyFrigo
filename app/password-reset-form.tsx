import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
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
          Alert.alert('Errore', 'Impossibile verificare la sessione utente');
          router.replace('/login');
          return;
        }

        if (!currentSession) {
          LoggingService.error('PasswordResetForm', 'No active session found');
          Alert.alert('Errore', 'Nessuna sessione attiva. Effettua nuovamente il login.');
          router.replace('/login');
          return;
        }

        // Refresh session to Ensure we have the latest flags (like is_resetting_password)
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          LoggingService.warning('PasswordResetForm', 'Session refresh failed', refreshError);
        }

        const { data: { session: refreshedSession }, error: sessionError } = await supabase.auth.getSession();
        const currentSessionToCheck = refreshedSession || currentSession;

        if (!currentSessionToCheck) {
          LoggingService.error('PasswordResetForm', 'Critical: No session available.');
          Alert.alert('Errore', 'Sessione scaduta o non valida. Riprova il login.');
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

    // Safety timer for UI unblocking
    const timer = setTimeout(() => setIsReady(true), 2000);

    const { data: authListener } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (event === 'SIGNED_OUT' || !currentSession) {
        LoggingService.info('PasswordResetForm', 'User signed out or session lost');
        router.replace('/login');
      } else if (event === 'USER_UPDATED') {
        LoggingService.info('PasswordResetForm', 'USER_UPDATED event received from server listener');
        serverConfirmed.current = true;
        setSession(currentSession);

        // If metadata flag is cleared, redirect. 
        const isResetting = currentSession?.user.user_metadata?.is_resetting_password;
        if (currentSession && !isResetting) {
          LoggingService.info('PasswordResetForm', 'Metadata flag cleared via event, redirecting...');
          router.replace('/(tabs)');
        }
      }
    });

    return () => {
      clearTimeout(timer);
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Errore', 'Inserisci e conferma la password.');
      return;
    }

    if (!isPasswordValid(newPassword) || !passwordsMatch) {
      Alert.alert('Errore', 'La password non soddisfa tutti i requisiti di sicurezza o le password non coincidono.');
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
        await Promise.race([updatePromise, timeoutPromise]);
        LoggingService.info('PasswordResetForm', 'Atomic update request resolved normally');
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage === 'TIMEOUT' && serverConfirmed.current) {
          LoggingService.info('PasswordResetForm', 'Request timed out locally but server confirmed success via event. Both password and flag updated.');
        } else {
          throw err;
        }
      }

      Alert.alert(
        'Successo',
        'Password reimpostata con successo! Verrai reindirizzato alla dashboard.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (error: unknown) {
      LoggingService.error('PasswordResetForm', 'Error during password update', error);
      let errorMessage = error instanceof Error && error.message !== 'TIMEOUT'
        ? error.message
        : (error instanceof Error && error.message === 'TIMEOUT' ? 'Il server non ha risposto in tempo, riprova tra poco.' : 'Errore sconosciuto');

      if (errorMessage.includes('New password should be different')) {
        errorMessage = 'La nuova password deve essere diversa dalla precedente.';
      }

      Alert.alert('Errore', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled = loading || !isPasswordValid(newPassword) || !passwordsMatch;

  if (!isReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Verifica sessione...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reimposta Password</Text>
      <Text style={styles.subtitle}>
        Ciao {session?.user.email}, inserisci la tua nuova password
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          testID="new-password-input"
          style={styles.input}
          placeholder="Nuova password"
          secureTextEntry={!isPasswordVisible}
          value={newPassword}
          onChangeText={setNewPassword}
          editable={!loading}
        />
        <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
          <FontAwesome name={isPasswordVisible ? 'eye-slash' : 'eye'} size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          testID="confirm-password-input"
          style={styles.input}
          placeholder="Conferma password"
          secureTextEntry={!isConfirmPasswordVisible}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!loading}
        />
        <TouchableOpacity onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)} style={styles.eyeIcon}>
          <FontAwesome name={isConfirmPasswordVisible ? 'eye-slash' : 'eye'} size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.validationContainer}>
        <ValidationCheck text="Almeno 6 caratteri" isValid={passwordValidation.minLength} />
        <ValidationCheck text="Una lettera maiuscola" isValid={passwordValidation.hasUpper} />
        <ValidationCheck text="Una lettera minuscola" isValid={passwordValidation.hasLower} />
        <ValidationCheck text="Un numero" isValid={passwordValidation.hasNumber} />
        <ValidationCheck text="Le password coincidono" isValid={passwordsMatch} />
      </View>

      <TouchableOpacity
        testID="confirm-reset-button"
        style={[
          styles.button,
          isButtonDisabled ? styles.buttonDisabled : styles.buttonEnabled
        ]}
        onPress={handleUpdatePassword}
        disabled={isButtonDisabled}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Aggiornamento...' : 'Aggiorna Password'}
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
