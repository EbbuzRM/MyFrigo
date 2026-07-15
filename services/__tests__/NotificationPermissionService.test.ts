// NotificationPermissionService.test.ts — NotificationPermissionService test module.
//
// exports: none
// used_by: none
// rules:   none

import { Platform } from 'react-native';
import { NotificationPermissionService } from '../NotificationPermissionService';
import { OneSignal } from 'react-native-onesignal';
import { LoggingService } from '../LoggingService';

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj: Record<string, unknown>) => (obj as any).ios || (obj as any).default),
  },
}));

jest.mock('react-native-onesignal', () => ({
  OneSignal: {
    Notifications: {
      getPermissionAsync: jest.fn(),
      requestPermission: jest.fn(),
    },
  },
}));

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
  // Reset OneSignal mocks to defaults to prevent test pollution
  (OneSignal.Notifications.getPermissionAsync as jest.Mock).mockReset();
  (OneSignal.Notifications.requestPermission as jest.Mock).mockReset();
});

describe('checkExpoNotificationsAvailability', () => {
  it('should return false on web platform', () => {
    const originalOS = Platform.OS;
    (Platform as any).OS = 'web';

    const result = NotificationPermissionService.checkExpoNotificationsAvailability();

    expect(result).toBe(false);
    (Platform as any).OS = originalOS;
  });

  it('should return true on native platforms (OneSignal available)', () => {
    const result = NotificationPermissionService.checkExpoNotificationsAvailability();

    expect(result).toBe(true);
  });

  it('should cache result after first call', () => {
    const result1 = NotificationPermissionService.checkExpoNotificationsAvailability();
    const result2 = NotificationPermissionService.checkExpoNotificationsAvailability();

    expect(result1).toBe(true);
    expect(result2).toBe(true);
    expect(LoggingService.error).toHaveBeenCalledTimes(0);
  });

  // Legacy tests — testing expo-notifications availability scenarios
  // that don't apply to OneSignal. Kept as .skip with explanations.
  it.skip('LEGACY: should return false when Notifications API is not available (missing scheduleNotificationAsync)', () => {
    // This test was for expo-notifications module availability checks.
    // OneSignal's availability check is simpler: true on native, false on web.
    // TODO: Add test for OneSignal SDK initialization failure if/when such logic exists.
  });

  it.skip('LEGACY: should return false when Notifications API throws', () => {
    // OneSignal availability check doesn't call external APIs — always true.
    // TODO: Add test if OneSignal initialization failure detection is added.
  });

  it.skip('LEGACY: should log error when API not available', () => {
    // Not applicable to OneSignal-based implementation.
  });

  it.skip('LEGACY: should log error when exception occurs', () => {
    // Not applicable to OneSignal-based implementation.
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
    // Cache is reset, should re-evaluate
    NotificationPermissionService.checkExpoNotificationsAvailability();
    expect(NotificationPermissionService.checkExpoNotificationsAvailability()).toBe(true);
    NotificationPermissionService.clearAvailabilityCache();
    expect(NotificationPermissionService.checkExpoNotificationsAvailability()).toBe(true);
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

  it('should return false when OneSignal not available', async () => {
    const spy = jest.spyOn(NotificationPermissionService as any, 'checkExpoNotificationsAvailability').mockReturnValue(false);
    
    const result = await NotificationPermissionService.getOrRequestPermissionsAsync();
    
    expect(result).toBe(false);
    // The service returns false immediately when availability check fails,
    // without logging an additional error message.
    
    spy.mockRestore();
  });

  it('should return true when permission already granted', async () => {
    (OneSignal.Notifications.getPermissionAsync as jest.Mock).mockResolvedValue(true);

    const result = await NotificationPermissionService.getOrRequestPermissionsAsync();

    expect(result).toBe(true);
    expect(OneSignal.Notifications.requestPermission).not.toHaveBeenCalled();
    expect(LoggingService.info).toHaveBeenCalledWith(
      'NotificationPermissionService',
      'Permission already granted'
    );
  });

  it('should request permission when not granted and return true on success', async () => {
    (OneSignal.Notifications.getPermissionAsync as jest.Mock).mockResolvedValue(false);
    (OneSignal.Notifications.requestPermission as jest.Mock).mockResolvedValue(true);

    const result = await NotificationPermissionService.getOrRequestPermissionsAsync();

    expect(result).toBe(true);
    expect(OneSignal.Notifications.requestPermission).toHaveBeenCalledWith(true);
  });

  it('should return false when permission denied', async () => {
    (OneSignal.Notifications.getPermissionAsync as jest.Mock).mockResolvedValue(false);
    (OneSignal.Notifications.requestPermission as jest.Mock).mockResolvedValue(false);

    const result = await NotificationPermissionService.getOrRequestPermissionsAsync();

    expect(result).toBe(false);
    expect(LoggingService.info).toHaveBeenCalledWith(
      'NotificationPermissionService',
      'Permission result: false'
    );
  });

  it('should handle null return from getPermissionAsync and requestPermission', async () => {
    (OneSignal.Notifications.getPermissionAsync as jest.Mock).mockResolvedValue(null);
    (OneSignal.Notifications.requestPermission as jest.Mock).mockResolvedValue(null);

    const result = await NotificationPermissionService.getOrRequestPermissionsAsync();

    // null is falsy → enters request branch; null returned as result
    expect(OneSignal.Notifications.requestPermission).toHaveBeenCalledWith(true);
    expect(result).toBeNull();
  });

  it('should log error on exception', async () => {
    (OneSignal.Notifications.getPermissionAsync as jest.Mock).mockRejectedValue(new Error('some error'));

    const result = await NotificationPermissionService.getOrRequestPermissionsAsync();

    expect(result).toBe(false);
    expect(LoggingService.error).toHaveBeenCalledWith(
      'NotificationPermissionService',
      'Error requesting permissions:',
      expect.any(Error)
    );
  });

  it('should call requestPermission with true parameter', async () => {
    (OneSignal.Notifications.getPermissionAsync as jest.Mock).mockResolvedValue(false);
    (OneSignal.Notifications.requestPermission as jest.Mock).mockResolvedValue(true);

    await NotificationPermissionService.getOrRequestPermissionsAsync();

    expect(OneSignal.Notifications.requestPermission).toHaveBeenCalledWith(true);
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

  it('should return false when OneSignal not available', async () => {
    const spy = jest.spyOn(NotificationPermissionService as any, 'checkExpoNotificationsAvailability').mockReturnValue(false);

    const result = await NotificationPermissionService.checkPermissionsAsync();

    expect(result).toBe(false);

    spy.mockRestore();
  });

  it('should return true when permission granted', async () => {
    (OneSignal.Notifications.getPermissionAsync as jest.Mock).mockResolvedValue(true);

    const result = await NotificationPermissionService.checkPermissionsAsync();

    expect(result).toBe(true);
  });

  it('should return false when permission not granted', async () => {
    (OneSignal.Notifications.getPermissionAsync as jest.Mock).mockResolvedValue(false);

    const result = await NotificationPermissionService.checkPermissionsAsync();

    expect(result).toBe(false);
  });

  it('should handle null return from getPermissionAsync', async () => {
    (OneSignal.Notifications.getPermissionAsync as jest.Mock).mockResolvedValue(null);

    const result = await NotificationPermissionService.checkPermissionsAsync();

    // null is returned directly — caller should treat as falsy
    expect(result).toBeNull();
  });

  it('should log error on exception', async () => {
    (OneSignal.Notifications.getPermissionAsync as jest.Mock).mockRejectedValue(new Error('some error'));

    const result = await NotificationPermissionService.checkPermissionsAsync();

    expect(result).toBe(false);
    expect(LoggingService.error).toHaveBeenCalledWith(
      'NotificationPermissionService',
      'Error checking permissions:',
      expect.any(Error)
    );
  });
});
