// useRegistration.test.ts — useRegistration test module.
//
// exports: none
// used_by: none
// rules: none

import { renderHook, act } from '@testing-library/react-native';
import { useRegistration } from '../useRegistration';
import type { RegistrationData, RegistrationResult } from '../useRegistration.types';

// Mock all sub-hooks used by useRegistration
jest.mock('../useRegistrationState', () => ({
  useRegistrationState: jest.fn(),
}));

jest.mock('../usePostRegistration', () => ({
  usePostRegistration: jest.fn(),
}));

jest.mock('../useRegistrationOrchestrator', () => ({
  useRegistrationOrchestrator: jest.fn(),
}));

jest.mock('../useRegistrationActions', () => ({
  useEmailCheck: jest.fn(),
  useUserProfileCreation: jest.fn(),
  useAccountCreation: jest.fn(),
}));

// Import mocked modules
const {
  useRegistrationState,
} = require('../useRegistrationState');
const {
  usePostRegistration,
} = require('../usePostRegistration');
const {
  useRegistrationOrchestrator,
} = require('../useRegistrationOrchestrator');
const {
  useEmailCheck,
  useUserProfileCreation,
  useAccountCreation,
} = require('../useRegistrationActions');

describe('useRegistration', () => {
  const mockRegistrationData: RegistrationData = {
    email: 'test@example.com',
    password: 'TestPass123!',
    firstName: 'Mario',
    lastName: 'Rossi',
  };

  const mockRegistrationResult: RegistrationResult = {
    success: true,
    userId: 'user-123',
    emailConfirmed: true,
  };

  const mockState = {
    isLoading: false,
    error: null,
    registrationComplete: false,
    setLoading: jest.fn(),
    setError: jest.fn(),
    setComplete: jest.fn(),
    reset: jest.fn(),
    handleError: jest.fn(),
  };

  const mockRegister = jest.fn();
  const mockCheckEmail = jest.fn();
  const mockCreateAccount = jest.fn();
  const mockHandlePostRegistration = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnEmailNeedsConfirmation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    (useRegistrationState as jest.Mock).mockReturnValue(mockState);
    (useEmailCheck as jest.Mock).mockReturnValue(mockCheckEmail);
    (useUserProfileCreation as jest.Mock).mockReturnValue(jest.fn());
    (useAccountCreation as jest.Mock).mockReturnValue(mockCreateAccount);
    (useRegistrationOrchestrator as jest.Mock).mockReturnValue(mockRegister);
    (usePostRegistration as jest.Mock).mockReturnValue(mockHandlePostRegistration);
  });

  describe('Initialization', () => {
    it('should initialize all sub-hooks correctly', () => {
      const { result } = renderHook(() =>
        useRegistration(mockOnSuccess, mockOnEmailNeedsConfirmation)
      );

      // Verify all sub-hooks were called
      expect(useRegistrationState).toHaveBeenCalled();
      expect(useEmailCheck).toHaveBeenCalled();
      expect(useUserProfileCreation).toHaveBeenCalled();
      expect(useAccountCreation).toHaveBeenCalled();
      expect(useRegistrationOrchestrator).toHaveBeenCalledWith(
        mockCheckEmail,
        mockCreateAccount,
        mockState
      );
      expect(usePostRegistration).toHaveBeenCalled();

      // Verify returned interface
      expect(result.current.register).toBe(mockRegister);
      expect(result.current.checkEmailExists).toBe(mockCheckEmail);
      expect(result.current.createUserAccount).toBe(mockCreateAccount);
      expect(result.current.handlePostRegistration).toBe(mockHandlePostRegistration);
    });

    it('should expose state values', () => {
      const customState = {
        ...mockState,
        isLoading: true,
        error: 'Something went wrong',
        registrationComplete: false,
      };
      (useRegistrationState as jest.Mock).mockReturnValue(customState);

      const { result } = renderHook(() =>
        useRegistration(mockOnSuccess, mockOnEmailNeedsConfirmation)
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe('Something went wrong');
      expect(result.current.registrationComplete).toBe(false);
    });

    it('should expose all required functions', () => {
      const { result } = renderHook(() =>
        useRegistration(mockOnSuccess, mockOnEmailNeedsConfirmation)
      );

      expect(typeof result.current.register).toBe('function');
      expect(typeof result.current.checkEmailExists).toBe('function');
      expect(typeof result.current.createUserAccount).toBe('function');
      expect(typeof result.current.handlePostRegistration).toBe('function');
      expect(typeof result.current.resetError).toBe('function');
    });
  });

  describe('register', () => {
    it('should delegate to register orchestrator', async () => {
      mockRegister.mockResolvedValueOnce(mockRegistrationResult);

      const { result } = renderHook(() =>
        useRegistration(mockOnSuccess, mockOnEmailNeedsConfirmation)
      );

      let res: RegistrationResult;
      await act(async () => {
        res = await result.current.register(mockRegistrationData);
      });

      expect(mockRegister).toHaveBeenCalledWith(mockRegistrationData);
      expect(res!).toEqual(mockRegistrationResult);
    });

    it('should handle registration errors', async () => {
      const errorResult: RegistrationResult = { success: false, error: 'Email already exists' };
      mockRegister.mockResolvedValueOnce(errorResult);

      const { result } = renderHook(() =>
        useRegistration(mockOnSuccess, mockOnEmailNeedsConfirmation)
      );

      let res: RegistrationResult;
      await act(async () => {
        res = await result.current.register(mockRegistrationData);
      });

      expect(res!).toEqual(errorResult);
    });
  });

  describe('checkEmailExists', () => {
    it('should check if email exists', async () => {
      mockCheckEmail.mockResolvedValueOnce(false);

      const { result } = renderHook(() =>
        useRegistration(mockOnSuccess, mockOnEmailNeedsConfirmation)
      );

      let exists: boolean;
      await act(async () => {
        exists = await result.current.checkEmailExists('test@example.com');
      });

      expect(mockCheckEmail).toHaveBeenCalledWith('test@example.com');
      expect(exists!).toBe(false);
    });

    it('should return true when email already exists', async () => {
      mockCheckEmail.mockResolvedValueOnce(true);

      const { result } = renderHook(() =>
        useRegistration(mockOnSuccess, mockOnEmailNeedsConfirmation)
      );

      let exists: boolean;
      await act(async () => {
        exists = await result.current.checkEmailExists('existing@example.com');
      });

      expect(exists!).toBe(true);
    });
  });

  describe('handlePostRegistration', () => {
    it('should delegate to post-registration handler', () => {
      const { result } = renderHook(() =>
        useRegistration(mockOnSuccess, mockOnEmailNeedsConfirmation)
      );

      act(() => {
        result.current.handlePostRegistration(mockRegistrationResult, 'test@example.com');
      });

      expect(mockHandlePostRegistration).toHaveBeenCalledWith(
        mockRegistrationResult,
        'test@example.com'
      );
    });
  });

  describe('resetError', () => {
    it('should call setError(null)', () => {
      const { result } = renderHook(() =>
        useRegistration(mockOnSuccess, mockOnEmailNeedsConfirmation)
      );

      act(() => {
        result.current.resetError();
      });

      expect(mockState.setError).toHaveBeenCalledWith(null);
    });
  });

  describe('createUserAccount', () => {
    it('should delegate to account creation', async () => {
      mockCreateAccount.mockResolvedValueOnce(mockRegistrationResult);

      const { result } = renderHook(() =>
        useRegistration(mockOnSuccess, mockOnEmailNeedsConfirmation)
      );

      let res: RegistrationResult;
      await act(async () => {
        res = await result.current.createUserAccount(mockRegistrationData);
      });

      expect(mockCreateAccount).toHaveBeenCalledWith(mockRegistrationData);
      expect(res!).toEqual(mockRegistrationResult);
    });
  });
});
