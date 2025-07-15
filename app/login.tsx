import React, { useState, useEffect } from 'react';
import { Alert, View, TextInput, StyleSheet, Text, Pressable, ActivityIndicator, TouchableOpacity } from 'react-native';
import { supabase } from '@/services/supabaseClient';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

// Componente helper per la checklist di validazione
const ValidationCheck = ({ isValid, text }: { isValid: boolean; text: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
    <FontAwesome name={isValid ? 'check-circle' : 'circle-o'} size={16} color={isValid ? '#28a745' : '#6c757d'} />
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

  const validatePassword = (text: string) => {
    const minLength = text.length >= 6;
    const hasUpper = /[A-Z]/.test(text);
    const hasLower = /[a-z]/.test(text);
    const hasNumber = /\d/.test(text);
    setPasswordValidation({ minLength, hasUpper, hasLower, hasNumber });
  };

  useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);

  async function handleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Errore nel Login', error.message);
    setLoading(false);
  }

  async function handleSignUp() {
    setLoading(true);
    const redirectUri = makeRedirectUri({ scheme: 'myfrigo', path: '/auth-callback' });
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUri },
    });
    if (error) {
      Alert.alert('Errore nella Registrazione', error.message);
    } else {
      router.replace('/registration-confirmation');
    }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    setLoading(true);
    const redirectUri = makeRedirectUri({ scheme: 'myfrigo' });
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUri },
    });

    if (error) {
      Alert.alert('Errore Login Google', error.message);
    } else if (data.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
      if (result.type === 'error' || result.type === 'cancel') {
        // L'utente ha annullato o c'è stato un errore
        console.log('OAuth flow cancelled or failed', result);
      }
      // Se il login ha successo, il listener in AuthContext gestirà la sessione.
    }
    setLoading(false);
  }

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
        onPress={() => handleLogin()}
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

      <View style={styles.divider} />

      <Pressable
        style={[styles.button, styles.socialButton /* , loading && styles.buttonDisabled */]}
        onPress={() => handleGoogleLogin()}
      >
        <FontAwesome name="google" size={20} color="#fff" style={styles.socialIcon} />
        <Text style={styles.buttonText}>Accedi con Google</Text>
      </Pressable>
    </View>
  );
}

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
    marginBottom: 15,
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 18, // Potrebbe richiedere un aggiustamento fine
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
});
