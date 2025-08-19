// Mock per NotificationService per evitare problemi con OneSignal nei test
export const NotificationService = {
  initialize: jest.fn(),
  scheduleExpirationNotification: jest.fn(),
  cancelNotification: jest.fn(),
  getOrRequestPermissionsAsync: jest.fn().mockResolvedValue(true),
  scheduleTestNotification: jest.fn(),
  isNotificationScheduled: jest.fn().mockResolvedValue(false),
  scheduleMultipleNotifications: jest.fn(),
  checkExpoNotificationsAvailability: jest.fn().mockReturnValue(true),
};

export const eventEmitter = {
  on: jest.fn(),
  emit: jest.fn(),
  removeAllListeners: jest.fn(),
  removeAllEvents: jest.fn(),
};
