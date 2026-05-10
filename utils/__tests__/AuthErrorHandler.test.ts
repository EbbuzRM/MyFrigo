// AuthErrorHandler.test.ts — AuthErrorHandler test module.
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

import * as AuthErrorHandler from '../AuthErrorHandler';
import { LoggingService } from '../../services/LoggingService';
import { ErrorCode } from '../../types/errorCodes';

const {
  isEmailNotConfirmed,
  isInvalidCredentials,
  isAuthSessionExpired,
  isForbidden,
  isInsufficientPermissions,
  handleEmailNotConfirmedError,
  handleInvalidCredentialsError,
  handleSessionExpiredError,
  handleForbiddenError,
  handleInsufficientPermissionsError,
  handleGenericAuthError,
  handleAuthError,
} = AuthErrorHandler;

beforeEach(() => {
  jest.clearAllMocks();
});

// ──────────────────────────────────────────────
//  isEmailNotConfirmed
// ──────────────────────────────────────────────
describe('isEmailNotConfirmed', () => {
  it('should return true for error with message containing "email" and "confirm"', () => {
    const err = { message: 'Please confirm your email address' };
    expect(isEmailNotConfirmed(err)).toBe(true);
  });

  it('should return false for error without email/confirm keywords', () => {
    const err = { message: 'Something went wrong' };
    expect(isEmailNotConfirmed(err)).toBe(false);
  });

  it('should return false for null/undefined', () => {
    expect(isEmailNotConfirmed(null)).toBe(false);
    expect(isEmailNotConfirmed(undefined)).toBe(false);
  });

  it('should return false for error without message', () => {
    const err = { code: '403' };
    expect(isEmailNotConfirmed(err)).toBe(false);
  });
});

// ──────────────────────────────────────────────
//  isInvalidCredentials
// ──────────────────────────────────────────────
describe('isInvalidCredentials', () => {
  it('should return true for error with message containing "invalid" and "credentials"', () => {
    const err = { message: 'Invalid credentials provided' };
    expect(isInvalidCredentials(err)).toBe(true);
  });

  it('should return true for error with message containing "invalid" and "login"', () => {
    const err = { message: 'Invalid login attempt' };
    expect(isInvalidCredentials(err)).toBe(true);
  });

  it('should return false for error without credentials/login keywords', () => {
    const err = { message: 'Something went wrong' };
    expect(isInvalidCredentials(err)).toBe(false);
  });

  it('should return false for null/undefined and no message', () => {
    expect(isInvalidCredentials(null)).toBe(false);
    expect(isInvalidCredentials(undefined)).toBe(false);
    const err = { code: '500' };
    expect(isInvalidCredentials(err)).toBe(false);
  });
});

// ──────────────────────────────────────────────
//  isAuthSessionExpired
// ──────────────────────────────────────────────
describe('isAuthSessionExpired', () => {
  it('should return true for error with code "PGRST301"', () => {
    const err = { code: 'PGRST301', message: 'connection error' };
    expect(isAuthSessionExpired(err)).toBe(true);
  });

  it('should return true for error with message containing "session expired"', () => {
    const err = { message: 'Your session has expired' };
    expect(isAuthSessionExpired(err)).toBe(true);
  });

  it('should return true for error with message containing "session invalid"', () => {
    const err = { message: 'Session is invalid' };
    expect(isAuthSessionExpired(err)).toBe(true);
  });

  it('should return false for error without session content', () => {
    const err = { message: 'Something went wrong' };
    expect(isAuthSessionExpired(err)).toBe(false);
  });

  it('should return false for null/undefined', () => {
    expect(isAuthSessionExpired(null)).toBe(false);
    expect(isAuthSessionExpired(undefined)).toBe(false);
  });
});

// ──────────────────────────────────────────────
//  isForbidden
// ──────────────────────────────────────────────
describe('isForbidden', () => {
  it('should return true for error with code "403"', () => {
    const err = { code: '403', message: 'Forbidden' };
    expect(isForbidden(err)).toBe(true);
  });

  it('should return true for error with code "FORBIDDEN"', () => {
    const err = { code: 'FORBIDDEN', message: 'Access denied' };
    expect(isForbidden(err)).toBe(true);
  });

  it('should return true for error with message containing "forbidden"', () => {
    const err = { message: 'Access is forbidden' };
    expect(isForbidden(err)).toBe(true);
  });

  it('should return true for error with message containing "access denied"', () => {
    const err = { message: 'Access denied for this resource' };
    expect(isForbidden(err)).toBe(true);
  });

  it('should return false for error without forbidden content', () => {
    const err = { message: 'Something went wrong' };
    expect(isForbidden(err)).toBe(false);
  });

  it('should return false for null/undefined', () => {
    expect(isForbidden(null)).toBe(false);
    expect(isForbidden(undefined)).toBe(false);
  });
});

// ──────────────────────────────────────────────
//  isInsufficientPermissions
// ──────────────────────────────────────────────
describe('isInsufficientPermissions', () => {
  it('should return true for error with code "403"', () => {
    const err = { code: '403', message: 'Forbidden' };
    expect(isInsufficientPermissions(err)).toBe(true);
  });

  it('should return true for error with code "PGRST301"', () => {
    const err = { code: 'PGRST301', message: 'connection error' };
    expect(isInsufficientPermissions(err)).toBe(true);
  });

  it('should return true for error with message containing "permission"', () => {
    const err = { message: 'Insufficient permissions' };
    expect(isInsufficientPermissions(err)).toBe(true);
  });

  it('should return true for error with message containing "unauthorized"', () => {
    const err = { message: 'Unauthorized access' };
    expect(isInsufficientPermissions(err)).toBe(true);
  });

  it('should return false for error without permission content', () => {
    const err = { message: 'Something went wrong' };
    expect(isInsufficientPermissions(err)).toBe(false);
  });

  it('should return false for null/undefined', () => {
    expect(isInsufficientPermissions(null)).toBe(false);
    expect(isInsufficientPermissions(undefined)).toBe(false);
  });
});

// ──────────────────────────────────────────────
//  handleEmailNotConfirmedError
// ──────────────────────────────────────────────
describe('handleEmailNotConfirmedError', () => {
  it('should return AppError with EMAIL_NOT_CONFIRMED code', () => {
    const err = { message: 'Please confirm your email address' };
    const result = handleEmailNotConfirmedError(err);
    expect(result.code).toBe(ErrorCode.EMAIL_NOT_CONFIRMED);
  });

  it('should use correct message', () => {
    const err = { message: 'Please confirm your email address' };
    const result = handleEmailNotConfirmedError(err);
    expect(result.message).toBe('Email non confermata. Controlla la tua email e clicca sul link di conferma.');
  });

  it('should include originalError in details', () => {
    const err = { message: 'Please confirm your email address' };
    const result = handleEmailNotConfirmedError(err);
    expect(result.details).toBeDefined();
    expect(result.details).toHaveProperty('originalError');
    expect(result.details!.originalError).toBe('Please confirm your email address');
  });
});

// ──────────────────────────────────────────────
//  handleInvalidCredentialsError
// ──────────────────────────────────────────────
describe('handleInvalidCredentialsError', () => {
  it('should return AppError with INVALID_CREDENTIALS code', () => {
    const err = { message: 'Invalid credentials provided' };
    const result = handleInvalidCredentialsError(err);
    expect(result.code).toBe(ErrorCode.INVALID_CREDENTIALS);
  });

  it('should use correct message', () => {
    const err = { message: 'Invalid credentials provided' };
    const result = handleInvalidCredentialsError(err);
    expect(result.message).toBe('Email o password non validi.');
  });

  it('should include originalError in details', () => {
    const err = { message: 'Invalid credentials provided' };
    const result = handleInvalidCredentialsError(err);
    expect(result.details).toBeDefined();
    expect(result.details).toHaveProperty('originalError');
    expect(result.details!.originalError).toBe('Invalid credentials provided');
  });
});

// ──────────────────────────────────────────────
//  handleSessionExpiredError
// ──────────────────────────────────────────────
describe('handleSessionExpiredError', () => {
  it('should return AppError with SESSION_EXPIRED code', () => {
    const err = { message: 'Your session has expired' };
    const result = handleSessionExpiredError(err);
    expect(result.code).toBe(ErrorCode.SESSION_EXPIRED);
  });

  it('should use correct message', () => {
    const err = { message: 'Your session has expired' };
    const result = handleSessionExpiredError(err);
    expect(result.message).toBe('Sessione scaduta. Per favore accedi di nuovo.');
  });

  it('should include originalError in details', () => {
    const err = { message: 'Your session has expired' };
    const result = handleSessionExpiredError(err);
    expect(result.details).toBeDefined();
    expect(result.details).toHaveProperty('originalError');
    expect(result.details!.originalError).toBe('Your session has expired');
  });
});

// ──────────────────────────────────────────────
//  handleForbiddenError
// ──────────────────────────────────────────────
describe('handleForbiddenError', () => {
  it('should return AppError with FORBIDDEN code', () => {
    const err = { code: '403', message: 'Access denied' };
    const result = handleForbiddenError(err);
    expect(result.code).toBe(ErrorCode.FORBIDDEN);
  });

  it('should use correct message', () => {
    const err = { code: '403', message: 'Access denied' };
    const result = handleForbiddenError(err);
    expect(result.message).toBe('Accesso negato. Non hai i permessi necessari.');
  });

  it('should include originalError in details', () => {
    const err = { code: '403', message: 'Access denied' };
    const result = handleForbiddenError(err);
    expect(result.details).toBeDefined();
    expect(result.details).toHaveProperty('originalError');
    expect(result.details!.originalError).toBe('Access denied');
  });
});

// ──────────────────────────────────────────────
//  handleInsufficientPermissionsError
// ──────────────────────────────────────────────
describe('handleInsufficientPermissionsError', () => {
  it('should return AppError with INSUFFICIENT_PERMISSIONS code', () => {
    const err = { message: 'Insufficient permissions' };
    const result = handleInsufficientPermissionsError(err);
    expect(result.code).toBe(ErrorCode.INSUFFICIENT_PERMISSIONS);
  });

  it('should use correct message', () => {
    const err = { message: 'Insufficient permissions' };
    const result = handleInsufficientPermissionsError(err);
    expect(result.message).toBe('Permessi insufficienti per questa operazione.');
  });

  it('should include originalError in details', () => {
    const err = { message: 'Insufficient permissions' };
    const result = handleInsufficientPermissionsError(err);
    expect(result.details).toBeDefined();
    expect(result.details).toHaveProperty('originalError');
    expect(result.details!.originalError).toBe('Insufficient permissions');
  });
});

// ──────────────────────────────────────────────
//  handleGenericAuthError
// ──────────────────────────────────────────────
describe('handleGenericAuthError', () => {
  it('should return AppError with UNAUTHORIZED code', () => {
    const err = { message: 'Unknown auth error' };
    const result = handleGenericAuthError(err);
    expect(result.code).toBe(ErrorCode.UNAUTHORIZED);
  });

  it('should use correct message', () => {
    const err = { message: 'Unknown auth error' };
    const result = handleGenericAuthError(err);
    expect(result.message).toBe('Errore di autenticazione. Per favore accedi di nuovo.');
  });

  it('should include originalError in details', () => {
    const err = { message: 'Unknown auth error' };
    const result = handleGenericAuthError(err);
    expect(result.details).toBeDefined();
    expect(result.details).toHaveProperty('originalError');
    expect(result.details!.originalError).toBe('Unknown auth error');
  });
});

// ──────────────────────────────────────────────
//  handleAuthError routing
// ──────────────────────────────────────────────
describe('handleAuthError routing', () => {
  it('should route email not confirmed errors to handleEmailNotConfirmedError', () => {
    const err = { message: 'Please confirm your email address' };
    const result = handleAuthError(err);
    expect(result.code).toBe(ErrorCode.EMAIL_NOT_CONFIRMED);
    expect(result.message).toBe('Email non confermata. Controlla la tua email e clicca sul link di conferma.');
  });

  it('should route invalid credentials errors to handleInvalidCredentialsError', () => {
    const err = { message: 'Invalid credentials provided' };
    const result = handleAuthError(err);
    expect(result.code).toBe(ErrorCode.INVALID_CREDENTIALS);
    expect(result.message).toBe('Email o password non validi.');
  });

  it('should route session expired errors to handleSessionExpiredError', () => {
    const err = { message: 'Your session has expired' };
    const result = handleAuthError(err);
    expect(result.code).toBe(ErrorCode.SESSION_EXPIRED);
    expect(result.message).toBe('Sessione scaduta. Per favore accedi di nuovo.');
  });

  it('should route forbidden errors to handleForbiddenError', () => {
    const err = { message: 'Access denied: forbidden' };
    const result = handleAuthError(err);
    expect(result.code).toBe(ErrorCode.FORBIDDEN);
    expect(result.message).toBe('Accesso negato. Non hai i permessi necessari.');
  });

  it('should route insufficient permissions errors to handleInsufficientPermissionsError', () => {
    const err = { message: 'Insufficient permissions for this operation' };
    const result = handleAuthError(err);
    expect(result.code).toBe(ErrorCode.INSUFFICIENT_PERMISSIONS);
    expect(result.message).toBe('Permessi insufficienti per questa operazione.');
  });

  it('should route unknown auth errors to generic handler', () => {
    const err = { message: 'Some unknown auth error' };
    const result = handleAuthError(err);
    expect(result.code).toBe(ErrorCode.UNAUTHORIZED);
    expect(result.message).toBe('Errore di autenticazione. Per favore accedi di nuovo.');
  });
});