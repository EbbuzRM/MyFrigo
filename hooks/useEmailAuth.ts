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
import { AuthService, AuthResult, getRateLimitStatus } from '@/services/AuthService';

/**
 * Hook per la gestione dell'autenticazione email
 * La navigazione è gestita esclusivamente dall'AuthContext tramite expo-router
 */
export const useEmailAuth = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      setLoading(true);

      // Pre-check persisted block for instant UX
      const preCheck = await getRateLimitStatus(email);
      if (!preCheck.allowed) {
        const minutes = Math.ceil((preCheck.remainingMs || 0) / 60000);
        const msg = `Troppi tentativi di login. Riprova tra ${minutes} minuti.`;
        setError(msg);
        setRateLimitedUntil(Date.now() + (preCheck.remainingMs || 0));
        setRemainingMs(preCheck.remainingMs);
        setAttemptsLeft(0);
        return { success: false, error: msg };
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
        // con messaggio di blocco per UX immediata (§6: "Troppi tentativi" già al 5°)
        const status = await getRateLimitStatus(email);
        if (!status.allowed) {
          const minutes = Math.ceil((status.remainingMs || 0) / 60000);
          const msg = `Troppi tentativi di login. Riprova tra ${minutes} minuti.`;
          setError(msg);
          return { success: false, error: msg };
        }

        setError(result.error || 'Errore durante il login');
        // If blocked after this attempt, ensure countdown shown even if error already set
        if (result.error?.includes('Troppi tentativi')) {
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
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      LoggingService.error('useEmailAuth', 'Login failed', err);
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [email, refreshRateLimitState]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    email,
    setEmail,
    loading,
    error,
    handleLogin,
    clearError,
    rateLimitedUntil,
    remainingMs,
    attemptsLeft,
    isRateLimited,
    refreshRateLimitState,
  };
};