# Contesto Tecnico: MyFrigo - Gestore Intelligente degli Alimenti

## Tecnologie Utilizzate
- React Native con Expo per lo sviluppo mobile cross-platform
- TypeScript per la sicurezza dei tipi
- Supabase per i servizi backend (database PostgreSQL, autenticazione, funzioni serverless)
- OneSignal per le notifiche push remote
- Expo Notifications per le notifiche locali
- Expo Router per la navigazione
- React Context API per la gestione dello stato
- AsyncStorage per la persistenza dei dati locali
- Expo Camera ed expo-image-picker per l'acquisizione di foto
- @react-native-ml-kit/text-recognition per la funzionalità OCR
- react-native-onesignal per l'integrazione OneSignal
- lucide-react-native per le icone
- react-native-reanimated per le animazioni
- react-native-gesture-handler per la gestione dei gesti
- react-native-safe-area-context per la gestione dell'area sicura
- react-native-svg per la grafica SVG
- react-native-calendars per i componenti del calendario
- @react-native-google-signin/google-signin per l'autenticazione Google
- expo-auth-session per i flussi OAuth
- expo-linking per la gestione del deep linking
- whatwg-fetch per le richieste di rete
- Gradle per l'automazione della build Android
- Android SDK per lo sviluppo e il testing nativo Android

## Configurazione di Sviluppo
- Versione LTS di Node.js
- Expo CLI ed EAS CLI per lo sviluppo e la build
- Android Studio e Xcode per lo sviluppo e il testing nativo
- App Expo Go per test rapidi su dispositivi fisici
- VS Code con estensioni consigliate per lo sviluppo React Native
- Variabili d'ambiente configurate nel file .env per le credenziali Supabase e OneSignal
- Supabase CLI per lo sviluppo locale e le migrazioni del database
- Android SDK e Gradle per le build native Android

## Vincoli Tecnici
- L'app deve funzionare in modo affidabile con la gestione standard degli errori poiché il sistema di resilienza è stato rimosso
- Le notifiche locali devono essere pianificate con precisione tenendo conto dei fusi orari
- Le dimensioni dell'app devono essere ottimizzate a causa delle limitazioni della piattaforma mobile
- L'utilizzo della batteria deve essere ridotto al minimo, specialmente per le attività in background
- La sincronizzazione dei dati deve gestire i conflitti in modo elegante
- L'interfaccia utente deve essere reattiva su diverse dimensioni e orientamenti dello schermo
- L'autenticazione deve essere sicura con una corretta gestione della sessione
- Il deep linking deve essere configurato correttamente per i flussi di navigazione esterni
- La reimpostazione della password basata su OTP richiede una corretta gestione della sessione
- Il caricamento delle icone deve gestire elegantemente i fallimenti di rete con fallback locali
- Il processo di build Android deve essere configurato correttamente con tutti i plugin e le dipendenze richieste

## Dipendenze
- @supabase/supabase-js per l'integrazione del client Supabase
- @react-native-async-storage/async-storage per l'archiviazione dei dati locali
- @react-native-ml-kit/text-recognition per la funzionalità OCR
- react-native-onesignal per l'integrazione OneSignal
- pacchetti expo-* per varie funzionalità Expo
- lucide-react-native per le icone dell'interfaccia utente
- react-native-reanimated per le animazioni
- react-native-gesture-handler per i gesti
- react-native-safe-area-context per la gestione dell'area sicura
- react-native-svg per la grafica SVG
- react-native-calendars per i componenti dell'interfaccia utente del calendario
- lodash per le funzioni di utilità
- @react-native-google-signin/google-signin per l'autenticazione Google
- expo-auth-session per i flussi OAuth
- expo-linking per il deep linking
- whatwg-fetch per le richieste di rete
- expo-modules-autolinking per il collegamento dei moduli nativi

## Pattern di Utilizzo degli Strumenti
- Expo CLI per il server di sviluppo e il testing
- EAS CLI per la build e la distribuzione agli app store
- Jest per i test unitari con @testing-library/react-native
- ESLint e Prettier per la qualità e la formattazione del codice
- TypeScript per il controllo dei tipi
- Supabase CLI per lo sviluppo locale e le migrazioni del database
- Git per il controllo della versione con GitHub per il repository remoto
- LoggingService per la registrazione centralizzata in tutta l'applicazione
- Expo Router per il routing basato su file e il deep linking
- IconService per la gestione delle icone con chiamate API remote e fallback locali
- Gradle per l'automazione della build Android e la gestione delle dipendenze