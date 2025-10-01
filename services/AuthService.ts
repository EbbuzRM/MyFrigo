import { supabase } from './supabaseClient';
import { LoggingService } from './LoggingService';
import { authLogger } from '@/utils/AuthLogger';

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
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Esegue il login con email e password
   */
  static async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
      if (!this.validateEmail(email)) {
        throw new Error('Formato email non valido');
      }

      if (!email || !password) {
        authLogger.errorStep('LOGIN_VALIDATION', new Error('Email e password sono richieste'));
        throw new Error('Email e password sono richieste');
      }

      authLogger.endStep('LOGIN_VALIDATION');
      authLogger.startStep('SUPABASE_LOGIN');

      LoggingService.info('AuthService', 'Attempting direct Supabase login', { email });

      const startTime = Date.now();

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      const duration = Date.now() - startTime;

      if (error) {
        authLogger.errorStep('SUPABASE_LOGIN', error);

        // Gestione errore email non confermata
        if (error.message?.includes('Email not confirmed') || error.message?.includes('email_not_confirmed')) {
          LoggingService.warning('AuthService', 'Login failed - email not confirmed', {
            duration,
            errorMessage: error.message,
            email: email
          });

          return {
            success: false,
            error: 'Email non confermata. Controlla la tua email e clicca sul link di conferma.'
          };
        }

        LoggingService.error('AuthService', 'Login failed', {
          duration,
          errorMessage: error.message,
          email: email
        });

        return {
          success: false,
          error: error.message || 'Login fallito'
        };
      }

      authLogger.endStep('SUPABASE_LOGIN', { duration });
      LoggingService.info('AuthService', 'Login successful', {
        duration,
        email: email
      });

      authLogger.completeAuth(true);
      return { success: true, duration };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      LoggingService.error('AuthService', 'Login failed', error);
      authLogger.completeAuth(false);

      return {
        success: false,
        error: errorMessage
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