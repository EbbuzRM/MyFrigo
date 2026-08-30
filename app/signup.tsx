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
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import Constants from 'expo-constants';
import ConfirmHcaptcha from '@hcaptcha/react-native-hcaptcha';
import { AUTH_CONSTANTS } from '@/constants/auth';
import { useSignupValidation, SignupFormData } from '@/hooks/useSignupValidation';
import { useRegistration } from '@/hooks/useRegistration';
import { ValidationCheck } from '@/components/ValidationCheck';
import { signupStyles as styles } from '@/styles/signupStyles';

export default function SignupScreen() {
  const [formData, setFormData] = useState<SignupFormData>({ email: '', password: '', firstName: '', lastName: '' });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>();
  const captchaRef = useRef<ConfirmHcaptcha>(null);
  const router = useRouter();

  const sitekey = Constants.expoConfig?.extra?.hcaptchaSitekey;

  const { validateForm, validatePasswordField, passwordValidation, isFormValid, clearErrors } = useSignupValidation();
  const handleSuccess = useCallback(() => router.replace('/(tabs)'), [router]);
  const handleEmailNeedsConfirmation = useCallback((email: string) => router.replace({ pathname: '/confirm-email', params: { email } }), [router]);
  const { register, handlePostRegistration, isLoading, error } = useRegistration(handleSuccess, () => handleEmailNeedsConfirmation(formData.email));

  const updateField = useCallback((field: keyof SignupFormData, value: string) => {
    setFormData((prev: SignupFormData) => ({ ...prev, [field]: value }));
    if (field === 'password') validatePasswordField(value);
  }, [validatePasswordField]);

  const submitSignup = useCallback(async (token?: string) => {
    const trimmedFirstName = formData.firstName.trim();
    const trimmedLastName = formData.lastName.trim();
    const result = await register({ ...formData, firstName: trimmedFirstName, lastName: trimmedLastName, captchaToken: token });
    if (result.error === AUTH_CONSTANTS.ALERT_MESSAGES.EMAIL_EXISTS) {
      Alert.alert(AUTH_CONSTANTS.ALERT_TITLES.EMAIL_EXISTS, AUTH_CONSTANTS.ALERT_MESSAGES.EMAIL_EXISTS);
      return;
    }
    handlePostRegistration(result, formData.email);
  }, [formData, register, handlePostRegistration]);

  const onCaptchaMessage = useCallback((event: { nativeEvent: { data: string }; success: boolean }) => {
    if (event.success) {
      const token = event.nativeEvent.data;
      setCaptchaToken(token);
      captchaRef.current?.hide();
      submitSignup(token);
    } else if (event.nativeEvent.data === 'error') {
      captchaRef.current?.hide();
    } else if (event.nativeEvent.data === 'challenge-closed') {
      captchaRef.current?.hide();
    }
  }, [submitSignup]);

  const handleSignUp = useCallback(async () => {
    clearErrors();
    const validation = validateForm(formData);
    if (!validation.isValid) {
      Alert.alert(AUTH_CONSTANTS.ALERT_TITLES.MISSING_DATA, AUTH_CONSTANTS.ERRORS.MISSING_FIELDS);
      return;
    }
    if (formData.firstName.trim() === '' || formData.lastName.trim() === '') {
      Alert.alert(AUTH_CONSTANTS.ALERT_TITLES.MISSING_DATA, AUTH_CONSTANTS.ERRORS.MISSING_NAMES);
      return;
    }

    if (sitekey && sitekey !== 'YOUR_HCAPTCHA_SITEKEY' && !captchaToken) {
      captchaRef.current?.show();
      return;
    }

    await submitSignup(captchaToken);
  }, [formData, clearErrors, validateForm, submitSignup, captchaToken, sitekey]);

  const isDisabled = !isFormValid(formData) || isLoading;
  const { UI_LABELS, ALERT_TITLES, PASSWORD_VALIDATION } = AUTH_CONSTANTS;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{UI_LABELS.HEADER}</Text>
      <Text style={styles.subtitle}>{UI_LABELS.SUBTITLE}</Text>
      <Text style={styles.label}>{UI_LABELS.FIRST_NAME}</Text>
      <TextInput testID="signup-first-name-input" style={styles.input} placeholder={UI_LABELS.PLACEHOLDER_FIRST_NAME} value={formData.firstName} onChangeText={(t) => updateField('firstName', t)} autoCapitalize="words" editable={!isLoading} />
      <Text style={styles.label}>{UI_LABELS.LAST_NAME}</Text>
      <TextInput testID="signup-last-name-input" style={styles.input} placeholder={UI_LABELS.PLACEHOLDER_LAST_NAME} value={formData.lastName} onChangeText={(t) => updateField('lastName', t)} autoCapitalize="words" editable={!isLoading} />
      <Text style={styles.label}>{UI_LABELS.EMAIL}</Text>
      <TextInput testID="signup-email-input" style={styles.input} placeholder={UI_LABELS.PLACEHOLDER_EMAIL} value={formData.email} onChangeText={(t) => updateField('email', t)} keyboardType="email-address" autoCapitalize="none" editable={!isLoading} />
      <Text style={styles.label}>{UI_LABELS.PASSWORD}</Text>
      <View style={styles.passwordContainer}>
        <TextInput testID="signup-password-input" style={styles.input} placeholder={UI_LABELS.PLACEHOLDER_PASSWORD} value={formData.password} onChangeText={(t) => updateField('password', t)} secureTextEntry={!isPasswordVisible} editable={!isLoading} />
        <TouchableOpacity style={styles.eyeIcon} onPress={() => setIsPasswordVisible(!isPasswordVisible)} disabled={isLoading} accessibilityLabel="Mostra/Nascondi password" accessibilityRole="button" accessibilityState={{ disabled: isLoading }}>
          <FontAwesome name={isPasswordVisible ? 'eye' : 'eye-slash'} size={20} color="#6c757d" />
        </TouchableOpacity>
      </View>
      {formData.password.length > 0 && (
        <View style={styles.validationContainer}>
          <ValidationCheck isValid={passwordValidation.minLength} text={PASSWORD_VALIDATION.MIN_LENGTH} />
          <ValidationCheck isValid={passwordValidation.hasLower} text={PASSWORD_VALIDATION.HAS_LOWER} />
          <ValidationCheck isValid={passwordValidation.hasUpper} text={PASSWORD_VALIDATION.HAS_UPPER} />
          <ValidationCheck isValid={passwordValidation.hasNumber} text={PASSWORD_VALIDATION.HAS_NUMBER} />
        </View>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
      <TouchableOpacity testID="signup-button" style={[styles.button, isDisabled && styles.buttonDisabled]} onPress={handleSignUp} disabled={isDisabled} accessibilityRole="button" accessibilityLabel="Registrati" accessibilityState={{ disabled: isDisabled }}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{UI_LABELS.SIGNUP_BUTTON}</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.backText}>{UI_LABELS.BACK_TO_LOGIN}</Text>
      </TouchableOpacity>

      {sitekey && sitekey !== 'YOUR_HCAPTCHA_SITEKEY' && (
        <ConfirmHcaptcha
          ref={captchaRef}
          siteKey={sitekey}
          baseUrl="https://hcaptcha.com"
          onMessage={onCaptchaMessage}
          size="normal"
        />
      )}
    </View>
  );
}
