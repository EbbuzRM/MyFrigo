// NetworkErrorHandler.test.ts — NetworkErrorHandler test module.
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

import { isSessionExpired, isUnauthorized, handleNetworkConnectionError, handleTimeoutError, handleServiceUnavailableError, handleNetworkError } from '../NetworkErrorHandler';
import { ErrorCode } from '../../types/errorCodes';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('isSessionExpired', () => {
  it('should return true for error with code PGRST301', () => {
    const error = { code: 'PGRST301' };
    expect(isSessionExpired(error)).toBe(true);
  });

  it('should return true for error with message containing "session expired"', () => {
    const error = { message: 'session expired' };
    expect(isSessionExpired(error)).toBe(true);
  });

  it('should return true for error with message containing "session invalid"', () => {
    const error = { message: 'session invalid' };
    expect(isSessionExpired(error)).toBe(true);
  });

  it('should return false for error without session-related content', () => {
    const error = { message: 'something went wrong' };
    expect(isSessionExpired(error)).toBe(false);
  });

  it('should return false for null', () => {
    expect(isSessionExpired(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isSessionExpired(undefined)).toBe(false);
  });

  it('should return false for error with different code', () => {
    const error = { code: 'OTHER_CODE' };
    expect(isSessionExpired(error)).toBe(false);
  });
});

describe('isUnauthorized', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true for error with code PGRST301', () => {
    const error = { code: 'PGRST301' };
    expect(isUnauthorized(error)).toBe(true);
  });

  it('should return true for error with message containing "unauthorized"', () => {
    const error = { message: 'unauthorized access' };
    expect(isUnauthorized(error)).toBe(true);
  });

  it('should return true for error with message containing "jwt"', () => {
    const error = { message: 'jwt expired' };
    expect(isUnauthorized(error)).toBe(true);
  });

  it('should return true for error with message containing "token"', () => {
    const error = { message: 'token invalid' };
    expect(isUnauthorized(error)).toBe(true);
  });

  it('should return false for error without auth-related content', () => {
    const error = { message: 'something went wrong' };
    expect(isUnauthorized(error)).toBe(false);
  });

  it('should return false for null', () => {
    expect(isUnauthorized(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isUnauthorized(undefined)).toBe(false);
  });

  it('should return false for error with different code', () => {
    const error = { code: 'OTHER_CODE' };
    expect(isUnauthorized(error)).toBe(false);
  });
});

describe('handleNetworkConnectionError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return AppError with NETWORK_ERROR code', () => {
    const error = { code: 'ERR_NETWORK' as const, message: 'test' };
    const result = handleNetworkConnectionError(error);
    expect(result.code).toBe(ErrorCode.NETWORK_ERROR);
  });

  it('should use default message "Errore di connessione..."', () => {
    const error = { code: 'ERR_NETWORK' as const };
    const result = handleNetworkConnectionError(error);
    expect(result.message).toBe('Errore di connessione. Controlla la tua connessione a internet e riprova.');
  });

  it('should include originalError and networkCode in details', () => {
    const error = { code: 'ERR_NETWORK' as const, message: 'test error' };
    const result = handleNetworkConnectionError(error);
    expect(result.details).toEqual({ originalError: 'test error', networkCode: 'ERR_NETWORK' });
  });

  it('should handle custom error message', () => {
    const error = { code: 'ECONNABORTED' as const, message: 'custom network error' };
    const result = handleNetworkConnectionError(error);
    expect(result.details).toEqual({ originalError: 'custom network error', networkCode: 'ECONNABORTED' });
  });
});

describe('handleTimeoutError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return AppError with TIMEOUT_ERROR code', () => {
    const error = { message: 'timeout' };
    const result = handleTimeoutError(error);
    expect(result.code).toBe(ErrorCode.TIMEOUT_ERROR);
  });

  it('should use default message "Operazione scaduta..."', () => {
    const error = {};
    const result = handleTimeoutError(error);
    expect(result.message).toBe('Operazione scaduta. Riprova più tardi.');
  });

  it('should include originalError in details', () => {
    const error = { message: 'timeout occurred' };
    const result = handleTimeoutError(error);
    expect(result.details).toEqual({ originalError: 'timeout occurred' });
  });

  it('should handle custom error message', () => {
    const error = { message: 'custom timeout message' };
    const result = handleTimeoutError(error);
    expect(result.details).toEqual({ originalError: 'custom timeout message' });
  });
});

describe('handleServiceUnavailableError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return AppError with SERVICE_UNAVAILABLE code', () => {
    const error = { message: 'unavailable' };
    const result = handleServiceUnavailableError(error);
    expect(result.code).toBe(ErrorCode.SERVICE_UNAVAILABLE);
  });

  it('should use default message "Servizio temporaneamente non disponibile..."', () => {
    const error = {};
    const result = handleServiceUnavailableError(error);
    expect(result.message).toBe('Servizio temporaneamente non disponibile. Riprova più tardi.');
  });

  it('should include originalError in details', () => {
    const error = { message: 'service down' };
    const result = handleServiceUnavailableError(error);
    expect(result.details).toEqual({ originalError: 'service down' });
  });

  it('should handle custom error message', () => {
    const error = { message: 'custom unavailable message' };
    const result = handleServiceUnavailableError(error);
    expect(result.details).toEqual({ originalError: 'custom unavailable message' });
  });
});

describe('handleNetworkError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should route NetworkError (ERR_NETWORK) to handleNetworkConnectionError', () => {
    const error = { code: 'ERR_NETWORK', message: 'test' };
    const result = handleNetworkError(error);
    expect(result.code).toBe(ErrorCode.NETWORK_ERROR);
  });

  it('should route ECONNABORTED to handleNetworkConnectionError', () => {
    const error = { code: 'ECONNABORTED', message: 'test' };
    const result = handleNetworkError(error);
    expect(result.code).toBe(ErrorCode.NETWORK_ERROR);
  });

  it('should route timeout errors to handleTimeoutError', () => {
    const error = { message: 'timeout error occurred' };
    const result = handleNetworkError(error);
    expect(result.code).toBe(ErrorCode.TIMEOUT_ERROR);
  });

  it('should route unavailable errors to handleServiceUnavailableError', () => {
    const error = { message: 'service unavailable' };
    const result = handleNetworkError(error);
    expect(result.code).toBe(ErrorCode.SERVICE_UNAVAILABLE);
  });

  it('should route session expired to SESSION_EXPIRED code', () => {
    const error = { code: 'PGRST301' };
    const result = handleNetworkError(error);
    expect(result.code).toBe(ErrorCode.SESSION_EXPIRED);
  });

  it('should route unauthorized to UNAUTHORIZED code', () => {
    const error = { message: 'unauthorized' };
    const result = handleNetworkError(error);
    expect(result.code).toBe(ErrorCode.UNAUTHORIZED);
  });

  it('should fallback to generic NETWORK_ERROR for unknown errors', () => {
    const error = { message: 'some unknown error' };
    const result = handleNetworkError(error);
    expect(result.code).toBe(ErrorCode.NETWORK_ERROR);
  });

  it('should handle null input', () => {
    const result = handleNetworkError(null);
    expect(result.code).toBe(ErrorCode.NETWORK_ERROR);
  });

  it('should handle undefined input', () => {
    const result = handleNetworkError(undefined);
    expect(result.code).toBe(ErrorCode.NETWORK_ERROR);
  });

  it('should handle plain string input', () => {
    const result = handleNetworkError('plain string error');
    expect(result.code).toBe(ErrorCode.NETWORK_ERROR);
  });

  it('should handle Error instance', () => {
    const error = new Error('something went wrong');
    const result = handleNetworkError(error);
    expect(result.code).toBe(ErrorCode.NETWORK_ERROR);
  });
});