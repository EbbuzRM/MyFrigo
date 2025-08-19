import { useState, useEffect } from 'react';
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

        const isResetting = currentSession.user.user_metadata?.is_resetting_password;
        if (!isResetting) {
          LoggingService.error('PasswordResetForm', 'User not in password reset mode');
          Alert.alert('Errore', 'Sessione non valida per il reset password');
          router.replace('/login');
          return;
        }

        setSession(currentSession);
        setIsReady(true);
        LoggingService.info('PasswordResetForm', 'Session verified successfully', { userId: currentSession.user.id });
      } catch (error) {
        LoggingService.error('PasswordResetForm', 'Unexpected error checking session', error);
        Alert.alert('Errore', 'Errore durante la verifica della sessione');
        router.replace('/login');
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (event === 'SIGNED_OUT' || !currentSession) {
        LoggingService.info('PasswordResetForm', 'User signed out or session lost');
        router.replace('/login');
      } else if (event === 'USER_UPDATED') {
        setSession(currentSession);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const handleUpdatePassword = async () => {
    if (!isPasswordValid(newPassword) || !passwordsMatch) {
      Alert.alert('Errore', 'La password non soddisfa tutti i requisiti di sicurezza o le password non coincidono.');
      return;
    }

    setLoading(true);
    LoggingService.info('PasswordResetForm', 'Updating password');

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        data: {
          is_resetting_password: false
        }
      });

      if (error) {
        LoggingService.error('PasswordResetForm', 'Password update failed', error);
        let errorMessage = error.message;
        
        if (error.message.includes('New password should be different from the old password')) {
          errorMessage = 'La nuova password deve essere diversa dalla precedente.';
        }
        
        Alert.alert('Errore', errorMessage);
        return;
      }

      LoggingService.info('PasswordResetForm', 'Password updated successfully');
      Alert.alert(
        'Successo', 
        'Password reimpostata con successo! Verrai reindirizzato alla dashboard.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (error: any) {
      LoggingService.error('PasswordResetForm', 'Unexpected error during password update', error);
      Alert.alert('Errore', error.message || 'Errore durante l\'aggiornamento della password');
    } finally {
      setLoading(false);
    }
  };

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

      <Button
        title="Aggiorna Password"
        onPress={handleUpdatePassword}
        disabled={loading || !isPasswordValid(newPassword) || !passwordsMatch}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
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
