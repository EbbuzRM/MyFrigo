// AuthLogger.test.ts — AuthLogger test module.
//
// exports: none
// used_by: none
// rules:   none

jest.mock('../../services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
  },
}));

import { AuthLogger } from '../AuthLogger';
import { LoggingService } from '../../services/LoggingService';

// Restore real timers after any test that uses fake timers
afterEach(() => {
  jest.useRealTimers();
});

// ============================================================
// Singleton
// ============================================================
describe('AuthLogger singleton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AuthLogger as any).instance = undefined;
  });

  it('should return same instance on multiple getInstance calls', () => {
    const instance1 = AuthLogger.getInstance();
    const instance2 = AuthLogger.getInstance();
    expect(instance2).toBe(instance1);
  });

  it('should create new instance after reset', () => {
    const instance1 = AuthLogger.getInstance();
    (AuthLogger as any).instance = undefined;
    const instance2 = AuthLogger.getInstance();
    expect(instance2).not.toBe(instance1);
  });
});

// ============================================================
// startAuth
// ============================================================
describe('startAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AuthLogger as any).instance = undefined;
  });

  it('should set isAuthInProgress to true', () => {
    const logger = AuthLogger.getInstance();
    logger.startAuth();
    expect((logger as any).isAuthInProgress).toBe(true);
  });

  it('should add AUTH_PROCESS_STARTED step', () => {
    const logger = AuthLogger.getInstance();
    logger.startAuth();
    const steps = (logger as any).steps as Array<{ step: string; status: string }>;
    expect(steps).toHaveLength(1);
    expect(steps[0].step).toBe('AUTH_PROCESS_STARTED');
    expect(steps[0].status).toBe('start');
  });

  it('should call LoggingService.info', () => {
    const logger = AuthLogger.getInstance();
    logger.startAuth();
    expect(LoggingService.info).toHaveBeenCalledWith(
      'AuthLogger',
      'Processo di autenticazione iniziato'
    );
  });

  it('should reset steps array on new startAuth call', () => {
    const logger = AuthLogger.getInstance();

    logger.startAuth();
    logger.startStep('STEP_1');
    logger.startStep('STEP_2');
    // AUTH_PROCESS_STARTED(start) + STEP_1(start) + STEP_2(start)
    expect((logger as any).steps).toHaveLength(3);

    // Restart auth — steps must be cleared and re-initialised
    logger.startAuth();
    expect((logger as any).steps).toHaveLength(1);
    expect(((logger as any).steps[0] as any).step).toBe('AUTH_PROCESS_STARTED');
  });
});

// ============================================================
// startStep
// ============================================================
describe('startStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AuthLogger as any).instance = undefined;
  });

  it('should add a start step with data', () => {
    const logger = AuthLogger.getInstance();
    logger.startAuth();
    logger.startStep('LOGIN_FORM', { provider: 'google' });

    const steps = (logger as any).steps as Array<{
      step: string;
      status: string;
      data?: unknown;
    }>;
    const step = steps.find((s) => s.step === 'LOGIN_FORM');
    expect(step).toBeDefined();
    expect(step!.status).toBe('start');
    expect(step!.data).toEqual({ provider: 'google' });
  });

  it('should auto-start auth if not in progress', () => {
    const logger = AuthLogger.getInstance();
    // Do NOT call startAuth manually
    logger.startStep('SOME_STEP');

    expect((logger as any).isAuthInProgress).toBe(true);
    const steps = (logger as any).steps as Array<{ step: string }>;
    expect(steps.some((s) => s.step === 'AUTH_PROCESS_STARTED')).toBe(true);
    expect(steps.some((s) => s.step === 'SOME_STEP')).toBe(true);
  });

  it('should track step name and status correctly', () => {
    const logger = AuthLogger.getInstance();
    logger.startAuth();
    logger.startStep('PROVIDER_SELECT');
    logger.startStep('TOKEN_EXCHANGE');

    const steps = (logger as any).steps as Array<{ step: string; status: string }>;
    const providerSelect = steps.find((s) => s.step === 'PROVIDER_SELECT');
    const tokenExchange = steps.find((s) => s.step === 'TOKEN_EXCHANGE');

    expect(providerSelect!.status).toBe('start');
    expect(tokenExchange!.status).toBe('start');
    expect(providerSelect!.step).toBe('PROVIDER_SELECT');
    expect(tokenExchange!.step).toBe('TOKEN_EXCHANGE');
  });
});

// ============================================================
// endStep
// ============================================================
describe('endStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AuthLogger as any).instance = undefined;
  });

  it('should add success step with duration if matching start exists', () => {
    const logger = AuthLogger.getInstance();
    logger.startAuth();
    logger.startStep('STEP_1');
    logger.endStep('STEP_1');

    const steps = (logger as any).steps as Array<{
      step: string;
      status: string;
      duration?: number;
    }>;
    const successStep = steps.find((s) => s.step === 'STEP_1' && s.status === 'success');
    expect(successStep).toBeDefined();
    expect(successStep!.duration).toBeDefined();
    expect(successStep!.duration).toBeGreaterThanOrEqual(0);
  });

  it('should add success step without duration if no matching start', () => {
    const logger = AuthLogger.getInstance();
    logger.startAuth();
    logger.endStep('ORPHAN_STEP');

    const steps = (logger as any).steps as Array<{
      step: string;
      status: string;
      duration?: number;
    }>;
    const successStep = steps.find((s) => s.step === 'ORPHAN_STEP' && s.status === 'success');
    expect(successStep).toBeDefined();
    expect(successStep!.duration).toBeUndefined();
  });

  it('should calculate duration from startStep timestamp', () => {
    jest.useFakeTimers();
    const logger = AuthLogger.getInstance();
    logger.startAuth();
    logger.startStep('DELAYED_STEP');
    jest.advanceTimersByTime(2500);
    logger.endStep('DELAYED_STEP');

    const steps = (logger as any).steps as Array<{
      step: string;
      status: string;
      duration?: number;
    }>;
    const successStep = steps.find((s) => s.step === 'DELAYED_STEP' && s.status === 'success');
    expect(successStep!.duration).toBeGreaterThanOrEqual(2500);
  });
});

// ============================================================
// errorStep
// ============================================================
describe('errorStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AuthLogger as any).instance = undefined;
  });

  it('should add error step with duration if matching start exists', () => {
    const logger = AuthLogger.getInstance();
    logger.startAuth();
    logger.startStep('STEP_1');
    logger.errorStep('STEP_1', new Error('fail'));

    const steps = (logger as any).steps as Array<{
      step: string;
      status: string;
      duration?: number;
      error?: unknown;
    }>;
    const errorStep = steps.find((s) => s.step === 'STEP_1' && s.status === 'error');
    expect(errorStep).toBeDefined();
    expect(errorStep!.duration).toBeDefined();
    expect(errorStep!.error).toBeInstanceOf(Error);
  });

  it('should add error step without duration if no matching start', () => {
    const logger = AuthLogger.getInstance();
    logger.startAuth();
    logger.errorStep('ORPHAN_STEP', new Error('fail'));

    const steps = (logger as any).steps as Array<{
      step: string;
      status: string;
      duration?: number;
      error?: unknown;
    }>;
    const errorStep = steps.find((s) => s.step === 'ORPHAN_STEP' && s.status === 'error');
    expect(errorStep).toBeDefined();
    expect(errorStep!.duration).toBeUndefined();
    expect(errorStep!.error).toBeInstanceOf(Error);
  });

  it('should store error reference in step', () => {
    const logger = AuthLogger.getInstance();
    logger.startAuth();
    const error = new Error('something went wrong');
    logger.errorStep('STEP_1', error);

    const steps = (logger as any).steps as Array<{ step: string; status: string; error?: unknown }>;
    const errorStep = steps.find((s) => s.step === 'STEP_1' && s.status === 'error');
    expect(errorStep!.error).toBe(error);
  });
});

// ============================================================
// completeAuth
// ============================================================
describe('completeAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AuthLogger as any).instance = undefined;
  });

  it('should set isAuthInProgress to false', () => {
    const logger = AuthLogger.getInstance();
    logger.startAuth();
    logger.completeAuth();
    expect((logger as any).isAuthInProgress).toBe(false);
  });

  it('should add AUTH_PROCESS_COMPLETED step with totalDuration when success=true', () => {
    const logger = AuthLogger.getInstance();
    logger.startAuth();
    logger.completeAuth(true);

    const steps = (logger as any).steps as Array<{
      step: string;
      data?: unknown;
    }>;
    const lastStep = steps[steps.length - 1];
    expect(lastStep.step).toBe('AUTH_PROCESS_COMPLETED');
    expect(lastStep.data).toEqual({ totalDuration: expect.any(Number) });
    expect((lastStep.data as any).totalDuration).toBeGreaterThanOrEqual(0);
  });

  it('should add AUTH_PROCESS_FAILED step when success=false', () => {
    const logger = AuthLogger.getInstance();
    logger.startAuth();
    logger.completeAuth(false);

    const steps = (logger as any).steps as Array<{
      step: string;
      status: string;
    }>;
    const lastStep = steps[steps.length - 1];
    expect(lastStep.step).toBe('AUTH_PROCESS_FAILED');
    expect(lastStep.status).toBe('error');
  });

  it('should log summary via LoggingService.info', () => {
    const logger = AuthLogger.getInstance();
    logger.startAuth();
    logger.startStep('STEP_1');
    logger.endStep('STEP_1');
    logger.completeAuth(true);

    expect(LoggingService.info).toHaveBeenCalledWith(
      'AuthLogger',
      'Riepilogo processo di autenticazione',
      expect.anything()
    );
  });

  it('should handle gracefully when called without active auth (no-op)', () => {
    const logger = AuthLogger.getInstance();
    // No startAuth called
    logger.completeAuth();

    expect((logger as any).isAuthInProgress).toBe(false);
    expect((logger as any).steps).toHaveLength(0);
    expect(LoggingService.info).not.toHaveBeenCalled();
    expect(LoggingService.error).not.toHaveBeenCalled();
  });

  it('should reset isAuthInProgress even on error in completeAuth', () => {
    const logger = AuthLogger.getInstance();
    logger.startAuth();
    logger.startStep('STEP_1');

    // Force getAuthSummary to throw so the catch block executes
    (logger as any).getAuthSummary = () => {
      throw new Error('Unexpected error');
    };

    logger.completeAuth(true);

    expect((logger as any).isAuthInProgress).toBe(false);
    expect(LoggingService.error).toHaveBeenCalledWith(
      'AuthLogger',
      'Errore durante il completamento del processo di autenticazione',
      expect.any(Error)
    );
  });
});

// ============================================================
// getAuthSummary
// ============================================================
describe('getAuthSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AuthLogger as any).instance = undefined;
  });

  it('should return correct summary after completed auth flow', () => {
    const logger = AuthLogger.getInstance();
    logger.startAuth();
    logger.startStep('STEP_1');
    logger.endStep('STEP_1');
    logger.completeAuth(true);

    const summary = logger.getAuthSummary();
    // AUTH_PROCESS_STARTED(start) + STEP_1(start) + STEP_1(success) + AUTH_PROCESS_COMPLETED(success)
    expect(summary.isComplete).toBe(true);
    expect(summary.totalSteps).toBe(4);
    expect(summary.successSteps).toBe(2);
    expect(summary.errorSteps).toBe(0);
    // AUTH_PROCESS_STARTED is a 'start' step with no matching success/error → counted as pending
    expect(summary.pendingSteps).toBe(1);
  });

  it('should show isComplete: true after completeAuth', () => {
    const logger = AuthLogger.getInstance();
    logger.startAuth();
    logger.completeAuth();

    const summary = logger.getAuthSummary();
    expect(summary.isComplete).toBe(true);
  });

  it('should show isComplete: false while auth in progress', () => {
    const logger = AuthLogger.getInstance();
    logger.startAuth();
    logger.startStep('STEP_1');

    const summary = logger.getAuthSummary();
    expect(summary.isComplete).toBe(false);
  });

  it('should include totalSteps count', () => {
    const logger = AuthLogger.getInstance();
    logger.startAuth();
    logger.startStep('STEP_1');
    logger.startStep('STEP_2');
    logger.endStep('STEP_1');

    const summary = logger.getAuthSummary();
    // AUTH_PROCESS_STARTED + STEP_1(start) + STEP_2(start) + STEP_1(success)
    expect(summary.totalSteps).toBe(4);
  });

  it('should include successSteps and errorSteps counts', () => {
    const logger = AuthLogger.getInstance();
    logger.startAuth();
    logger.startStep('STEP_1');
    logger.endStep('STEP_1');
    logger.startStep('STEP_2');
    logger.errorStep('STEP_2', new Error('fail'));

    const summary = logger.getAuthSummary();
    expect(summary.successSteps).toBe(1);
    expect(summary.errorSteps).toBe(1);
  });

  it('should include pendingSteps count', () => {
    const logger = AuthLogger.getInstance();
    logger.startAuth();
    logger.startStep('STEP_1');
    logger.startStep('STEP_2');
    logger.endStep('STEP_1');
    // AUTH_PROCESS_STARTED is a 'start' step with no matching success/error, so it's pending too
    // STEP_2 is started but never ended → also pending

    const summary = logger.getAuthSummary();
    expect(summary.pendingSteps).toBe(2);
  });

  it('should include slowestSteps array sorted by duration desc', () => {
    jest.useFakeTimers();
    const logger = AuthLogger.getInstance();
    logger.startAuth(); // t=0

    logger.startStep('FAST');
    jest.advanceTimersByTime(100);
    logger.endStep('FAST'); // duration: 100

    logger.startStep('SLOW');
    jest.advanceTimersByTime(500);
    logger.endStep('SLOW'); // duration: 500

    logger.startStep('MEDIUM');
    jest.advanceTimersByTime(300);
    logger.endStep('MEDIUM'); // duration: 300

    logger.completeAuth(true);

    const summary = logger.getAuthSummary();
    const slowest = summary.slowestSteps as Array<{
      step: string;
      status: string;
      duration: number;
    }>;

    expect(slowest.length).toBe(3);
    expect(slowest[0].step).toBe('SLOW');
    expect(slowest[1].step).toBe('MEDIUM');
    expect(slowest[2].step).toBe('FAST');
    expect(slowest[0].duration).toBeGreaterThanOrEqual(slowest[1].duration);
    expect(slowest[1].duration).toBeGreaterThanOrEqual(slowest[2].duration);
  });

  it('should include timeline array with step, status, timeFromStart', () => {
    const logger = AuthLogger.getInstance();
    logger.startAuth();
    logger.startStep('STEP_1');
    logger.endStep('STEP_1');

    const summary = logger.getAuthSummary();
    const timeline = summary.timeline as Array<{ step: string; status: string; timeFromStart: number; duration?: number }>;
    expect(timeline).toBeDefined();
    expect(Array.isArray(timeline)).toBe(true);
    expect(timeline.length).toBeGreaterThan(0);

    timeline.forEach((entry) => {
      expect(typeof entry.step).toBe('string');
      expect(typeof entry.status).toBe('string');
      expect(typeof entry.timeFromStart).toBe('number');
      expect(entry.timeFromStart).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================================
// checkForBlockingOperations
// ============================================================
describe('checkForBlockingOperations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AuthLogger as any).instance = undefined;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return empty array when no blocking operations', () => {
    const logger = AuthLogger.getInstance();
    logger.startAuth();
    logger.startStep('STEP_1');
    logger.endStep('STEP_1');

    const result = logger.checkForBlockingOperations();
    expect(result).toEqual([]);
  });

  it('should return step name when step started more than 5 seconds ago', () => {
    jest.useFakeTimers();
    const logger = AuthLogger.getInstance();
    logger.startAuth(); // AUTH_PROCESS_STARTED is also a 'start' step
    logger.startStep('LONG_OPERATION');
    jest.advanceTimersByTime(6000);

    const result = logger.checkForBlockingOperations();
    // Both AUTH_PROCESS_STARTED and LONG_OPERATION are started > 5s ago with no end
    expect(result).toEqual(['AUTH_PROCESS_STARTED (6s)', 'LONG_OPERATION (6s)']);
  });

  it('should format duration in seconds', () => {
    jest.useFakeTimers();
    const logger = AuthLogger.getInstance();
    // startAuth also starts AUTH_PROCESS_STARTED which is a 'start' step
    logger.startAuth();
    logger.startStep('SLOW_OP');
    jest.advanceTimersByTime(12345);

    const result = logger.checkForBlockingOperations();
    // Both steps have been started > 5s ago with no end
    expect(result).toEqual(['AUTH_PROCESS_STARTED (12s)', 'SLOW_OP (12s)']);
    // Math.round(12345 / 1000) = 12
  });
});