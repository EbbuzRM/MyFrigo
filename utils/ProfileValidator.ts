// ProfileValidator.ts — ProfileValidator module.
//
// exports: isDefaultProfile | isValidProfile | getProfileValidationDetails
// used_by: utils\GoogleAuthRetryManager.ts
// rules:   Avoid importing external dependencies or adding side effects; keep the module as a pure utility with no imports from other modules.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

/**
 * Profile validation utilities
 * @module utils/ProfileValidator
 */

const DEFAULT_FIRST_NAMES = ['Utente', 'User', ''];
const DEFAULT_LAST_NAMES = ['Anonimo', 'Anonymous', ''];

/**
 * Validates if a profile has default/problematic values
 */
export function isDefaultProfile(firstName: string | null, lastName: string | null): boolean {
  return (
    DEFAULT_FIRST_NAMES.includes(firstName || '') ||
    DEFAULT_LAST_NAMES.includes(lastName || '') ||
    (!firstName && !lastName)
  );
}

/**
 * Checks if a profile is complete and valid
 */
export function isValidProfile(firstName: string | null, lastName: string | null): boolean {
  return !isDefaultProfile(firstName, lastName);
}

/**
 * Gets validation details for a profile
 */
export function getProfileValidationDetails(firstName: string | null, lastName: string | null): {
  isValid: boolean;
  isDefault: boolean;
  missingFields: string[];
} {
  const isDefault = isDefaultProfile(firstName, lastName);
  const missingFields: string[] = [];

  if (!firstName || DEFAULT_FIRST_NAMES.includes(firstName)) {
    missingFields.push('first_name');
  }
  if (!lastName || DEFAULT_LAST_NAMES.includes(lastName)) {
    missingFields.push('last_name');
  }

  return {
    isValid: !isDefault,
    isDefault,
    missingFields
  };
}
