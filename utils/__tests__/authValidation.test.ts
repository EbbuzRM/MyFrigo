import { validatePassword, isPasswordValid, validateEmail } from '../authValidation';

describe('authValidation', () => {
  describe('validatePassword', () => {
    it('should validate minLength', () => {
      expect(validatePassword('12345').minLength).toBe(false);
      expect(validatePassword('123456').minLength).toBe(true);
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
  });

  describe('isPasswordValid', () => {
    it('should return true only if all criteria are met', () => {
      expect(isPasswordValid('Abc123')).toBe(true);
      expect(isPasswordValid('abc123')).toBe(false); // No upper
      expect(isPasswordValid('ABC123')).toBe(false); // No lower
      expect(isPasswordValid('Abcdef')).toBe(false); // No number
      expect(isPasswordValid('Ab1')).toBe(false);    // Too short
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
