// AuthService.ts — AuthService module.
//
// exports: cleanupRateLimiter | AuthResult | AuthService
// used_by: components\LoginForm.tsx
//                   hooks\__tests__\useEmailAuth.test.ts
//                   hooks\__tests__\useGoogleAuth.test.ts
//                   hooks\useEmailAuth.ts
//                   hooks\useGoogleAuth.ts
// rules:   - All authentication methods must use `AuthLogger` for step tracking and error logging
//          - Email validation must always run before any Supabase authentication call
//          - All authentication operations must measure and return duration in `AuthResult`
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';
import { LoggingService } from './LoggingService';
import { authLogger } from '@/utils/AuthLogger';

/**
 * Rate limiter configuration
 * Client-side hardening: Supabase server default (30/ora per IP) insufficiente
 * per brute force mirato. Questo limiter aggiunge protezione per-email.
 * Suggerimento dashboard Supabase: Auth > Rate Limits -> abbassare Email + OTP
 * a 5/15min o abilitare CAPTCHA/leaked-password protection.
 */
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_STORAGE_KEY = 'myfrigo:rateLimitStore';
const RATE_LIMIT_WARNING_THRESHOLD = 3;
const OTP_RATE_LIMIT_SUFFIX = ':otp';

interface RateLimitRecord {
  attempts: number;
  firstAttempt: number;
}

/**
 * In-memory rate limit tracker per email (normalized key)
 * Persisted to AsyncStorage for survive app restart
 */
const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Cleanup interval reference to prevent multiple instances and allow cleanup
 */
let cleanupInterval: ReturnType<typeof setInterval> | null = null;
let isStoreLoaded = false;
let persistDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getOtpKey(email: string): string {
  return `${normalizeEmail(email)}${OTP_RATE_LIMIT_SUFFIX}`;
}

async function loadRateLimitStore(): Promise<void> {
  if (isStoreLoaded) return;
  isStoreLoaded = true;
  try {
    const raw = await AsyncStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, RateLimitRecord>;
    const now = Date.now();
    for (const [key, record] of Object.entries(parsed)) {
      if (
        record &&
        typeof record.attempts === 'number' &&
        typeof record.firstAttempt === 'number' &&
        now - record.firstAttempt <= RATE_LIMIT_WINDOW_MS
      ) {
        rateLimitStore.set(key, record);
      }
    }
  } catch {
    // Fallback: in-memory only if AsyncStorage unavailable or corrupted
  }
}

async function persistRateLimitStore(): Promise<void> {
  try {
    if (rateLimitStore.size === 0) {
      await AsyncStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
      return;
    }
    const obj: Record<string, RateLimitRecord> = {};
    for (const [k, v] of rateLimitStore.entries()) obj[k] = v;
    await AsyncStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(obj));
  } catch {
    // Fallback: ignore persist errors, keep in-memory working
  }
}

function schedulePersist(): void {
  if (persistDebounceTimer) clearTimeout(persistDebounceTimer);
  persistDebounceTimer = setTimeout(() => {
    persistDebounceTimer = null;
    void persistRateLimitStore();
  }, 50);
}

async function ensureStoreLoaded(): Promise<void> {
  if (!isStoreLoaded) await loadRateLimitStore();
}

/**
 * Checks if the email is rate limited
 * Returns true if allowed, false if rate limited
 */
async function checkRateLimit(email: string): Promise<{ allowed: boolean; remainingMs?: number; attemptsLeft: number }> {
  await ensureStoreLoaded();
  const key = normalizeEmail(email);
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record) {
    return { allowed: true, attemptsLeft: RATE_LIMIT_MAX_ATTEMPTS };
  }

  // Reset window if expired
  if (now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.delete(key);
    schedulePersist();
    return { allowed: true, attemptsLeft: RATE_LIMIT_MAX_ATTEMPTS };
  }

  const attemptsLeft = Math.max(0, RATE_LIMIT_MAX_ATTEMPTS - record.attempts);

  // Check if under limit
  if (record.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
    const remainingMs = RATE_LIMIT_WINDOW_MS - (now - record.firstAttempt);
    return { allowed: false, remainingMs, attemptsLeft: 0 };
  }

  return { allowed: true, attemptsLeft };
}

/**
 * Records a failed login attempt
 */
async function recordFailedAttempt(email: string): Promise<void> {
  await ensureStoreLoaded();
  const key = normalizeEmail(email);
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record) {
    rateLimitStore.set(key, { attempts: 1, firstAttempt: now });
  } else if (now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    // Window expired, start fresh
    rateLimitStore.set(key, { attempts: 1, firstAttempt: now });
  } else {
    record.attempts += 1;
  }

  const updated = rateLimitStore.get(key)!;
  if (updated.attempts === RATE_LIMIT_WARNING_THRESHOLD) {
    LoggingService.warning('AuthService', 'Rate limit warning threshold reached', {
      email: key,
      attempts: updated.attempts,
    });
  }
  if (updated.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
    LoggingService.error('AuthService', 'Rate limit exceeded - brute force block', {
      email: key,
      attempts: updated.attempts,
    });
  }

  schedulePersist();
}

/**
 * Clears rate limit for an email (on successful login)
 */
async function clearRateLimit(email: string): Promise<void> {
  await ensureStoreLoaded();
  const key = normalizeEmail(email);
  if (rateLimitStore.delete(key)) {
    schedulePersist();
  }
}

/** OTP variants use same store with suffix key */
export async function checkOtpRateLimit(email: string): Promise<{ allowed: boolean; remainingMs?: number; attemptsLeft: number }> {
  return checkRateLimit(getOtpKey(email));
}

export async function recordOtpFailedAttempt(email: string): Promise<void> {
  return recordFailedAttempt(getOtpKey(email));
}

export async function clearOtpRateLimit(email: string): Promise<void> {
  return clearRateLimit(getOtpKey(email));
}

export async function getRateLimitStatus(email: string): Promise<{ allowed: boolean; remainingMs?: number; attemptsLeft: number; attempts: number }> {
  await ensureStoreLoaded();
  const key = normalizeEmail(email);
  // checkRateLimit may delete expired record — read attempts AFTER check
  const base = await checkRateLimit(email);
  const updated = rateLimitStore.get(key);
  return { ...base, attempts: updated?.attempts ?? 0 };
}

export async function getOtpRateLimitStatus(email: string): Promise<{ allowed: boolean; remainingMs?: number; attemptsLeft: number; attempts: number }> {
  const key = getOtpKey(email);
  const base = await checkOtpRateLimit(email);
  const updated = rateLimitStore.get(key);
  return { ...base, attempts: updated?.attempts ?? 0 };
}

/**
 * Periodically cleans up expired rate limit records
 * Runs every 10 minutes to prevent memory leaks
 */
function startRateLimitCleanup(): void {
  if (cleanupInterval) return; // Prevent multiple instances
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    let changed = false;
    for (const [key, record] of rateLimitStore.entries()) {
      if (now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
        rateLimitStore.delete(key);
        changed = true;
      }
    }
    if (changed) void persistRateLimitStore();
  }, 10 * 60 * 1000); // 10 minutes
}

// Start cleanup on module load
startRateLimitCleanup();

/**
 * Cleans up the rate limiter interval and clears the store.
 * Call this during application shutdown or test teardown.
 */
export function cleanupRateLimiter(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  if (persistDebounceTimer) {
    clearTimeout(persistDebounceTimer);
    persistDebounceTimer = null;
  }
  rateLimitStore.clear();
  isStoreLoaded = false;
  // Fire-and-forget clear persisted store; do not block teardown
  void (async () => {
    try {
      await AsyncStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
    } catch {
      // ignore
    }
  })();
}

/** Test-only helpers to control persistence in unit tests */
export const __testing = {
  getStore: () => rateLimitStore,
  getStorageKey: () => RATE_LIMIT_STORAGE_KEY,
  normalizeEmail,
  getOtpKey,
  resetLoaded: () => { isStoreLoaded = false; },
};

/**
 * Interfaccia per il risultato dell'autenticazione
 */
export interface AuthResult {
  success: boolean;
  error?: string;
  duration?: number;
}

/**
 * Servizio centralizzato per la gestione dell'autenticazione
 */
export class AuthService {

  /**
   * Valida il formato dell'email
   */
  static validateEmail(email: string): boolean {
    // NOTE: Basic email validation. Does not support multi-part TLDs (.co.uk) or +aliases.
    // Supabase handles full validation server-side.
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Esegue il login con email e password
   */
  static async signInWithEmail(email: string, password: string, captchaToken?: string): Promise<AuthResult> {
    // Normalize once — validation + rate limiting + supabase must share same bucket
    const normalizedEmail = normalizeEmail(email);
    // Validation on normalized email (trim+lowercase) so " Test@Example.COM " is valid
    if (!this.validateEmail(normalizedEmail)) {
      return { success: false, error: 'Formato email non valido' };
    }

    if (!normalizedEmail || !password) {
      authLogger.errorStep('LOGIN_VALIDATION', new Error('Email e password sono richieste'));
      return { success: false, error: 'Email e password sono richieste' };
    }

    try {
      // Rate limiting check (normalized + persisted)
      const rateCheck = await checkRateLimit(normalizedEmail);
      if (!rateCheck.allowed) {
        const minutes = Math.ceil((rateCheck.remainingMs || 0) / 60000);
        return {
          success: false,
          error: `Troppi tentativi di login. Riprova tra ${minutes} minuti.`
        };
      }

      authLogger.endStep('LOGIN_VALIDATION');
      authLogger.startStep('SUPABASE_LOGIN');

      LoggingService.info('AuthService', 'Login attempt');

      const startTime = Date.now();

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
        options: captchaToken ? { captchaToken } : undefined,
      });

      const duration = Date.now() - startTime;

      if (error) {
        // Record failed attempt (persisted + normalized)
        await recordFailedAttempt(normalizedEmail);
        
        authLogger.errorStep('SUPABASE_LOGIN', error);

        const errMsg = (error.message?.toLowerCase() || '').trim();

        // Caso 1: Credenziali non valide → messaggio generico (previene enumerazione email)
        // Supabase restituisce "Invalid login credentials" per password errata o email inesistente
        if (errMsg.includes('invalid') && (errMsg.includes('credentials') || errMsg.includes('login'))) {
          LoggingService.warning('AuthService', 'Login failed - invalid credentials', {
            duration,
          });

          return {
            success: false,
            error: 'Email o password non validi.'
          };
        }

        // Caso 2: Email non confermata → messaggio specifico (informativo, non rivela esistenza account)
        if (errMsg.includes('email') && errMsg.includes('confirm')) {
          LoggingService.warning('AuthService', 'Login failed - email not confirmed', {
            duration,
          });

          return {
            success: false,
            error: 'Se le credenziali sono corrette, riceverai un\'email di conferma.'
          };
        }

        // Caso 3: Altri errori sconosciuti → messaggio generico di sicurezza
        LoggingService.error('AuthService', 'Login failed - unexpected error', {
          duration,
          error: errMsg,
        });

        return {
          success: false,
          error: 'Email o password non validi.'
        };
      }

      authLogger.endStep('SUPABASE_LOGIN', { duration });
      LoggingService.info('AuthService', 'Login successful', {
        duration,
      });

      // Clear rate limit on successful login
      await clearRateLimit(normalizedEmail);

      authLogger.completeAuth(true);
      return { success: true, duration };

    } catch (error) {
      LoggingService.error('AuthService', 'Login failed', error);
      authLogger.completeAuth(false);

      return {
        success: false,
        error: 'Si è verificato un errore durante il login. Riprova.'
      };
    }
  }

  /**
   * Esegue il login con Google
   */
  static async signInWithGoogle(idToken: string): Promise<AuthResult> {
    try {
      authLogger.startStep('SUPABASE_GOOGLE_AUTH');

      const startTime = Date.now();
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      const duration = Date.now() - startTime;

      if (error) {
        authLogger.errorStep('SUPABASE_GOOGLE_AUTH', error);
        throw new Error(error.message || 'Google login fallito');
      }

      authLogger.endStep('SUPABASE_GOOGLE_AUTH', { duration });
      LoggingService.info('AuthService', 'Google login successful', { duration });

      authLogger.completeAuth(true);
      return { success: true, duration };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      LoggingService.error('AuthService', 'Google login failed', error);
      authLogger.completeAuth(false);

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Gestisce gli errori di configurazione di Google Sign-In
   */
  static handleGoogleSignInConfigurationError(): AuthResult {
    const errorMessage = 'Il modulo nativo di Google Sign-In non è correttamente collegato. Questo problema si verifica solitamente quando si utilizza Expo Go invece di un custom development client.';

    LoggingService.error('AuthService', 'Google Sign-In native module error detected', {
      errorMessage,
      suggestion: 'Usa un custom development client con EAS Build'
    });

    return {
      success: false,
      error: errorMessage
    };
  }
}