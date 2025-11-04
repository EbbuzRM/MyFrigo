import { useState, useCallback } from 'react';
import { LoggingService } from '@/services/LoggingService';
import { AuthService, AuthResult } from '@/services/AuthService';

/**
 * Hook per la gestione dell'autenticazione email
 * La navigazione è gestita esclusivamente dall'AuthContext tramite expo-router
 */
export const useEmailAuth = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = useCallback(async (password: string): Promise<AuthResult> => {
    try {
      setError(null);
      setLoading(true);

      const result = await AuthService.signInWithEmail(email, password);

      if (result.success) {
        // La navigazione è gestita dall'AuthContext, non è necessario il BackHandler
        LoggingService.info('useEmailAuth', 'Email login successful');
      } else {
        setError(result.error || 'Errore durante il login');
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      LoggingService.error('useEmailAuth', 'Login failed', error);
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [email]);

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
  };
};