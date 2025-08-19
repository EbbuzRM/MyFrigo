import { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { supabase } from '@/services/supabaseClient';
import { LoggingService } from '@/services/LoggingService';
import { useRouter } from 'expo-router';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  
  const router = useRouter();

  // Metodo principale: reset con OTP
  const handleResetWithOTP = async () => {
    if (!email.trim()) {
      Alert.alert('Errore', 'Inserisci la tua email.');
      return;
    }

    setLoading(true);
    LoggingService.info('ForgotPassword', 'Starting password reset with OTP', { email });

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        // Non specifichiamo redirectTo per ricevere un OTP invece di un link
      });

      if (error) {
        LoggingService.error('ForgotPassword', `Error sending password reset email: ${error.message}`, error);
        let errorMessage = 'Errore nell\'invio dell\'email di reset della password. Si prega di riprovare.';
        
        // Errori specifici di Supabase
        if (error.message.includes('User not found')) {
          errorMessage = 'Nessun account trovato con questa email.';
        } else if (error.message.includes('Rate limit')) {
          errorMessage = 'Troppe richieste. Attendi qualche minuto prima di riprovare.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'L\'indirizzo email inserito non è valido.';
        }
        
        Alert.alert('Errore', errorMessage);
        return;
      }

      LoggingService.info('ForgotPassword', 'Password reset email sent successfully');
      Alert.alert('Successo', 'Email di reset della password inviata. Si prega di controllare la posta in arrivo.');
      setShowOtpInput(true);
    } catch (error: any) {
      LoggingService.error('ForgotPassword', 'Unexpected error during OTP reset', error);
      Alert.alert('Errore', error.message || 'Errore durante l\'invio del codice OTP');
    } finally {
      setLoading(false);
    }
  };

  // Verifica OTP e reindirizza al reset form
  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert('Errore', 'Inserisci un codice OTP valido a 6 cifre.');
      return;
    }

    setLoading(true);
    LoggingService.info('ForgotPassword', 'Verifying OTP', { email, otpLength: otp.length });

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery'
      });

      if (error) {
        LoggingService.error('ForgotPassword', 'OTP verification failed', error);
        let errorMessage = 'Codice OTP non valido o scaduto.';
        
        if (error.message.includes('Token has expired')) {
          errorMessage = 'Il codice OTP è scaduto. Richiedi un nuovo codice.';
        } else if (error.message.includes('Invalid token')) {
          errorMessage = 'Il codice OTP inserito non è corretto.';
        }
        
        Alert.alert('Errore', errorMessage);
        return;
      }

      LoggingService.info('ForgotPassword', 'OTP verified successfully', { userId: data.user?.id });
      // Aggiungi un flag alla sessione per indicare che stiamo facendo il reset password
      LoggingService.info('ForgotPassword', 'Updating user metadata with reset password flag');
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          is_resetting_password: true
        }
      });
      
      if (updateError) {
        LoggingService.error('ForgotPassword', 'Failed to update user metadata', updateError);
        Alert.alert('Errore', 'Impossibile aggiornare lo stato di reset password');
        return;
      }

      LoggingService.info('ForgotPassword', 'User metadata updated successfully', { userId: data.user?.id });
      // Reindirizza alla pagina di reimpostazione password
      router.replace('/password-reset-form');
    } catch (error: any) {
      LoggingService.error('ForgotPassword', 'Unexpected error during OTP verification', error);
      Alert.alert('Errore', error.message || 'Errore durante la verifica del codice');
    }
 finally {
      setLoading(false);
    }
  };

  // Metodo principale che delega al metodo scelto (ora solo OTP)
  const handleReset = async () => {
    await handleResetWithOTP();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recupero Password</Text>

      {/* Input email */}
      <TextInput
        style={styles.input}
        placeholder="Inserisci la tua email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
      />

      {!showOtpInput && (
        <>
          <Text style={styles.infoText}>
            Ti invieremo un codice OTP alla tua email per reimpostare la password.
          </Text>
          <Button title="Invia Codice OTP" onPress={handleReset} disabled={loading} />
        </>
      )}

      {showOtpInput && (
        <View>
          <View style={styles.otpSection}>
            <Text style={styles.otpSectionTitle}>Inserisci il codice OTP</Text>
            <Text style={styles.otpInfoText}>Controlla la tua email per il codice di verifica a 6 cifre.</Text>

            <TextInput
              style={styles.input}
              placeholder="Codice a 6 cifre"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
            />
            <Button title="Verifica Codice" onPress={handleVerifyOTP} disabled={loading} />
            <View style={{ marginTop: 20 }}>
              <Button
                title="Torna all'email"
                onPress={() => {
                  setShowOtpInput(false);
                  setOtp('');
                }}
                disabled={loading}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, marginBottom: 16, fontWeight: 'bold', textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 16 },
  loader: { marginTop: 20 },
  infoText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  switchContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  switchText: { fontSize: 14, color: '#666', marginRight: 8 },
  switchLinkText: { fontSize: 14, fontWeight: 'bold' },
  otpSection: { marginTop: 20 },
  otpSectionTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  otpInfoText: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16 },
  passwordResetSection: { marginTop: 20 },
  passwordResetTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  passwordInfoText: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16 },
  errorText: { color: 'red', textAlign: 'center', marginTop: 8 }
});