import { Alert, Platform } from 'react-native';
import i18next from 'i18next';
import { NotificationService } from '@/services/NotificationService';
import { NotificationTests } from '../NotificationTests';

jest.mock('@/services/NotificationService', () => ({
  NotificationService: {
    getOrRequestPermissionsAsync: jest.fn().mockResolvedValue(true),
    checkNotificationReadiness: jest.fn().mockResolvedValue(true),
  },
}));
jest.mock('@/services/LoggingService', () => ({
  LoggingService: { info: jest.fn(), warning: jest.fn(), error: jest.fn() },
}));

it.each([
  { language: 'it', title: 'Verifica notifiche completata' },
  { language: 'en', title: 'Notification readiness check completed' },
])('reports a permission check without claiming delivery in $language', async ({ language, title }) => {
  const oldPlatform = Platform.OS;
  Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
  await i18next.changeLanguage(language);
  jest.clearAllMocks();

  try {
    const result = await NotificationTests.runNotificationReadinessTest();
    expect(result).toEqual(expect.objectContaining({
      testId: 'notification-readiness',
      success: true,
      data: { permissionGranted: true },
    }));
    expect(result.data).not.toHaveProperty('scheduledAt');
    expect(NotificationService.checkNotificationReadiness).toHaveBeenCalledTimes(1);
    expect(Alert.alert).toHaveBeenCalledWith(title, expect.stringContaining('OneSignal'));
  } finally {
    Object.defineProperty(Platform, 'OS', { value: oldPlatform, configurable: true });
    await i18next.changeLanguage('it');
  }
});
