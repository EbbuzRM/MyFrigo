// useEmailAuth.test.ts — useEmailAuth test module.
//
// exports: none
// used_by: none
// rules: none

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useEmailAuth } from '../useEmailAuth';
import { AuthService, getRateLimitStatus } from '@/services/AuthService';

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
  AUTH_ERROR_CODES: {
    INVALID_EMAIL_FORMAT: 'invalid_email_format',
    MISSING_CREDENTIALS: 'missing_credentials',
    RATE_LIMITED: 'rate_limited',
    INVALID_CREDENTIALS: 'invalid_credentials',
    EMAIL_NOT_CONFIRMED: 'email_not_confirmed',
    LOGIN_FAILED: 'login_failed',
    GOOGLE_FAILED: 'google_failed',
    GOOGLE_CONFIG_ERROR: 'google_config_error',
  },
  getRateLimitStatus: jest.fn(() => Promise.resolve({ allowed: true, attemptsLeft: 5, remainingMs: 0, attempts: 0 })),
  getOtpRateLimitStatus: jest.fn(() => Promise.resolve({ allowed: true, attemptsLeft: 5, remainingMs: 0, attempts: 0 })),
  checkOtpRateLimit: jest.fn(() => Promise.resolve({ allowed: true, attemptsLeft: 5 })),
  recordOtpFailedAttempt: jest.fn(() => Promise.resolve()),
  clearOtpRateLimit: jest.fn(() => Promise.resolve()),
  __testing: {
    getStore: () => new Map(),
    getStorageKey: () => 'myfrigo:rateLimitStore',
    normalizeEmail: (e: string) => e.trim().toLowerCase(),
    getOtpKey: (e: string) => `${e.trim().toLowerCase()}:otp`,
    resetLoaded: jest.fn(),
  },
}));

const mockedSignInWithEmail = AuthService.signInWithEmail as jest.Mock;
const mockedGetRateLimitStatus = getRateLimitStatus as jest.Mock;

describe('useEmailAuth', () => {
  const testEmail = 'test@example.com';
  const testPassword = 'TestPass123';

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetRateLimitStatus.mockResolvedValue({ allowed: true, attemptsLeft: 5, remainingMs: 0, attempts: 0 });
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

      // captchaToken is undefined: handleLogin called without a captcha token
      expect(mockedSignInWithEmail).toHaveBeenCalledWith(
        testEmail,
        testPassword,
        undefined
      );
      expect(loginResult!.success).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should handle login failure', async () => {
      mockedSignInWithEmail.mockResolvedValueOnce({
        success: false,
        error: 'invalid_credentials',
      });

      const { result } = renderHook(() => useEmailAuth());

      act(() => {
        result.current.setEmail(testEmail);
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.handleLogin(testPassword);
      });

      expect(loginResult!.success).toBe(false);
      // The hook stores the stable code; the screen translates it at the boundary.
      expect(result.current.error).toBe('invalid_credentials');
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

      expect(loginResult!.success).toBe(false);
      // Provider/transport messages never surface: generic login code instead.
      expect(loginResult!.error).toBe('login_failed');
      expect(result.current.error).toBe('login_failed');
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

      expect(loginResult!.success).toBe(false);
      expect(loginResult!.error).toBe('login_failed');
    });

    it('should return the rate_limited code with count params when pre-check is blocked', async () => {
      const { result } = renderHook(() => useEmailAuth());

      act(() => {
        result.current.setEmail(testEmail);
      });

      // Let the email-change effect settle, then simulate a persisted block.
      await act(async () => {
        await Promise.resolve();
      });
      mockedGetRateLimitStatus.mockResolvedValue({ allowed: false, remainingMs: 120000, attemptsLeft: 0, attempts: 5 });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.handleLogin(testPassword);
      });

      expect(loginResult!.success).toBe(false);
      expect(loginResult!.error).toBe('rate_limited');
      expect(loginResult!.errorParams).toEqual({ count: 2 });
      expect(result.current.error).toBe('rate_limited');
      expect(result.current.errorParams).toEqual({ count: 2 });
      expect(mockedSignInWithEmail).not.toHaveBeenCalled();
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
        error: 'invalid_credentials',
      });

      const { result } = renderHook(() => useEmailAuth());

      act(() => {
        result.current.setEmail(testEmail);
      });

      await act(async () => {
        await result.current.handleLogin(testPassword);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('invalid_credentials');
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.errorParams).toBeUndefined();
    });
  });
});
