## Documentazione del Progetto

### Sezione Notifiche
- **Notifiche Locali:** Gestite tramite `expo-notifications`.
- **Notifiche Push:** Implementate tramite Supabase Edge Functions e il servizio Expo Push Notifications.
- **Configurazione:** La Edge Function `send-notification` è responsabile dell'invio delle notifiche.

### Pattern di Avvio Personalizzato (React 19 Polyfill)
Per garantire la compatibilità con React 19 e il bundler di Expo, il progetto utilizza un pattern di avvio personalizzato:
- **`index.js`**: È l'entry point principale definito in `app.json`.
- **`react-polyfill.js`**: Viene importato da `index.js` per primo. Assicura che gli hook di React siano disponibili globalmente, risolvendo problemi di `ReferenceError`.
- **`expo-router/entry`**: Viene importato da `index.js` subito dopo il polyfill, avviando l'app e Expo Router in un ambiente stabile.

Questo pattern è una parte fondamentale e stabile dell'architettura del progetto.

### Troubleshooting Note
- Per problemi di build Android, verificare `AndroidManifest.xml` e le versioni delle dipendenze.
- Assicurarsi che l'app sia una build nativa (`npx expo run:android`) per testare funzionalità native.
