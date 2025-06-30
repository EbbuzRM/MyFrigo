# MyFrigo Project Documentation

## projectbrief.md
# MyFrigo - Project Brief
MyFrigo è un’app mobile progettata per aiutare famiglie e utenti a gestire la scadenza dei prodotti nel frigorifero e in dispensa, evitando sprechi e semplificandone l’organizzazione.

## productContext.md
# Product Context
MyFrigo nasce per aiutare chiunque voglia tenere sotto controllo scadenze e prodotti nel frigo e in dispensa. Risolve problemi legati alla scadenza dei prodotti e alla mancanza di strumenti chiari e intuitivi per la loro gestione.

## activeContext.md
# Active Context
Focus attuale sulla stabilizzazione dell'integrazione con Firebase e sulla compatibilità con Kotlin e AGP. Recentemente aggiornata versione Kotlin e rimossa `getAnalytics()` per compatibilità mobile.

## systemPatterns.md
# System Patterns
Architettura basata su Expo SDK 51 e React Native 0.74.5. Backend dati e sincronizzazione gestiti da Firebase Firestore. Navigazione implementata con `expo-router`. Pattern principali includono componentizzazione dei servizi e dei componenti visivi.

## techContext.md
# Tech Context
Utilizza Expo SDK 51, TypeScript e librerie principali come `react-native-ml-kit/text-recognition`, `expo-camera`, `expo-notifications` e `firebase`. Ambiente di sviluppo basato su Node.js e Expo CLI. Gradle 8.8 e AGP 8.2.1, Kotlin 1.9.22.

## progress.md
# Progress
Cosa funziona: Inizializzazione e configurazione di Firebase, integrazione dei font e dei principali plugin, navigazione di base e caricamento dei dati dei prodotti.

Prossimi passi: Finalizzazione dei flussi principali (inserimento prodotti e alert scadenza), test e bugfix generale. Implementazioni future includeranno analisi dati e connessioni domotiche.

Problemi noti: Risoluzione plugin `expo-router` post pulizia dei node_modules e errori legati ad accessi a Firestore.

