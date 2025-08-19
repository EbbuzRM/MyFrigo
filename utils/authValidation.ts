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
}

/**
 * Valida una password secondo i criteri di sicurezza
 * @param password La password da validare
 * @returns Oggetto con i risultati della validazione
 */
export function validatePassword(password: string): PasswordValidationResult {
  return {
    minLength: password.length >= 6,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
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
    validation.hasNumber
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