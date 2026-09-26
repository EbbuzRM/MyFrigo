// notifications.ts — english catalog for the `notifications` domain.
//
// exports: notificationsEn
// used_by: i18n/catalogs/en/index.ts
// rules:   Must expose exactly the same keys as `notificationsIt` — enforced at
//          compile time by the `satisfies` constraint (missing/extra keys fail tsc).
// agent:   executor | 2026-09-22 | Fase A i18n | base keys (content migrates in Fase B)

import { notificationsIt } from '../it/notifications';

export const notificationsEn = {
  title: 'Notifications',
  permissionDenied: 'Notification permission denied',
  permissionAlertTitle: 'Notification Permissions',
  permissionAlertMessage: 'Notifications are disabled. To re-enable them, change your device settings.',
  openSettings: 'Open Settings',
  testUnavailable: 'Test unavailable',
  testUnavailableWeb: 'Notifications are not supported on the web.',
  testPermissionDone: 'Permission test completed',
  testPermissionFailed: 'Permission test failed',
  testPermissionGranted: 'Notification permission granted. The notification system is configured.',
  testPermissionDenied: 'Notification permission not granted. Enable it in device settings.',
  testPermissionError: 'Permission test error',
  testReadinessFailed: 'Notification readiness check failed',
  testReadinessNoPermission: 'Notification permission not granted. Enable it in device settings.',
  testReadinessDone: 'Notification readiness check completed',
  testReadinessDoneMessage: 'OneSignal permission was verified. This check does not send a notification.',
  testReadinessError: 'Notification readiness check error',
  testUnexpectedError: 'There was a problem running the check.',
} satisfies Record<keyof typeof notificationsIt, string>;
