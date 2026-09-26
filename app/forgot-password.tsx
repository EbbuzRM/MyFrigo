// forgot-password.tsx — forgot-password module.
//
// exports: ForgotPassword | function
// used_by: none
// rules:   - OTP-based password reset flow must preserve the current Supabase auth pattern without redirectTo parameter
//          - Email validation and error handling logic for specific Supabase error messages must remain intact
//          - State management for email, loading, OTP input visibility, and OTP value must be maintained across the component lifecycle
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { useState, useRef } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppLanguage } from '@/i18n/useAppLanguage';
import ConfirmHcaptcha from '@hcaptcha/react-native-hcaptcha';
import { styles } from '@/styles/forgot-password.styles';
import { supabase } from '@/services/supabaseClient';
import { checkOtpRateLimit, recordOtpFailedAttempt, clearOtpRateLimit } from '@/services/AuthService';
import { LoggingService } from '@/services/LoggingService';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';

type CaptchaMessageEvent = {
  nativeEvent: { data: string };
  success: boolean;
  markUsed?: () => void;
};

export default function ForgotPassword() {
  const { t } = useTranslation();
  const language = useAppLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string>();
  const captchaRef = useRef<ConfirmHcaptcha>(null);
  const captchaSubmissionInFlight = useRef(false);

  const router = useRouter();

  const sitekey = Constants.expoConfig?.extra?.hcaptchaSitekey;

  const submitReset = async (token?: string) => {
    // hCaptcha responses are single-use; never retry a reset with an old token.
    setCaptchaToken(undefined);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        captchaToken: token,
      });

      const isUnknownAccount = error?.message.includes('User not found') ?? false;

      if (error && !isUnknownAccount) {
        LoggingService.error('ForgotPassword', 'Error sending password reset email', {
          message: error.message,
        });
        let errorMessage = t('auth.errors_resetEmailSendError');

        // Errori specifici di Supabase
        if (error.message.includes('Rate limit')) {
          errorMessage = t('auth.errors_tooManyRequests');
        } else if (error.message.includes('Invalid email')) {
          errorMessage = t('auth.errors_invalidEmailAddress');
        }

        Alert.alert(t('auth.alertTitles_error'), errorMessage);
        setCaptchaToken(undefined);
        captchaRef.current?.hide();
        return;
      }

      if (isUnknownAccount) {
        LoggingService.warning('ForgotPassword', 'Password reset request accepted without account disclosure');
      }

      LoggingService.info('ForgotPassword', 'Password reset email sent successfully');
      Alert.alert(
        t('auth.checkEmailAlertTitle'),
        t('auth.checkEmailAlertMessage')
      );
      setShowOtpInput(true);
    } catch (error: unknown) {
      LoggingService.error('ForgotPassword', 'Unexpected error during OTP reset', error);
      Alert.alert(t('auth.alertTitles_error'), t('auth.errors_unexpectedOtpError'));
      setCaptchaToken(undefined);
      captchaRef.current?.hide();
    } finally {
      setLoading(false);
    }
  };

  const onCaptchaMessage = (event: CaptchaMessageEvent) => {
    if (event.success) {
      const token = event.nativeEvent.data.trim();
      // The native package also reports "open" with success=true. Ignore it;
      // only a passcode is valid input for Supabase Auth.
      if (token.length <= 35 || captchaSubmissionInFlight.current) return;

      captchaSubmissionInFlight.current = true;
      setCaptchaToken(undefined);
      captchaRef.current?.hide();
      void submitReset(token).finally(() => {
        event.markUsed?.();
        captchaSubmissionInFlight.current = false;
      });
    } else if (event.nativeEvent.data === 'error') {
      setCaptchaToken(undefined);
      captchaRef.current?.hide();
    } else if (event.nativeEvent.data === 'challenge-closed') {
      setCaptchaToken(undefined);
      captchaRef.current?.hide();
    }
  };

  // E2E test mode flag — checks build-time env var AND runtime Constants.extra
  // (so it works both when .env.e2e is used at build time and via app.config.js extra)
  const isE2ETest = (): boolean => {
    if (process.env.EXPO_PUBLIC_E2E_TEST_MODE === 'true') return true;
    try {
      return Constants.expoConfig?.extra?.e2eTestMode === true;
    } catch {
      return false;
    }
  };

  // Metodo principale: reset con OTP
  const handleResetWithOTP = async () => {
    if (!email.trim()) {
      Alert.alert(t('auth.alertTitles_error'), t('auth.errors_emailRequired'));
      return;
    }

    setLoading(true);
    LoggingService.info('ForgotPassword', 'Starting password reset with OTP', { email });

    // E2E test mode: use Edge Function instead of real email
    if (isE2ETest()) {
      try {
        LoggingService.info('ForgotPassword', 'E2E test mode: generating recovery token via edge function');

        const { data: otpData, error: otpError } = await supabase.functions.invoke('e2e-otp', {
          body: { email: email.trim().toLowerCase(), action: 'generate-recovery-token' },
          headers: { 'x-e2e-secret': '' },
        });

        if (otpError) {
          const rawMessage = typeof otpError === 'string' ? otpError : otpError.message;
          LoggingService.error('ForgotPassword', 'E2E OTP generation failed', { message: rawMessage });
          throw new Error(t('auth.errors_otpGenerationError'));
        }

        if (!otpData?.token_hash) {
          Alert.alert(t('auth.alertTitles_error'), t('auth.errors_tokenHashMissing'));
          return;
        }

        LoggingService.info('ForgotPassword', 'Token hash received, verifying OTP');

        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: otpData.token_hash,
          type: 'recovery',
        });

        if (error) {
          LoggingService.error('ForgotPassword', 'OTP verification failed in E2E mode', error);
          Alert.alert(t('auth.alertTitles_error'), t('auth.errors_otpVerifyFailed'));
          return;
        }

        if (data?.session) {
          LoggingService.info('ForgotPassword', 'Session established in E2E mode, navigating to password reset form');
          router.replace('/password-reset-form');
        } else {
          Alert.alert(t('auth.alertTitles_error'), t('auth.errors_noSessionEstablished'));
          return;
        }
      } catch (error: unknown) {
        LoggingService.error('ForgotPassword', 'E2E test mode error', error);
        Alert.alert(t('auth.alertTitles_error'), t('auth.errors_otpGenerationError'));
      } finally {
        setLoading(false);
      }
      return;
    }

    // Real flow: show captcha if configured and not yet solved
    if (sitekey && sitekey !== 'YOUR_HCAPTCHA_SITEKEY' && !captchaToken) {
      captchaRef.current?.show();
      return;
    }

    await submitReset(captchaToken);
  };

  // Verifica OTP e reindirizza al reset form
  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert(t('auth.alertTitles_error'), t('auth.errors_invalidOtpLength'));
      return;
    }

    // Client-side brute-force protection per OTP (persists via AuthService store)
    const otpCheck = await checkOtpRateLimit(email);
    if (!otpCheck.allowed) {
      const minutes = Math.ceil((otpCheck.remainingMs || 0) / 60000);
      LoggingService.warning('ForgotPassword', 'OTP rate limit blocked', { remainingMs: otpCheck.remainingMs });
      Alert.alert(t('auth.alertTitles_error'), t('auth.errors_otpRateLimit', { count: minutes }));
      return;
    }

    setLoading(true);
    LoggingService.info('ForgotPassword', 'Verifying OTP', { email, otpLength: otp.length });

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp,
        type: 'recovery'
      });

      if (error) {
        await recordOtpFailedAttempt(email);
        LoggingService.error('ForgotPassword', 'OTP verification failed', error);
        let errorMessage = t('auth.errors_genericOtpError');

        if (error.message.includes('Token has expired')) {
          errorMessage = t('auth.errors_expiredOtp');
        } else if (error.message.includes('Invalid token')) {
          errorMessage = t('auth.errors_incorrectOtp');
        } else {
          // Check if now rate-limited after recording
          const after = await checkOtpRateLimit(email);
          if (!after.allowed) {
            const m = Math.ceil((after.remainingMs || 0) / 60000);
            errorMessage = t('auth.errors_otpRateLimit', { count: m });
          }
        }

        Alert.alert(t('auth.alertTitles_error'), errorMessage);
        return;
      }

      // OTP success -> clear OTP rate limit for this email
      await clearOtpRateLimit(email);

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
        Alert.alert(t('auth.alertTitles_error'), t('auth.errors_metadataUpdateError'));
        return;
      }

      LoggingService.info('ForgotPassword', 'User metadata updated successfully', { userId: data.user?.id });

      // Explicitly try to navigate
      LoggingService.info('ForgotPassword', 'Attempting navigation to /password-reset-form');

      // Delay slightly to ensure metadata propagation if needed, though updatedUser should be enough.
      // We use setTimeout to break out of current event loop stack if needed.
      setTimeout(() => {
        router.replace('/password-reset-form');
      }, 100);

    } catch (error: unknown) {
      LoggingService.error('ForgotPassword', 'Unexpected error during OTP verification', error);
      Alert.alert(t('auth.alertTitles_error'), t('auth.errors_unexpectedVerifyError'));
    } finally {
      setLoading(false);
    }
  };

  // Metodo principale che delega al metodo scelto (ora solo OTP)
  const handleReset = async () => {
    await handleResetWithOTP();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('auth.forgotPasswordTitle')}</Text>

      {/* Input email */}
      <TextInput
        testID="forgot-password-email-input"
        style={styles.input}
        placeholder={t('auth.emailInputPlaceholder')}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
      />

      {!showOtpInput && (
        <>
          <Text style={styles.infoText}>
            {t('auth.otpInfoText')}
          </Text>
          <View testID="send-otp-button">
            <Button title={t('auth.sendOtpButton')} onPress={handleReset} disabled={loading} />
          </View>
        </>
      )}

      {showOtpInput && (
        <View>
          <View style={styles.otpSection}>
            <Text style={styles.otpSectionTitle}>{t('auth.enterOtpTitle')}</Text>
            <Text style={styles.otpInfoText}>{t('auth.checkEmailForCode')}</Text>

            <TextInput
              testID="otp-input"
              style={styles.input}
              placeholder={t('auth.otpInputPlaceholder')}
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
            />
            <View testID="verify-otp-button">
              <Button title={t('auth.verifyCodeButton')} onPress={handleVerifyOTP} disabled={loading} />
            </View>
            <View style={styles.backToEmailButton}>
              <Button
                title={t('auth.backToEmailButton')}
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

      {sitekey && sitekey !== 'YOUR_HCAPTCHA_SITEKEY' && (
        <ConfirmHcaptcha
          ref={captchaRef}
          siteKey={sitekey}
          languageCode={language}
          baseUrl="https://hcaptcha.com"
          onMessage={onCaptchaMessage}
          size="normal"
        />
      )}
    </View>
  );
}
