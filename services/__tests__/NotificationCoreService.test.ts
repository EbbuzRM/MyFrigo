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

  describe('scheduleTestNotification()', () => {
    it('should not do anything on web platform', async () => {
      // Arrange
      const { Platform } = require('react-native');
      Platform.OS = 'web';

      // Act
      await NotificationCoreService.scheduleTestNotification();

      // Assert
      expect(require('react-native-onesignal').OneSignal.Notifications.getPermissionAsync).not.toHaveBeenCalled();
      expect(LoggingService.info).not.toHaveBeenCalled();
      expect(LoggingService.error).not.toHaveBeenCalled();

      // Restore
      Platform.OS = 'ios';
    });

    it('should log error when permission is not granted', async () => {
      // Arrange
      require('react-native-onesignal').OneSignal.Notifications.getPermissionAsync.mockResolvedValue(false);

      // Act
      await NotificationCoreService.scheduleTestNotification();

      // Assert
      expect(require('react-native-onesignal').OneSignal.Notifications.getPermissionAsync).toHaveBeenCalledTimes(1);
      expect(LoggingService.error).toHaveBeenCalledWith(
        'NotificationCoreService',
        'Cannot schedule test: permission not granted'
      );
      expect(LoggingService.info).not.toHaveBeenCalled();
    });

    it('should log info when permission is granted', async () => {
      // Arrange
      require('react-native-onesignal').OneSignal.Notifications.getPermissionAsync.mockResolvedValue(true);

      // Act
      await NotificationCoreService.scheduleTestNotification();

      // Assert
      expect(require('react-native-onesignal').OneSignal.Notifications.getPermissionAsync).toHaveBeenCalledTimes(1);
      expect(LoggingService.info).toHaveBeenCalledWith(
        'NotificationCoreService',
        'OneSignal permission check OK for test notification'
      );
      expect(LoggingService.error).not.toHaveBeenCalled();
    });
  });
});
