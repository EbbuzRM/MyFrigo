import { AuthTests } from '../AuthTests';
import { authLogger } from '@/utils/AuthLogger';

// Mock delle dipendenze
jest.mock('@/services/LoggingService');
jest.mock('@/utils/AuthLogger');
jest.mock('@/utils/FormStateLogger');
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
      expect(result.duration).toBeGreaterThan(0);
      expect(result.data).toHaveProperty('comparison');
      expect(result.data).toHaveProperty('summary');
    });
  });
});