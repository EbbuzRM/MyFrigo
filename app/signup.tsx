import React, { useState } from 'react';
import {
  Alert,
  View,
  TextInput,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '@/services/supabaseClient';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { LoggingService } from '@/services/LoggingService';
import { validatePassword } from '../utils/authValidation';


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

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
  });
  const [signupError, setSignupError] = useState<string | null>(null);

  const router = useRouter();

  // Gestisce la validazione della password
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setPasswordValidation(validatePassword(text));
  };

  // Gestisce la registrazione - SEMPLIFICATO
  const handleSignUp = async () => {
    try {
      LoggingService.info('Signup', 'Starting simple registration process', {
        email: email,
        hasFirstName: !!firstName,
        hasLastName: !!lastName
      });
      
      // Reset errore prima di iniziare
      setSignupError(null);
      LoggingService.debug('Signup', 'Error state reset before registration');
      
      setLoading(true);
      LoggingService.debug('Signup', 'Loading state set to true');
      
      // Verifica che tutti i requisiti siano soddisfatti
      if (isRegistrationDisabled) {
        const errorMsg = 'Completa tutti i campi richiesti e assicurati che la password rispetti i requisiti';
        LoggingService.warning('Signup', 'Registration disabled due to validation', {
          isRegistrationDisabled,
          email: !!email,
          firstName: !!firstName,
          lastName: !!lastName,
          passwordValidation
        });
        throw new Error(errorMsg);
      }
      
      // Valida che nome e cognome siano stati inseriti
      const trimmedFirstName = firstName.trim();
      const trimmedLastName = lastName.trim();
      
      if (!trimmedFirstName || !trimmedLastName) {
        LoggingService.warning('Signup', 'First name or last name is empty');
        Alert.alert('Dati Mancanti', 'Per favore, inserisci nome e cognome per completare la registrazione.');
        return;
      }

      // Controlla se l'email esiste già
      const { data: emailExists, error: rpcError } = await supabase.rpc('check_email_exists', { email_to_check: email });

      if (rpcError) {
        LoggingService.error('Signup', 'RPC call to check_email_exists failed', rpcError);
        throw new Error("Errore durante la verifica dell'email. Riprova.");
      }

      if (emailExists) {
        Alert.alert('Email già registrata', 'Questo indirizzo email è già in uso. Prova ad accedere.');
        setLoading(false);
        return;
      }

      LoggingService.info('Signup', 'Calling Supabase signup directly', {
        email: email,
        firstName: trimmedFirstName,
        lastName: trimmedLastName
      });

      // REGISTRAZIONE DIRETTA CON SUPABASE - SEMPLICE E AFFIDABILE
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            first_name: trimmedFirstName,
            last_name: trimmedLastName,
            full_name: `${trimmedFirstName} ${trimmedLastName}`
          }
        }
      });

      if (error) {
        LoggingService.error('Signup', 'Supabase signup failed', {
          code: error.code,
          message: error.message,
          status: error.status
        });
        throw new Error(error.message);
      }

      if (data.user) {
        LoggingService.info('Signup', 'Registration successful', {
          userId: data.user.id,
          email: data.user.email,
          emailConfirmed: data.user.email_confirmed_at,
          needsConfirmation: !data.user.email_confirmed_at
        });

        // Crea il profilo utente nella tabella users
        if (data.user.email_confirmed_at) {
          // Se l'email è già confermata, crea subito il profilo
          LoggingService.info('Signup', 'Email already confirmed, creating profile');
          const { error: profileError } = await supabase
            .from('users')
            .upsert({
              id: data.user.id,
              first_name: trimmedFirstName,
              last_name: trimmedLastName,
              updated_at: new Date().toISOString()
            });

          if (profileError) {
            LoggingService.error('Signup', 'Profile creation failed', profileError);
            // Non bloccare la registrazione per questo errore
          } else {
            LoggingService.info('Signup', 'Profile created successfully');
          }
        }
        
        if (data.user.email_confirmed_at) {
          // Email già confermata - vai al login
          Alert.alert(
            'Registrazione Completata',
            'Registrazione completata con successo! Puoi accedere subito.',
            [{
              text: 'OK',
              onPress: () => {
                LoggingService.info('Signup', 'User with confirmed email redirected to login', { userId: data.user?.id });
                router.replace('/login');
              }
            }]
          );
        } else {
          // Reindirizza alla nuova pagina di conferma OTP
          router.replace({
            pathname: '/confirm-email',
            params: { email: data.user.email },
          });
        }
      } else {
        LoggingService.error('Signup', 'No user created during signup');
        throw new Error('Registrazione fallita: nessun utente creato');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      LoggingService.error('Signup', 'Registration failed', {
        error: error,
        errorMessage: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Aggiorna lo stato errore
      setSignupError(errorMessage);
      LoggingService.debug('Signup', 'Error state updated', { errorMessage });
      
      // Mostra alert
      Alert.alert(
        'Errore di Registrazione',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      LoggingService.info('Signup', 'Registration process completed', {
        hasError: !!signupError,
        currentError: signupError
      });
      setLoading(false);
      LoggingService.debug('Signup', 'Loading state set to false');
    }
  };

  // Verifica se la registrazione è disabilitata
  const isRegistrationDisabled =
    !email ||
    !firstName ||
    !lastName ||
    !passwordValidation.minLength ||
    !passwordValidation.hasUpper ||
    !passwordValidation.hasLower ||
    !passwordValidation.hasNumber;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Registrati</Text>
      <Text style={styles.subtitle}>Crea il tuo account MyFrigo</Text>

      <Text style={styles.label}>Nome</Text>
      <TextInput
        style={styles.input}
        placeholder="Il tuo nome"
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
        editable={!loading}
      />
      
      <Text style={styles.label}>Cognome</Text>
      <TextInput
        style={styles.input}
        placeholder="Il tuo cognome"
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
        editable={!loading}
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="La tua email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />

      <Text style={styles.label}>Password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.input}
          placeholder="La tua password"
          value={password}
          onChangeText={handlePasswordChange}
          secureTextEntry={!isPasswordVisible}
          editable={!loading}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          disabled={loading}
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

      {signupError && (
        <Text style={styles.errorText}>{signupError}</Text>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignUp}
        disabled={isRegistrationDisabled || loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Registrati</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.backText}>Torna al login</Text>
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
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    paddingHorizontal: 15,
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
    right: 15,
    top: 18,
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
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  errorText: {
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 15,
  },
  backText: {
    color: '#007bff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  }
});