// useRegistrationActions.ts — useRegistrationActions module.
//
// exports: useUserProfileCreation | useAccountCreation
// used_by: hooks\useRegistration.ts
// rules:   - All authentication hooks must use `useCallback` with proper dependency arrays and must not mutate external state directly
//          - Supabase client calls must always be wrapped in try-catch or error-checked, with errors logged via `LoggingService` using the `LOG_TAG` constant
//          - Profile creation and account creation must remain separate, composable hooks
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { useCallback } from 'react';
import { supabase } from '@/services/supabaseClient';
import { LoggingService } from '@/services/LoggingService';
import Constants from 'expo-constants';
import { AUTH_CONSTANTS } from '@/constants/auth';
import { RegistrationData, RegistrationResult, REGISTRATION_ERROR_CODES } from './useRegistration.types';

const LOG_TAG = AUTH_CONSTANTS.LOG_TAGS.SIGNUP;

// E2E test mode flag — checks build-time env var AND runtime Constants.extra
// (so it works both when .env.e2e is used at build time and via app.config.js extra)
const isE2ETest = (): boolean => {
  const env = (process as { env?: Record<string, string | undefined> }).env;
  if (env?.EXPO_PUBLIC_E2E_TEST_MODE === 'true') return true;
  try {
    return Constants.expoConfig?.extra?.e2eTestMode === true;
  } catch {
    return false;
  }
};

export function useUserProfileCreation() {
  return useCallback(async (userId: string, firstName: string, lastName: string) => {
    const { error: profileError } = await supabase.from('users').upsert({
      id: userId,
      first_name: firstName,
      last_name: lastName,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      LoggingService.error(LOG_TAG, 'Profile creation failed', profileError);
    } else {
      LoggingService.info(LOG_TAG, 'Profile created successfully');
    }
  }, []);
}

export function useAccountCreation(onProfileCreated: (userId: string, firstName: string, lastName: string) => Promise<void>) {
  return useCallback(async (data: RegistrationData): Promise<RegistrationResult> => {
    const trimmedFirstName = data.firstName.trim();
    const trimmedLastName = data.lastName.trim();

    LoggingService.info(LOG_TAG, 'Calling Supabase signup', {
      email: data.email,
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
    });

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        captchaToken: data.captchaToken,
        data: {
          first_name: trimmedFirstName,
          last_name: trimmedLastName,
          full_name: `${trimmedFirstName} ${trimmedLastName}`,
        },
      },
    });

    if (signUpError) {
      LoggingService.error(LOG_TAG, 'Supabase signup failed', {
        code: signUpError.code,
        message: signUpError.message,
        status: signUpError.status,
      });
      // Stable code (never leak provider message to UI): the screen maps it
      // to `auth.errors_registrationFailed`. Same generic code for
      // already-registered emails -> no account enumeration.
      throw new Error(REGISTRATION_ERROR_CODES.REGISTRATION_FAILED);
    }

    if (!authData.user) {
      LoggingService.error(LOG_TAG, 'No user created during signup');
      throw new Error(REGISTRATION_ERROR_CODES.REGISTRATION_FAILED);
    }

    LoggingService.info(LOG_TAG, 'Registration successful', {
      userId: authData.user.id,
      email: authData.user.email,
      emailConfirmed: authData.user.email_confirmed_at,
    });

    const isEmailConfirmed = !!authData.user.email_confirmed_at || isE2ETest();

    if (isEmailConfirmed) {
      await onProfileCreated(authData.user.id, trimmedFirstName, trimmedLastName);
    }

    return {
      success: true,
      userId: authData.user.id,
      emailConfirmed: isEmailConfirmed,
    };
  }, [onProfileCreated]);
}
