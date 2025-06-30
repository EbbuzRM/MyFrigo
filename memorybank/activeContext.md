# Active Context

## 🔥 Focus attuale
- **[IN CORSO]** Correzione dell'errore `Cannot read property 'DATE' of undefined`.
- Verifica e stabilizzazione dell'integrazione con Firebase (Firestore).

## ✅ Recenti cambiamenti
- Risolto problema di build Android con Expo aggiungendo:
  - `compileSdkVersion 34` in build.gradle
  - Dipendenze: `metro-react-native-babel-transformer` e `expo-asset`
- Aggiornata versione di Kotlin per compatibilità con AGP e plugin Expo.
- Rimosso `getAnalytics()` (incompatibilità React Native).
- Allineate librerie principali (`expo-router`, `react-native`, `firebase`).

## 🗺️ Prossimi passi
- **[TASK]** Verificare e correggere tutti i riferimenti a `product.date` nel codice, sostituendoli con `product.expirationDate`.
  - **File critici da controllare**:
    - `NotificationService.ts`
    - `StorageService.ts`
    - `ProductCard.tsx`
    - `manual-entry.tsx`
- Verifica e test dei flussi di scansione e lettura dei dati.
- Configurazioni finali per rilascio build interna.

## ⚡️ Decisioni e considerazioni
- Quando l'app è stabile aggiornare la versione **Expo SDK 51** con piu recente.
- Utilizzare Firebase Firestore come database principale dei prodotti.
