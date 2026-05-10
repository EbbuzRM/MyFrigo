// NotificationCoreService.test.ts — NotificationCoreService test module.
//
// exports: none
// used_by: none
// rules:   none

// ─── Mock di react-native (Platform) ────────────────────────────────────────
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios', // Default to iOS for testing
  },
}));

// ─── Mock di expo-notifications ──────────────────────────────────────────────
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  Notifications: {
    setNotificationHandler: jest.fn(),
    setNotificationChannelAsync: jest.fn(),
  },
  SchedulableTriggerInputTypes: {
    DATE: 'date',
  },
}));

// ─── Mock dei servizi locali ────────────────────────────────────────────────
jest.mock('../LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../NotificationPermissionService', () => ({
  NotificationPermissionService: {
    checkExpoNotificationsAvailability: jest.fn(),
  },
}));

import { LoggingService } from '../LoggingService';
import { NotificationPermissionService } from '../NotificationPermissionService';
import { NotificationCoreService } from '../NotificationCoreService';

// ─── Helpers ────────────────────────────────────────────────────────────────
const DATE_NOW = new Date('2026-05-10T12:00:00.000Z');

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(DATE_NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

// Accesso dinamico ai mock di expo-notifications (come in NotificationService.test.ts)
const scheduleNotificationAsync = () =>
  require('expo-notifications').scheduleNotificationAsync;

const getSchedulableTriggerInputTypes = () =>
  require('expo-notifications').SchedulableTriggerInputTypes;

// ─── Test Suite ─────────────────────────────────────────────────────────────
describe('NotificationCoreService', () => {
  describe('scheduleTestNotification()', () => {
    it('non deve fare nulla su piattaforma web', async () => {
      // Arrange
      const { Platform } = require('react-native');
      Platform.OS = 'web';

      // Act
      await NotificationCoreService.scheduleTestNotification();

      // Assert
      expect(NotificationPermissionService.checkExpoNotificationsAvailability).not.toHaveBeenCalled();
      expect(scheduleNotificationAsync()).not.toHaveBeenCalled();
      expect(LoggingService.info).not.toHaveBeenCalled();
      expect(LoggingService.error).not.toHaveBeenCalled();

      // Restore
      Platform.OS = 'ios';
    });

    it('deve loggare un errore quando Expo Notifications non è disponibile', async () => {
      // Arrange
      jest
        .spyOn(NotificationPermissionService, 'checkExpoNotificationsAvailability')
        .mockReturnValue(false);

      // Act
      await NotificationCoreService.scheduleTestNotification();

      // Assert
      expect(NotificationPermissionService.checkExpoNotificationsAvailability).toHaveBeenCalledTimes(1);
      expect(LoggingService.error).toHaveBeenCalledWith(
        'NotificationCoreService',
        'Cannot schedule test notification: Expo Notifications not available'
      );
      expect(scheduleNotificationAsync()).not.toHaveBeenCalled();
    });

    it('deve pianificare la notifica di test quando tutto è disponibile', async () => {
      // Arrange
      jest
        .spyOn(NotificationPermissionService, 'checkExpoNotificationsAvailability')
        .mockReturnValue(true);
      scheduleNotificationAsync().mockResolvedValue('test-notification-id');

      const expectedDate = new Date(DATE_NOW.getTime() + 10 * 1000);

      // Act
      await NotificationCoreService.scheduleTestNotification();

      // Assert
      expect(NotificationPermissionService.checkExpoNotificationsAvailability).toHaveBeenCalledTimes(1);
      expect(LoggingService.info).toHaveBeenCalledWith(
        'NotificationCoreService',
        `Scheduling TEST notification for ${expectedDate.toISOString()}`
      );
      expect(scheduleNotificationAsync()).toHaveBeenCalledWith({
        content: {
          title: '🔔 Notifica di Prova',
          body: 'Se vedi questo messaggio, le notifiche funzionano correttamente!',
          data: { test: 'true' },
        },
        trigger: {
          type: getSchedulableTriggerInputTypes().DATE,
          date: expectedDate,
        },
      });
      expect(LoggingService.info).toHaveBeenCalledWith(
        'NotificationCoreService',
        'Test notification scheduled successfully.'
      );
    });

    it('deve loggare un errore quando scheduleNotificationAsync fallisce', async () => {
      // Arrange
      jest
        .spyOn(NotificationPermissionService, 'checkExpoNotificationsAvailability')
        .mockReturnValue(true);

      const mockError = new Error('Network failure');
      scheduleNotificationAsync().mockRejectedValue(mockError);

      // Act
      await NotificationCoreService.scheduleTestNotification();

      // Assert
      expect(LoggingService.error).toHaveBeenCalledWith(
        'NotificationCoreService',
        'Error scheduling test notification:',
        mockError
      );
    });
  });
});