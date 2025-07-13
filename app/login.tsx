import React, { useState, useEffect } from 'react';
import { Alert, View, TextInput, StyleSheet, Text, Pressable } from 'react-native';
import { supabase } from '@/services/supabaseClient';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);


  async function handleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert('Errore nel Login', error.message);
    }
    setLoading(false);
  }

  async function handleSignUp() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
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
    const redirectUri = makeRedirectUri({
      scheme: 'myfrigo',
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
      },
    });

    if (error) {
      Alert.alert('Errore Login Google', error.message);
    } else if (data.url) {
      await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>MyFrigo</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Login in corso...' : 'Login'}</Text>
      </Pressable>
      <Pressable style={[styles.button, styles.secondaryButton]} onPress={handleSignUp} disabled={loading}>
        <Text style={styles.secondaryButtonText}>Registrati</Text>
      </Pressable>
      
      <View style={styles.divider} />

      <Pressable style={[styles.button, styles.socialButton]} onPress={handleGoogleLogin} disabled={loading}>
        <FontAwesome name="google" size={20} color="#fff" style={styles.socialIcon} />
        <Text style={styles.buttonText}>Accedi con Google</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    color: '#212529',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ced4da',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007bff',
  },
  secondaryButtonText: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 20,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#db4437',
  },
  socialIcon: {
    marginRight: 10,
  },
});