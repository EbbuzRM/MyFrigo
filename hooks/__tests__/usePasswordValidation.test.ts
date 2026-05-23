// usePasswordValidation.test.ts — usePasswordValidation test module.
//
// exports: none
// used_by: none
// rules: none

import { renderHook, act } from '@testing-library/react-native';
import { usePasswordValidation, PasswordValidation } from '../usePasswordValidation';

// --- Test Suite ---
describe('usePasswordValidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty password and invalid state', () => {
      const { result } = renderHook(() => usePasswordValidation());

      expect(result.current.password).toBe('');
      expect(result.current.isPasswordValid).toBe(false);
      expect(result.current.validationProgress).toBe(0);
    });

    it('should have all validation criteria as false initially', () => {
      const { result } = renderHook(() => usePasswordValidation());

      expect(result.current.validation).toEqual({
        minLength: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
      });
    });
  });

  describe('Minimum Length Validation (8 characters)', () => {
    it('should mark minLength as false when password has less than 8 characters', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('Aa12345'); // 7 characters
      });

      expect(result.current.validation.minLength).toBe(false);
    });

    it('should mark minLength as true when password has exactly 8 characters', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('Aa123456'); // 8 characters
      });

      expect(result.current.validation.minLength).toBe(true);
    });

    it('should mark minLength as true when password has more than 8 characters', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('Aa1234567'); // 9 characters
      });

      expect(result.current.validation.minLength).toBe(true);
    });

    it('should mark minLength as false when password is empty', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('');
      });

      expect(result.current.validation.minLength).toBe(false);
    });
  });

  describe('Uppercase Character Validation', () => {
    it('should mark hasUpper as true when password contains uppercase letter', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('Aaaaaaaaa1');
      });

      expect(result.current.validation.hasUpper).toBe(true);
    });

    it('should mark hasUpper as false when password has no uppercase letters', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('aaaaaaaa1');
      });

      expect(result.current.validation.hasUpper).toBe(false);
    });

    it('should mark hasUpper as true when password contains multiple uppercase letters', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('AAAaaa11');
      });

      expect(result.current.validation.hasUpper).toBe(true);
    });
  });

  describe('Lowercase Character Validation', () => {
    it('should mark hasLower as true when password contains lowercase letter', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('AAAAaaa1');
      });

      expect(result.current.validation.hasLower).toBe(true);
    });

    it('should mark hasLower as false when password has no lowercase letters', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('AAAAAAA1');
      });

      expect(result.current.validation.hasLower).toBe(false);
    });

    it('should mark hasLower as true when password contains multiple lowercase letters', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('aaaaAAA1');
      });

      expect(result.current.validation.hasLower).toBe(true);
    });
  });

  describe('Number Validation', () => {
    it('should mark hasNumber as true when password contains a digit', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('Aaaaaaaa1');
      });

      expect(result.current.validation.hasNumber).toBe(true);
    });

    it('should mark hasNumber as false when password has no digits', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('Aaaaaaaa');
      });

      expect(result.current.validation.hasNumber).toBe(false);
    });

    it('should mark hasNumber as true when password contains multiple digits', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('Aa123456');
      });

      expect(result.current.validation.hasNumber).toBe(true);
    });
  });

  describe('Special Characters Handling', () => {
    it('should handle password with only special characters', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('!@#$%^&*');
      });

      expect(result.current.validation).toEqual({
        minLength: true,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
      });
    });

    it('should handle password with special characters and valid criteria', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('Aa123456!@#');
      });

      expect(result.current.isPasswordValid).toBe(true);
    });

    it('should handle password with spaces', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('Aa1 test');
      });

      expect(result.current.validation.minLength).toBe(true);
      expect(result.current.validation.hasUpper).toBe(true);
      expect(result.current.validation.hasLower).toBe(true);
      expect(result.current.validation.hasNumber).toBe(true);
    });
  });

  describe('Valid and Invalid Combinations', () => {
    it('should return false when only minLength is met', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('aaaaaaaa');
      });

      expect(result.current.isPasswordValid).toBe(false);
    });

    it('should return false when only hasUpper is met', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('AAAAAAAA');
      });

      expect(result.current.isPasswordValid).toBe(false);
    });

    it('should return false when only hasLower is met', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('aaaaaaaa');
      });

      expect(result.current.isPasswordValid).toBe(false);
    });

    it('should return false when only hasNumber is met', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('12345678');
      });

      expect(result.current.isPasswordValid).toBe(false);
    });

    it('should return true when all criteria are met', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('Aa123456');
      });

      expect(result.current.isPasswordValid).toBe(true);
    });

    it('should return false when 3 out of 4 criteria are met', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('Aaaaaaaa'); // Missing number
      });

      expect(result.current.isPasswordValid).toBe(false);
    });
  });

  describe('Error Messages and Validation States', () => {
    it('should show partial validation when password is weak', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('abc');
      });

      expect(result.current.validation).toEqual({
        minLength: false,
        hasUpper: false,
        hasLower: true,
        hasNumber: false,
      });
    });

    it('should update validation state on every character change', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('A');
      });
      expect(result.current.validation.hasUpper).toBe(true);

      act(() => {
        result.current.handlePasswordChange('Aa');
      });
      expect(result.current.validation.hasLower).toBe(true);

      act(() => {
        result.current.handlePasswordChange('Aa1');
      });
      expect(result.current.validation.hasNumber).toBe(true);

      act(() => {
        result.current.handlePasswordChange('Aa123456');
      });
      expect(result.current.validation.minLength).toBe(true);
    });
  });

  describe('Validation Progress', () => {
    it('should return 0 when no criteria are met', () => {
      const { result } = renderHook(() => usePasswordValidation());

      expect(result.current.validationProgress).toBe(0);
    });

    it('should return 25 when one criterion is met', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('a');
      });

      expect(result.current.validationProgress).toBe(25);
    });

    it('should return 50 when two criteria are met', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('Aa');
      });

      expect(result.current.validationProgress).toBe(50);
    });

    it('should return 75 when three criteria are met', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('Aa1');
      });

      expect(result.current.validationProgress).toBe(75);
    });

    it('should return 100 when all criteria are met', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('Aa123456');
      });

      expect(result.current.validationProgress).toBe(100);
    });
  });

  describe('setPassword Function', () => {
    it('should set password directly', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.setPassword('DirectSet1');
      });

      expect(result.current.password).toBe('DirectSet1');
    });

    it('should update validation when using setPassword', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.setPassword('Aa123456');
      });

      expect(result.current.validation).toEqual({
        minLength: true,
        hasUpper: true,
        hasLower: true,
        hasNumber: true,
      });
    });

    it('should update isPasswordValid when using setPassword', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.setPassword('Aa123456');
      });

      expect(result.current.isPasswordValid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle unicode characters', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('Àa123456');
      });

      expect(result.current.validation.minLength).toBe(true);
    });

    it('should handle very long passwords', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('Aa1'.repeat(100));
      });

      expect(result.current.isPasswordValid).toBe(true);
    });

    it('should handle password with all criteria met at exactly 8 characters', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('Aa123456');
      });

      expect(result.current.validation).toEqual({
        minLength: true,
        hasUpper: true,
        hasLower: true,
        hasNumber: true,
      });
      expect(result.current.isPasswordValid).toBe(true);
    });

    it('should handle password change from valid to invalid', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('Aa123456');
      });
      expect(result.current.isPasswordValid).toBe(true);

      act(() => {
        result.current.handlePasswordChange('short');
      });
      expect(result.current.isPasswordValid).toBe(false);
    });

    it('should handle password change from invalid to valid', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('short');
      });
      expect(result.current.isPasswordValid).toBe(false);

      act(() => {
        result.current.handlePasswordChange('Aa123456');
      });
      expect(result.current.isPasswordValid).toBe(true);
    });
  });

  describe('Handle Password Change', () => {
    it('should update password state', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('Test123');
      });

      expect(result.current.password).toBe('Test123');
    });

    it('should update validation state', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('Test123');
      });

      expect(result.current.validation).toEqual({
        minLength: false, // 7 chars
        hasUpper: true,
        hasLower: true,
        hasNumber: true,
      });
    });

    it('should handle empty string', () => {
      const { result } = renderHook(() => usePasswordValidation());

      act(() => {
        result.current.handlePasswordChange('');
      });

      expect(result.current.password).toBe('');
      expect(result.current.validation).toEqual({
        minLength: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
      });
    });
  });

  describe('isPasswordValid', () => {
    it('should return false when password is empty', () => {
      const { result } = renderHook(() => usePasswordValidation());

      expect(result.current.isPasswordValid).toBe(false);
    });

    it('should return true only when all 4 criteria are satisfied', () => {
      const { result } = renderHook(() => usePasswordValidation());

      // Test each criterion individually
      act(() => {
        result.current.handlePasswordChange('Aa123456');
      });
      expect(result.current.isPasswordValid).toBe(true);

      // Remove uppercase
      act(() => {
        result.current.handlePasswordChange('aa123456');
      });
      expect(result.current.isPasswordValid).toBe(false);

      // Remove lowercase
      act(() => {
        result.current.handlePasswordChange('AA123456');
      });
      expect(result.current.isPasswordValid).toBe(false);

      // Remove number
      act(() => {
        result.current.handlePasswordChange('Aaaaaaaa');
      });
      expect(result.current.isPasswordValid).toBe(false);

      // Remove length
      act(() => {
        result.current.handlePasswordChange('Aa1');
      });
      expect(result.current.isPasswordValid).toBe(false);
    });
  });
});
