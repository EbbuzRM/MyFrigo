import { TestRunner } from '../TestRunner';
import { AuthTests } from '../AuthTests';
import { DatabaseTests } from '../DatabaseTests';
import { PerformanceTests } from '../PerformanceTests';
import { SystemTests } from '../SystemTests';

// Mock delle dipendenze
jest.mock('../AuthTests');
jest.mock('../DatabaseTests');
jest.mock('../PerformanceTests');
jest.mock('../SystemTests');
jest.mock('@/services/LoggingService');

describe('TestRunner', () => {
  let testRunner: TestRunner;
  let mockCallbacks: any;

  beforeEach(() => {
    testRunner = new TestRunner();
    mockCallbacks = {
      onTestStart: jest.fn(),
      onTestComplete: jest.fn(),
      onAllTestsComplete: jest.fn(),
      onError: jest.fn(),
    };
    testRunner.setCallbacks(mockCallbacks);
    jest.clearAllMocks();
  });

  describe('runTest', () => {
    it('should run auth test successfully', async () => {
      const mockTest = {
        id: 'auth-logging',
        name: 'Test Sistema Logging Autenticazione',
        category: 'auth' as const,
        run: jest.fn(),
      };

      const mockResult = {
        testId: 'auth-logging',
        success: true,
        duration: 100,
        data: { test: 'data' },
      };

      (AuthTests.runAuthLoggingTest as jest.Mock).mockResolvedValue(mockResult);

      const result = await testRunner.runTest(mockTest);

      expect(mockCallbacks.onTestStart).toHaveBeenCalledWith('auth-logging');
      expect(AuthTests.runAuthLoggingTest).toHaveBeenCalled();
      expect(mockCallbacks.onTestComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          testId: 'auth-logging',
          success: true,
          category: 'auth',
        })
      );
      expect(result).toEqual(
        expect.objectContaining({
          testId: 'auth-logging',
          success: true,
          category: 'auth',
        })
      );
    });

    it('should handle test errors correctly', async () => {
      const mockTest = {
        id: 'auth-logging',
        name: 'Test Sistema Logging Autenticazione',
        category: 'auth' as const,
        run: jest.fn(),
      };

      const mockError = new Error('Test error');
      (AuthTests.runAuthLoggingTest as jest.Mock).mockRejectedValue(mockError);

      const result = await testRunner.runTest(mockTest);

      expect(mockCallbacks.onTestStart).toHaveBeenCalledWith('auth-logging');
      expect(mockCallbacks.onError).toHaveBeenCalledWith(mockError);
      expect(mockCallbacks.onTestComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          testId: 'auth-logging',
          success: false,
          error: expect.any(String),
        })
      );
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should handle unknown test category', async () => {
      const mockTest = {
        id: 'unknown-test',
        name: 'Test Sconosciuto',
        category: 'unknown' as any,
        run: jest.fn(),
      };

      const result = await testRunner.runTest(mockTest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Categoria test non riconosciuta');
    });
  });

  describe('runTestsSequentially', () => {
    it('should run multiple tests in sequence', async () => {
      const mockTests = [
        {
          id: 'auth-logging',
          name: 'Test Auth',
          category: 'auth' as const,
          run: jest.fn(),
        },
        {
          id: 'database-connectivity',
          name: 'Test Database',
          category: 'database' as const,
          run: jest.fn(),
        },
      ];

      const mockResults = [
        { testId: 'auth-logging', success: true, duration: 100 },
        { testId: 'database-connectivity', success: true, duration: 150 },
      ];

      (AuthTests.runAuthLoggingTest as jest.Mock).mockResolvedValue(mockResults[0]);
      (DatabaseTests.runDatabaseConnectivityTest as jest.Mock).mockResolvedValue(mockResults[1]);

      const results = await testRunner.runTestsSequentially(mockTests, 100);

      expect(results).toHaveLength(2);
      expect(mockCallbacks.onAllTestsComplete).toHaveBeenCalledWith(results);
    });

    it('should handle delays between tests', async () => {
      const mockTests = [
        {
          id: 'test1',
          name: 'Test 1',
          category: 'auth' as const,
          run: jest.fn(),
        },
        {
          id: 'test2',
          name: 'Test 2',
          category: 'auth' as const,
          run: jest.fn(),
        },
      ];

      (AuthTests.runAuthLoggingTest as jest.Mock)
        .mockResolvedValueOnce({ testId: 'test1', success: true, duration: 100 })
        .mockResolvedValueOnce({ testId: 'test2', success: true, duration: 100 });

      const startTime = Date.now();
      await testRunner.runTestsSequentially(mockTests, 200);
      const endTime = Date.now();

      // Dovrebbe aver atteso almeno 200ms tra i test
      expect(endTime - startTime).toBeGreaterThanOrEqual(200);
    });
  });

  describe('runTestsByCategory', () => {
    it('should filter and run tests by category', async () => {
      const mockTests = [
        {
          id: 'auth1',
          name: 'Auth Test 1',
          category: 'auth' as const,
          run: jest.fn(),
        },
        {
          id: 'auth2',
          name: 'Auth Test 2',
          category: 'auth' as const,
          run: jest.fn(),
        },
        {
          id: 'db1',
          name: 'Database Test 1',
          category: 'database' as const,
          run: jest.fn(),
        },
      ];

      const mockResult = { testId: 'auth1', success: true, duration: 100 };
      (AuthTests.runAuthLoggingTest as jest.Mock).mockResolvedValue(mockResult);

      const results = await testRunner.runTestsByCategory(mockTests, 'auth');

      expect(results).toHaveLength(2);
      expect(AuthTests.runAuthLoggingTest).toHaveBeenCalledTimes(2);
    });
  });

  describe('runAllTests', () => {
    it('should run all tests organized by category', async () => {
      const mockTests = [
        { id: 'auth1', name: 'Auth 1', category: 'auth' as const, run: jest.fn() },
        { id: 'db1', name: 'DB 1', category: 'database' as const, run: jest.fn() },
        { id: 'perf1', name: 'Perf 1', category: 'performance' as const, run: jest.fn() },
        { id: 'sys1', name: 'Sys 1', category: 'system' as const, run: jest.fn() },
      ];

      const mockResults = [
        { testId: 'auth1', success: true, duration: 100 },
        { testId: 'db1', success: true, duration: 100 },
        { testId: 'perf1', success: true, duration: 100 },
        { testId: 'sys1', success: true, duration: 100 },
      ];

      (AuthTests.runAuthLoggingTest as jest.Mock).mockResolvedValue(mockResults[0]);
      (DatabaseTests.runDatabaseConnectivityTest as jest.Mock).mockResolvedValue(mockResults[1]);
      (PerformanceTests.runApiPerformanceTest as jest.Mock).mockResolvedValue(mockResults[2]);
      (SystemTests.runSystemHealthTest as jest.Mock).mockResolvedValue(mockResults[3]);

      const results = await testRunner.runAllTests(mockTests);

      expect(results).toHaveLength(4);
      expect(mockCallbacks.onAllTestsComplete).toHaveBeenCalledWith(results);
    });
  });
});