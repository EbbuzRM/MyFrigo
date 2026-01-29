import { LoggingService } from '../services/LoggingService';

/**
 * Type guard per verificare se è un oggetto errore con proprietà code
 */
function hasErrorCode(error: unknown): error is { code: string | number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as Record<string, unknown>).code === 'string'
  );
}

/**
 * Type guard per verificare se è un oggetto errore con proprietà message
 */
function hasErrorMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

/**
 * Type guard per verificare se è un errore di rete
 */
function isNetworkError(error: unknown): error is { code: string; message?: string } {
  return hasErrorCode(error) && (
    error.code === 'ERR_NETWORK' || 
    error.code === 'ECONNABORTED'
  );
}

/**
 * Interfaccia per gli errori standardizzati
 */
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  stack?: string;
}

/**
 * Codici di errore standard
 */
export enum ErrorCode {
  // Errori di autenticazione
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_NOT_CONFIRMED = 'EMAIL_NOT_CONFIRMED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Errori di validazione
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_EMAIL_FORMAT = 'INVALID_EMAIL_FORMAT',
  INVALID_DATA_FORMAT = 'INVALID_DATA_FORMAT',
  
  // Errori di database
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  
  // Errori di sistema
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Errori di autorizzazione
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Errori di configurazione
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  MISSING_ENVIRONMENT_VARIABLE = 'MISSING_ENVIRONMENT_VARIABLE'
}

/**
 * Classe per la gestione centralizzata degli errori
 */
export class ErrorHandler {
  /**
   * Crea un errore standardizzato
   */
  static createError(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
    originalError?: unknown
  ): AppError {
    const error: AppError = {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      stack: originalError && typeof originalError === 'object' && 'stack' in originalError 
        ? (originalError as { stack?: string }).stack 
        : undefined
    };
    
    // Logga l'errore con dettagli appropriati
    this.logError(error, originalError);
    
    return error;
  }
  
  /**
   * Converte un errore sconosciuto in un AppError standardizzato
   */
  static normalizeError(error: unknown): AppError {
    let code = ErrorCode.SYSTEM_ERROR;
    let message = 'Errore sconosciuto';
    let details: Record<string, unknown> | undefined = undefined;
    
    if (error instanceof Error) {
      message = error.message;
      
      // Analizza il tipo di errore
      if (error.message.includes('unauthorized') || error.message.includes('JWT')) {
        code = ErrorCode.UNAUTHORIZED;
      } else if (error.message.includes('email') && error.message.includes('confirm')) {
        code = ErrorCode.EMAIL_NOT_CONFIRMED;
      } else if (error.message.includes('validation') || error.message.includes('invalid')) {
        code = ErrorCode.VALIDATION_ERROR;
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        code = ErrorCode.NETWORK_ERROR;
      } else if (error.message.includes('not found')) {
        code = ErrorCode.NOT_FOUND;
      } else if (error.message.includes('duplicate') || error.message.includes('unique')) {
        code = ErrorCode.DUPLICATE_ENTRY;
      }
      
      details = {
        originalMessage: error.message,
        stack: error.stack
      };
    } else if (typeof error === 'object' && error !== null) {
      message = hasErrorMessage(error) ? error.message : 'Errore sconosciuto';
      details = error as Record<string, unknown>;
      
      if (hasErrorCode(error)) {
        const errorCode = String(error.code).toUpperCase();
        if (Object.values(ErrorCode).includes(errorCode as ErrorCode)) {
          code = errorCode as ErrorCode;
        }
      }
    }
    
    return this.createError(code, message, details, error);
  }
  
  /**
   * Logga l'errore in modo appropriato
   */
  private static logError(error: AppError, originalError?: unknown): void {
    const logMessage = `[${error.code}] ${error.message}`;
    
    switch (error.code) {
      case ErrorCode.UNAUTHORIZED:
      case ErrorCode.SESSION_EXPIRED:
      case ErrorCode.FORBIDDEN:
        LoggingService.warning('ErrorHandler', logMessage, error.details);
        break;
        
      case ErrorCode.VALIDATION_ERROR:
      case ErrorCode.INVALID_EMAIL_FORMAT:
        LoggingService.info('ErrorHandler', logMessage, error.details);
        break;
        
      case ErrorCode.NETWORK_ERROR:
      case ErrorCode.SERVICE_UNAVAILABLE:
        LoggingService.warning('ErrorHandler', logMessage, error.details);
        break;
        
      case ErrorCode.NOT_FOUND:
        LoggingService.info('ErrorHandler', logMessage, error.details);
        break;
        
      case ErrorCode.DATABASE_ERROR:
      case ErrorCode.SYSTEM_ERROR:
      case ErrorCode.CONFIGURATION_ERROR:
      default:
        LoggingService.error('ErrorHandler', logMessage, originalError || error.details);
        break;
    }
  }
  
  /**
   * Gestisce gli errori di rete
   */
  static handleNetworkError(error: unknown): AppError {
    if (isNetworkError(error)) {
      const errorMessage = hasErrorMessage(error) ? error.message : 'Errore di rete';
      return this.createError(
        ErrorCode.NETWORK_ERROR,
        'Errore di connessione. Controlla la tua connessione a internet e riprova.',
        { originalError: errorMessage }
      );
    }
    
    return this.normalizeError(error);
  }
  
  /**
   * Gestisce gli errori di database
   */
  static handleDatabaseError(error: unknown): AppError {
    let message = 'Errore durante l\'operazione sul database.';
    let code = ErrorCode.DATABASE_ERROR;
    
    // Analizza l'errore specifico del database
    if (hasErrorCode(error)) {
      if (error.code === '23505') { // Unique violation
        message = 'Dati duplicati. Questo valore esiste già.';
        code = ErrorCode.DUPLICATE_ENTRY;
      } else if (error.code === '23503') { // Foreign key violation
        message = 'Riferimento a dati non esistenti.';
        code = ErrorCode.VALIDATION_ERROR;
      } else if (error.code === 'PGRST116') { // Rows not returned
        message = 'Dati non trovati.';
        code = ErrorCode.NOT_FOUND;
      }
    }
    
    const errorMessage = hasErrorMessage(error) ? error.message : String(error);
    const errorCode = hasErrorCode(error) ? error.code : undefined;
    
    return this.createError(code, message, { originalError: errorCode, details: errorMessage });
  }
  
  /**
   * Gestisce gli errori di validazione
   */
  static handleValidationError(field: string, value: unknown, rule: string): AppError {
    return this.createError(
      ErrorCode.VALIDATION_ERROR,
      `Campo "${field}" non valido: ${rule}`,
      { field, value, rule }
    );
  }
  
  /**
   * Gestisce gli errori di autenticazione
   */
  static handleAuthError(error: unknown): AppError {
    if (hasErrorMessage(error) && error.message.includes('Email not confirmed')) {
      return this.createError(
        ErrorCode.EMAIL_NOT_CONFIRMED,
        'Email non confermata. Controlla la tua email e clicca sul link di conferma.',
        { originalError: error.message }
      );
    }
    
    if (hasErrorMessage(error) && (error.message.includes('Invalid credentials') || error.message.includes('Invalid login'))) {
      return this.createError(
        ErrorCode.INVALID_CREDENTIALS,
        'Email o password non validi.',
        { originalError: error.message }
      );
    }
    
    return this.normalizeError(error);
  }
  
  /**
   * Verifica se è un errore di sessione scaduta
   */
  static isSessionExpired(error: unknown): boolean {
    if (!hasErrorMessage(error)) {
      return hasErrorCode(error) && error.code === 'PGRST301';
    }
    
    return (
      error.message.includes('session') && 
      (error.message.includes('expired') || error.message.includes('invalid'))
    ) || (hasErrorCode(error) && error.code === 'PGRST301');
  }
  
  /**
   * Verifica se è un errore di autorizzazione
   */
  static isUnauthorized(error: unknown): boolean {
    if (hasErrorCode(error) && error.code === 'PGRST301') {
      return true;
    }
    
    if (!hasErrorMessage(error)) {
      return false;
    }
    
    return (
      error.message.includes('unauthorized') ||
      error.message.includes('JWT') ||
      error.message.includes('token')
    );
  }
  
  /**
   * Formatta un errore per la visualizzazione nell'interfaccia
   */
  static formatForUI(error: AppError): string {
    // Messaggi personalizzati per gli errori comuni
    switch (error.code) {
      case ErrorCode.UNAUTHORIZED:
        return 'Sessione scaduta. Per favore accedi di nuovo.';
      case ErrorCode.EMAIL_NOT_CONFIRMED:
        return error.message;
      case ErrorCode.INVALID_CREDENTIALS:
        return 'Credenziali non valide. Riprova.';
      case ErrorCode.NETWORK_ERROR:
        return 'Problema di connessione. Controlla la rete e riprova.';
      case ErrorCode.NOT_FOUND:
        return 'Dati non trovati.';
      case ErrorCode.VALIDATION_ERROR:
        return 'Dati inseriti non validi.';
      case ErrorCode.DATABASE_ERROR:
        return 'Errore durante il salvataggio dei dati.';
      default:
        return 'Si è verificato un errore. Riprova più tardi.';
    }
  }
}
