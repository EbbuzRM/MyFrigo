// useEmailAuth.ts — useEmailAuth module.
//
// exports: useEmailAuth
// used_by: components\LoginForm.tsx
//                   components\__tests__\LoginForm.test.tsx
// rules:   The authentication flow is managed exclusively by AuthContext via expo-router; this hook must never handle navigation or redirection logic.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { useState, useCallback, useEffect, useRef } from 'react';
import { LoggingService } from '@/services/LoggingService';
import {
  AuthService,
  AuthResult,
  AUTH_ERROR_CODES,
  getRateLimitStatus,
  type AuthErrorCode,
} from '@/services/AuthService';
import type { AuthErrorParams } from '@/utils/authErrorI18n';

/**
 * Hook per la gestione dell'autenticazione email
 * La navigazione è gestita esclusivamente dall'AuthContext tramite expo-router
 */
export const useEmailAuth = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorParams, setErrorParams] = useState<AuthErrorParams | undefined>(undefined);
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | undefined>(undefined);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshRateLimitState = useCallback(async (targetEmail: string) => {
    try {
      const status = await getRateLimitStatus(targetEmail);
      if (!status.allowed && status.remainingMs) {
        setRateLimitedUntil(Date.now() + status.remainingMs);
        setRemainingMs(status.remainingMs);
      } else {
        setRateLimitedUntil(null);
        setRemainingMs(undefined);
      }
      setAttemptsLeft(status.attemptsLeft);
    } catch {
      // ignore
    }
  }, []);

  // Sync attemptsLeft / block when email changes (read persisted state)
  useEffect(() => {
    if (email) void refreshRateLimitState(email);
    else {
      setRateLimitedUntil(null);
      setRemainingMs(undefined);
      setAttemptsLeft(null);
    }
  }, [email, refreshRateLimitState]);

  // Countdown tick per UX
  useEffect(() => {
    if (rateLimitedUntil == null) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      return;
    }
    const tick = () => {
      const rem = rateLimitedUntil - Date.now();
      if (rem <= 0) {
        setRateLimitedUntil(null);
        setRemainingMs(undefined);
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        void refreshRateLimitState(email);
      } else {
        setRemainingMs(rem);
      }
    };
    tick();
    countdownRef.current = setInterval(tick, 1000);
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [rateLimitedUntil, email, refreshRateLimitState]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const isRateLimited = rateLimitedUntil != null && (remainingMs ?? 0) > 0;

  const handleLogin = useCallback(async (password: string, captchaToken?: string): Promise<AuthResult> => {
    try {
      setError(null);
      setErrorParams(undefined);
      setLoading(true);

      // Pre-check persisted block for instant UX. The hook only stores the
      // stable `rate_limited` code (+ `{ count }` params): the screen maps
      // code -> `auth.*` catalog text at the UI boundary.
      const preCheck = await getRateLimitStatus(email);
      if (!preCheck.allowed) {
        const minutes = Math.ceil((preCheck.remainingMs || 0) / 60000);
        setError(AUTH_ERROR_CODES.RATE_LIMITED);
        setErrorParams({ count: minutes });
        setRateLimitedUntil(Date.now() + (preCheck.remainingMs || 0));
        setRemainingMs(preCheck.remainingMs);
        setAttemptsLeft(0);
        return { success: false, error: AUTH_ERROR_CODES.RATE_LIMITED, errorParams: { count: minutes } };
      }

      const result = await AuthService.signInWithEmail(email, password, captchaToken);

      // Refresh state after attempt (success clears, failure updates)
      await refreshRateLimitState(email);

      if (result.success) {
        LoggingService.info('useEmailAuth', 'Email login successful');
        setRateLimitedUntil(null);
        setRemainingMs(undefined);
      } else {
        // Se limite appena raggiunto al 5° fallimento, sovrascrivi errore generico
        // con codice di blocco per UX immediata (§6: rate-limit già al 5°)
        const status = await getRateLimitStatus(email);
        if (!status.allowed) {
          const minutes = Math.ceil((status.remainingMs || 0) / 60000);
          setError(AUTH_ERROR_CODES.RATE_LIMITED);
          setErrorParams({ count: minutes });
          return { success: false, error: AUTH_ERROR_CODES.RATE_LIMITED, errorParams: { count: minutes } };
        }

        setError(result.error ?? AUTH_ERROR_CODES.LOGIN_FAILED);
        // If blocked after this attempt, ensure countdown shown even if error already set
        if (result.error === AUTH_ERROR_CODES.RATE_LIMITED) {
          const s = await getRateLimitStatus(email);
          if (!s.allowed && s.remainingMs) {
            setRateLimitedUntil(Date.now() + s.remainingMs);
            setRemainingMs(s.remainingMs);
            setAttemptsLeft(0);
          }
        }
      }

      return result;

    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : null;
      const code: AuthErrorCode =
        rawMessage !== null &&
        (Object.values(AUTH_ERROR_CODES) as string[]).includes(rawMessage)
          ? (rawMessage as AuthErrorCode)
          : AUTH_ERROR_CODES.LOGIN_FAILED;
      LoggingService.error('useEmailAuth', 'Login failed', err);
      setError(code);
      setErrorParams(undefined);

      return {
        success: false,
        error: code
      };
    } finally {
      setLoading(false);
    }
  }, [email, refreshRateLimitState]);

  const clearError = useCallback(() => {
    setError(null);
    setErrorParams(undefined);
  }, []);

  return {
    email,
    setEmail,
    loading,
    error,
    errorParams,
    handleLogin,
    clearError,
    rateLimitedUntil,
    remainingMs,
    attemptsLeft,
    isRateLimited,
    refreshRateLimitState,
  };
};