## Pattern di Sistema

### Flusso di Avvio dell'Applicazione
Il progetto utilizza un flusso di avvio personalizzato per garantire la stabilità con React 19:
1.  **`app.json`** definisce `index.js` come entry point.
2.  **`index.js`** viene eseguito.
3.  Al suo interno, viene importato per primo **`react-polyfill.js`**, che popola l'ambiente globale con gli hook di React.
4.  Subito dopo, viene importato **`expo-router/entry`**, che avvia l'applicazione e tutta la logica di routing in un ambiente ora compatibile.

### Gestione Notifiche
- **Client-side:** L'app Expo gestisce la richiesta dei permessi e l'ottenimento dell'Expo Push Token.
- **Server-side (Edge Function):** Una Supabase Edge Function (`send-notification`) riceve il token e invia la notifica push.

**Stato Attuale del Pattern:**
Tutti i pattern di sistema sono pienamente operativi. Il flusso di avvio stabile permette al resto dell'applicazione, inclusa la gestione delle notifiche, di funzionare come previsto.
