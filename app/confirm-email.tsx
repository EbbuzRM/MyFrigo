// confirm-email.tsx — confirm-email module.
//
// exports: ConfirmEmailScreen | function
// used_by: none
// rules:   - This module depends on `@/services/supabaseClient` and `@/services/LoggingService`; any refactoring must preserve these import paths and service interfaces.
//          - The screen expects `email` as a route parameter via `useLocalSearchParams`; changes to navigation or parameter handling must maintain this input contract.
//          - OTP verification logic is tightly coupled to Supabase Auth's `verifyOtp` with `type: 'signup'`; alternative auth providers or verification flows cannot be introduced here without modifying this core integration point.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/services/supabaseClient';
import { LoggingService } from '@/services/LoggingService';

export default function ConfirmEmailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<'confirmEmailCodeRequired' | 'confirmEmailCodeInvalid' | null>(null);

  const handleVerifyOtp = async () => {
    if (!email || !otp) {
      setError('confirmEmailCodeRequired');
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
        t('auth.confirmEmailSuccessTitle'),
        t('auth.confirmEmailSuccessMessage'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              router.replace('/');
            },
          },
        ]
      );
    } catch (e: unknown) {
      setError('confirmEmailCodeInvalid');
      LoggingService.error('ConfirmEmailOTP', 'An exception occurred during OTP verification', e);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      Alert.alert(t('common.error'), t('auth.confirmEmailMissingAddress'));
      return;
    }

    setLoading(true);
    try {
      const { error: resendError } = await supabase.auth.resend({ type: 'signup', email });
      if (resendError) throw resendError;
      Alert.alert(t('auth.confirmEmailResentTitle'), t('auth.confirmEmailResentMessage'));
      LoggingService.info('ConfirmEmailOTP', 'Resent OTP successfully', { email });
    } catch (resendError) {
      Alert.alert(t('common.error'), t('auth.confirmEmailResendFailed'));
      LoggingService.error('ConfirmEmailOTP', 'Failed to resend OTP', resendError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.content}>
        <Text style={styles.title}>{t('auth.confirmEmailTitle')}</Text>
        <Text style={styles.subtitle}>
          {t('auth.confirmEmailSubtitle', { email })}
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

        {error && <Text style={styles.errorText}>{t(`auth.${error}`)}</Text>}

        <TouchableOpacity
          style={[styles.button, (loading || otp.length < 6) && styles.buttonDisabled]}
          onPress={handleVerifyOtp}
          disabled={loading || otp.length < 6}
          accessibilityRole="button"
          accessibilityLabel={t('auth.confirmEmailVerify')}
          accessibilityState={{ disabled: loading || otp.length < 6 }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('auth.confirmEmailVerify')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.resendButton} onPress={handleResendOtp} disabled={loading} accessibilityRole="button" accessibilityLabel={t('auth.confirmEmailResend')} accessibilityState={{ disabled: loading }}>
          <Text style={styles.resendButtonText}>{t('auth.confirmEmailResend')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
    paddingTop: 120, // Aumentato per abbassare il contenuto
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
