// profile.tsx — profile module.
//
// exports: ProfileScreen | function
// used_by: none
// rules:   - Depends on `AuthContext` and `supabaseClient` for user/profile state and persistence; must not bypass these shared services.
//          - Relies on `LoggingService` for operational tracing; all state transitions and validation failures must be logged.
//          - Uses `useEffect` to synchronize local form state with context `profile`; edits must preserve this reactive sync pattern.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { LoggingService } from '@/services/LoggingService';
import { supabase } from '@/services/supabaseClient';
import { validatePassword, isPasswordValid } from '@/utils/authValidation';
import { FontAwesome } from '@expo/vector-icons';

// Componente per il check di validazione
const ValidationCheck = ({ text, isValid }: { text: string; isValid: boolean }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
    <FontAwesome name={isValid ? 'check-circle' : 'times-circle'} size={16} color={isValid ? 'green' : 'red'} />
    <Text style={{ marginLeft: 8, color: isValid ? 'green' : 'red' }}>{text}</Text>
  </View>
);

export default function ProfileScreen() {
  const { user, profile, refreshUserProfile, changePassword } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false); // Inizia come false, i dati arrivano dal contesto
  const [saving, setSaving] = useState(false);

  // Stati per la sezione cambio password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmNewPasswordVisible, setIsConfirmNewPasswordVisible] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    // Popola i campi di input con i dati del profilo dal contesto
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
    }
  }, [profile]);

  const handleUpdateProfile = async () => {
    LoggingService.info('[PROFILE_UPDATE] Inizio della funzione.', 'Function started');
    if (!user) {
      Alert.alert('Errore', 'Nessun utente loggato.');
      LoggingService.error('[PROFILE_UPDATE] Uscita: utente non trovato.', 'User not authenticated', user);
      return;
    }
    
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName || !trimmedLastName) {
      Alert.alert('Attenzione', 'Nome e cognome non possono essere vuoti.');
      LoggingService.error('[PROFILE_UPDATE] Uscita: campi vuoti.', 'Empty fields', { firstName, lastName });
      return;
    }

    LoggingService.info('[PROFILE_UPDATE] Imposto saving a true.', 'Setting saving to true');
    setSaving(true);

    try {
      LoggingService.info('[PROFILE_UPDATE] Inizio blocco try. Chiamo supabase.from("users").update().', 'Block try started');
      const { error: dbError } = await supabase
        .from('users')
        .update({
          first_name: trimmedFirstName,
          last_name: trimmedLastName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      LoggingService.info('[PROFILE_UPDATE] Fine chiamata a supabase.from("users").update().', 'Call to update completed');

      if (dbError) {
        LoggingService.error('[PROFILE_UPDATE] Errore da "users".update():', 'Error in update', dbError);
        throw dbError;
      }
      LoggingService.info('[PROFILE_UPDATE] "users".update() completato con successo.', 'Update completed successfully');

      await refreshUserProfile();
      
      Alert.alert('Successo', 'Profilo aggiornato!');
      if (router.canGoBack()) {
        LoggingService.info('[PROFILE_UPDATE] Navigo indietro.', 'Navigating back');
        router.back();
      }

    } catch (error: unknown) {
      LoggingService.error("[PROFILE_UPDATE] Errore nel blocco catch:", 'Error in catch block', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      Alert.alert('Errore', `Impossibile aggiornare il profilo: ${errorMessage}`);
    } finally {
      LoggingService.info('[PROFILE_UPDATE] Eseguo blocco finally. Imposto saving a false.', 'Finally block executed');
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

  const handleChangePassword = async () => {
    LoggingService.info('[PASSWORD_CHANGE] Inizio cambio password.', 'Change password started');

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert('Errore', 'Compila tutti i campi password.');
      LoggingService.error('[PASSWORD_CHANGE] Uscita: campi vuoti.', 'Empty fields');
      return;
    }

    if (!isPasswordValid(newPassword)) {
      Alert.alert('Errore', 'La nuova password non soddisfa tutti i requisiti di sicurezza.');
      LoggingService.error('[PASSWORD_CHANGE] Nuova password non valida.', 'Invalid new password');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert('Errore', 'Le nuove password non coincidono.');
      LoggingService.error('[PASSWORD_CHANGE] Password di conferma non corrispondente.', 'Passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Errore', 'La nuova password deve essere diversa dalla password attuale.');
      LoggingService.error('[PASSWORD_CHANGE] Nuova password uguale alla vecchia.', 'New password same as current');
      return;
    }

    setChangingPassword(true);

    try {
      LoggingService.info('[PASSWORD_CHANGE] Chiamo changePassword dal contesto.', 'Calling changePassword');
      await changePassword(currentPassword, newPassword);

      LoggingService.info('[PASSWORD_CHANGE] Cambio password completato con successo.', 'Password changed successfully');
      Alert.alert('Successo', 'Password aggiornata con successo!');

      // Svuota i campi
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: unknown) {
      LoggingService.error('[PASSWORD_CHANGE] Errore durante il cambio password:', 'Change password error', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      Alert.alert('Errore', `Impossibile aggiornare la password: ${errorMessage}`);
    } finally {
      setChangingPassword(false);
    }
  };

  const passwordValidation = validatePassword(newPassword);
  const passwordsMatch = newPassword === confirmNewPassword && newPassword !== '';

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
        accessibilityRole="button"
        accessibilityLabel="Salva Modifiche"
        accessibilityState={{ disabled: saving }}
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
        accessibilityRole="button"
        accessibilityLabel="Logout"
        accessibilityState={{ disabled: saving }}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>

      {/* Sezione Cambio Password */}
      <View style={styles.passwordSection}>
        <Text style={styles.sectionTitle}>Cambia Password</Text>

        <Text style={styles.label}>Password Attuale</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.inputWithIcon}
            placeholder="Inserisci la password attuale"
            secureTextEntry={!isCurrentPasswordVisible}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            editable={!changingPassword}
          />
          <TouchableOpacity
            accessibilityLabel="Mostra password attuale"
            accessibilityRole="button"
            onPress={() => setIsCurrentPasswordVisible(!isCurrentPasswordVisible)}
            style={styles.eyeIcon}
          >
            <FontAwesome name={isCurrentPasswordVisible ? 'eye-slash' : 'eye'} size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Nuova Password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.inputWithIcon}
            placeholder="Inserisci la nuova password"
            secureTextEntry={!isNewPasswordVisible}
            value={newPassword}
            onChangeText={setNewPassword}
            editable={!changingPassword}
          />
          <TouchableOpacity
            accessibilityLabel="Mostra nuova password"
            accessibilityRole="button"
            onPress={() => setIsNewPasswordVisible(!isNewPasswordVisible)}
            style={styles.eyeIcon}
          >
            <FontAwesome name={isNewPasswordVisible ? 'eye-slash' : 'eye'} size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Conferma Nuova Password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.inputWithIcon}
            placeholder="Conferma la nuova password"
            secureTextEntry={!isConfirmNewPasswordVisible}
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
            editable={!changingPassword}
          />
          <TouchableOpacity
            accessibilityLabel="Mostra conferma nuova password"
            accessibilityRole="button"
            onPress={() => setIsConfirmNewPasswordVisible(!isConfirmNewPasswordVisible)}
            style={styles.eyeIcon}
          >
            <FontAwesome name={isConfirmNewPasswordVisible ? 'eye-slash' : 'eye'} size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.validationContainer}>
          <ValidationCheck text="Almeno 8 caratteri" isValid={passwordValidation.minLength} />
          <ValidationCheck text="Una lettera maiuscola" isValid={passwordValidation.hasUpper} />
          <ValidationCheck text="Una lettera minuscola" isValid={passwordValidation.hasLower} />
          <ValidationCheck text="Un numero" isValid={passwordValidation.hasNumber} />
          <ValidationCheck text="Le password coincidono" isValid={passwordsMatch} />
        </View>

        <TouchableOpacity
          style={[styles.button, changingPassword && styles.buttonDisabled]}
          onPress={handleChangePassword}
          disabled={changingPassword}
          accessibilityRole="button"
          accessibilityLabel="Cambia Password"
          accessibilityState={{ disabled: changingPassword }}
        >
          {changingPassword ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Cambia Password</Text>
          )}
        </TouchableOpacity>
      </View>
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
    marginBottom: 0,
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
  inputContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  inputWithIcon: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    paddingRight: 50,
    borderRadius: 8,
    fontSize: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
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
  passwordSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  validationContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
});
