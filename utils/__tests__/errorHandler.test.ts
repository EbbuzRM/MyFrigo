import { ErrorCode, getErrorCategory } from '../../types/errorCodes';
import {
  createError,
  handleError,
  handleValidationError,
  normalizeError,
  formatErrorForUI,
  getErrorTitle,
  formatErrorForDebug,
  getErrorSuggestions,
} from '../errorHandler';
import { LoggingService } from '../../services/LoggingService';

// Mock LoggingService
jest.mock('../../services/LoggingService', () => ({
  LoggingService: {
    debug: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
  },
}));

describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createError', () => {
    it('should create a standardized AppError object', () => {
      const error = createError(ErrorCode.SYSTEM_ERROR, 'Test message', { foo: 'bar' });
      
      expect(error.code).toBe(ErrorCode.SYSTEM_ERROR);
      expect(error.message).toBe('Test message');
      expect(error.details).toEqual({ foo: 'bar' });
      expect(error.timestamp).toBeDefined();
    });

    it('should log the error via LoggingService', () => {
      createError(ErrorCode.SYSTEM_ERROR, 'System error');
      expect(LoggingService.error).toHaveBeenCalled();

      createError(ErrorCode.VALIDATION_ERROR, 'Validation error');
      expect(LoggingService.info).toHaveBeenCalled();

      createError(ErrorCode.UNAUTHORIZED, 'Auth error');
      expect(LoggingService.warning).toHaveBeenCalled();
    });

    it('should handle configuration object as first argument', () => {
      const error = createError({
        code: ErrorCode.DATABASE_ERROR,
        message: 'Config message',
        details: { db: 'test' }
      });

      expect(error.code).toBe(ErrorCode.DATABASE_ERROR);
      expect(error.message).toBe('Config message');
      expect(error.details).toEqual({ db: 'test' });
    });
  });

  describe('handleError', () => {
    it('should route network errors to handleNetworkError', () => {
      const networkError = new Error('fetch failed');
      // Adding a property that makes it looks like a network error to isNetworkError check
      // Depending on how isNetworkError is implemented in errorTypes.ts
      (networkError as any).name = 'TypeError'; // Often fetch errors are TypeErrors
      (networkError as any).message = 'Failed to fetch';
      
      const appError = handleError(networkError);
      expect(appError.code).toBe(ErrorCode.NETWORK_ERROR);
    });

    it('should route auth errors based on message content', () => {
      const authError = { message: 'unauthorized access' };
      const appError = handleError(authError);
      expect(appError.code).toBe(ErrorCode.UNAUTHORIZED);
    });

    it('should route database errors based on Postgres codes', () => {
      const dbError = { code: '23505', message: 'duplicate key' };
      const appError = handleError(dbError);
      expect(appError.code).toBe(ErrorCode.DUPLICATE_ENTRY);
    });

    it('should route validation errors based on message', () => {
      const valError = { message: 'validation failed' };
      const appError = handleError(valError);
      expect(appError.code).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it('should fallback to normalizeError for unknown errors', () => {
      const unknownError = 'Something went wrong';
      const appError = handleError(unknownError);
      expect(appError.code).toBe(ErrorCode.SYSTEM_ERROR);
      expect(appError.message).toBe('Something went wrong');
    });
  });

  describe('handleValidationError', () => {
    it('should create a validation error with field and rule', () => {
      const appError = handleValidationError('too short', 'username', 'min 3 chars');
      expect(appError.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(appError.message).toContain('username');
      expect(appError.message).toContain('min 3 chars');
      expect(appError.details).toEqual({
        field: 'username',
        rule: 'min 3 chars',
        value: 'too short'
      });
    });

    it('should normalize validation errors with message', () => {
      const appError = handleValidationError({ message: 'Invalid format' });
      expect(appError.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(appError.message).toBe('Invalid format');
    });
  });

  describe('normalizeError', () => {
    it('should normalize Error instances', () => {
      const error = new Error('Real error');
      const appError = normalizeError(error);
      expect(appError.code).toBe(ErrorCode.SYSTEM_ERROR);
      expect(appError.message).toBe('Real error');
      expect(appError.details).toHaveProperty('stack');
    });

    it('should normalize objects with code property', () => {
      const errorObj = { code: ErrorCode.NOT_FOUND, message: 'Missing' };
      const appError = normalizeError(errorObj);
      expect(appError.code).toBe(ErrorCode.NOT_FOUND);
      expect(appError.message).toBe('Missing');
    });

    it('should normalize strings', () => {
      const appError = normalizeError('Error string');
      expect(appError.code).toBe(ErrorCode.SYSTEM_ERROR);
      expect(appError.message).toBe('Error string');
    });
  });
});

describe('ErrorFormatters', () => {
  const mockError: any = {
    code: ErrorCode.NETWORK_ERROR,
    message: 'Original message',
    timestamp: '2024-01-01T00:00:00Z',
    details: { retry: true }
  };

  describe('formatErrorForUI', () => {
    it('should return a user-friendly Italian message', () => {
      const uiMessage = formatErrorForUI(mockError);
      expect(uiMessage).toBe('Problema di connessione. Controlla la rete e riprova.');
    });

    it('should return default message for unknown code', () => {
      const unknownError = { ...mockError, code: 'UNKNOWN_CODE' };
      const uiMessage = formatErrorForUI(unknownError as any);
      expect(uiMessage).toContain('Si è verificato un errore');
    });
  });

  describe('getErrorTitle', () => {
    it('should return a title for the error', () => {
      const title = getErrorTitle(mockError);
      expect(title).toBe('Errore di Connessione');
    });
  });

  describe('formatErrorForDebug', () => {
    it('should return a string containing code, message and details', () => {
      const debugStr = formatErrorForDebug(mockError);
      expect(debugStr).toContain(ErrorCode.NETWORK_ERROR);
      expect(debugStr).toContain('Original message');
      expect(debugStr).toContain('retry');
    });
  });

  describe('getErrorSuggestions', () => {
    it('should return suggestions for the error', () => {
      const suggestions = getErrorSuggestions(mockError);
      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toContain('connessione');
    });
  });
});
