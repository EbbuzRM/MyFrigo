import { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { supabase } from '@/services/supabaseClient';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Errore', 'Inserisci la tua email.');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'myfrigo://password-reset', // oppure: https://myfrigo.vercel.app/password-reset
    });

    if (error) {
      Alert.alert('Errore', error.message);
    } else {
      Alert.alert('Email inviata', 'Controlla la tua email per il link di reset.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recupero Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Inserisci la tua email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <Button title="Invia Link di Reset" onPress={handleReset} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, marginBottom: 16, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 20 },
});
