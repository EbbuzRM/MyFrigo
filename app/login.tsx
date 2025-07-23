import React, { useState, useEffect } from 'react';
import {
  Alert,
  View,
  TextInput,
  StyleSheet,
  Text,
  Pressable,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { supabase } from '@/services/supabaseClient';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';

const ValidationCheck = ({ isValid, text }: { isValid: boolean; text: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
    <FontAwesome
      name={isValid ? 'check-circle' : 'circle-o'}
      size={16}
      color={isValid ? '#28a745' : '#6c757d'}
    />
    <Text style={{ marginLeft: 8, color: isValid ? '#28a745' : '#6c757d' }}>{text}</Text>
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

  const router = useRouter();

  useEffect(() => {
    const webClientId = Constants.expoConfig?.extra?.googleWebClientId;
    if (!webClientId) {
      console.error("FATAL: Google Web Client ID not found in app.json's extra config.");
      return;
    }
    GoogleSignin.configure({
      webClientId,
    });
  }, []);

  const validatePassword = (text: string) => {
    setPasswordValidation({
      minLength: text.length >= 6,
      hasUpper: /[A-Z]/.test(text),
      hasLower: /[a-z]/.test(text),
      hasNumber: /\d/.test(text),
    });
  };

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Errore nel Login', error.message);
    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      console.error('[SignUp] Errore durante la registrazione:', error.message);
      Alert.alert('Errore di Registrazione', error.message);
    } else if (data.user) {
      console.log('[SignUp] Registrazione riuscita. Mostro l_alert di conferma.');
      Alert.alert(
        'Registrazione Avvenuta',
        'Controlla la tua email per confermare l account e poter accedere.',
        [{ text: 'OK', onPress: () => {
          setEmail('');
          setPassword('');
        }}]
      );
    } else {
      console.warn('[SignUp] Caso anomalo: nessuna sessione, utente o errore restituito da Supabase.');
      Alert.alert('Errore Sconosciuto', 'Si è verificato un problema durante la registrazione. Riprova.');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    if (Platform.OS !== 'android') {
        Alert.alert('Supporto Piattaforma', 'Il login con Google è attualmente supportato solo su Android.');
        return;
    }
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const { idToken } = await GoogleSignin.signIn();
      
      if (idToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });

        if (error) {
          throw new Error(`Errore Supabase: ${error.message}`);
        }
        // Il listener onAuthStateChange in AuthContext gestirà il reindirizzamento
        console.log('Login con Google (Nativo) riuscito. In attesa del listener...');

      } else {
        throw new Error('Impossibile ottenere l_idToken da Google.');
      }
    } catch (error: any) {
      console.error('Errore durante il login con Google:', error);
      Alert.alert('Errore di Autenticazione', error.message);
    } finally {
      setLoading(false);
    }
  };

  const isRegistrationDisabled =
    !email ||
    !passwordValidation.minLength ||
    !passwordValidation.hasUpper ||
    !passwordValidation.hasLower ||
    !passwordValidation.hasNumber;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>MyFrigo</Text>
      <Text style={styles.subtitle}>Accedi o inserisci i tuoi dati per registrarti.</Text>

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
          onChangeText={(text) => {
            setPassword(text);
            validatePassword(text);
          }}
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

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </Pressable>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton, isRegistrationDisabled && styles.buttonDisabled]}
        onPress={handleSignUp}
        disabled={isRegistrationDisabled || loading}
      >
        <Text style={styles.secondaryButtonText}>Registrati</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/forgot-password')}>
        <Text style={styles.forgotPasswordText}>Hai dimenticato la password?</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <Pressable
        style={[styles.button, styles.socialButton]}
        onPress={handleGoogleLogin}
        disabled={loading}
      >
        <FontAwesome name="google" size={20} color="#fff" style={styles.socialIcon} />
        <Text style={styles.buttonText}>Accedi con Google</Text>
      </Pressable>
    </View>
  );
}

/* ------------- Styles ------------- */
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 32, fontWeight: 'bold', color: '#212529', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#6c757d', textAlign: 'center', marginBottom: 30 },
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
  buttonText: { color: '#fff', fontWeight: 'bold' },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007bff',
  },
  secondaryButtonText: { color: '#007bff', fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#e9ecef', marginVertical: 20 },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#db4437',
  },
  socialIcon: { marginRight: 10 },
  forgotPasswordText: {
    color: '#007bff',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 5,
  },
});