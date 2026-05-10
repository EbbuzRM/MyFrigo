// DatabaseErrorHandler.test.ts — DatabaseErrorHandler test module.
//
// exports: none
// used_by: none
// rules:   none

import { isDuplicateEntryError, isForeignKeyError, isNotFoundError, getPostgresErrorInfo, handleDuplicateEntryError, handleForeignKeyError, handleNotFoundError, handleGenericDatabaseError, handleDatabaseError } from '../DatabaseErrorHandler';
import { LoggingService } from '../../services/LoggingService';
import { ErrorCode } from '../../types/errorCodes';
import { AppError } from '../../types/errorTypes';

// Mock LoggingService
jest.mock('../../services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
  },
}));

describe('isDuplicateEntryError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true for error with code 23505', () => {
    const error = { code: '23505', message: 'duplicate key value violates unique constraint' };
    const result = isDuplicateEntryError(error);
    expect(result).toBe(true);
  });

  it('should return false for error with different code', () => {
    const error = { code: '23503', message: 'foreign key violation' };
    const result = isDuplicateEntryError(error);
    expect(result).toBe(false);
  });

  it('should return false for null', () => {
    const result = isDuplicateEntryError(null);
    expect(result).toBe(false);
  });

  it('should return false for undefined', () => {
    const result = isDuplicateEntryError(undefined);
    expect(result).toBe(false);
  });

  it('should return false for error without code', () => {
    const error = { message: 'some error' };
    const result = isDuplicateEntryError(error);
    expect(result).toBe(false);
  });
});

describe('isForeignKeyError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true for error with code 23503', () => {
    const error = { code: '23503', message: 'insert or update on table violates foreign key constraint' };
    const result = isForeignKeyError(error);
    expect(result).toBe(true);
  });

  it('should return false for error with different code', () => {
    const error = { code: '23505', message: 'duplicate key value' };
    const result = isForeignKeyError(error);
    expect(result).toBe(false);
  });

  it('should return false for null', () => {
    const result = isForeignKeyError(null);
    expect(result).toBe(false);
  });

  it('should return false for undefined', () => {
    const result = isForeignKeyError(undefined);
    expect(result).toBe(false);
  });

  it('should return false for error without code', () => {
    const error = { message: 'some error' };
    const result = isForeignKeyError(error);
    expect(result).toBe(false);
  });
});

describe('isNotFoundError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true for error with code PGRST116', () => {
    const error = { code: 'PGRST116', message: 'Could not find anything in the table' };
    const result = isNotFoundError(error);
    expect(result).toBe(true);
  });

  it('should return false for error with different code', () => {
    const error = { code: '23505', message: 'duplicate key value' };
    const result = isNotFoundError(error);
    expect(result).toBe(false);
  });

  it('should return false for null', () => {
    const result = isNotFoundError(null);
    expect(result).toBe(false);
  });

  it('should return false for undefined', () => {
    const result = isNotFoundError(undefined);
    expect(result).toBe(false);
  });
});

describe('getPostgresErrorInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return correct info for known PG code 23505', () => {
    const result = getPostgresErrorInfo('23505');
    expect(result).toBeDefined();
    expect(result!.code).toBe(ErrorCode.DUPLICATE_ENTRY);
    expect(result!.message).toBe('Dati duplicati. Questo valore esiste già.');
  });

  it('should return correct info for known PG code 23503', () => {
    const result = getPostgresErrorInfo('23503');
    expect(result).toBeDefined();
    expect(result!.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(result!.message).toBe('Riferimento a dati non esistenti.');
  });

  it('should return correct info for PGRST116', () => {
    const result = getPostgresErrorInfo('PGRST116');
    expect(result).toBeDefined();
    expect(result!.code).toBe(ErrorCode.NOT_FOUND);
    expect(result!.message).toBe('Dati non trovati.');
  });

  it('should return correct info for 28P01', () => {
    const result = getPostgresErrorInfo('28P01');
    expect(result).toBeDefined();
    expect(result!.code).toBe(ErrorCode.INVALID_CREDENTIALS);
    expect(result!.message).toBe('Credenziali database non valide.');
  });

  it('should return null for unknown code', () => {
    const result = getPostgresErrorInfo('XXXXX');
    expect(result).toBeNull();
  });
});

describe('handleDuplicateEntryError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return AppError with DUPLICATE_ENTRY code', () => {
    const error = { code: '23505', message: 'duplicate key value violates unique constraint "products_pkey"' };
    const result = handleDuplicateEntryError(error);

    expect(result).toBeDefined();
    expect(result.code).toBe(ErrorCode.DUPLICATE_ENTRY);
  });

  it('should include original message in details', () => {
    const error = { code: '23505', message: 'duplicate key value violates unique constraint' };
    const result = handleDuplicateEntryError(error);

    expect(result.details).toBeDefined();
    expect(result.details!.originalError).toBe('duplicate key value violates unique constraint');
  });

  it('should set constraint to unique', () => {
    const error = { code: '23505', message: 'duplicate key' };
    const result = handleDuplicateEntryError(error);

    expect(result.details).toBeDefined();
    expect(result.details!.constraint).toBe('unique');
  });

  it('should use default message', () => {
    const error = { code: '23505', message: 'some duplicate error' };
    const result = handleDuplicateEntryError(error);

    expect(result.message).toBe('Dati duplicati. Questo valore esiste già.');
  });
});

describe('handleForeignKeyError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return AppError with VALIDATION_ERROR code', () => {
    const error = { code: '23503', message: 'insert or update on table violates foreign key constraint' };
    const result = handleForeignKeyError(error);

    expect(result).toBeDefined();
    expect(result.code).toBe(ErrorCode.VALIDATION_ERROR);
  });

  it('should include original message in details', () => {
    const error = { code: '23503', message: 'foreign key violation on category_id' };
    const result = handleForeignKeyError(error);

    expect(result.details).toBeDefined();
    expect(result.details!.originalError).toBe('foreign key violation on category_id');
  });

  it('should set constraint to foreign_key', () => {
    const error = { code: '23503', message: 'fk violation' };
    const result = handleForeignKeyError(error);

    expect(result.details).toBeDefined();
    expect(result.details!.constraint).toBe('foreign_key');
  });
});

describe('handleNotFoundError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return AppError with NOT_FOUND code', () => {
    const error = { code: 'PGRST116', message: 'Could not find anything in the products table' };
    const result = handleNotFoundError(error);

    expect(result).toBeDefined();
    expect(result.code).toBe(ErrorCode.NOT_FOUND);
  });

  it('should include original message in details', () => {
    const error = { code: 'PGRST116', message: 'Entity not found' };
    const result = handleNotFoundError(error);

    expect(result.details).toBeDefined();
    expect(result.details!.originalError).toBe('Entity not found');
  });

  it('should use default message', () => {
    const error = { code: 'PGRST116', message: 'some not found error' };
    const result = handleNotFoundError(error);

    expect(result.message).toBe('Dati non trovati.');
  });
});

describe('handleGenericDatabaseError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should map 23505 to DUPLICATE_ENTRY', () => {
    const error = { code: '23505', message: 'duplicate key' };
    const result = handleGenericDatabaseError(error);

    expect(result.code).toBe(ErrorCode.DUPLICATE_ENTRY);
    expect(result.message).toBe('Dati duplicati. Questo valore esiste già.');
    expect(result.details).toBeDefined();
    expect(result.details!.pgCode).toBe('23505');
    expect(result.details!.originalMessage).toBe('duplicate key');
  });

  it('should map 23503 to VALIDATION_ERROR', () => {
    const error = { code: '23503', message: 'foreign key violation' };
    const result = handleGenericDatabaseError(error);

    expect(result.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(result.message).toBe('Riferimento a dati non esistenti.');
    expect(result.details!.pgCode).toBe('23503');
    expect(result.details!.originalMessage).toBe('foreign key violation');
  });

  it('should map PGRST116 to NOT_FOUND', () => {
    const error = { code: 'PGRST116', message: 'not found' };
    const result = handleGenericDatabaseError(error);

    expect(result.code).toBe(ErrorCode.NOT_FOUND);
    expect(result.message).toBe('Dati non trovati.');
    expect(result.details!.pgCode).toBe('PGRST116');
    expect(result.details!.originalMessage).toBe('not found');
  });

  it('should map 28P01 to INVALID_CREDENTIALS', () => {
    const error = { code: '28P01', message: 'invalid password' };
    const result = handleGenericDatabaseError(error);

    expect(result.code).toBe(ErrorCode.INVALID_CREDENTIALS);
    expect(result.message).toBe('Credenziali database non valide.');
    expect(result.details!.pgCode).toBe('28P01');
    expect(result.details!.originalMessage).toBe('invalid password');
  });

  it('should map 3D000 to DATABASE_ERROR', () => {
    const error = { code: '3D000', message: 'database does not exist' };
    const result = handleGenericDatabaseError(error);

    expect(result.code).toBe(ErrorCode.DATABASE_ERROR);
    expect(result.message).toBe('Database non trovato.');
    expect(result.details!.pgCode).toBe('3D000');
    expect(result.details!.originalMessage).toBe('database does not exist');
  });

  it('should map 08006 to NETWORK_ERROR', () => {
    const error = { code: '08006', message: 'connection failure' };
    const result = handleGenericDatabaseError(error);

    expect(result.code).toBe(ErrorCode.NETWORK_ERROR);
    expect(result.message).toBe('Errore di connessione al database.');
    expect(result.details!.pgCode).toBe('08006');
    expect(result.details!.originalMessage).toBe('connection failure');
  });

  it('should map 08001 to NETWORK_ERROR', () => {
    const error = { code: '08001', message: 'could not connect' };
    const result = handleGenericDatabaseError(error);

    expect(result.code).toBe(ErrorCode.NETWORK_ERROR);
    expect(result.message).toBe('Impossibile connettersi al database.');
    expect(result.details!.pgCode).toBe('08001');
    expect(result.details!.originalMessage).toBe('could not connect');
  });

  it('should map 53300 to SERVICE_UNAVAILABLE', () => {
    const error = { code: '53300', message: 'too many connections' };
    const result = handleGenericDatabaseError(error);

    expect(result.code).toBe(ErrorCode.SERVICE_UNAVAILABLE);
    expect(result.message).toBe('Troppe connessioni al database. Riprova più tardi.');
    expect(result.details!.pgCode).toBe('53300');
    expect(result.details!.originalMessage).toBe('too many connections');
  });

  it('should preserve original message in details', () => {
    const error = { code: '23505', message: 'unique constraint violation on email' };
    const result = handleGenericDatabaseError(error);

    expect(result.details).toBeDefined();
    expect(result.details!.originalMessage).toBe('unique constraint violation on email');
  });

  it('should include pgCode in details for known codes', () => {
    const error = { code: '23505', message: 'duplicate' };
    const result = handleGenericDatabaseError(error);

    expect(result.details!.pgCode).toBe('23505');
  });

  it('should handle unknown PG code with DATABASE_ERROR', () => {
    const error = { code: 'XXXXX', message: 'unknown error' };
    const result = handleGenericDatabaseError(error);

    expect(result.code).toBe(ErrorCode.DATABASE_ERROR);
    expect(result.message).toBe("Errore durante l'operazione sul database.");
    expect(result.details!.errorCode).toBe('XXXXX');
    expect(result.details!.originalMessage).toBe('unknown error');
  });

  it('should handle error without code', () => {
    const error = { message: 'some database error' };
    const result = handleGenericDatabaseError(error);

    expect(result.code).toBe(ErrorCode.DATABASE_ERROR);
    expect(result.message).toBe("Errore durante l'operazione sul database.");
    expect(result.details!.originalMessage).toBe('some database error');
  });

  it('should handle Error instance with stack', () => {
    const error = Object.assign(new Error('connection timeout'), { code: '28P01' });
    const result = handleGenericDatabaseError(error);

    expect(result.code).toBe(ErrorCode.INVALID_CREDENTIALS);
    expect(result.message).toBe('Credenziali database non valide.');
    expect(result.details!.pgCode).toBe('28P01');
    expect(result.details!.originalMessage).toBe('connection timeout');
    expect(result.details!.stack).toBeDefined();
  });

  it('should handle plain string', () => {
    const result = handleGenericDatabaseError('database error');

    expect(result.code).toBe(ErrorCode.DATABASE_ERROR);
    expect(result.message).toBe("Errore durante l'operazione sul database.");
    expect(result.details).toEqual({});
  });
});

describe('handleDatabaseError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should route duplicate entry errors (code 23505) to handleDuplicateEntryError', () => {
    const error = { code: '23505', message: 'duplicate key value violates unique constraint' };
    const result = handleDatabaseError(error);

    expect(result.code).toBe(ErrorCode.DUPLICATE_ENTRY);
    expect(result.message).toBe('Dati duplicati. Questo valore esiste già.');
    expect(result.details!.constraint).toBe('unique');
  });

  it('should route foreign key errors (code 23503) to handleForeignKeyError', () => {
    const error = { code: '23503', message: 'insert or update on table violates foreign key constraint' };
    const result = handleDatabaseError(error);

    expect(result.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(result.message).toBe('Riferimento a dati non esistenti.');
    expect(result.details!.constraint).toBe('foreign_key');
  });

  it('should route not found errors (code PGRST116) to handleNotFoundError', () => {
    const error = { code: 'PGRST116', message: 'Could not find anything' };
    const result = handleDatabaseError(error);

    expect(result.code).toBe(ErrorCode.NOT_FOUND);
    expect(result.message).toBe('Dati non trovati.');
  });

  it('should route unknown PG codes to handleGenericDatabaseError', () => {
    const error = { code: '3D000', message: 'database does not exist' };
    const result = handleDatabaseError(error);

    expect(result.code).toBe(ErrorCode.DATABASE_ERROR);
    expect(result.message).toBe('Database non trovato.');
    expect(result.details!.pgCode).toBe('3D000');
  });

  it('should route errors without recognized code to handleGenericDatabaseError', () => {
    const error = { code: 'XXXXX', message: 'unknown error' };
    const result = handleDatabaseError(error);

    expect(result.code).toBe(ErrorCode.DATABASE_ERROR);
    expect(result.message).toBe("Errore durante l'operazione sul database.");
  });
});