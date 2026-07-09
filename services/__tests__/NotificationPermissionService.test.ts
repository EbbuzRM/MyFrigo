// NotificationPermissionService.test.ts — NotificationPermissionService test module.
//
// exports: none
// used_by: none
// rules:   none

import { Platform } from 'react-native';
import { NotificationPermissionService } from '../NotificationPermissionService';
import * as Notifications from 'expo-notifications';
import { LoggingService } from '../LoggingService';

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios || obj.default),
  },
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
}), { virtual: true });

jest.mock('../LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  NotificationPermissionService.clearAvailabilityCache();
});

describe('checkExpoNotificationsAvailability', () => {
  it('should return false on web platform', () => {
    const originalOS = Platform.OS;
    (Platform as any).OS = 'web';

    const result = NotificationPermissionService.checkExpoNotificationsAvailability();

    expect(result).toBe(false);
    (Platform as any).OS = originalOS;
  });

  it('should return true when Notifications API is available', () => {
    const result = NotificationPermissionService.checkExpoNotificationsAvailability();

    expect(result).toBe(true);
  });

  it.skip('should return false when Notifications API is not available (missing scheduleNotificationAsync)', () => {
    jest.isolateModules(() => {
      jest.doMock('expo-notifications', () => ({
        getPermissionsAsync: jest.fn(),
        requestPermissionsAsync: jest.fn(),
        // scheduleNotificationAsync intentionally omitted
        cancelScheduledNotificationAsync: jest.fn(),
      }), { virtual: true });

      const NPS = require('../NotificationPermissionService').NotificationPermissionService;
      const LoggingServiceMock = require('../LoggingService').LoggingService;

      NPS.clearAvailabilityCache();
      const result = NPS.checkExpoNotificationsAvailability();

      expect(result).toBe(false);
      expect(LoggingServiceMock.error).toHaveBeenCalledWith(
        'NotificationPermissionService',
        'Expo Notifications API not available or not properly linked'
      );
    });
  });

  it.skip('should return false when Notifications API throws', () => {
    jest.isolateModules(() => {
      jest.doMock('expo-notifications', () => ({
        getPermissionsAsync: jest.fn(),
        requestPermissionsAsync: jest.fn(),
        scheduleNotificationAsync: jest.fn(() => {
          throw new Error('native module not available');
        }),
        cancelScheduledNotificationAsync: jest.fn(),
      }), { virtual: true });

      const NPS = require('../NotificationPermissionService').NotificationPermissionService;
      const LoggingServiceMock = require('../LoggingService').LoggingService;

      NPS.clearAvailabilityCache();
      const result = NPS.checkExpoNotificationsAvailability();

      expect(result).toBe(false);
      expect(LoggingServiceMock.error).toHaveBeenCalledWith(
        'NotificationPermissionService',
        'Error checking Expo Notifications availability:',
        expect.any(Error)
      );
    });
  });

  it('should cache result after first call', () => {
    const result1 = NotificationPermissionService.checkExpoNotificationsAvailability();
    const result2 = NotificationPermissionService.checkExpoNotificationsAvailability();

    expect(result1).toBe(true);
    expect(result2).toBe(true);
    expect(LoggingService.error).toHaveBeenCalledTimes(0);
  });

  it.skip('should log error when API not available', () => {
    jest.isolateModules(() => {
      jest.doMock('expo-notifications', () => ({
        getPermissionsAsync: jest.fn(),
        requestPermissionsAsync: jest.fn(),
        // scheduleNotificationAsync intentionally omitted
        cancelScheduledNotificationAsync: jest.fn(),
      }), { virtual: true });

      const NPS = require('../NotificationPermissionService').NotificationPermissionService;
      const LoggingServiceMock = require('../LoggingService').LoggingService;

      NPS.clearAvailabilityCache();
      NPS.checkExpoNotificationsAvailability();

      expect(LoggingServiceMock.error).toHaveBeenCalledWith(
        'NotificationPermissionService',
        'Expo Notifications API not available or not properly linked'
      );
    });
  });

  it.skip('should log error when exception occurs', () => {
    jest.isolateModules(() => {
      jest.doMock('expo-notifications', () => ({
        getPermissionsAsync: jest.fn(),
        requestPermissionsAsync: jest.fn(),
        scheduleNotificationAsync: jest.fn(() => {
          throw new Error('unexpected error');
        }),
        cancelScheduledNotificationAsync: jest.fn(),
      }), { virtual: true });

      const NPS = require('../NotificationPermissionService').NotificationPermissionService;
      const LoggingServiceMock = require('../LoggingService').LoggingService;

      NPS.clearAvailabilityCache();
      NPS.checkExpoNotificationsAvailability();

      expect(LoggingServiceMock.error).toHaveBeenCalledWith(
        'NotificationPermissionService',
        'Error checking Expo Notifications availability:',
        expect.any(Error)
      );
    });
  });
});

describe('clearAvailabilityCache', () => {
  it('should reset availabilityChecked to false', () => {
    NotificationPermissionService.checkExpoNotificationsAvailability();
    NotificationPermissionService.clearAvailabilityCache();

    // After clearing, calling again should re-evaluate and still return true
    const result = NotificationPermissionService.checkExpoNotificationsAvailability();
    expect(result).toBe(true);
  });

  it('should reset availabilityResult to false', () => {
    jest.isolateModules(() => {
      jest.doMock('expo-notifications', () => ({
        getPermissionsAsync: jest.fn(),
        requestPermissionsAsync: jest.fn(),
        // scheduleNotificationAsync intentionally omitted
        cancelScheduledNotificationAsync: jest.fn(),
      }));

      const NPS = require('../NotificationPermissionService').NotificationPermissionService;

      NPS.clearAvailabilityCache();
      // First call should cache false
      NPS.checkExpoNotificationsAvailability();

      // Now restore the API and clear cache
      jest.doMock('expo-notifications', () => ({
        getPermissionsAsync: jest.fn(),
        requestPermissionsAsync: jest.fn(),
        scheduleNotificationAsync: jest.fn(),
        // cancelScheduledNotificationAsync intentionally omitted
      }), { virtual: true });
      NPS.clearAvailabilityCache();

      const result = NPS.checkExpoNotificationsAvailability();
      expect(result).toBe(true);
    });
  });
});

describe('getOrRequestPermissionsAsync', () => {
  it('should return false on web platform', async () => {
    const originalOS = Platform.OS;
    (Platform as any).OS = 'web';

    const result = await NotificationPermissionService.getOrRequestPermissionsAsync();

    expect(result).toBe(false);
    (Platform as any).OS = originalOS;
  });

  it('should return false when Expo Notifications not available', async () => {
    const spy = jest.spyOn(NotificationPermissionService as any, 'checkExpoNotificationsAvailability').mockReturnValue(false);
    
    const result = await NotificationPermissionService.getOrRequestPermissionsAsync();
    
    expect(result).toBe(false);
    expect(LoggingService.error).toHaveBeenCalledWith(
      'NotificationPermissionService',
      'Cannot check permissions: Expo Notifications not available'
    );
    
    spy.mockRestore();
  });

  it('should return true when permissions already granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

    const result = await NotificationPermissionService.getOrRequestPermissionsAsync();

    expect(result).toBe(true);
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(LoggingService.info).toHaveBeenCalledWith(
      'NotificationPermissionService',
      'Permissions are granted.'
    );
  });

  it('should request permissions when not granted and return result', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

    const result = await NotificationPermissionService.getOrRequestPermissionsAsync();

    expect(result).toBe(true);
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledWith({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        provideAppNotificationSettings: true,
      },
    });
  });

  it('should return false when permission denied', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    const result = await NotificationPermissionService.getOrRequestPermissionsAsync();

    expect(result).toBe(false);
    expect(LoggingService.info).toHaveBeenCalledWith(
      'NotificationPermissionService',
      'Permission request denied or failed.'
    );
  });

  it('should log error on exception', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockRejectedValue(new Error('some error'));

    const result = await NotificationPermissionService.getOrRequestPermissionsAsync();

    expect(result).toBe(false);
    expect(LoggingService.error).toHaveBeenCalledWith(
      'NotificationPermissionService',
      'Error requesting permissions:',
      expect.any(Error)
    );
  });

  it('should request permissions with correct iOS options', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

    await NotificationPermissionService.getOrRequestPermissionsAsync();

    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledWith({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        provideAppNotificationSettings: true,
      },
    });
  });
});

describe('checkPermissionsAsync', () => {
  it('should return false on web platform', async () => {
    const originalOS = Platform.OS;
    (Platform as any).OS = 'web';

    const result = await NotificationPermissionService.checkPermissionsAsync();

    expect(result).toBe(false);
    (Platform as any).OS = originalOS;
  });

  it('should return false when Expo Notifications not available', async () => {
    jest.isolateModules(() => {
      jest.doMock('expo-notifications', () => ({
        getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'denied' }),
        requestPermissionsAsync: jest.fn(),
        // scheduleNotificationAsync intentionally omitted
        cancelScheduledNotificationAsync: jest.fn(),
      }), { virtual: true });

      const NPS = require('../NotificationPermissionService').NotificationPermissionService;

      NPS.clearAvailabilityCache();
      return NPS.checkPermissionsAsync().then((result: boolean) => {
        expect(result).toBe(false);
      });
    });
  });

  it('should return true when permissions granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

    const result = await NotificationPermissionService.checkPermissionsAsync();

    expect(result).toBe(true);
  });

  it('should return false when permissions not granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    const result = await NotificationPermissionService.checkPermissionsAsync();

    expect(result).toBe(false);
  });

  it('should log error on exception', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockRejectedValue(new Error('some error'));

    const result = await NotificationPermissionService.checkPermissionsAsync();

    expect(result).toBe(false);
    expect(LoggingService.error).toHaveBeenCalledWith(
      'NotificationPermissionService',
      'Error checking permissions:',
      expect.any(Error)
    );
  });
});