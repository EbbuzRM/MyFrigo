/**
 * @fileoverview User-friendly error message formatters.
 * Converts technical error codes to readable Italian messages for UI display.
 */

import { ErrorCode } from '../types/errorCodes';
import { AppError } from '../types/errorTypes';

/**
 * User-friendly error messages mapped by error code.
 * All messages are in Italian for consistency with the app language.
 */
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Auth errors
  [ErrorCode.UNAUTHORIZED]: 'Sessione scaduta. Per favore accedi di nuovo.',
  [ErrorCode.INVALID_CREDENTIALS]: 'Credenziali non valide. Riprova.',
  [ErrorCode.EMAIL_NOT_CONFIRMED]:
    'Email non confermata. Controlla la tua email e clicca sul link di conferma.',
  [ErrorCode.SESSION_EXPIRED]: 'Sessione scaduta. Per favore accedi di nuovo.',

  // Validation errors
  [ErrorCode.VALIDATION_ERROR]: 'Dati inseriti non validi.',
  [ErrorCode.INVALID_EMAIL_FORMAT]: 'Formato email non valido.',
  [ErrorCode.INVALID_DATA_FORMAT]: 'Formato dati non valido.',

  // Database errors
  [ErrorCode.DATABASE_ERROR]: 'Errore durante il salvataggio dei dati.',
  [ErrorCode.NETWORK_ERROR]: 'Problema di connessione. Controlla la rete e riprova.',
  [ErrorCode.NOT_FOUND]: 'Dati non trovati.',
  [ErrorCode.DUPLICATE_ENTRY]: 'Dati duplicati. Questo valore esiste già.',

  // System errors
  [ErrorCode.SYSTEM_ERROR]: 'Si è verificato un errore. Riprova più tardi.',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Servizio temporaneamente non disponibile.',
  [ErrorCode.TIMEOUT_ERROR]: 'Operazione scaduta. Riprova più tardi.',

  // Authorization errors
  [ErrorCode.FORBIDDEN]: 'Accesso negato.',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'Permessi insufficienti per questa operazione.',

  // Configuration errors
  [ErrorCode.CONFIGURATION_ERROR]: 'Errore di configurazione.',
  [ErrorCode.MISSING_ENVIRONMENT_VARIABLE]: 'Configurazione incompleta.',
};

/**
 * Formats an error for display in the UI.
 * Returns a user-friendly Italian message.
 * @param error - The error to format
 * @returns User-friendly error message
 */
export function formatErrorForUI(error: AppError): string {
  return ERROR_MESSAGES[error.code] || 'Si è verificato un errore. Riprova più tardi.';
}

/**
 * Formats an error code directly to a message.
 * Useful when you only have the code, not the full error object.
 * @param code - The error code
 * @returns User-friendly error message
 */
export function formatErrorCode(code: ErrorCode): string {
  return ERROR_MESSAGES[code] || 'Si è verificato un errore. Riprova più tardi.';
}

/**
 * Gets a title for an error (for modal dialogs, alerts, etc.)
 * @param error - The error to get a title for
 * @returns Short error title
 */
export function getErrorTitle(error: AppError): string {
  const titles: Record<ErrorCode, string> = {
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

  return titles[error.code] || 'Errore';
}

/**
 * Formats error details for debugging purposes.
 * Includes timestamp and any additional details.
 * @param error - The error to format
 * @returns Formatted debug string
 */
export function formatErrorForDebug(error: AppError): string {
  const parts = [`[${error.code}] ${error.message}`];

  if (error.details && Object.keys(error.details).length > 0) {
    parts.push(`Details: ${JSON.stringify(error.details)}`);
  }

  parts.push(`Time: ${error.timestamp}`);

  if (error.stack) {
    parts.push(`Stack: ${error.stack}`);
  }

  return parts.join(' | ');
}

/**
 * Gets suggestions for the user based on error type.
 * @param error - The error to get suggestions for
 * @returns Array of actionable suggestions
 */
export function getErrorSuggestions(error: AppError): string[] {
  const suggestions: Record<ErrorCode, string[]> = {
    [ErrorCode.UNAUTHORIZED]: ['Effettua il login di nuovo', 'Controlla che la sessione sia valida'],
    [ErrorCode.INVALID_CREDENTIALS]: [
      'Verifica email e password',
      'Usa "Password dimenticata" se necessario',
    ],
    [ErrorCode.EMAIL_NOT_CONFIRMED]: [
      'Controlla la cartella spam',
      'Richiedi una nuova email di conferma',
    ],
    [ErrorCode.SESSION_EXPIRED]: ['Effettua il login di nuovo'],
    [ErrorCode.VALIDATION_ERROR]: ['Controlla i dati inseriti', 'Assicurati che tutti i campi siano compilati'],
    [ErrorCode.INVALID_EMAIL_FORMAT]: ['Inserisci un indirizzo email valido'],
    [ErrorCode.INVALID_DATA_FORMAT]: ['Verifica il formato dei dati richiesti'],
    [ErrorCode.DATABASE_ERROR]: ['Riprova tra qualche istante', 'Contatta il supporto se persiste'],
    [ErrorCode.NETWORK_ERROR]: [
      'Controlla la connessione WiFi/dati',
      'Verifica che non sia attiva una VPN',
    ],
    [ErrorCode.NOT_FOUND]: ['Verifica che i dati esistano', 'Ricarica la pagina'],
    [ErrorCode.DUPLICATE_ENTRY]: ['Usa un valore diverso', 'Verifica che non esista già'],
    [ErrorCode.SYSTEM_ERROR]: ['Riprova più tardi', 'Contatta il supporto se persiste'],
    [ErrorCode.SERVICE_UNAVAILABLE]: ['Riprova tra qualche minuto'],
    [ErrorCode.TIMEOUT_ERROR]: ['Riprova l\'operazione'],
    [ErrorCode.FORBIDDEN]: ['Verifica di avere i permessi necessari'],
    [ErrorCode.INSUFFICIENT_PERMISSIONS]: ['Contatta l\'amministratore'],
    [ErrorCode.CONFIGURATION_ERROR]: ['Contatta il supporto tecnico'],
    [ErrorCode.MISSING_ENVIRONMENT_VARIABLE]: ['Contatta il supporto tecnico'],
  };

  return suggestions[error.code] || ['Riprova più tardi'];
}
