# Progress

## ✅ Cosa funziona
- Build Android riuscita con Expo
- Inizializzazione e configurazione di Firebase.
- Integrazione dei font e dei principali plugin.
- Navigazione di base e caricamento dei dati dei prodotti.
- Scansione dei prodotti (lettura dati) e lettura data di scadenza.
- Inserimento manuale dei prodotti.
- Visualizzazione dei dati dei prodotti.
- Eliminazione manuale dei prodotti.
- Tema Chiaro e Scuro.
- Gestione delle Categorie Personalizzate.
- Filtro prodotti per categoria.
- Ordinamento prodotti per scadenza.

## ⚡️ Da implementare
- Notifiche in-app per scadenze dei prodotti.

## 🐞 Problemi noti
- **Errore `Cannot read property 'DATE' of undefined`**:
  - **Causa**: `product` è `undefined` in qualche contesto
  - **Soluzione implementata**: Aggiunti controlli di sicurezza nel componente `ProductCard`
  - **Stato**: Risolto



## ➕ Prossimi passi
- Finalizzazione dei flussi principali (inserimento prodotti e alert scadenze).
- Testing e bugfix generale.
- Implementazione futura di analisi dati e connessione domotica.
- UI/UX miglioramenti per una navigazione fluida e intuitiva.
- Sincronizzazione dei dati tra dispositivi diversi.
- Opzioni di condivisione dei dati dei prodotti.
- Integrazione di servizi di social sharing per condividere la lista dei prodotti.
