// authValidation.ts — authValidation module.
//
// exports: PasswordValidationResult | validatePassword | isPasswordValid | validateEmail
// used_by: app\password-reset-form.tsx
//         hooks\useSignupValidation.ts
//         hooks\useSignupValidation.types.ts
//         hooks\useSignupValidators.ts
// rules:   - Password validation must always check all four criteria (length, uppercase, lowercase, digits) simultaneously, never allow partial validation
//          - Email validation must use the defined regex pattern and cannot be modified without explicit architectural approval
//          - All validation functions must remain pure, synchronous, and side-effect free
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

/**
 * Funzioni di utilità per la validazione dell'autenticazione
 */

/**
 * Interfaccia per i risultati della validazione della password
 */
export interface PasswordValidationResult {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  isNotCommon: boolean;
}

/**
 * Lista di password comuni da bloccare per prevenire attacchi dizionario.
 */
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123',
  '12345678', '123456789', '1234567890',
  'qwerty12', 'qwerty', 'qwerty123',
  'abc123', 'letmein', 'welcome',
  'admin', 'login', 'master',
  'hello', 'charlie', 'donald',
  'iloveyou', 'trustno1', 'sunshine',
  'princess', 'football', 'shadow',
  'monkey', 'dragon', 'access',
]);

/**
 * Valida una password secondo i criteri di sicurezza
 * @param password La password da validare
 * @returns Oggetto con i risultati della validazione
 */
export function validatePassword(password: string): PasswordValidationResult {
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    isNotCommon: !COMMON_PASSWORDS.has(password.toLowerCase()),
  };
}

/**
 * Verifica se una password soddisfa tutti i criteri di sicurezza
 * @param password La password da verificare
 * @returns true se la password è valida, false altrimenti
 */
export function isPasswordValid(password: string): boolean {
  const validation = validatePassword(password);
  return (
    validation.minLength &&
    validation.hasUpper &&
    validation.hasLower &&
    validation.hasNumber &&
    validation.isNotCommon
  );
}

/**
 * Valida un indirizzo email
 * @param email L'indirizzo email da validare
 * @returns true se l'email è valida, false altrimenti
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}