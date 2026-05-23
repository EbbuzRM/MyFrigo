// useEmailAuth.test.ts — useEmailAuth test module.
//
// exports: none
// used_by: none
// rules: none

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useEmailAuth } from '../useEmailAuth';
import { AuthService } from '@/services/AuthService';

// Mock LoggingService
jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock AuthService
jest.mock('@/services/AuthService', () => ({
  AuthService: {
    signInWithEmail: jest.fn(),
  },
}));

const mockedSignInWithEmail = AuthService.signInWithEmail as jest.Mock;

describe('useEmailAuth', () => {
  const testEmail = 'test@example.com';
  const testPassword = 'TestPass123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useEmailAuth());

      expect(result.current.email).toBe('');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should provide all required functions', () => {
      const { result } = renderHook(() => useEmailAuth());

      expect(typeof result.current.setEmail).toBe('function');
      expect(typeof result.current.handleLogin).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('setEmail', () => {
    it('should update email value', () => {
      const { result } = renderHook(() => useEmailAuth());

      act(() => {
        result.current.setEmail(testEmail);
      });

      expect(result.current.email).toBe(testEmail);
    });
  });

  describe('handleLogin', () => {
    it('should perform successful login', async () => {
      mockedSignInWithEmail.mockResolvedValueOnce({
        success: true,
      });

      const { result } = renderHook(() => useEmailAuth());

      // Set email first
      act(() => {
        result.current.setEmail(testEmail);
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.handleLogin(testPassword);
      });

      expect(mockedSignInWithEmail).toHaveBeenCalledWith(testEmail, testPassword);
      expect(loginResult.success).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should handle login failure', async () => {
      mockedSignInWithEmail.mockResolvedValueOnce({
        success: false,
        error: 'Credenziali non valide',
      });

      const { result } = renderHook(() => useEmailAuth());

      act(() => {
        result.current.setEmail(testEmail);
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.handleLogin(testPassword);
      });

      expect(loginResult.success).toBe(false);
      expect(result.current.error).toBe('Credenziali non valide');
    });

    it('should handle network error during login', async () => {
      mockedSignInWithEmail.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useEmailAuth());

      act(() => {
        result.current.setEmail(testEmail);
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.handleLogin(testPassword);
      });

      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBe('Network error');
      expect(result.current.error).toBe('Network error');
    });

    it('should handle unknown error during login', async () => {
      mockedSignInWithEmail.mockRejectedValueOnce('Unknown error');

      const { result } = renderHook(() => useEmailAuth());

      act(() => {
        result.current.setEmail(testEmail);
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.handleLogin(testPassword);
      });

      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBe('Errore sconosciuto');
    });

    it('should set loading state during login', async () => {
      // Use a promise we can control
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockedSignInWithEmail.mockReturnValueOnce(promise);

      const { result } = renderHook(() => useEmailAuth());

      act(() => {
        result.current.setEmail(testEmail);
      });

      // Start login but don't await
      let loginPromise: Promise<void>;
      act(() => {
        loginPromise = result.current.handleLogin(testPassword).then(() => {});
      });

      // Should be loading now
      expect(result.current.loading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!({ success: true });
        await loginPromise;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear the error state', async () => {
      mockedSignInWithEmail.mockResolvedValueOnce({
        success: false,
        error: 'Some error',
      });

      const { result } = renderHook(() => useEmailAuth());

      act(() => {
        result.current.setEmail(testEmail);
      });

      await act(async () => {
        await result.current.handleLogin(testPassword);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Some error');
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
