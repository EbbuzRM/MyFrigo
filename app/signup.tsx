import React, { useState, useCallback } from 'react';
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
import { AUTH_CONSTANTS } from '@/constants/auth';
import { useSignupValidation, SignupFormData } from '@/hooks/useSignupValidation';
import { useRegistration } from '@/hooks/useRegistration';
import { ValidationCheck } from '@/components/ValidationCheck';
import { signupStyles as styles } from '@/styles/signupStyles';

export default function SignupScreen() {
  const [formData, setFormData] = useState<SignupFormData>({ email: '', password: '', firstName: '', lastName: '' });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const router = useRouter();
  const { validateForm, validatePasswordField, passwordValidation, isFormValid, clearErrors } = useSignupValidation();
  const handleSuccess = useCallback(() => router.replace('/login'), [router]);
  const handleEmailNeedsConfirmation = useCallback((email: string) => router.replace({ pathname: '/confirm-email', params: { email } }), [router]);
  const { register, handlePostRegistration, isLoading, error } = useRegistration(handleSuccess, () => handleEmailNeedsConfirmation(formData.email));

  const updateField = useCallback((field: keyof SignupFormData, value: string) => {
    setFormData((prev: SignupFormData) => ({ ...prev, [field]: value }));
    if (field === 'password') validatePasswordField(value);
  }, [validatePasswordField]);

  const handleSignUp = useCallback(async () => {
    clearErrors();
    const validation = validateForm(formData);
    if (!validation.isValid) {
      Alert.alert(AUTH_CONSTANTS.ALERT_TITLES.MISSING_DATA, AUTH_CONSTANTS.ERRORS.MISSING_FIELDS);
      return;
    }
    const trimmedFirstName = formData.firstName.trim();
    const trimmedLastName = formData.lastName.trim();
    if (!trimmedFirstName || !trimmedLastName) {
      Alert.alert(AUTH_CONSTANTS.ALERT_TITLES.MISSING_DATA, AUTH_CONSTANTS.ERRORS.MISSING_NAMES);
      return;
    }
    const result = await register({ ...formData, firstName: trimmedFirstName, lastName: trimmedLastName });
    if (result.error === AUTH_CONSTANTS.ALERT_MESSAGES.EMAIL_EXISTS) {
      Alert.alert(AUTH_CONSTANTS.ALERT_TITLES.EMAIL_EXISTS, AUTH_CONSTANTS.ALERT_MESSAGES.EMAIL_EXISTS);
      return;
    }
    handlePostRegistration(result, formData.email);
  }, [formData, clearErrors, validateForm, register, handlePostRegistration]);

  const isDisabled = !isFormValid(formData) || isLoading;
  const { UI_LABELS, ALERT_TITLES, PASSWORD_VALIDATION } = AUTH_CONSTANTS;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{UI_LABELS.HEADER}</Text>
      <Text style={styles.subtitle}>{UI_LABELS.SUBTITLE}</Text>
      <Text style={styles.label}>{UI_LABELS.FIRST_NAME}</Text>
      <TextInput style={styles.input} placeholder={UI_LABELS.PLACEHOLDER_FIRST_NAME} value={formData.firstName} onChangeText={(t) => updateField('firstName', t)} autoCapitalize="words" editable={!isLoading} />
      <Text style={styles.label}>{UI_LABELS.LAST_NAME}</Text>
      <TextInput style={styles.input} placeholder={UI_LABELS.PLACEHOLDER_LAST_NAME} value={formData.lastName} onChangeText={(t) => updateField('lastName', t)} autoCapitalize="words" editable={!isLoading} />
      <Text style={styles.label}>{UI_LABELS.EMAIL}</Text>
      <TextInput style={styles.input} placeholder={UI_LABELS.PLACEHOLDER_EMAIL} value={formData.email} onChangeText={(t) => updateField('email', t)} keyboardType="email-address" autoCapitalize="none" editable={!isLoading} />
      <Text style={styles.label}>{UI_LABELS.PASSWORD}</Text>
      <View style={styles.passwordContainer}>
        <TextInput style={styles.input} placeholder={UI_LABELS.PLACEHOLDER_PASSWORD} value={formData.password} onChangeText={(t) => updateField('password', t)} secureTextEntry={!isPasswordVisible} editable={!isLoading} />
        <TouchableOpacity style={styles.eyeIcon} onPress={() => setIsPasswordVisible(!isPasswordVisible)} disabled={isLoading}>
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
      <TouchableOpacity style={[styles.button, isDisabled && styles.buttonDisabled]} onPress={handleSignUp} disabled={isDisabled}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{UI_LABELS.SIGNUP_BUTTON}</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.backText}>{UI_LABELS.BACK_TO_LOGIN}</Text>
      </TouchableOpacity>
    </View>
  );
}
