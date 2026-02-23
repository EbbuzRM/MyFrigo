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
