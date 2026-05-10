// errorFormatters.test.ts — errorFormatters test module.
//
// exports: none
// used_by: none
// rules:   none

import { formatErrorForUI, formatErrorCode, getErrorTitle, formatErrorForDebug, getErrorSuggestions } from
  '../errorFormatters';
import { LoggingService } from '../../services/LoggingService';
import { ErrorCode } from '../../types/errorCodes';

// Mock (necessario per LoggingService chiamato internamente da createError)
jest.mock('../../services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('formatErrorForUI', () => {
  it('should return correct message for UNAUTHORIZED', () => {
    const err: any = {
      code: ErrorCode.UNAUTHORIZED,
      message: 'test message',
      details: { foo: 'bar' },
      timestamp: '2026-01-01T00:00:00.000Z',
      stack: 'Error: test\n    at test',
    };
    expect(formatErrorForUI(err)).toBe('Sessione scaduta. Per favore accedi di nuovo.');
  });

  it('should return correct message for INVALID_CREDENTIALS', () => {
    const err: any = {
      code: ErrorCode.INVALID_CREDENTIALS,
      message: 'test message',
      details: {},
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    expect(formatErrorForUI(err)).toBe('Credenziali non valide. Riprova.');
  });

  it('should return correct message for EMAIL_NOT_CONFIRMED', () => {
    const err: any = {
      code: ErrorCode.EMAIL_NOT_CONFIRMED,
      message: 'test message',
      details: {},
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    expect(formatErrorForUI(err)).toBe(
      'Email non confermata. Controlla la tua email e clicca sul link di conferma.',
    );
  });

  it('should return correct message for SESSION_EXPIRED', () => {
    const err: any = {
      code: ErrorCode.SESSION_EXPIRED,
      message: 'test message',
      details: {},
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    expect(formatErrorForUI(err)).toBe('Sessione scaduta. Per favore accedi di nuovo.');
  });

  it('should return correct message for VALIDATION_ERROR', () => {
    const err: any = {
      code: ErrorCode.VALIDATION_ERROR,
      message: 'test message',
      details: {},
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    expect(formatErrorForUI(err)).toBe('Dati inseriti non validi.');
  });

  it('should return correct message for INVALID_EMAIL_FORMAT', () => {
    const err: any = {
      code: ErrorCode.INVALID_EMAIL_FORMAT,
      message: 'test message',
      details: {},
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    expect(formatErrorForUI(err)).toBe('Formato email non valido.');
  });

  it('should return correct message for INVALID_DATA_FORMAT', () => {
    const err: any = {
      code: ErrorCode.INVALID_DATA_FORMAT,
      message: 'test message',
      details: {},
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    expect(formatErrorForUI(err)).toBe('Formato dati non valido.');
  });

  it('should return correct message for DATABASE_ERROR', () => {
    const err: any = {
      code: ErrorCode.DATABASE_ERROR,
      message: 'test message',
      details: {},
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    expect(formatErrorForUI(err)).toBe('Errore durante il salvataggio dei dati.');
  });

  it('should return correct message for NETWORK_ERROR', () => {
    const err: any = {
      code: ErrorCode.NETWORK_ERROR,
      message: 'test message',
      details: {},
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    expect(formatErrorForUI(err)).toBe('Problema di connessione. Controlla la rete e riprova.');
  });

  it('should return correct message for NOT_FOUND', () => {
    const err: any = {
      code: ErrorCode.NOT_FOUND,
      message: 'test message',
      details: {},
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    expect(formatErrorForUI(err)).toBe('Dati non trovati.');
  });

  it('should return correct message for DUPLICATE_ENTRY', () => {
    const err: any = {
      code: ErrorCode.DUPLICATE_ENTRY,
      message: 'test message',
      details: {},
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    expect(formatErrorForUI(err)).toBe('Dati duplicati. Questo valore esiste già.');
  });

  it('should return correct message for SYSTEM_ERROR', () => {
    const err: any = {
      code: ErrorCode.SYSTEM_ERROR,
      message: 'test message',
      details: {},
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    expect(formatErrorForUI(err)).toBe('Si è verificato un errore. Riprova più tardi.');
  });

  it('should return correct message for SERVICE_UNAVAILABLE', () => {
    const err: any = {
      code: ErrorCode.SERVICE_UNAVAILABLE,
      message: 'test message',
      details: {},
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    expect(formatErrorForUI(err)).toBe('Servizio temporaneamente non disponibile.');
  });

  it('should return correct message for TIMEOUT_ERROR', () => {
    const err: any = {
      code: ErrorCode.TIMEOUT_ERROR,
      message: 'test message',
      details: {},
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    expect(formatErrorForUI(err)).toBe('Operazione scaduta. Riprova più tardi.');
  });

  it('should return correct message for FORBIDDEN', () => {
    const err: any = {
      code: ErrorCode.FORBIDDEN,
      message: 'test message',
      details: {},
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    expect(formatErrorForUI(err)).toBe('Accesso negato.');
  });

  it('should return correct message for INSUFFICIENT_PERMISSIONS', () => {
    const err: any = {
      code: ErrorCode.INSUFFICIENT_PERMISSIONS,
      message: 'test message',
      details: {},
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    expect(formatErrorForUI(err)).toBe('Permessi insufficienti per questa operazione.');
  });

  it('should return correct message for CONFIGURATION_ERROR', () => {
    const err: any = {
      code: ErrorCode.CONFIGURATION_ERROR,
      message: 'test message',
      details: {},
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    expect(formatErrorForUI(err)).toBe('Errore di configurazione.');
  });

  it('should return correct message for MISSING_ENVIRONMENT_VARIABLE', () => {
    const err: any = {
      code: ErrorCode.MISSING_ENVIRONMENT_VARIABLE,
      message: 'test message',
      details: {},
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    expect(formatErrorForUI(err)).toBe('Configurazione incompleta.');
  });

  it('should return fallback message for unknown error code', () => {
    const err: any = {
      code: 'UNKNOWN_CODE' as ErrorCode,
      message: 'test message',
      details: {},
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    expect(formatErrorForUI(err)).toBe('Si è verificato un errore. Riprova più tardi.');
  });
});

describe('formatErrorCode', () => {
  it('should return correct message for UNAUTHORIZED', () => {
    expect(formatErrorCode(ErrorCode.UNAUTHORIZED)).toBe('Sessione scaduta. Per favore accedi di nuovo.');
  });

  it('should return correct message for INVALID_CREDENTIALS', () => {
    expect(formatErrorCode(ErrorCode.INVALID_CREDENTIALS)).toBe('Credenziali non valide. Riprova.');
  });

  it('should return correct message for NETWORK_ERROR', () => {
    expect(formatErrorCode(ErrorCode.NETWORK_ERROR)).toBe('Problema di connessione. Controlla la rete e riprova.');
  });

  it('should return correct message for SYSTEM_ERROR', () => {
    expect(formatErrorCode(ErrorCode.SYSTEM_ERROR)).toBe('Si è verificato un errore. Riprova più tardi.');
  });

  it('should return correct message for CONFIGURATION_ERROR', () => {
    expect(formatErrorCode(ErrorCode.CONFIGURATION_ERROR)).toBe('Errore di configurazione.');
  });

  it('should return correct message for MISSING_ENVIRONMENT_VARIABLE', () => {
    expect(formatErrorCode(ErrorCode.MISSING_ENVIRONMENT_VARIABLE)).toBe('Configurazione incompleta.');
  });

  it('should return fallback for unknown code', () => {
    expect(formatErrorCode('UNKNOWN_CODE' as ErrorCode)).toBe(
      'Si è verificato un errore. Riprova più tardi.',
    );
  });
});

describe('getErrorTitle', () => {
  it('should return correct title for UNAUTHORIZED', () => {
    const err: any = { code: ErrorCode.UNAUTHORIZED, message: 'test' };
    expect(getErrorTitle(err)).toBe('Sessione Scaduta');
  });

  it('should return correct title for INVALID_CREDENTIALS', () => {
    const err: any = { code: ErrorCode.INVALID_CREDENTIALS, message: 'test' };
    expect(getErrorTitle(err)).toBe('Login Fallito');
  });

  it('should return correct title for EMAIL_NOT_CONFIRMED', () => {
    const err: any = { code: ErrorCode.EMAIL_NOT_CONFIRMED, message: 'test' };
    expect(getErrorTitle(err)).toBe('Email Non Confermata');
  });

  it('should return correct title for SESSION_EXPIRED', () => {
    const err: any = { code: ErrorCode.SESSION_EXPIRED, message: 'test' };
    expect(getErrorTitle(err)).toBe('Sessione Scaduta');
  });

  it('should return correct title for VALIDATION_ERROR', () => {
    const err: any = { code: ErrorCode.VALIDATION_ERROR, message: 'test' };
    expect(getErrorTitle(err)).toBe('Dati Non Validi');
  });

  it('should return correct title for INVALID_EMAIL_FORMAT', () => {
    const err: any = { code: ErrorCode.INVALID_EMAIL_FORMAT, message: 'test' };
    expect(getErrorTitle(err)).toBe('Email Non Valida');
  });

  it('should return correct title for INVALID_DATA_FORMAT', () => {
    const err: any = { code: ErrorCode.INVALID_DATA_FORMAT, message: 'test' };
    expect(getErrorTitle(err)).toBe('Formato Non Valido');
  });

  it('should return correct title for NOT_FOUND', () => {
    const err: any = { code: ErrorCode.NOT_FOUND, message: 'test' };
    expect(getErrorTitle(err)).toBe('Non Trovato');
  });

  it('should return correct title for DATABASE_ERROR', () => {
    const err: any = { code: ErrorCode.DATABASE_ERROR, message: 'test' };
    expect(getErrorTitle(err)).toBe('Errore Database');
  });

  it('should return correct title for NETWORK_ERROR', () => {
    const err: any = { code: ErrorCode.NETWORK_ERROR, message: 'test' };
    expect(getErrorTitle(err)).toBe('Errore di Connessione');
  });

  it('should return correct title for DUPLICATE_ENTRY', () => {
    const err: any = { code: ErrorCode.DUPLICATE_ENTRY, message: 'test' };
    expect(getErrorTitle(err)).toBe('Dato Duplicato');
  });

  it('should return correct title for SYSTEM_ERROR', () => {
    const err: any = { code: ErrorCode.SYSTEM_ERROR, message: 'test' };
    expect(getErrorTitle(err)).toBe('Errore di Sistema');
  });

  it('should return correct title for SERVICE_UNAVAILABLE', () => {
    const err: any = { code: ErrorCode.SERVICE_UNAVAILABLE, message: 'test' };
    expect(getErrorTitle(err)).toBe('Servizio Non Disponibile');
  });

  it('should return correct title for TIMEOUT_ERROR', () => {
    const err: any = { code: ErrorCode.TIMEOUT_ERROR, message: 'test' };
    expect(getErrorTitle(err)).toBe('Timeout');
  });

  it('should return correct title for FORBIDDEN', () => {
    const err: any = { code: ErrorCode.FORBIDDEN, message: 'test' };
    expect(getErrorTitle(err)).toBe('Accesso Negato');
  });

  it('should return correct title for INSUFFICIENT_PERMISSIONS', () => {
    const err: any = { code: ErrorCode.INSUFFICIENT_PERMISSIONS, message: 'test' };
    expect(getErrorTitle(err)).toBe('Permessi Insufficienti');
  });

  it('should return correct title for CONFIGURATION_ERROR', () => {
    const err: any = { code: ErrorCode.CONFIGURATION_ERROR, message: 'test' };
    expect(getErrorTitle(err)).toBe('Errore Configurazione');
  });

  it('should return correct title for MISSING_ENVIRONMENT_VARIABLE', () => {
    const err: any = { code: ErrorCode.MISSING_ENVIRONMENT_VARIABLE, message: 'test' };
    expect(getErrorTitle(err)).toBe('Configurazione Mancante');
  });

  it('should return "Errore" for unknown code', () => {
    const err: any = { code: 'UNKNOWN_CODE', message: 'test' };
    expect(getErrorTitle(err)).toBe('Errore');
  });

  it('should handle all 18 ErrorCode values', () => {
    const allCodes = Object.values(ErrorCode);
    expect(allCodes).toHaveLength(18);

    const titleMap: Record<ErrorCode, string> = {
      [ErrorCode.UNAUTHORIZED]: 'Sessione Scaduta',
      [ErrorCode.INVALID_CREDENTIALS]: 'Login Fallito',
      [ErrorCode.EMAIL_NOT_CONFIRMED]: 'Email Non Confermata',
      [ErrorCode.SESSION_EXPIRED]: 'Sessione Scaduta',
      [ErrorCode.VALIDATION_ERROR]: 'Dati Non Validi',
      [ErrorCode.INVALID_EMAIL_FORMAT]: 'Email Non Valida',
      [ErrorCode.INVALID_DATA_FORMAT]: 'Formato Non Valido',
      [ErrorCode.DATABASE_ERROR]: 'Errore Database',
      [ErrorCode.NETWORK_ERROR]: 'Errore di Connessione',
      [ErrorCode.NOT_FOUND]: 'Non Trovato',
      [ErrorCode.DUPLICATE_ENTRY]: 'Dato Duplicato',
      [ErrorCode.SYSTEM_ERROR]: 'Errore di Sistema',
      [ErrorCode.SERVICE_UNAVAILABLE]: 'Servizio Non Disponibile',
      [ErrorCode.TIMEOUT_ERROR]: 'Timeout',
      [ErrorCode.FORBIDDEN]: 'Accesso Negato',
      [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'Permessi Insufficienti',
      [ErrorCode.CONFIGURATION_ERROR]: 'Errore Configurazione',
      [ErrorCode.MISSING_ENVIRONMENT_VARIABLE]: 'Configurazione Mancante',
    };

    for (const code of allCodes) {
      const err: any = { code, message: 'test' };
      expect(getErrorTitle(err)).toBe(titleMap[code]);
    }
  });
});

describe('formatErrorForDebug', () => {
  it('should include code and message', () => {
    const err: any = {
      code: ErrorCode.SYSTEM_ERROR,
      message: 'test message',
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    const result = formatErrorForDebug(err);
    expect(result).toContain(ErrorCode.SYSTEM_ERROR);
    expect(result).toContain('test message');
  });

  it('should include details when present', () => {
    const err: any = {
      code: ErrorCode.DATABASE_ERROR,
      message: 'db error',
      details: { table: 'users', id: 42 },
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    const result = formatErrorForDebug(err);
    expect(result).toContain('table');
    expect(result).toContain('users');
    expect(result).toContain('42');
  });

  it('should include timestamp', () => {
    const err: any = {
      code: ErrorCode.NETWORK_ERROR,
      message: 'net error',
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    const result = formatErrorForDebug(err);
    expect(result).toContain('2026-01-01T00:00:00.000Z');
  });

  it('should include stack when present', () => {
    const err: any = {
      code: ErrorCode.SYSTEM_ERROR,
      message: 'test',
      timestamp: '2026-01-01T00:00:00.000Z',
      stack: 'Error: test\n    at test.js:1:1',
    };
    const result = formatErrorForDebug(err);
    expect(result).toContain('Stack:');
    expect(result).toContain('Error: test');
  });

  it('should handle missing details gracefully', () => {
    const err: any = {
      code: ErrorCode.NOT_FOUND,
      message: 'not found',
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    const result = formatErrorForDebug(err);
    expect(result).not.toContain('Details:');
    expect(result).toContain(ErrorCode.NOT_FOUND);
    expect(result).toContain('not found');
  });
});

describe('getErrorSuggestions', () => {
  it('should return suggestions for UNAUTHORIZED', () => {
    const err: any = { code: ErrorCode.UNAUTHORIZED, message: 'test' };
    const suggestions = getErrorSuggestions(err);
    expect(suggestions).toEqual(['Effettua il login di nuovo', 'Controlla che la sessione sia valida']);
  });

  it('should return suggestions for INVALID_CREDENTIALS', () => {
    const err: any = { code: ErrorCode.INVALID_CREDENTIALS, message: 'test' };
    const suggestions = getErrorSuggestions(err);
    expect(suggestions).toEqual(['Verifica email e password', 'Usa "Password dimenticata" se necessario']);
  });

  it('should return suggestions for EMAIL_NOT_CONFIRMED', () => {
    const err: any = { code: ErrorCode.EMAIL_NOT_CONFIRMED, message: 'test' };
    const suggestions = getErrorSuggestions(err);
    expect(suggestions).toEqual(['Controlla la cartella spam', 'Richiedi una nuova email di conferma']);
  });

  it('should return suggestions for SESSION_EXPIRED', () => {
    const err: any = { code: ErrorCode.SESSION_EXPIRED, message: 'test' };
    const suggestions = getErrorSuggestions(err);
    expect(suggestions).toEqual(['Effettua il login di nuovo']);
  });

  it('should return suggestions for NETWORK_ERROR', () => {
    const err: any = { code: ErrorCode.NETWORK_ERROR, message: 'test' };
    const suggestions = getErrorSuggestions(err);
    expect(suggestions).toEqual(['Controlla la connessione WiFi/dati', 'Verifica che non sia attiva una VPN']);
  });

  it('should return suggestions for DATABASE_ERROR', () => {
    const err: any = { code: ErrorCode.DATABASE_ERROR, message: 'test' };
    const suggestions = getErrorSuggestions(err);
    expect(suggestions).toEqual(['Riprova tra qualche istante', 'Contatta il supporto se persiste']);
  });

  it('should return suggestions for FORBIDDEN', () => {
    const err: any = { code: ErrorCode.FORBIDDEN, message: 'test' };
    const suggestions = getErrorSuggestions(err);
    expect(suggestions).toEqual(['Verifica di avere i permessi necessari']);
  });

  it('should return suggestions for SYSTEM_ERROR', () => {
    const err: any = { code: ErrorCode.SYSTEM_ERROR, message: 'test' };
    const suggestions = getErrorSuggestions(err);
    expect(suggestions).toEqual(['Riprova più tardi', 'Contatta il supporto se persiste']);
  });

  it('should return fallback suggestion for unknown code', () => {
    const err: any = { code: 'UNKNOWN_CODE' as ErrorCode, message: 'test' };
    const suggestions = getErrorSuggestions(err);
    expect(suggestions).toEqual(['Riprova più tardi']);
  });
});