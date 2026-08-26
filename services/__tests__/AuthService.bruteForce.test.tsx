// AuthService.bruteForce.test.ts — Demo brute force protection.
// exports: none
// used_by: none

/**
 * Test dimostrativo protezione brute force.
 * Factory + fake timers + AsyncStorage persistence.
 * Non rompe test esistenti — usa cleanupRateLimiter + AsyncStorage.clear.
 */

jest.mock('../supabaseClient', () => {
  const mockSupabase = {
    auth: {
      signInWithPassword: jest.fn(),
      signInWithIdToken: jest.fn(),
    },
    from: jest.fn(),
  };
  return { supabase: mockSupabase };
});

jest.mock('../LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
  },
}));

jest.mock('@/utils/AuthLogger', () => ({
  authLogger: {
    startAuth: jest.fn(),
    startStep: jest.fn(),
    endStep: jest.fn(),
    errorStep: jest.fn(),
    completeAuth: jest.fn(),
  },
  AuthLogger: {
    getInstance: jest.fn(() => ({
      startAuth: jest.fn(),
      startStep: jest.fn(),
      endStep: jest.fn(),
      errorStep: jest.fn(),
      completeAuth: jest.fn(),
      getAuthSummary: jest.fn(() => ({})),
    })),
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService, cleanupRateLimiter, checkOtpRateLimit, recordOtpFailedAttempt, getRateLimitStatus, getOtpRateLimitStatus, __testing } from '../AuthService';
import { supabase } from '../supabaseClient';
import { LoggingService } from '../LoggingService';
import * as UseEmailAuthModule from '@/hooks/useEmailAuth';
import * as UsePasswordValidationModule from '@/hooks/usePasswordValidation';
import { renderHook, act } from '@testing-library/react-native';
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LoginForm } from '@/components/LoginForm';

// Helpers / factories
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

type RateMock = jest.MockedFunction<typeof supabase.auth.signInWithPassword>;

const getMockEmail = (overrides?: Partial<{ raw: string; normalized: string }>) => {
  const raw = overrides?.raw ?? 'test@example.com';
  const normalized = overrides?.normalized ?? raw.trim().toLowerCase();
  return { raw, normalized };
};

const getMockRateLimitError = () => ({ message: 'Invalid login credentials' });

const mockFailedLogin = (mock: RateMock) => {
  mock.mockResolvedValue({ data: null, error: getMockRateLimitError() } as any);
};

const mockSuccessfulLogin = (mock: RateMock) => {
  mock.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null } as any);
};

function flushPersistTimers() {
  // schedulePersist debounce 50ms
  jest.advanceTimersByTime(60);
}

describe('AuthService — Brute Force Protection Demo', () => {
  const supabaseMock = supabase.auth.signInWithPassword as unknown as RateMock;

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T10:00:00.000Z'));
    jest.clearAllMocks();
    cleanupRateLimiter();
    // cleanupRateLimiter fire-and-forget removeItem — flush microtasks
    await Promise.resolve();
    // Ensure debounce timer cleared after cleanup
    jest.runOnlyPendingTimers();
    await AsyncStorage.clear();
    // Reset LoggingService mocks
    (LoggingService.warning as jest.Mock).mockClear();
    (LoggingService.error as jest.Mock).mockClear();
  });

  afterEach(async () => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    cleanupRateLimiter();
    await AsyncStorage.clear();
    await Promise.resolve();
    jest.clearAllMocks();
  });

  describe('1. 5 tentativi falliti → 6° bloccato', () => {
    it('dopo 5 fallimenti, il 6° ritorna allowed=false con messaggio Troppi tentativi e remainingMs >0', async () => {
      mockFailedLogin(supabaseMock);

      for (let i = 0; i < 5; i++) {
        const r = await AuthService.signInWithEmail('victim@example.com', 'wrong');
        expect(r.success).toBe(false);
        expect(r.error).not.toContain('Troppi tentativi');
        flushPersistTimers();
        // allow persist promise to resolve
        await Promise.resolve();
      }

      // 6th — should be blocked without hitting supabase
      supabaseMock.mockClear();
      const blocked = await AuthService.signInWithEmail('victim@example.com', 'wrong');

      expect(blocked.success).toBe(false);
      expect(blocked.error).toContain('Troppi tentativi');
      expect(supabaseMock).not.toHaveBeenCalled();

      const status = await getRateLimitStatus('victim@example.com');
      expect(status.allowed).toBe(false);
      expect(status.remainingMs).toBeGreaterThan(0);
      expect(status.remainingMs).toBeLessThanOrEqual(RATE_LIMIT_WINDOW_MS);
      expect(status.attempts).toBe(5);
      expect(status.attemptsLeft).toBe(0);
    });

    it('logger: warning a 3° tentativo, error a 5°', async () => {
      mockFailedLogin(supabaseMock);
      for (let i = 0; i < 5; i++) {
        await AuthService.signInWithEmail('log@example.com', 'wrong');
        flushPersistTimers();
        await Promise.resolve();
      }
      expect(LoggingService.warning).toHaveBeenCalledWith('AuthService', 'Rate limit warning threshold reached', expect.objectContaining({ attempts: 3 }));
      expect(LoggingService.error).toHaveBeenCalledWith('AuthService', 'Rate limit exceeded - brute force block', expect.objectContaining({ attempts: 5 }));
    });
  });

  describe('2. Normalizzazione email (trim+lowercase) condivide counter', () => {
    it('" Test@Example.COM " e "test@example.com" condividono lo stesso bucket', async () => {
      mockFailedLogin(supabaseMock);
      const variants = [' Test@Example.COM ', 'test@example.com', ' TEST@example.com', 'test@EXAMPLE.com ', '  test@example.com  '];

      // 5 fallimenti usando varianti diverse
      for (const email of variants) {
        const r = await AuthService.signInWithEmail(email, 'wrong');
        // first 5 should not yet be blocked (block starts at 6th)
        // But after 5 total, next is blocked
        flushPersistTimers();
        await Promise.resolve();
        expect(r.success).toBe(false);
      }

      // Dopo 5 tentativi distribuiti su varianti, la 6° con canonical deve essere bloccata
      supabaseMock.mockClear();
      const blocked = await AuthService.signInWithEmail('test@example.com', 'wrong');
      expect(blocked.success).toBe(false);
      expect(blocked.error).toContain('Troppi tentativi');
      expect(supabaseMock).not.toHaveBeenCalled();

      // Anche variante con spazi/case deve essere bloccata
      const blocked2 = await AuthService.signInWithEmail('  TEST@EXAMPLE.COM ', 'wrong');
      expect(blocked2.success).toBe(false);
      expect(blocked2.error).toContain('Troppi tentativi');

      // Email diversa non è bloccata
      mockSuccessfulLogin(supabaseMock);
      const other = await AuthService.signInWithEmail('other@example.com', 'correct');
      expect(other.success).toBe(true);
    });

    it('normalizeEmail helper esposto in __testing normalizza correttamente', () => {
      expect(__testing.normalizeEmail(' Test@Example.COM ')).toBe('test@example.com');
      expect(__testing.getOtpKey(' Test@Example.COM ')).toBe('test@example.com:otp');
    });
  });

  describe('3. OTP brute force: 5 verify fallite → 6° bloccata', () => {
    it('5 recordOtpFailedAttempt → checkOtpRateLimit blocca la 6°', async () => {
      const email = 'otp@example.com';
      // Simula 5 tentativi OTP falliti
      for (let i = 0; i < 5; i++) {
        await recordOtpFailedAttempt(email);
        flushPersistTimers();
        await Promise.resolve();
        const mid = await checkOtpRateLimit(email);
        if (i < 4) expect(mid.allowed).toBe(true);
      }
      flushPersistTimers();
      await Promise.resolve();

      const blocked = await checkOtpRateLimit(email);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remainingMs).toBeGreaterThan(0);
      expect(blocked.attemptsLeft).toBe(0);

      const status = await getOtpRateLimitStatus(email);
      expect(status.allowed).toBe(false);
      expect(status.attempts).toBe(5);

      // bucket OTP separato dal login: login stesso email non è bloccato
      const loginStatus = await getRateLimitStatus(email);
      expect(loginStatus.allowed).toBe(true);
      expect(loginStatus.attempts).toBe(0);
    });

    it('OTP con varianti case/spazi condivide bucket', async () => {
      await recordOtpFailedAttempt(' OTP@Test.COM ');
      flushPersistTimers(); await Promise.resolve();
      await recordOtpFailedAttempt('otp@test.com');
      flushPersistTimers(); await Promise.resolve();
      await recordOtpFailedAttempt(' OTP@test.com ');
      flushPersistTimers(); await Promise.resolve();
      await recordOtpFailedAttempt('otp@TEST.com');
      flushPersistTimers(); await Promise.resolve();
      await recordOtpFailedAttempt('otp@test.com');
      flushPersistTimers(); await Promise.resolve();

      const s = await checkOtpRateLimit('  otp@test.com ');
      expect(s.allowed).toBe(false);
    });
  });

  describe('4. Sblocco dopo window (15min+1s)', () => {
    it('dopo 15min+1s, allowed torna true e nuovo tentativo non è bloccato', async () => {
      mockFailedLogin(supabaseMock);
      for (let i = 0; i < 5; i++) {
        await AuthService.signInWithEmail('window@example.com', 'wrong');
        flushPersistTimers(); await Promise.resolve();
      }
      const blocked = await getRateLimitStatus('window@example.com');
      expect(blocked.allowed).toBe(false);

      // Avanza oltre finestra
      jest.advanceTimersByTime(RATE_LIMIT_WINDOW_MS + 1000);
      await Promise.resolve();

      const afterWindow = await getRateLimitStatus('window@example.com');
      expect(afterWindow.allowed).toBe(true);
      expect(afterWindow.attemptsLeft).toBe(5);

      // Verifica login ora passa a supabase (non più bloccato)
      // Reset mock counter prima del nuovo tentativo — i 5 fallimenti precedenti restano in history
      supabaseMock.mockClear();
      mockSuccessfulLogin(supabaseMock);
      const result = await AuthService.signInWithEmail('window@example.com', 'correct');
      expect(result.success).toBe(true);
      expect(supabaseMock).toHaveBeenCalledTimes(1);
    });

    it('OTP sblocco dopo window', async () => {
      for (let i = 0; i < 5; i++) {
        await recordOtpFailedAttempt('otp-window@example.com');
        flushPersistTimers(); await Promise.resolve();
      }
      expect((await checkOtpRateLimit('otp-window@example.com')).allowed).toBe(false);
      jest.advanceTimersByTime(RATE_LIMIT_WINDOW_MS + 1000);
      await Promise.resolve();
      expect((await checkOtpRateLimit('otp-window@example.com')).allowed).toBe(true);
    });
  });

  describe('5. Successo resetta counter', () => {
    it('dopo 3 fallimenti, un successo azzera counter — nuovo fallimento non è bloccato', async () => {
      mockFailedLogin(supabaseMock);
      for (let i = 0; i < 3; i++) {
        await AuthService.signInWithEmail('reset@example.com', 'wrong');
        flushPersistTimers(); await Promise.resolve();
      }
      let status = await getRateLimitStatus('reset@example.com');
      expect(status.attempts).toBe(3);
      expect(status.allowed).toBe(true);

      // successo
      mockSuccessfulLogin(supabaseMock);
      const ok = await AuthService.signInWithEmail('reset@example.com', 'correct');
      expect(ok.success).toBe(true);
      flushPersistTimers(); await Promise.resolve();

      status = await getRateLimitStatus('reset@example.com');
      expect(status.attempts).toBe(0);
      expect(status.allowed).toBe(true);

      // nuovo fallimento → contatore riparte da 1, non bloccato
      mockFailedLogin(supabaseMock);
      const fail = await AuthService.signInWithEmail('reset@example.com', 'wrong');
      expect(fail.success).toBe(false);
      expect(fail.error).not.toContain('Troppi tentativi');
      flushPersistTimers(); await Promise.resolve();
      status = await getRateLimitStatus('reset@example.com');
      expect(status.attempts).toBe(1);
    });
  });

  describe('7. Persistenza AsyncStorage (survive restart)', () => {
    it('blocco persiste dopo reload (reset in-memory ma AsyncStorage resta)', async () => {
      mockFailedLogin(supabaseMock);
      for (let i = 0; i < 5; i++) {
        await AuthService.signInWithEmail('persist@example.com', 'wrong');
        flushPersistTimers(); await Promise.resolve();
        // Persist is void async inside setTimeout — flush microtasks after timer
        await Promise.resolve();
      }
      // flush last persist debounce (50ms) + microtasks
      flushPersistTimers();
      await Promise.resolve();
      await Promise.resolve();

      const raw = await AsyncStorage.getItem(__testing.getStorageKey());
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw as string);
      expect(parsed['persist@example.com']).toBeDefined();
      expect(parsed['persist@example.com'].attempts).toBe(5);

      // Simula restart: clear in-memory ma NON AsyncStorage, reset flag
      __testing.getStore().clear();
      __testing.resetLoaded();

      // Dopo reload, check deve ricaricare da storage e risultare bloccato
      const afterReload = await getRateLimitStatus('persist@example.com');
      expect(afterReload.allowed).toBe(false);
      expect(afterReload.attempts).toBe(5);

      const blocked = await AuthService.signInWithEmail('persist@example.com', 'wrong');
      expect(blocked.error).toContain('Troppi tentativi');

      // Window expiry deve comunque sbloccare anche dopo persist
      jest.advanceTimersByTime(RATE_LIMIT_WINDOW_MS + 1000);
      await Promise.resolve();
      // Force reload after window expiry — store entry should be considered expired and cleared
      __testing.getStore().clear();
      __testing.resetLoaded();
      const afterExpiry = await getRateLimitStatus('persist@example.com');
      // After expiry, expired record is filtered on load, so allowed true
      expect(afterExpiry.allowed).toBe(true);
    });

    it('dati corrotti o scaduti in AsyncStorage vengono ignorati al load', async () => {
      // Scrivi dati corrotti
      await AsyncStorage.setItem(__testing.getStorageKey(), 'not-json');
      __testing.getStore().clear();
      __testing.resetLoaded();
      const s1 = await getRateLimitStatus('corrupt@example.com');
      expect(s1.allowed).toBe(true);

      // Scrivi record scaduto (oltre window)
      const expiredRecord = {
        'expired@example.com': { attempts: 5, firstAttempt: Date.now() - RATE_LIMIT_WINDOW_MS - 5000 },
        'valid@example.com': { attempts: 5, firstAttempt: Date.now() },
      };
      await AsyncStorage.setItem(__testing.getStorageKey(), JSON.stringify(expiredRecord));
      __testing.getStore().clear();
      __testing.resetLoaded();
      const sExpired = await getRateLimitStatus('expired@example.com');
      expect(sExpired.allowed).toBe(true);
      const sValid = await getRateLimitStatus('valid@example.com');
      expect(sValid.allowed).toBe(false);
    });
  });
});

// ── 6. UX hook + component ───────────────────────────────────────────────

describe('6. UX hook: useEmailAuth isRateLimited dopo 5 fallimenti', () => {
  const supabaseMock2 = () => supabase.auth.signInWithPassword as unknown as RateMock;

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T10:00:00.000Z'));
    jest.clearAllMocks();
    cleanupRateLimiter();
    await Promise.resolve();
    jest.runOnlyPendingTimers();
    await AsyncStorage.clear();
  });

  afterEach(async () => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    cleanupRateLimiter();
    await AsyncStorage.clear();
    await Promise.resolve();
  });

  it('isRateLimited diventa true dopo 5 handleLogin falliti, con countdown remainingMs', async () => {
    const mock = supabaseMock2();
    mockFailedLogin(mock as any);

    const { result } = renderHook(() => UseEmailAuthModule.useEmailAuth());

    // set email
    act(() => {
      result.current.setEmail('hook@example.com');
    });

    // allow useEffect refreshRateLimitState to settle
    await act(async () => {
      await Promise.resolve();
    });
    jest.advanceTimersByTime(10);
    await Promise.resolve();

    // 5 tentativi falliti via hook (reale AuthService)
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        await result.current.handleLogin('wrong');
      });
      // flush persist debounce
      jest.advanceTimersByTime(60);
      await act(async () => {
        await Promise.resolve();
      });
    }

    expect(result.current.isRateLimited).toBe(true);
    expect(result.current.remainingMs).toBeGreaterThan(0);
    expect(result.current.error).toContain('Troppi tentativi');
  });

  it('pre-check blocca immediatamente se già rate limited (senza chiamare supabase)', async () => {
    const mock = supabaseMock2();
    mockFailedLogin(mock as any);
    // pre-popola store 5 fallimenti direttamente
    for (let i = 0; i < 5; i++) {
      await AuthService.signInWithEmail('precheck@example.com', 'wrong');
      jest.advanceTimersByTime(60);
      await Promise.resolve();
    }
    mock.mockClear();

    const { result } = renderHook(() => UseEmailAuthModule.useEmailAuth());
    act(() => { result.current.setEmail('precheck@example.com'); });
    await act(async () => { await Promise.resolve(); });
    jest.advanceTimersByTime(10);
    await Promise.resolve();

    await act(async () => {
      const r = await result.current.handleLogin('wrong');
      expect(r.success).toBe(false);
      expect(r.error).toContain('Troppi tentativi');
    });
    expect(mock).not.toHaveBeenCalled();
    expect(result.current.isRateLimited).toBe(true);
  });
});

describe('6b. UX component: LoginForm bottone disabilitato quando rate limited', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const getMockUseEmailAuthReturn = (overrides?: Partial<ReturnType<typeof UseEmailAuthModule.useEmailAuth>>) => ({
    email: 'test@example.com',
    setEmail: jest.fn(),
    loading: false,
    error: null,
    handleLogin: jest.fn().mockResolvedValue({ success: false, error: 'Troppi tentativi di login. Riprova tra 15 minuti.' }),
    clearError: jest.fn(),
    rateLimitedUntil: Date.now() + 15 * 60 * 1000,
    remainingMs: 15 * 60 * 1000,
    attemptsLeft: 0,
    isRateLimited: false,
    refreshRateLimitState: jest.fn(),
    ...overrides,
  });

  it('bottone Login disabilitato e mostra Bloccato + warning quando isRateLimited true', () => {
    const spy = jest.spyOn(UseEmailAuthModule, 'useEmailAuth').mockReturnValue(
      getMockUseEmailAuthReturn({ isRateLimited: true, remainingMs: 15 * 60 * 1000, attemptsLeft: 0, rateLimitedUntil: Date.now() + 15 * 60 * 1000 }) as any
    );
    const spyPwd = jest.spyOn(UsePasswordValidationModule, 'usePasswordValidation').mockReturnValue({
      password: 'SomePass123!',
      handlePasswordChange: jest.fn(),
      validation: { minLength: true, hasUpper: true, hasLower: true, hasNumber: true, hasSpecial: true, isNotCommon: true },
    } as any);

    const { getByTestId, getByText } = render(<LoginForm onLoginSuccess={jest.fn()} onLoginError={jest.fn()} />);

    const btn = getByTestId('login-button');
    expect(btn.props.disabled).toBe(true);
    expect(btn.props.accessibilityState?.disabled).toBeUndefined(); // we check disabled prop
    expect(getByTestId('rate-limit-warning')).toBeTruthy();
    expect(getByText(/Troppi tentativi/)).toBeTruthy();
    expect(getByText(/Bloccato/)).toBeTruthy();

    spyPwd.mockRestore();
    spy.mockRestore();
  });

  it('bottone abilitato quando non rate limited', () => {
    const spy = jest.spyOn(UseEmailAuthModule, 'useEmailAuth').mockReturnValue(
      getMockUseEmailAuthReturn({ isRateLimited: false, remainingMs: undefined, attemptsLeft: 5, rateLimitedUntil: null }) as any
    );
    const spyPwd = jest.spyOn(UsePasswordValidationModule, 'usePasswordValidation').mockReturnValue({
      password: 'SomePass123!',
      handlePasswordChange: jest.fn(),
      validation: { minLength: true, hasUpper: true, hasLower: true, hasNumber: true, hasSpecial: true, isNotCommon: true },
    } as any);

    const { getByTestId, queryByTestId } = render(<LoginForm onLoginSuccess={jest.fn()} onLoginError={jest.fn()} />);
    expect(getByTestId('login-button').props.disabled).toBe(false);
    expect(queryByTestId('rate-limit-warning')).toBeNull();
    spyPwd.mockRestore();
    spy.mockRestore();
  });

  it('handleLogin non chiamato se isRateLimited true (pre-check in component)', async () => {
    const onLoginError = jest.fn();
    const handleLogin = jest.fn();
    const spy = jest.spyOn(UseEmailAuthModule, 'useEmailAuth').mockReturnValue(
      getMockUseEmailAuthReturn({ isRateLimited: true, remainingMs: 120000, handleLogin } as any)
    );
    const spyPwd = jest.spyOn(UsePasswordValidationModule, 'usePasswordValidation').mockReturnValue({
      password: 'SomePass123!',
      handlePasswordChange: jest.fn(),
      validation: { minLength: true, hasUpper: true, hasLower: true, hasNumber: true, hasSpecial: true, isNotCommon: true },
    } as any);

    const { getByTestId } = render(<LoginForm onLoginError={onLoginError} />);
    fireEvent.press(getByTestId('login-button'));
    expect(handleLogin).not.toHaveBeenCalled();
    expect(onLoginError).toHaveBeenCalledWith(expect.stringContaining('Troppi tentativi'));
    spyPwd.mockRestore();
    spy.mockRestore();
  });

  it('mostra hint tentativi rimasti quando attemptsLeft <=2', () => {
    const spy = jest.spyOn(UseEmailAuthModule, 'useEmailAuth').mockReturnValue(
      getMockUseEmailAuthReturn({ isRateLimited: false, attemptsLeft: 2, remainingMs: undefined, rateLimitedUntil: null }) as any
    );
    const spyPwd = jest.spyOn(UsePasswordValidationModule, 'usePasswordValidation').mockReturnValue({
      password: '', handlePasswordChange: jest.fn(), validation: {} as any,
    } as any);
    const { getByTestId } = render(<LoginForm />);
    expect(getByTestId('attempts-left-hint')).toBeTruthy();
    spyPwd.mockRestore();
    spy.mockRestore();
  });
});
