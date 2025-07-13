## Contesto Tecnologico

**Stack Tecnologico:**
- **Frontend:** React Native, Expo (SDK 53), TypeScript.
- **Backend (Notifiche):** Supabase Edge Functions.
- **Notifiche Push:** `expo-notifications`.

**Versioni Chiave:**
- `expo`: `^53.0.13`
- `react`: `19.0.0`
- `react-native`: `^0.79.5`

**Pattern di Compatibilità (React 19):**
- Per risolvere un'incompatibilità tra React 19 e il bundler di Expo, è stato implementato un pattern di avvio personalizzato.
- **`react-polyfill.js`**: Assicura che gli hook di React siano disponibili globalmente.
- **`index.js`**: Nuovo entry point che carica il polyfill prima di avviare l'app tramite `expo-router/entry`.
- Questo approccio è considerato una soluzione stabile e permanente per il progetto.
