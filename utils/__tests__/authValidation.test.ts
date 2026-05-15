import { validatePassword, isPasswordValid, validateEmail } from '../authValidation';

describe('authValidation', () => {
  describe('validatePassword', () => {
    it('should validate minLength (8 characters minimum)', () => {
      expect(validatePassword('1234567').minLength).toBe(false);
      expect(validatePassword('12345678').minLength).toBe(true);
    });

    it('should validate hasUpper', () => {
      expect(validatePassword('abc').hasUpper).toBe(false);
      expect(validatePassword('Abc').hasUpper).toBe(true);
    });

    it('should validate hasLower', () => {
      expect(validatePassword('ABC').hasLower).toBe(false);
      expect(validatePassword('aBC').hasLower).toBe(true);
    });

    it('should validate hasNumber', () => {
      expect(validatePassword('abc').hasNumber).toBe(false);
      expect(validatePassword('abc1').hasNumber).toBe(true);
    });

    it('should validate isNotCommon', () => {
      expect(validatePassword('password').isNotCommon).toBe(false);
      expect(validatePassword('PASSWORD').isNotCommon).toBe(false);
      expect(validatePassword('12345678').isNotCommon).toBe(false);
      expect(validatePassword('qwerty12').isNotCommon).toBe(false);
      expect(validatePassword('MyStr0ngP@ss').isNotCommon).toBe(true);
    });
  });

  describe('isPasswordValid', () => {
    it('should return true only if all criteria are met', () => {
      expect(isPasswordValid('Abc12345')).toBe(true);
      expect(isPasswordValid('abc12345')).toBe(false); // No upper
      expect(isPasswordValid('ABC12345')).toBe(false); // No lower
      expect(isPasswordValid('Abcdefgh')).toBe(false); // No number
      expect(isPasswordValid('Ab1')).toBe(false);      // Too short
      expect(isPasswordValid('Abc123')).toBe(false);   // Too short (needs 8)
    });

    it('should reject common passwords', () => {
      expect(isPasswordValid('Password1')).toBe(false); // common
      expect(isPasswordValid('Qwerty12')).toBe(false);  // common
      expect(isPasswordValid('12345678')).toBe(false);  // common (no upper/lower anyway)
    });
  });

  describe('validateEmail', () => {
    it('should validate email format', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('test.name@example.co.uk')).toBe(true);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });
  });
});
