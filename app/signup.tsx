// signup.tsx — signup module.
//
// exports: SignupScreen | function
// used_by: none
// rules:   This module must remain a self-contained signup screen with no direct dependencies on other screens, only navigating via router.replace.
//          The component must use the useSignupValidation and useRegistration hooks for all form logic and API calls, never implementing validation or registration logic internally.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { useState, useCallback, useRef } from 'react';
import {
  Alert,
  View,
  TextInput,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppLanguage } from '@/i18n/useAppLanguage';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import Constants from 'expo-constants';
import ConfirmHcaptcha from '@hcaptcha/react-native-hcaptcha';
import { useSignupValidation, SignupFormData } from '@/hooks/useSignupValidation';
import { useRegistration } from '@/hooks/useRegistration';
import { translateRegistrationError } from '@/utils/authErrorI18n';
import { ValidationCheck } from '@/components/ValidationCheck';
import { signupStyles as styles } from '@/styles/signupStyles';

type CaptchaMessageEvent = {
  nativeEvent: { data: string };
  success: boolean;
  markUsed?: () => void;
};

export default function SignupScreen() {
  const { t } = useTranslation();
  const language = useAppLanguage();
  const [formData, setFormData] = useState<SignupFormData>({ email: '', password: '', firstName: '', lastName: '' });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>();
  const captchaRef = useRef<ConfirmHcaptcha>(null);
  const captchaSubmissionInFlight = useRef(false);
  const router = useRouter();

  const sitekey = Constants.expoConfig?.extra?.hcaptchaSitekey;

  const { validateForm, validatePasswordField, passwordValidation, isFormValid, clearErrors } = useSignupValidation();
  const handleSuccess = useCallback(() => router.replace('/(tabs)'), [router]);
  const handleEmailNeedsConfirmation = useCallback((email: string) => router.replace({ pathname: '/confirm-email', params: { email } }), [router]);
  const handleLogin = useCallback(() => router.replace('/login'), [router]);
  const handlePasswordRecovery = useCallback(() => router.replace('/forgot-password'), [router]);
  const { register, handlePostRegistration, isLoading, error } = useRegistration(
    handleSuccess,
    () => handleEmailNeedsConfirmation(formData.email),
    handleLogin,
    handlePasswordRecovery
  );

  const updateField = useCallback((field: keyof SignupFormData, value: string) => {
    setFormData((prev: SignupFormData) => ({ ...prev, [field]: value }));
    if (field === 'password') validatePasswordField(value);
  }, [validatePasswordField]);

  const submitSignup = useCallback(async (token?: string) => {
    // hCaptcha responses are single-use; force a fresh challenge after every
    // registration attempt, including validation or server failures.
    setCaptchaToken(undefined);
    const trimmedFirstName = formData.firstName.trim();
    const trimmedLastName = formData.lastName.trim();
    const result = await register({ ...formData, firstName: trimmedFirstName, lastName: trimmedLastName, captchaToken: token });
    handlePostRegistration(result, formData.email);
  }, [formData, register, handlePostRegistration]);

  const onCaptchaMessage = useCallback((event: CaptchaMessageEvent) => {
    if (event.success) {
      const token = event.nativeEvent.data.trim();
      // The native package also reports "open" with success=true. Ignore it;
      // only a passcode is valid input for Supabase Auth.
      if (token.length <= 35 || captchaSubmissionInFlight.current) return;

      captchaSubmissionInFlight.current = true;
      setCaptchaToken(undefined);
      captchaRef.current?.hide();
      void submitSignup(token).finally(() => {
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
  }, [submitSignup]);

  const handleSignUp = useCallback(async () => {
    clearErrors();
    const validation = validateForm(formData);
    if (!validation.isValid) {
      Alert.alert(t('auth.alertTitles_missingData'), t('auth.errors_missingFields'));
      return;
    }
    if (formData.firstName.trim() === '' || formData.lastName.trim() === '') {
      Alert.alert(t('auth.alertTitles_missingData'), t('auth.errors_missingNames'));
      return;
    }

    if (sitekey && sitekey !== 'YOUR_HCAPTCHA_SITEKEY' && !captchaToken) {
      captchaRef.current?.show();
      return;
    }

    await submitSignup(captchaToken);
  }, [formData, clearErrors, validateForm, submitSignup, captchaToken, sitekey]);

  const isDisabled = !isFormValid(formData) || isLoading;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('auth.signupHeader')}</Text>
      <Text style={styles.subtitle}>{t('auth.signupSubtitle')}</Text>
      <Text style={styles.label}>{t('auth.firstNameLabel')}</Text>
      <TextInput testID="signup-first-name-input" style={styles.input} placeholder={t('auth.firstNamePlaceholder')} value={formData.firstName} onChangeText={(v) => updateField('firstName', v)} autoCapitalize="words" editable={!isLoading} />
      <Text style={styles.label}>{t('auth.lastNameLabel')}</Text>
      <TextInput testID="signup-last-name-input" style={styles.input} placeholder={t('auth.lastNamePlaceholder')} value={formData.lastName} onChangeText={(v) => updateField('lastName', v)} autoCapitalize="words" editable={!isLoading} />
      <Text style={styles.label}>{t('auth.emailLabel')}</Text>
      <TextInput testID="signup-email-input" style={styles.input} placeholder={t('auth.emailPlaceholderSignup')} value={formData.email} onChangeText={(v) => updateField('email', v)} keyboardType="email-address" autoCapitalize="none" editable={!isLoading} />
      <Text style={styles.label}>{t('auth.passwordLabel')}</Text>
      <View style={styles.passwordContainer}>
        <TextInput testID="signup-password-input" style={styles.input} placeholder={t('auth.passwordPlaceholderSignup')} value={formData.password} onChangeText={(v) => updateField('password', v)} secureTextEntry={!isPasswordVisible} editable={!isLoading} />
        <TouchableOpacity style={styles.eyeIcon} onPress={() => setIsPasswordVisible(!isPasswordVisible)} disabled={isLoading} accessibilityLabel={t('auth.showHidePasswordLabel')} accessibilityRole="button" accessibilityState={{ disabled: isLoading }}>
          <FontAwesome name={isPasswordVisible ? 'eye' : 'eye-slash'} size={20} color="#6c757d" />
        </TouchableOpacity>
      </View>
      {formData.password.length > 0 && (
        <View style={styles.validationContainer}>
          <ValidationCheck isValid={passwordValidation.minLength} text={t('auth.minLengthRequirement')} />
          <ValidationCheck isValid={passwordValidation.hasLower} text={t('auth.hasLowerRequirement')} />
          <ValidationCheck isValid={passwordValidation.hasUpper} text={t('auth.hasUpperRequirement')} />
          <ValidationCheck isValid={passwordValidation.hasNumber} text={t('auth.hasNumberRequirement')} />
        </View>
      )}
      {error && <Text style={styles.errorText}>{translateRegistrationError(t, error)}</Text>}
      <TouchableOpacity testID="signup-button" style={[styles.button, isDisabled && styles.buttonDisabled]} onPress={handleSignUp} disabled={isDisabled} accessibilityRole="button" accessibilityLabel={t('auth.signUp')} accessibilityState={{ disabled: isDisabled }}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('auth.signupButton')}</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.backText}>{t('auth.backToLogin')}</Text>
      </TouchableOpacity>

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
