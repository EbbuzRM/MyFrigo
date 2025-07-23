import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/services/supabaseClient';

export default function ProfileScreen() {
  // Aggiorniamo per includere setProfile per l'aggiornamento ottimistico
  const { user, profile, setProfile } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false); // Inizia come false, i dati arrivano dal contesto
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Popola i campi di input con i dati del profilo dal contesto
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
    }
  }, [profile]);

  const handleUpdateProfile = async () => {
    console.log('[PROFILE_UPDATE] Inizio della funzione.');
    if (!user) {
      Alert.alert('Errore', 'Nessun utente loggato.');
      console.log('[PROFILE_UPDATE] Uscita: utente non trovato.');
      return;
    }
    
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName || !trimmedLastName) {
      Alert.alert('Attenzione', 'Nome e cognome non possono essere vuoti.');
      console.log('[PROFILE_UPDATE] Uscita: campi vuoti.');
      return;
    }

    console.log('[PROFILE_UPDATE] Imposto saving a true.');
    setSaving(true);

    console.log('[PROFILE_UPDATE] Eseguo aggiornamento ottimistico UI.');
    setProfile({ first_name: trimmedFirstName, last_name: trimmedLastName });

    try {
      console.log('[PROFILE_UPDATE] Inizio blocco try. Chiamo supabase.from("users").update()');
      const { error: dbError } = await supabase
        .from('users')
        .update({
          first_name: trimmedFirstName,
          last_name: trimmedLastName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      console.log('[PROFILE_UPDATE] Fine chiamata a supabase.from("users").update().');

      if (dbError) {
        console.log('[PROFILE_UPDATE] Errore da "users".update():', dbError);
        setProfile(profile); 
        throw dbError;
      }
      console.log('[PROFILE_UPDATE] "users".update() completato con successo.');

      // La chiamata a supabase.auth.updateUser() è stata rimossa perché causava il blocco.
      
      Alert.alert('Successo', 'Profilo aggiornato!');
      if (router.canGoBack()) {
        console.log('[PROFILE_UPDATE] Navigo indietro.');
        router.back();
      }

    } catch (error: any) {
      console.error("[PROFILE_UPDATE] Errore nel blocco catch:", error);
      Alert.alert('Errore', `Impossibile aggiornare il profilo: ${error.message}`);
    } finally {
      console.log('[PROFILE_UPDATE] Eseguo blocco finally. Imposto saving a false.');
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setSaving(true);
    const { error } = await supabase.auth.signOut();
    setSaving(false);
    if (error) {
      Alert.alert('Errore', 'Impossibile effettuare il logout: ' + error.message);
    } else {
      router.replace('/login');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Il Tuo Profilo</Text>
      <Text style={styles.label}>Nome</Text>
      <TextInput
        style={styles.input}
        placeholder="Il tuo nome"
        value={firstName}
        onChangeText={setFirstName}
      />
      <Text style={styles.label}>Cognome</Text>
      <TextInput
        style={styles.input}
        placeholder="Il tuo cognome"
        value={lastName}
        onChangeText={setLastName}
      />
      <TouchableOpacity
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleUpdateProfile}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Salva Modifiche</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.logoutButton, saving && styles.buttonDisabled]}
        onPress={handleLogout}
        disabled={saving}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 20,
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
  logoutButton: {
    backgroundColor: '#dc3545',
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

