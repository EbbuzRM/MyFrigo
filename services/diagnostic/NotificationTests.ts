import { LoggingService } from '@/services/LoggingService';
import { NotificationService } from '@/services/NotificationService';
import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export interface NotificationTestResult {
    testId: string;
    success: boolean;
    duration: number;
    error?: string;
    data?: any;
}

export class NotificationTests {
    static async runNotificationPermissionsTest(): Promise<NotificationTestResult> {
        const startTime = Date.now();

        try {
            if (Platform.OS === 'web') {
                Alert.alert(
                    'Test Non Disponibile',
                    'Le notifiche non sono supportate sulla piattaforma web.'
                );
                return {
                    testId: 'notification-permissions',
                    success: false,
                    duration: Date.now() - startTime,
                    error: 'Platform not supported'
                };
            }

            // Verifica disponibilità Expo Notifications
            const isAvailable = NotificationService.checkExpoNotificationsAvailability();
            if (!isAvailable) {
                Alert.alert(
                    'Test Notifiche Fallito',
                    'Il modulo Expo Notifications non è disponibile o non è correttamente configurato.'
                );
                return {
                    testId: 'notification-permissions',
                    success: false,
                    duration: Date.now() - startTime,
                    error: 'Expo Notifications not available'
                };
            }

            // Ottieni i permessi
            const hasPermissions = await NotificationService.getOrRequestPermissionsAsync();

            // Ottieni lo stato corrente dei permessi per il report dettagliato
            const { status } = await Notifications.getPermissionsAsync();

            const testData = {
                hasPermissions,
                permissionStatus: status,
                platform: Platform.OS
            };

            LoggingService.info('NotificationTests', 'Risultato test permessi notifiche:', testData);

            if (hasPermissions) {
                Alert.alert(
                    'Test Permessi Completato',
                    `✅ Permessi Notifiche: ${status}\n\nIl sistema di notifiche è configurato correttamente!`
                );
            } else {
                Alert.alert(
                    'Test Permessi Fallito',
                    `❌ Permessi Notifiche: ${status}\n\nI permessi per le notifiche non sono stati concessi. Attivali nelle impostazioni del dispositivo.`
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
                'Errore Test Permessi',
                `Si è verificato un errore: ${errorMessage}`
            );

            return {
                testId: 'notification-permissions',
                success: false,
                duration: Date.now() - startTime,
                error: errorMessage
            };
        }
    }

    static async runNotificationSchedulingTest(): Promise<NotificationTestResult> {
        const startTime = Date.now();

        try {
            if (Platform.OS === 'web') {
                Alert.alert(
                    'Test Non Disponibile',
                    'Le notifiche non sono supportate sulla piattaforma web.'
                );
                return {
                    testId: 'notification-scheduling',
                    success: false,
                    duration: Date.now() - startTime,
                    error: 'Platform not supported'
                };
            }

            // Verifica disponibilità
            const isAvailable = NotificationService.checkExpoNotificationsAvailability();
            if (!isAvailable) {
                Alert.alert(
                    'Test Notifiche Fallito',
                    'Il modulo Expo Notifications non è disponibile.'
                );
                return {
                    testId: 'notification-scheduling',
                    success: false,
                    duration: Date.now() - startTime,
                    error: 'Expo Notifications not available'
                };
            }

            // Verifica permessi prima di schedulare
            const hasPermissions = await NotificationService.getOrRequestPermissionsAsync();
            if (!hasPermissions) {
                Alert.alert(
                    'Test Scheduling Fallito',
                    'Permessi notifiche non concessi. Impossibile schedulare notifiche di test.'
                );
                return {
                    testId: 'notification-scheduling',
                    success: false,
                    duration: Date.now() - startTime,
                    error: 'Permissions not granted'
                };
            }

            // Schedula una notifica di test
            await NotificationService.scheduleTestNotification();

            const testData = {
                scheduledAt: new Date().toISOString(),
                triggerIn: '10 secondi'
            };

            LoggingService.info('NotificationTests', 'Notifica di test schedulata:', testData);

            Alert.alert(
                'Test Scheduling Completato',
                '✅ Notifica di test schedulata con successo!\n\nRiceverai una notifica tra circa 10 secondi.'
            );

            return {
                testId: 'notification-scheduling',
                success: true,
                duration: Date.now() - startTime,
                data: testData
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
            LoggingService.error('NotificationTests', 'Errore nel test scheduling notifiche:', error);

            Alert.alert(
                'Errore Test Scheduling',
                `Si è verificato un errore: ${errorMessage}`
            );

            return {
                testId: 'notification-scheduling',
                success: false,
                duration: Date.now() - startTime,
                error: errorMessage
            };
        }
    }
}
