// useRegistration.types.ts — useRegistration.types module.
//
// exports: RegistrationData | RegistrationResult | UseRegistrationReturn
// used_by: hooks\usePostRegistration.ts
//                   hooks\useRegistration.ts
//                   hooks\useRegistrationActions.ts
//                   hooks\useRegistrationOrchestrator.ts
//                   hooks\useRegistrationState.ts
// rules:   All exported interfaces in this module expose the contract for the registration subsystem and must remain backward-compatible with all five listed consumer hooks.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

export interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  captchaToken?: string;
}

/**
 * Stable error codes emitted by the registration hooks.
 * Hooks never return user-facing translated strings: they emit one of these
 * codes and the screen consumer (signup.tsx) maps code -> `auth.*` catalog
 * key via {@link REGISTRATION_ERROR_I18N_KEYS} at the UI boundary.
 * Codes are plain strings so `RegistrationResult.error` stays `string`.
 */
export const REGISTRATION_ERROR_CODES = {
  REGISTRATION_FAILED: 'registration_failed',
  UNKNOWN_ERROR: 'unknown_error',
} as const;

export type RegistrationErrorCode =
  (typeof REGISTRATION_ERROR_CODES)[keyof typeof REGISTRATION_ERROR_CODES];

/**
 * Maps each stable registration error code to its `auth.*` catalog key.
 * Used by the screen consumer to translate at the UI boundary. Values stay
 * literal (not widened to `string`) so screens can pass them directly to the
 * typed `t()` function.
 */
export const REGISTRATION_ERROR_I18N_KEYS = {
  [REGISTRATION_ERROR_CODES.REGISTRATION_FAILED]: 'auth.errors_registrationFailed',
  [REGISTRATION_ERROR_CODES.UNKNOWN_ERROR]: 'auth.errors_unknownError',
} as const satisfies Record<RegistrationErrorCode, string>;

/** Returns true if `value` is a known stable registration error code. */
export function isRegistrationErrorCode(value: unknown): value is RegistrationErrorCode {
  return (
    typeof value === 'string' &&
    (Object.values(REGISTRATION_ERROR_CODES) as string[]).includes(value)
  );
}

export interface RegistrationResult {
  success: boolean;
  userId?: string;
  emailConfirmed?: boolean;
  error?: string;
}

export interface UseRegistrationReturn {
  register: (data: RegistrationData) => Promise<RegistrationResult>;
  createUserAccount: (data: RegistrationData) => Promise<RegistrationResult>;
  handlePostRegistration: (result: RegistrationResult, email: string) => void;
  isLoading: boolean;
  error: string | null;
  registrationComplete: boolean;
  resetError: () => void;
}
