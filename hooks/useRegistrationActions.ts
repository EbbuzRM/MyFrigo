import { useCallback } from 'react';
import { supabase } from '@/services/supabaseClient';
import { LoggingService } from '@/services/LoggingService';
import { AUTH_CONSTANTS } from '@/constants/auth';
import { RegistrationData, RegistrationResult } from './useRegistration.types';

const LOG_TAG = AUTH_CONSTANTS.LOG_TAGS.SIGNUP;

export function useEmailCheck() {
  return useCallback(async (email: string): Promise<boolean> => {
    const { data: emailExists, error: rpcError } = await supabase.rpc('check_email_exists', {
      email_to_check: email,
    });

    if (rpcError) {
      LoggingService.error(LOG_TAG, 'RPC call to check_email_exists failed', rpcError);
      throw new Error(AUTH_CONSTANTS.ERRORS.EMAIL_CHECK_FAILED);
    }

    return emailExists || false;
  }, []);
}

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
      throw new Error(signUpError.message);
    }

    if (!authData.user) {
      LoggingService.error(LOG_TAG, 'No user created during signup');
      throw new Error(AUTH_CONSTANTS.ERRORS.REGISTRATION_FAILED);
    }

    LoggingService.info(LOG_TAG, 'Registration successful', {
      userId: authData.user.id,
      email: authData.user.email,
      emailConfirmed: authData.user.email_confirmed_at,
    });

    if (authData.user.email_confirmed_at) {
      await onProfileCreated(authData.user.id, trimmedFirstName, trimmedLastName);
    }

    return {
      success: true,
      userId: authData.user.id,
      emailConfirmed: !!authData.user.email_confirmed_at,
    };
  }, [onProfileCreated]);
}
