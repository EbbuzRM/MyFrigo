# Riepilogo Sessione di Debug Detox

Questo documento riassume le azioni intraprese e i problemi riscontrati durante le sessioni di debug dei test E2E con Detox.

## Lavoro della Sessione Precedente (Risolto)

*   **Problema:** La build di Detox per Android falliva con `java.lang.OutOfMemoryError: Java heap space`.
*   **Causa:** Memoria insufficiente allocata al processo Gradle.
*   **Soluzione:** Aumentata la memoria massima (`-Xmx`) e la `MaxMetaspaceSize` per Gradle nel file `android/gradle.properties`.
*   **Risultato:** Build di Detox completata con successo.

## Lavoro della Sessione Corrente (In Corso)

### 1. Debug Iniziale dei Test Detox

*   **Problema:** I test Detox fallivano con timeout nel hook `beforeAll` (`await device.launchApp()`), suggerendo un crash all'avvio dell'app o un problema di comunicazione.
*   **Azione:** Analizzato il file `e2e/starter.test.js`.
*   **Problema:** La logica `beforeEach` nel test file causava il logout forzato dell'utente prima di ogni test, portando a fallimenti nei test che richiedevano l'utente loggato.
*   **Soluzione:** Ristrutturato il file `e2e/starter.test.js`:
    *   Rimosso il blocco `beforeEach`.
    *   Utilizzato un singolo `beforeAll` per lanciare l'app una volta.
    *   Ordinati i test in sequenza (login, poi navigazione) per mantenere lo stato di login.
*   **Risultato:** I test di login (`should display login screen on app start` e `should login with test credentials and navigate to dashboard`) hanno iniziato a passare.

### 2. Identificazione e Aggiunta dei `testID` Mancanti

*   **Problema:** Molti test fallivano con `No views in hierarchy found matching...` anche dopo la ristrutturazione, indicando `testID` mancanti.
*   **Azione:** Ricercati e aggiunti i `testID` nei componenti dell'app:
    *   `app/(tabs)/_layout.tsx`: Aggiunti `tabBarTestID` a tutti i `Tabs.Screen` (`dashboard-tab`, `products-tab`, `add-tab`, `history-tab`, `settings-tab`).
    *   `app/login.tsx`: Verificato che i `testID` (`login-screen`, `email-input`, `password-input`, `login-button`) fossero già presenti.
    *   `app/(tabs)/index.tsx`: Verificato che `index-screen` fosse già presente.
    *   `app/(tabs)/products.tsx`: Aggiunto `testID="products-list"` al `FlatList`.
    *   `components/ProductCard.tsx`: Aggiunto `testID="product-item-${index}"` al `TouchableOpacity` principale.
    *   `app/product-detail.tsx`: Aggiunti `testID` a `SafeAreaView` (`product-detail-screen`), `Text` del nome (`product-name`), `Text` della scadenza (`product-expiry`), e `TouchableOpacity` del pulsante indietro (`back-button`).
    *   `app/(tabs)/add.tsx`: Aggiunti `testID` a `SafeAreaView` (`add-product-screen`), `AddMethodCard` per scansione (`photo-capture-button`), e `AddMethodCard` per inserimento manuale (`manual-entry-button`).
*   **Risultato:** I `testID` sono stati aggiunti.

### 3. Debug dei Problemi di Timing e Navigazione

*   **Problema:** Dopo l'aggiunta dei `testID`, i test di navigazione fallivano ancora, spesso con timeout o elementi non trovati.
*   **Azione:**
    *   Aggiunto `waitFor` con timeout di 10 secondi al test `should navigate to products list from tab bar`.
    *   Aggiunto `waitFor` con timeout di 50 secondi al test `should navigate to add product screen` e un ritardo di 1 secondo prima del tap.
    *   Aggiunto `waitFor` con timeout di 5 secondi al test `should handle product detail navigation`.
    *   Eseguiti test con screenshot (`--take-screenshots failing`) per analizzare lo stato dell'app al momento del fallimento.
*   **Risultato:**
    *   Il test `should navigate to products list from tab bar` ora **PASSA**.
    *   Il test `should navigate to add product screen` continua a **FALLIRE** per timeout. Lo screenshot mostra che l'app rimane sulla dashboard dopo il tap sul tab "Aggiungi". La navigazione non avviene.
    *   Il test `should handle product detail navigation` continua a **FALLIRE** per timeout. Lo screenshot mostra che la schermata di dettaglio *è* visibile, ma Detox non la riconosce come tale.

## Problemi Ancora Aperti

1.  **Navigazione alla schermata "Aggiungi Prodotto" (`add-product-screen`):
    *   **Sintomo:** Il test `should navigate to add product screen` fallisce per timeout (60 secondi). L'app non naviga dalla dashboard alla schermata "Aggiungi Prodotto" quando si tocca il tab "Aggiungi".
    *   **Diagnosi:** Sembra essere un problema fondamentale nella logica di navigazione dell'app o nel rendering del componente `add.tsx` quando attivato tramite il tab, non un semplice problema di timing del test.

2.  **Visibilità della schermata "Dettagli Prodotto" (`product-detail-screen`):
    *   **Sintomo:** Il test `should handle product detail navigation` fallisce per timeout (5 secondi). Lo screenshot mostra chiaramente la schermata di dettaglio del prodotto, ma Detox non la riconosce come visibile.
    *   **Diagnosi:** Questo è probabilmente un problema di percezione della visibilità da parte di Detox, forse a causa di animazioni, layout complessi o un timeout troppo breve.

## Prossimi Passi

*   **Per la schermata "Dettagli Prodotto":** Aumentare ulteriormente il timeout del `waitFor` per `product-detail-screen` (es. a 20 secondi) per vedere se il test passa.
*   **Per la schermata "Aggiungi Prodotto":**
    *   Revertire le modifiche al test (`setTimeout` e timeout esteso) in `e2e/starter.test.js` per questo test, dato che non hanno risolto il problema.
    *   Catturare i logcat (`adb logcat`) durante il tentativo di navigazione al tab "Aggiungi" per cercare errori o avvisi che possano spiegare perché la navigazione non avviene.
    *   Considerare di isolare il test di navigazione "Aggiungi Prodotto" in un file separato per eliminare qualsiasi interferenza.
