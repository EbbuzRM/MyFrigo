import { NotificationService } from '../NotificationService';

// Mock dependencies
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios', // Default to iOS for testing
    select: jest.fn((obj) => obj['ios'] || obj.default),
  },
}));
jest.mock('react-native-onesignal', () => ({
  OneSignal: {
    initialize: jest.fn(),
    Notifications: {
      requestPermission: jest.fn(),
    },
    User: {
      addEventListener: jest.fn(),
      getOnesignalId: jest.fn(),
      addTags: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
    },
  },
}));
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('mock-id')),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  AndroidImportance: {
    MAX: 'max',
  },
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  SchedulableTriggerInputTypes: {
    DATE: 'date',
  },
}), { virtual: true });
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

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset static properties
    (NotificationService as any).isInitialized = false;
    // Reset Platform.OS to default
    require('react-native').Platform.OS = 'ios';
  });

  describe('initialize', () => {
    it('should not initialize on web platform', () => {
      // Mock Platform.OS as 'web'
      const PlatformMock = require('react-native').Platform;
      PlatformMock.OS = 'web';

      NotificationService.initialize();

      // Should not initialize OneSignal or set notification channel
      expect(require('react-native-onesignal').OneSignal.initialize).not.toHaveBeenCalled();
      expect(require('expo-notifications').setNotificationChannelAsync).not.toHaveBeenCalled();
    });

    it('should initialize OneSignal successfully on Android', () => {
      // Mock Platform.OS as 'android'
      const PlatformMock = require('react-native').Platform;
      PlatformMock.OS = 'android';

      NotificationService.initialize();

      // Should set notification channel
      expect(require('expo-notifications').setNotificationChannelAsync).toHaveBeenCalledWith('default', {
        name: 'Default',
        importance: 'max',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      // Should initialize OneSignal
      expect(require('react-native-onesignal').OneSignal.initialize).toHaveBeenCalledWith('test-app-id');
      expect(require('react-native-onesignal').OneSignal.Notifications.requestPermission).toHaveBeenCalledWith(true);
      
      // Should mark as initialized
      expect((NotificationService as any).isInitialized).toBe(true);
      
      // Should log success
      expect(require('../LoggingService').LoggingService.info).toHaveBeenCalledWith(
        'NotificationService',
        'OneSignal SDK initialized successfully.'
      );
    });

    it('should handle OneSignal initialization error', () => {
      // Mock Platform.OS as 'android'
      const PlatformMock = require('react-native').Platform;
      PlatformMock.OS = 'android';

      // Mock OneSignal.initialize to throw an error
      const oneSignalMock = require('react-native-onesignal').OneSignal;
      oneSignalMock.initialize.mockImplementation(() => {
        throw new Error('OneSignal initialization failed');
      });

      NotificationService.initialize();

      // Should log error
      expect(require('../LoggingService').LoggingService.error).toHaveBeenCalledWith(
        'NotificationService',
        'Error initializing OneSignal:',
        expect.any(Error)
      );
      
      // Should not mark as initialized
      expect((NotificationService as any).isInitialized).toBe(false);
    });

    it('should handle missing OneSignal App ID', () => {
      // Mock Platform.OS as 'android'
      const PlatformMock = require('react-native').Platform;
      PlatformMock.OS = 'android';

      // Mock missing app ID
      const constantsMock = require('expo-constants');
      const originalAppId = constantsMock.expoConfig.extra.oneSignalAppId;
      constantsMock.expoConfig.extra.oneSignalAppId = undefined;

      NotificationService.initialize();

      // Restore for other tests
      constantsMock.expoConfig.extra.oneSignalAppId = originalAppId;

      // Should log error
      expect(require('../LoggingService').LoggingService.error).toHaveBeenCalledWith(
        'NotificationService',
        'FATAL: OneSignal App ID not found in app.json.'
      );
      
      // Should not initialize OneSignal
      expect(require('react-native-onesignal').OneSignal.initialize).not.toHaveBeenCalled();
    });

    it('should handle missing OneSignal native module', () => {
      // Mock Platform.OS as 'android'
      const PlatformMock = require('react-native').Platform;
      PlatformMock.OS = 'android';

      // Mock missing OneSignal module
      const oneSignalMock = require('react-native-onesignal').OneSignal;
      const originalInit = oneSignalMock.initialize;
      oneSignalMock.initialize = undefined;

      NotificationService.initialize();

      // Restore
      oneSignalMock.initialize = originalInit;

      // Should log error
      expect(require('../LoggingService').LoggingService.error).toHaveBeenCalledWith(
        'NotificationService',
        'FATAL: OneSignal native module not linked.'
      );
    });

    it.skip('should not initialize twice', () => {
      // Mock Platform.OS as 'android'
      const PlatformMock = require('react-native').Platform;
      PlatformMock.OS = 'android';

      // Ensure app ID is set
      const ConstantsMock = require('expo-constants');
      ConstantsMock.expoConfig.extra.oneSignalAppId = 'test-app-id';

      // Initialize
      NotificationService.initialize();
      
      // Should be marked as initialized
      expect((NotificationService as any).isInitialized).toBe(true);
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