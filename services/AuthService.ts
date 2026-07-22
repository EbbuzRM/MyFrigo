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

import { supabase } from './supabaseClient';
import { LoggingService } from './LoggingService';
import { authLogger } from '@/utils/AuthLogger';

/**
 * Rate limiter configuration
 */
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface RateLimitRecord {
  attempts: number;
  firstAttempt: number;
}

/**
 * In-memory rate limit tracker per email
 */
const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Cleanup interval reference to prevent multiple instances and allow cleanup
 */
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Checks if the email is rate limited
 * Returns true if allowed, false if rate limited
 */
function checkRateLimit(email: string): { allowed: boolean; remainingMs?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(email);

  if (!record) {
    return { allowed: true };
  }

  // Reset window if expired
  if (now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.delete(email);
    return { allowed: true };
  }

  // Check if under limit
  if (record.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
    const remainingMs = RATE_LIMIT_WINDOW_MS - (now - record.firstAttempt);
    return { allowed: false, remainingMs };
  }

  return { allowed: true };
}

/**
 * Records a failed login attempt
 */
function recordFailedAttempt(email: string): void {
  const now = Date.now();
  const record = rateLimitStore.get(email);

  if (!record) {
    rateLimitStore.set(email, { attempts: 1, firstAttempt: now });
  } else if (now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    // Window expired, start fresh
    rateLimitStore.set(email, { attempts: 1, firstAttempt: now });
  } else {
    record.attempts += 1;
  }
}

/**
 * Clears rate limit for an email (on successful login)
 */
function clearRateLimit(email: string): void {
  rateLimitStore.delete(email);
}

/**
 * Periodically cleans up expired rate limit records
 * Runs every 10 minutes to prevent memory leaks
 */
function startRateLimitCleanup(): void {
  if (cleanupInterval) return; // Prevent multiple instances
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [email, record] of rateLimitStore.entries()) {
      if (now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
        rateLimitStore.delete(email);
      }
    }
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
  rateLimitStore.clear();
}

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
  static async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    // Validation — return user-friendly messages before entering the try block
    if (!this.validateEmail(email)) {
      return { success: false, error: 'Formato email non valido' };
    }

    if (!email || !password) {
      authLogger.errorStep('LOGIN_VALIDATION', new Error('Email e password sono richieste'));
      return { success: false, error: 'Email e password sono richieste' };
    }

    try {
      // Rate limiting check
      const rateCheck = checkRateLimit(email);
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
        email,
        password,
      });

      const duration = Date.now() - startTime;

      if (error) {
        // Record failed attempt
        recordFailedAttempt(email);
        
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
      clearRateLimit(email);

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