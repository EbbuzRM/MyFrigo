// permissions.ts — permissions module.
//
// exports: showNotificationPermissionsAlert
// used_by: app\(tabs)\index.tsx
// rules:   The module's only public function (`showNotificationPermissionsAlert`) returns `void` and produces a side effect. Any new public functions added must maintain the pattern of being exported individually and start with a verb in camelCase. Do not add default exports or class-based wrappers.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { Alert, Linking } from 'react-native';

/**
 * Mostra un alert all'utente per comunicare che le notifiche sono disattivate,
 * offrendo la possibilità di aprire le impostazioni di sistema.
 */
export function showNotificationPermissionsAlert() {
    Alert.alert(
        "Permessi Notifiche",
        "Le notifiche sono disattivate. Per riattivarle, devi modificare le impostazioni del tuo dispositivo.",
        [
            { text: "Annulla", style: "cancel" },
            { text: "Apri Impostazioni", onPress: () => Linking.openSettings() }
        ]
    );
}
