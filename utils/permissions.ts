// permissions.ts — permissions module.
//
// exports: showNotificationPermissionsAlert
// used_by: app\(tabs)\index.tsx
// rules:   The module's only public function (`showNotificationPermissionsAlert`) returns `void` and produces a side effect. Any new public functions added must maintain the pattern of being exported individually and start with a verb in camelCase. Do not add default exports or class-based wrappers.
// agent:   executor | 2026-09-22 | Fase B i18n | gruppo 3a: dashboard (alert tradotto al boundary)

import { Alert, Linking } from 'react-native';
import i18next from 'i18next';

/**
 * Mostra un alert all'utente per comunicare che le notifiche sono disattivate,
 * offrendo la possibilità di aprire le impostazioni di sistema.
 */
export function showNotificationPermissionsAlert() {
    Alert.alert(
        i18next.t('notifications.permissionAlertTitle'),
        i18next.t('notifications.permissionAlertMessage'),
        [
            { text: i18next.t('common.cancel'), style: 'cancel' },
            { text: i18next.t('notifications.openSettings'), onPress: () => Linking.openSettings() }
        ]
    );
}
