import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

export default function CompleteProfileScreen() {
  const { updateProfile, refreshUserProfile } = useAuth(); // Usa refreshUserProfile
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCompleteProfile = async () => {
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName || !trimmedLastName) {
      Alert.alert('Attenzione', 'Per favore, inserisci nome e cognome.');
      return;
    }

    setSaving(true);
    try {
      // Ora basta chiamare updateProfile.
      // Al suo interno, salverà i dati e poi aggiornerà lo stato locale.
      await updateProfile(trimmedFirstName, trimmedLastName);

      // La navigazione verrà gestita automaticamente dal layout principale
      // non appena rileverà che il profilo è stato completato.

    } catch (error: any) {
      Alert.alert('Errore', 'Impossibile salvare il profilo: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Completa il Tuo Profilo</Text>
      <Text style={styles.subtitle}>Inserisci il tuo nome e cognome per continuare.</Text>
      
      <Text style={styles.label}>Nome</Text>
      <TextInput
        style={styles.input}
        placeholder="Il tuo nome"
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
      />
      
      <Text style={styles.label}>Cognome</Text>
      <TextInput
        style={styles.input}
        placeholder="Il tuo cognome"
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
      />
      
      <TouchableOpacity
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleCompleteProfile}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Salva e Continua</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
