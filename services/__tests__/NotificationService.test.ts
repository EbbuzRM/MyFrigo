import { NotificationService } from '../NotificationService';

// Mock dependencies
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj['ios'] || obj.default),
  },
}));
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      oneSignalAppId: 'test-app-id',
    },
  },
}));
jest.mock('../LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));
jest.mock('../EventEmitter', () => ({
  EventEmitter: jest.fn(),
  eventEmitter: {},
}));
jest.mock('../NotificationPermissionService', () => ({
  NotificationPermissionService: {
    getOrRequestPermissionsAsync: jest.fn(),
    checkExpoNotificationsAvailability: jest.fn(),
  },
}));
jest.mock('../NotificationCoreService', () => ({
  NotificationCoreService: {
    scheduleTestNotification: jest.fn(),
  },
}));
jest.mock('../OneSignalService', () => ({
  OneSignalService: {
    initialize: jest.fn(),
    requestPermission: jest.fn(),
  },
}));

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset static properties
    (NotificationService as any).isInitialized = false;
    // Reset Platform.OS to default
    require('react-native').Platform.OS = 'ios';
    // Set default mock implementations (clearAllMocks may clear them)
    require('../OneSignalService').OneSignalService.initialize.mockResolvedValue(undefined);
    require('../OneSignalService').OneSignalService.requestPermission.mockResolvedValue(undefined);
  });

  describe('initialize', () => {
    it('should not initialize on web platform', async () => {
      const PlatformMock = require('react-native').Platform;
      PlatformMock.OS = 'web';

      await NotificationService.initialize();

      // Should not call OneSignalService at all
      expect(require('../OneSignalService').OneSignalService.initialize).not.toHaveBeenCalled();
      expect(require('../OneSignalService').OneSignalService.requestPermission).not.toHaveBeenCalled();
    });

    it('should initialize OneSignalService successfully', async () => {
      const PlatformMock = require('react-native').Platform;
      PlatformMock.OS = 'android';

      await NotificationService.initialize();

      // Should delegate to OneSignalService
      expect(require('../OneSignalService').OneSignalService.initialize).toHaveBeenCalledTimes(1);
      expect(require('../OneSignalService').OneSignalService.requestPermission).toHaveBeenCalledTimes(1);

      // Should mark as initialized
      expect((NotificationService as any).isInitialized).toBe(true);

      // Should log success
      expect(require('../LoggingService').LoggingService.info).toHaveBeenCalledWith(
        'NotificationService',
        'OneSignal SDK initialized successfully via OneSignalService.'
      );
    });

    it('should handle OneSignalService initialization error', async () => {
      const PlatformMock = require('react-native').Platform;
      PlatformMock.OS = 'android';

      const mockError = new Error('OneSignal initialization failed');
      require('../OneSignalService').OneSignalService.initialize.mockRejectedValue(mockError);

      await NotificationService.initialize();

      // Should log error
      expect(require('../LoggingService').LoggingService.error).toHaveBeenCalledWith(
        'NotificationService',
        'Error initializing OneSignal:',
        mockError
      );

      // Should not mark as initialized
      expect((NotificationService as any).isInitialized).toBe(false);
    });

    it('should handle missing OneSignal App ID', async () => {
      const PlatformMock = require('react-native').Platform;
      PlatformMock.OS = 'android';

      // Mock missing app ID
      const constantsMock = require('expo-constants');
      const originalAppId = constantsMock.expoConfig.extra.oneSignalAppId;
      constantsMock.expoConfig.extra.oneSignalAppId = undefined;

      await NotificationService.initialize();

      // Restore for other tests
      constantsMock.expoConfig.extra.oneSignalAppId = originalAppId;

      // Should log error
      expect(require('../LoggingService').LoggingService.error).toHaveBeenCalledWith(
        'NotificationService',
        'FATAL: OneSignal App ID not found in app.json.'
      );

      // Should not call OneSignalService
      expect(require('../OneSignalService').OneSignalService.initialize).not.toHaveBeenCalled();
    });

    it('should not initialize twice', async () => {
      const PlatformMock = require('react-native').Platform;
      PlatformMock.OS = 'android';

      await NotificationService.initialize();
      await NotificationService.initialize();

      // OneSignalService.initialize should only be called once
      expect(require('../OneSignalService').OneSignalService.initialize).toHaveBeenCalledTimes(1);
      expect((NotificationService as any).isInitialized).toBe(true);
    });

    it('should not reinitialize if already initialized', async () => {
      const PlatformMock = require('react-native').Platform;
      PlatformMock.OS = 'android';

      // Set as already initialized
      (NotificationService as any).isInitialized = true;

      await NotificationService.initialize();

      // Should not call OneSignalService again
      expect(require('../OneSignalService').OneSignalService.initialize).not.toHaveBeenCalled();
    });
  });

  describe('getOrRequestPermissionsAsync', () => {
    it('should delegate to NotificationPermissionService', async () => {
      const mockResult = true;
      require('../NotificationPermissionService').NotificationPermissionService.getOrRequestPermissionsAsync.mockResolvedValue(mockResult);

      const result = await NotificationService.getOrRequestPermissionsAsync();

      expect(result).toBe(mockResult);
      expect(require('../NotificationPermissionService').NotificationPermissionService.getOrRequestPermissionsAsync).toHaveBeenCalled();
    });
  });

  describe('scheduleTestNotification', () => {
    it('should delegate to NotificationCoreService', async () => {
      await NotificationService.scheduleTestNotification();

      expect(require('../NotificationCoreService').NotificationCoreService.scheduleTestNotification).toHaveBeenCalled();
    });
  });
});
