
# System Patterns

## 🏗️ Architettura generale
- App mobile basata su **Expo SDK 51** e **React Native 0.74.5**.
- Backend dati e sincronizzazione forniti da **Firebase Firestore**.
- Navigazione gestita da **expo-router**.

## ⚡️ Pattern principali
- Modularizzazione dei componenti React Native.
- Utilizzo dei servizi esterni (Firebase) centralizzati nel file `firebase-config.ts`.
- Integrazione dei font e dei sistemi di gestione dei dati via `@expo/google-fonts` e `expo-font`.
- Notifiche e alert gestiti tramite `expo-notifications`.

## � Convenzioni sui Nomi
- **Date di Scadenza**: Utilizzare sempre `expirationDate` per le date di scadenza dei prodotti. Evitare nomi generici come `date` per prevenire ambiguità e errori.

## �🔗 Relazioni chiave dei componenti
- **App.tsx** ➔ Entry point dell’app
- **Firebase Service** ➔ Interfaccia dati e storage
- **UI Components** ➔ Consumano dati e li rendono visivamente accessibili
