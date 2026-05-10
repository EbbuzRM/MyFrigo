// ProfileValidator.test.ts — ProfileValidator test module.
//
// exports: none
// used_by: none
// rules:   none

import { isDefaultProfile, isValidProfile, getProfileValidationDetails } from '../ProfileValidator';
import { LoggingService } from '../../services/LoggingService';

jest.mock('../../services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
  },
}));

describe('ProfileValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────
  //  isDefaultProfile
  // ─────────────────────────────────────────────
  describe('isDefaultProfile', () => {
    // ── firstName matches default ──
    it('returns true when firstName is "Utente"', () => {
      expect(isDefaultProfile('Utente', 'Rossi')).toBe(true);
    });

    it('returns true when firstName is "User"', () => {
      expect(isDefaultProfile('User', 'Rossi')).toBe(true);
    });

    it('returns true when firstName is empty string', () => {
      expect(isDefaultProfile('', 'Rossi')).toBe(true);
    });

    // ── lastName matches default ──
    it('returns true when lastName is "Anonimo"', () => {
      expect(isDefaultProfile('Mario', 'Anonimo')).toBe(true);
    });

    it('returns true when lastName is "Anonymous"', () => {
      expect(isDefaultProfile('Mario', 'Anonymous')).toBe(true);
    });

    it('returns true when lastName is empty string', () => {
      expect(isDefaultProfile('Mario', '')).toBe(true);
    });

    // ── both null / missing ──
    it('returns true when both firstName and lastName are null', () => {
      expect(isDefaultProfile(null, null)).toBe(true);
    });

    it('returns true when firstName is null and lastName is empty', () => {
      expect(isDefaultProfile(null, '')).toBe(true);
    });

    it('returns true when firstName is empty and lastName is null', () => {
      expect(isDefaultProfile('', null)).toBe(true);
    });

    // ── default firstName + default lastName ──
    it('returns true when both firstName and lastName are default values', () => {
      expect(isDefaultProfile('Utente', 'Anonimo')).toBe(true);
    });

    // ── valid non-default names ──
    it('returns false when both firstName and lastName are valid', () => {
      expect(isDefaultProfile('Mario', 'Rossi')).toBe(false);
    });

    it('returns false when names contain special characters', () => {
      expect(isDefaultProfile('José', 'Müller')).toBe(false);
    });

    it('returns false when names contain numbers', () => {
      expect(isDefaultProfile('User123', 'Test456')).toBe(false);
    });

    it('returns false when names have leading/trailing spaces', () => {
      expect(isDefaultProfile(' Mario', 'Rossi ')).toBe(false);
    });

    // ── case sensitivity ──
    it('returns false when firstName is "utente" (lowercase)', () => {
      expect(isDefaultProfile('utente', 'Rossi')).toBe(false);
    });

    it('returns false when lastName is "anonimo" (lowercase)', () => {
      expect(isDefaultProfile('Mario', 'anonimo')).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  //  isValidProfile
  // ─────────────────────────────────────────────
  describe('isValidProfile', () => {
    it('returns true when profile has valid names', () => {
      expect(isValidProfile('Mario', 'Rossi')).toBe(true);
    });

    it('returns false when firstName is "Utente"', () => {
      expect(isValidProfile('Utente', 'Rossi')).toBe(false);
    });

    it('returns false when firstName is "User"', () => {
      expect(isValidProfile('User', 'Rossi')).toBe(false);
    });

    it('returns false when lastName is "Anonimo"', () => {
      expect(isValidProfile('Mario', 'Anonimo')).toBe(false);
    });

    it('returns false when lastName is "Anonymous"', () => {
      expect(isValidProfile('Mario', 'Anonymous')).toBe(false);
    });

    it('returns false when both names are null', () => {
      expect(isValidProfile(null, null)).toBe(false);
    });

    it('returns false when both names are empty strings', () => {
      expect(isValidProfile('', '')).toBe(false);
    });

    it('returns false when default profile "Utente / Anonimo"', () => {
      expect(isValidProfile('Utente', 'Anonimo')).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  //  getProfileValidationDetails
  // ─────────────────────────────────────────────
  describe('getProfileValidationDetails', () => {
    // ── valid profile ──
    it('returns isValid=true, isDefault=false, empty missingFields for valid profile', () => {
      const result = getProfileValidationDetails('Mario', 'Rossi');
      expect(result).toEqual({
        isValid: true,
        isDefault: false,
        missingFields: [],
      });
    });

    // ── default firstName only ──
    it('flags first_name as missing when firstName is "Utente"', () => {
      const result = getProfileValidationDetails('Utente', 'Rossi');
      expect(result.isValid).toBe(false);
      expect(result.isDefault).toBe(true);
      expect(result.missingFields).toContain('first_name');
      expect(result.missingFields).not.toContain('last_name');
    });

    it('flags first_name as missing when firstName is "User"', () => {
      const result = getProfileValidationDetails('User', 'Rossi');
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('first_name');
    });

    it('flags first_name as missing when firstName is empty string', () => {
      const result = getProfileValidationDetails('', 'Rossi');
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('first_name');
    });

    // ── default lastName only ──
    it('flags last_name as missing when lastName is "Anonimo"', () => {
      const result = getProfileValidationDetails('Mario', 'Anonimo');
      expect(result.isValid).toBe(false);
      expect(result.isDefault).toBe(true);
      expect(result.missingFields).toContain('last_name');
      expect(result.missingFields).not.toContain('first_name');
    });

    it('flags last_name as missing when lastName is "Anonymous"', () => {
      const result = getProfileValidationDetails('Mario', 'Anonymous');
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('last_name');
    });

    it('flags last_name as missing when lastName is empty string', () => {
      const result = getProfileValidationDetails('Mario', '');
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('last_name');
    });

    // ── null fields ──
    it('flags both fields as missing when both are null', () => {
      const result = getProfileValidationDetails(null, null);
      expect(result.isValid).toBe(false);
      expect(result.isDefault).toBe(true);
      expect(result.missingFields).toEqual(['first_name', 'last_name']);
    });

    it('flags first_name when firstName is null and lastName is valid', () => {
      const result = getProfileValidationDetails(null, 'Rossi');
      expect(result.missingFields).toEqual(['first_name']);
    });

    it('flags last_name when firstName is valid and lastName is null', () => {
      const result = getProfileValidationDetails('Mario', null);
      expect(result.missingFields).toEqual(['last_name']);
    });

    // ── both default ──
    it('flags both fields when both are default values', () => {
      const result = getProfileValidationDetails('Utente', 'Anonimo');
      expect(result.isValid).toBe(false);
      expect(result.isDefault).toBe(true);
      expect(result.missingFields).toEqual(['first_name', 'last_name']);
    });

    // ── empty strings for both ──
    it('flags both fields when both are empty strings', () => {
      const result = getProfileValidationDetails('', '');
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toEqual(['first_name', 'last_name']);
    });

    // ── mixed default + valid ──
    it('flags only first_name when firstName is default and lastName is valid', () => {
      const result = getProfileValidationDetails('User', 'Bianchi');
      expect(result.missingFields).toEqual(['first_name']);
    });

    it('flags only last_name when firstName is valid and lastName is default', () => {
      const result = getProfileValidationDetails('Luca', 'Anonymous');
      expect(result.missingFields).toEqual(['last_name']);
    });
  });
});