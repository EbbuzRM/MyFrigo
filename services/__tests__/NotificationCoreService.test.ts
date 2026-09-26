// NotificationCoreService.test.ts — NotificationCoreService test module.
//
// exports: none
// used_by: none
// rules:   none

// ─── Mock di react-native (Platform) ────────────────────────────────────────
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

// ─── Mock di react-native-onesignal ─────────────────────────────────────────
jest.mock('react-native-onesignal', () => ({
  OneSignal: {
    Notifications: {
      getPermissionAsync: jest.fn(),
    },
  },
}));

// ─── Mock dei servizi locali ────────────────────────────────────────────────
jest.mock('../LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

import { LoggingService } from '../LoggingService';
import { NotificationCoreService } from '../NotificationCoreService';

// ─── Test Suite ─────────────────────────────────────────────────────────────
describe('NotificationCoreService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: permission granted
    require('react-native-onesignal').OneSignal.Notifications.getPermissionAsync.mockResolvedValue(true);
    require('react-native').Platform.OS = 'ios';
  });

  describe('checkNotificationReadiness()', () => {
    it('reports unavailable on web without querying permission', async () => {
      // Arrange
      const { Platform } = require('react-native');
      Platform.OS = 'web';

      // Act
      const result = await NotificationCoreService.checkNotificationReadiness();

      // Assert
      expect(result).toBe(false);
      expect(require('react-native-onesignal').OneSignal.Notifications.getPermissionAsync).not.toHaveBeenCalled();
      expect(LoggingService.info).not.toHaveBeenCalled();
      expect(LoggingService.error).not.toHaveBeenCalled();

      // Restore
      Platform.OS = 'ios';
    });

    it('reports unavailable when permission is not granted', async () => {
      // Arrange
      require('react-native-onesignal').OneSignal.Notifications.getPermissionAsync.mockResolvedValue(false);

      // Act
      const result = await NotificationCoreService.checkNotificationReadiness();

      // Assert
      expect(require('react-native-onesignal').OneSignal.Notifications.getPermissionAsync).toHaveBeenCalledTimes(1);
      expect(result).toBe(false);
      expect(LoggingService.warning).toHaveBeenCalledWith(
        'NotificationCoreService',
        'Notification permission not granted'
      );
      expect(LoggingService.info).not.toHaveBeenCalled();
    });

    it('reports ready without sending a notification', async () => {
      // Arrange
      require('react-native-onesignal').OneSignal.Notifications.getPermissionAsync.mockResolvedValue(true);

      // Act
      const result = await NotificationCoreService.checkNotificationReadiness();

      // Assert
      expect(result).toBe(true);
      expect(require('react-native-onesignal').OneSignal.Notifications.getPermissionAsync).toHaveBeenCalledTimes(1);
      expect(LoggingService.info).toHaveBeenCalledWith(
        'NotificationCoreService',
        'OneSignal notification permission granted'
      );
      expect(LoggingService.error).not.toHaveBeenCalled();
    });
  });
});
