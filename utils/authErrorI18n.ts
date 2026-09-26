// authErrorI18n.ts — authErrorI18n module.
//
// exports: translateAuthError | translateRegistrationError
// used_by: components\LoginForm.tsx
//                   app\login.tsx
//                   app\signup.tsx
//                   hooks\useGoogleAuth.ts
// rules:   Hooks/services only emit stable error codes (never user-facing
//          strings); screens translate codes at the UI boundary via these
//          helpers. Unknown codes fall back to `auth.errors_unknownError` so
//          a raw code is never shown to the user.
// agent:   executor | 2026-09-23 | Fase B i18n | gruppo 2 auth: CHIUSURA

import type { TFunction } from 'i18next';
import {
  AUTH_ERROR_CODES,
  AUTH_ERROR_I18N_KEYS,
  type AuthErrorCode,
} from '@/services/AuthService';
import {
  REGISTRATION_ERROR_CODES,
  REGISTRATION_ERROR_I18N_KEYS,
  type RegistrationErrorCode,
} from '@/hooks/useRegistration.types';

export type AuthErrorParams = Record<string, string | number>;

function isKnownCode(code: string, codes: readonly string[]): boolean {
  return codes.includes(code);
}

/**
 * Translates a stable auth error code (see `AUTH_ERROR_CODES`) into the
 * user-facing message for the active language. `params` carries i18next
 * interpolation values (e.g. `{ count }` for the rate-limit plural).
 * Unknown/missing codes resolve to `auth.errors_unknownError`.
 */
export function translateAuthError(
  t: TFunction,
  code: string | null | undefined,
  params?: AuthErrorParams
): string {
  if (
    typeof code === 'string' &&
    isKnownCode(code, Object.values(AUTH_ERROR_CODES))
  ) {
    return t(AUTH_ERROR_I18N_KEYS[code as AuthErrorCode], params);
  }
  return t('auth.errors_unknownError');
}

/**
 * Translates a stable registration error code (see
 * `REGISTRATION_ERROR_CODES`) into the user-facing message for the active
 * language. Unknown/missing codes resolve to `auth.errors_unknownError`.
 */
export function translateRegistrationError(
  t: TFunction,
  code: string | null | undefined
): string {
  if (
    typeof code === 'string' &&
    isKnownCode(code, Object.values(REGISTRATION_ERROR_CODES))
  ) {
    return t(REGISTRATION_ERROR_I18N_KEYS[code as RegistrationErrorCode]);
  }
  return t('auth.errors_unknownError');
}
