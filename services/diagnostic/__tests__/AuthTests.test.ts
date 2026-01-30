import { AuthTests } from '../AuthTests';
import { authLogger } from '@/utils/AuthLogger';
import { formStateLogger } from '@/utils/FormStateLogger';

// Mock delle dipendenze
jest.mock('@/services/LoggingService');
jest.mock('@/utils/AuthLogger', () => ({
  authLogger: {
    startAuth: jest.fn(),
    startStep: jest.fn(),
    endStep: jest.fn(),
    completeAuth: jest.fn(),
    getAuthSummary: jest.fn(() => ({
      isComplete: true,
      totalDuration: 100,
      totalSteps: 2,
      successSteps: 2,
      errorSteps: 0,
      pendingSteps: 0,
      slowestSteps: [],
      timeline: []
    })),
  },
}));
jest.mock('@/utils/FormStateLogger', () => ({
  formStateLogger: {
    logNavigation: jest.fn(),
    saveFormState: jest.fn(),
    getFormState: jest.fn(() => ({
      name: 'Prodotto di test',
      brand: 'Marca di test',
      quantity: '2',
      unit: 'pz',
      notes: 'Note modificate'
    })),
    compareStates: jest.fn(() => ({
      hasDifferences: true,
      differences: [{ key: 'quantity', oldValue: '1', newValue: '2' }]
    })),
    getStateSummary: jest.fn(() => ({
      navigationHistoryLength: 1,
      lastNavigation: { action: 'TEST_NAVIGATION', from: 'screen-a', to: 'screen-b' },
      formStates: { 'test-form-1': { timestamp: Date.now(), dataKeys: ['name', 'brand', 'quantity', 'unit', 'notes'] } }
    })),
  },
}));
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe('AuthTests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('runAuthLoggingTest', () => {
    it('should return success result when auth logger works correctly', async () => {
      const result = await AuthTests.runAuthLoggingTest();

      expect(result).toEqual({
        testId: 'auth-logging',
        success: true,
        duration: expect.any(Number),
        data: expect.any(Object),
      });
    });

    it('should return error result when auth logger throws', async () => {
      const mockError = new Error('Test error');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (authLogger.startAuth as jest.Mock).mockImplementationOnce(() => {
        throw mockError;
      });

      const result = await AuthTests.runAuthLoggingTest();

      expect(result).toEqual({
        testId: 'auth-logging',
        success: false,
        duration: expect.any(Number),
        error: expect.any(String),
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('runFormStateLoggingTest', () => {
    it('should return success result when form state logger works correctly', async () => {
      const result = await AuthTests.runFormStateLoggingTest();

      expect(result).toEqual({
        testId: 'form-logging',
        success: true,
        duration: expect.any(Number),
        data: expect.any(Object),
      });
    });

    it('should handle form state operations correctly', async () => {
      const result = await AuthTests.runFormStateLoggingTest();

      expect(result.success).toBe(true);
      expect(result.testId).toBe('form-logging');
      expect(result.duration).toEqual(expect.any(Number));
      expect(result.data).toHaveProperty('comparison');
      expect(result.data).toHaveProperty('summary');
    });
  });
});