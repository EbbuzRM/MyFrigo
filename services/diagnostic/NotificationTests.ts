// NotificationTests.ts — NotificationTests module.
//
// exports: DiagnosticData | NotificationTestResult | NotificationTests
// used_by: hooks\useDiagnosticTests.ts
// rules:   Module requires cross-platform handling for web vs native notification APIs (expo-notifications vs Alert).
//          Relies on NotificationService and LoggingService singletons for permission management and diagnostics.
//          All public test methods must return `NotificationTestResult` with consistent `testId`, `success`, and `duration` fields.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { LoggingService } from '@/services/LoggingService';
import i18next from 'i18next';
import { NotificationService } from '@/services/NotificationService';
import { Alert, Platform } from 'react-native';
import { OneSignal } from 'react-native-onesignal';

export interface DiagnosticData {
  [key: string]: unknown;
}

export interface NotificationTestResult {
    testId: string;
    success: boolean;
    duration: number;
    error?: string;
    data?: DiagnosticData;
}

export class NotificationTests {
    static async runNotificationPermissionsTest(): Promise<NotificationTestResult> {
        const startTime = Date.now();

        try {
            if (Platform.OS === 'web') {
                Alert.alert(
                    i18next.t('notifications.testUnavailable'),
                    i18next.t('notifications.testUnavailableWeb')
                );
                return {
                    testId: 'notification-permissions',
                    success: false,
                    duration: Date.now() - startTime,
                    error: 'Platform not supported'
                };
            }

            // Ottieni i permessi
            const hasPermissions = await NotificationService.getOrRequestPermissionsAsync();

            // Ottieni lo stato corrente dei permessi per il report dettagliato
            const permissionStatus = await OneSignal.Notifications.getPermissionAsync();

            const testData = {
                hasPermissions,
                permissionStatus: permissionStatus ? 'granted' : 'denied',
                platform: Platform.OS
            };

            LoggingService.info('NotificationTests', 'Risultato test permessi notifiche:', testData);

            if (hasPermissions) {
                Alert.alert(
                    i18next.t('notifications.testPermissionDone'),
                    i18next.t('notifications.testPermissionGranted')
                );
            } else {
                Alert.alert(
                    i18next.t('notifications.testPermissionFailed'),
                    i18next.t('notifications.testPermissionDenied')
                );
            }

            return {
                testId: 'notification-permissions',
                success: hasPermissions,
                duration: Date.now() - startTime,
                data: testData
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
            LoggingService.error('NotificationTests', 'Errore nel test permessi notifiche:', error);

            Alert.alert(
                i18next.t('notifications.testPermissionError'),
                i18next.t('notifications.testUnexpectedError')
            );

            return {
                testId: 'notification-permissions',
                success: false,
                duration: Date.now() - startTime,
                error: errorMessage
            };
        }
    }

    static async runNotificationReadinessTest(): Promise<NotificationTestResult> {
        const startTime = Date.now();

        try {
            if (Platform.OS === 'web') {
                Alert.alert(
                    i18next.t('notifications.testUnavailable'),
                    i18next.t('notifications.testUnavailableWeb')
                );
                return {
                    testId: 'notification-readiness',
                    success: false,
                    duration: Date.now() - startTime,
                    error: 'Platform not supported'
                };
            }

            // Verifica il permesso senza simulare l'invio di una notifica.
            const hasPermissions = await NotificationService.getOrRequestPermissionsAsync();
            if (!hasPermissions) {
                Alert.alert(
                    i18next.t('notifications.testReadinessFailed'),
                    i18next.t('notifications.testReadinessNoPermission')
                );
                return {
                    testId: 'notification-readiness',
                    success: false,
                    duration: Date.now() - startTime,
                    error: 'Permissions not granted'
                };
            }

            const permissionGranted = await NotificationService.checkNotificationReadiness();
            if (!permissionGranted) {
                Alert.alert(
                    i18next.t('notifications.testReadinessFailed'),
                    i18next.t('notifications.testReadinessNoPermission')
                );
                return {
                    testId: 'notification-readiness',
                    success: false,
                    duration: Date.now() - startTime,
                    error: 'Permission not granted'
                };
            }
            LoggingService.info('NotificationTests', 'OneSignal notification permission confirmed');

            Alert.alert(
                i18next.t('notifications.testReadinessDone'),
                i18next.t('notifications.testReadinessDoneMessage')
            );

            return {
                testId: 'notification-readiness',
                success: true,
                duration: Date.now() - startTime,
                data: { permissionGranted: true }
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
            LoggingService.error('NotificationTests', 'Notification readiness check failed', error);

            Alert.alert(
                i18next.t('notifications.testReadinessError'),
                i18next.t('notifications.testUnexpectedError')
            );

            return {
                testId: 'notification-readiness',
                success: false,
                duration: Date.now() - startTime,
                error: errorMessage
            };
        }
    }
}
