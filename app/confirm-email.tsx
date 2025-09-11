import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/services/supabaseClient';
import { LoggingService } from '@/services/LoggingService';

export default function ConfirmEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerifyOtp = async () => {
    if (!email || !otp) {
      setError('Per favore, inserisci il codice di verifica.');
      return;
    }

    setLoading(true);
    setError(null);
    LoggingService.info('ConfirmEmailOTP', 'Attempting to verify OTP', { email });

    try {
      const { data, error: verificationError } = await supabase.auth.verifyOtp({
        email: email,
        token: otp,
        type: 'signup',
      });

      if (verificationError) {
        LoggingService.error('ConfirmEmailOTP', 'OTP verification failed', verificationError);
        throw verificationError;
      }

      LoggingService.info('ConfirmEmailOTP', 'OTP verification successful', { user: data.user });
      Alert.alert(
        'Registrazione Completata!',
        'La tua email è stata verificata con successo. Sarai reindirizzato alla dashboard.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/');
            },
          },
        ]
      );
    } catch (e: any) {
      const errorMessage = e.message || 'Codice OTP non valido o scaduto.';
      setError(errorMessage);
      LoggingService.error('ConfirmEmailOTP', 'An exception occurred during OTP verification', e);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      Alert.alert('Errore', 'Indirizzo email non trovato. Torna alla registrazione.');
      return;
    }

    setLoading(true);
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    setLoading(false);

    if (resendError) {
      Alert.alert('Errore', 'Impossibile inviare un nuovo codice. Riprova più tardi.');
      LoggingService.error('ConfirmEmailOTP', 'Failed to resend OTP', resendError);
    } else {
      Alert.alert('Inviato!', 'Un nuovo codice di verifica è stato inviato alla tua email.');
      LoggingService.info('ConfirmEmailOTP', 'Resent OTP successfully', { email });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Verifica la tua Email</Text>
        <Text style={styles.subtitle}>
          Abbiamo inviato un codice di 6 cifre a <Text style={styles.emailText}>{email}</Text>.
          Inseriscilo qui sotto per continuare.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="123456"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
          editable={!loading}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, (loading || otp.length < 6) && styles.buttonDisabled]}
          onPress={handleVerifyOtp}
          disabled={loading || otp.length < 6}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verifica e Accedi</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.resendButton} onPress={handleResendOtp} disabled={loading}>
          <Text style={styles.resendButtonText}>Invia di nuovo il codice</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
    lineHeight: 24,
  },
  emailText: {
    fontWeight: 'bold',
    color: '#007bff',
  },
  input: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 10,
    borderWidth: 1,
    borderColor: '#ced4da',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#007bff',
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resendButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendButtonText: {
    color: '#007bff',
    fontSize: 15,
    fontWeight: '500',
  },
  errorText: {
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 15,
  },
});