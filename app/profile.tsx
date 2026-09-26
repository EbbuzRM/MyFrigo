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
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { LoggingService } from '@/services/LoggingService';
import { supabase } from '@/services/supabaseClient';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, profile, refreshUserProfile, signOut } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading] = useState(false); // Inizia come false, i dati arrivano dal contesto
  const [saving, setSaving] = useState(false);



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
      Alert.alert(t('common.error'), t('auth.profileNoUser'));
      LoggingService.error('[PROFILE_UPDATE] Uscita: utente non trovato.', 'User not authenticated', user);
      return;
    }
    
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName || !trimmedLastName) {
      Alert.alert(t('common.error'), t('auth.profileNamesRequired'));
      LoggingService.error('[PROFILE_UPDATE] Uscita: campi vuoti.', 'Empty fields');
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
      
      Alert.alert(t('auth.profileUpdated'));
      if (router.canGoBack()) {
        LoggingService.info('[PROFILE_UPDATE] Navigo indietro.', 'Navigating back');
        router.back();
      }

    } catch (error: unknown) {
      LoggingService.error("[PROFILE_UPDATE] Errore nel blocco catch:", 'Error in catch block', error);
      Alert.alert(t('common.error'), t('auth.profileUpdateFailed'));
    } finally {
      LoggingService.info('[PROFILE_UPDATE] Eseguo blocco finally. Imposto saving a false.', 'Finally block executed');
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setSaving(true);
    try {
      await signOut();
    } catch (error: unknown) {
      LoggingService.error('Profile', 'Sign out failed', error);
      Alert.alert(t('common.error'), t('auth.logoutFailed'));
    } finally {
      setSaving(false);
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
      <Text style={styles.title}>{t('auth.profileTitle')}</Text>
      <Text style={styles.label}>{t('auth.firstNameLabel')}</Text>
      <TextInput
        testID="first-name-input"
        style={styles.input}
        placeholder={t('auth.firstNamePlaceholder')}
        value={firstName}
        onChangeText={setFirstName}
      />
      <Text style={styles.label}>{t('auth.lastNameLabel')}</Text>
      <TextInput
        testID="last-name-input"
        style={styles.input}
        placeholder={t('auth.lastNamePlaceholder')}
        value={lastName}
        onChangeText={setLastName}
      />
      <TouchableOpacity
        testID="save-profile-button"
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleUpdateProfile}
        disabled={saving}
        accessibilityRole="button"
        accessibilityLabel={t('auth.saveChanges')}
        accessibilityState={{ disabled: saving }}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t('auth.saveChanges')}</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.logoutButton, saving && styles.buttonDisabled]}
        onPress={handleLogout}
        disabled={saving}
        accessibilityRole="button"
        accessibilityLabel={t('auth.logout')}
        accessibilityState={{ disabled: saving }}
      >
        <Text style={styles.buttonText}>{t('auth.logout')}</Text>
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
