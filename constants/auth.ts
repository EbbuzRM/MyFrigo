// auth.ts — auth module.
//
// exports: AUTH_CONSTANTS | AuthConstants
// used_by: app\signup.tsx
//                   hooks\usePostRegistration.ts
//                   hooks\useRegistrationActions.ts
//                   hooks\useRegistrationOrchestrator.ts
//                   hooks\useRegistrationState.ts
//                   hooks\useSignupValidators.ts
// rules:   Utilizzare esclusivamente le costanti definite in `AUTH_CONSTANTS` per tutte le stringhe UI, messaggi di errore e regole di validazione relative all'autenticazione; non introdurre stringhe hardcodate nei componenti. Mantenere la struttura dell'oggetto `AUTH_CONSTANTS` coerentemente organizzata per categorie (ERRORS, ALERT_TITLES, ALERT_MESSAGES, UI_LABELS).
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

/**
 * Constants for authentication-related strings and validation rules
 */

export const AUTH_CONSTANTS = {
  // Validation rules
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 1,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Error messages
  ERRORS: {
    MISSING_FIELDS: 'Completa tutti i campi richiesti e assicurati che la password rispetti i requisiti',
    MISSING_NAMES: 'Per favore, inserisci nome e cognome per completare la registrazione.',
    EMAIL_CHECK_FAILED: "Errore durante la verifica dell'email. Riprova.",
    REGISTRATION_FAILED: 'Registrazione fallita: nessun utente creato',
    UNKNOWN_ERROR: 'Errore sconosciuto',
  },

  // Alert titles
  ALERT_TITLES: {
    MISSING_DATA: 'Dati Mancanti',
    EMAIL_EXISTS: 'Email già registrata',
    REGISTRATION_COMPLETE: 'Registrazione Completata',
    REGISTRATION_ERROR: 'Errore di Registrazione',
  },

  // Alert messages
  ALERT_MESSAGES: {
    EMAIL_EXISTS: 'Questo indirizzo email è già in uso. Prova ad accedere.',
    REGISTRATION_SUCCESS: 'Registrazione completata con successo! Puoi accedere subito.',
    OK_BUTTON: 'OK',
  },

  // UI labels
  UI_LABELS: {
    FIRST_NAME: 'Nome',
    LAST_NAME: 'Cognome',
    EMAIL: 'Email',
    PASSWORD: 'Password',
    SIGNUP_BUTTON: 'Registrati',
    BACK_TO_LOGIN: 'Torna al login',
    HEADER: 'Registrati',
    SUBTITLE: 'Crea il tuo account MyFrigo',
    PLACEHOLDER_FIRST_NAME: 'Il tuo nome',
    PLACEHOLDER_LAST_NAME: 'Il tuo cognome',
    PLACEHOLDER_EMAIL: 'La tua email',
    PLACEHOLDER_PASSWORD: 'La tua password',
  },

  // Password validation labels
  PASSWORD_VALIDATION: {
    MIN_LENGTH: 'Almeno 8 caratteri',
    HAS_UPPER: 'Una lettera maiuscola',
    HAS_LOWER: 'Una lettera minuscola',
    HAS_NUMBER: 'Un numero',
  },

  // Logging tags
  LOG_TAGS: {
    SIGNUP: 'Signup',
  },
} as const;

export type AuthConstants = typeof AUTH_CONSTANTS;
