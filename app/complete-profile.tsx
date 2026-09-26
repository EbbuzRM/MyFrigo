// complete-profile.tsx — complete-profile module.
//
// exports: CompleteProfileScreen | function
// used_by: none
// rules:   - This module depends on `updateProfile` from `AuthContext`; any changes to this dependency must preserve its contract and side effect (auto-navigation upon profile completion).
//          - All user-facing strings must remain in Italian (e.g., 'Attenzione', 'Completa il Tuo Profilo').
//          - The screen is a standalone modal for first-time profile setup; do not merge it into other navigation flows or add new routes.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

export default function CompleteProfileScreen() {
  const { t } = useTranslation();
  const { updateProfile } = useAuth(); // Usa refreshUserProfile
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCompleteProfile = async () => {
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName || !trimmedLastName) {
      Alert.alert(t('common.error'), t('auth.completeProfileRequired'));
      return;
    }

    setSaving(true);
    try {
      // Ora basta chiamare updateProfile.
      // Al suo interno, salverà i dati e poi aggiornerà lo stato locale.
      await updateProfile(trimmedFirstName, trimmedLastName);

      // La navigazione verrà gestita automaticamente dal layout principale
      // non appena rileverà che il profilo è stato completato.

    } catch {
      Alert.alert(t('common.error'), t('auth.completeProfileFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t('auth.completeProfileTitle')}</Text>
      <Text style={styles.subtitle}>{t('auth.completeProfileSubtitle')}</Text>
      
      <Text style={styles.label}>{t('auth.firstNameLabel')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('auth.firstNamePlaceholder')}
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          testID="complete-profile-first-name-input"
        />
        
        <Text style={styles.label}>{t('auth.lastNameLabel')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('auth.lastNamePlaceholder')}
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
          testID="complete-profile-last-name-input"
        />
        
        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleCompleteProfile}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={t('auth.completeProfileSave')}
          accessibilityState={{ disabled: saving }}
          testID="complete-profile-save-button"
        >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t('auth.completeProfileSave')}</Text>
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
