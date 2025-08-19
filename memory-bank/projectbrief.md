# Project Brief: MyFrigo - Gestore Intelligente degli Alimenti

## Panoramica
MyFrigo è un'applicazione mobile cross-platform costruita con React Native ed Expo che aiuta gli utenti a gestire il loro inventario alimentare domestico. L'app tiene traccia delle date di scadenza, invia notifiche locali per i prodotti in scadenza e fornisce statistiche sui consumi per minimizzare lo spreco alimentare. Presenta un'interfaccia utente moderna con supporto per temi chiari/scuri e utilizza Supabase come backend per l'archiviazione del database, l'autenticazione e le funzioni serverless.

L'applicazione ha recentemente subito miglioramenti significativi al suo sistema di autenticazione, inclusa la migrazione a un flusso di reimpostazione della password basato su OTP e la stabilizzazione del login di Google con una corretta configurazione OAuth. L'app presenta anche un sistema sofisticato e robusto di gestione delle icone per le categorie di prodotti con ricerca locale intelligente e feedback chiaro all'utente per le icone mancanti.

## Requisiti Fondamentali
- Gestione dell'inventario dei prodotti con dettagli su quantità, marca e date
- Notifiche locali affidabili per i prodotti in scadenza
- Molteplici modi per aggiungere prodotti: inserimento manuale, scansione di codici a barre e foto con OCR
- Sincronizzazione in tempo reale con un database PostgreSQL
- Autenticazione sicura con Row Level Security
- Statistiche e report sui consumi
- Interfaccia utente reattiva con supporto per temi chiari/scuri
- Funzionalità affidabile di reimpostazione della password tramite OTP anziché link
- Configurazione corretta del deep linking per i flussi di autenticazione mobile
- Integrazione con OneSignal per le notifiche push
- Sistema robusto di gestione delle icone per le categorie di prodotti con fallback remoto e locale
- Configurazione e distribuzione affidabili delle build native Android e iOS

## Obiettivi
- Aiutare gli utenti a ridurre lo spreco alimentare monitorando le date di scadenza
- Fornire un'interfaccia intuitiva per la gestione dell'inventario alimentare domestico
- Consentire agli utenti di prendere decisioni di acquisto migliori tramite le statistiche sui consumi
- Garantire che i dati siano sincronizzati tra i dispositivi con aggiornamenti in tempo reale
- Offrire un'esperienza utente fluida su piattaforme iOS e Android
- Fornire un sistema di autenticazione sicuro e affidabile con feedback chiaro all'utente
- Assicurarsi che le operazioni di reimpostazione della password funzionino senza problemi e senza messaggi di errore confusi
- Mantenere un'interfaccia utente visivamente accattivante con caricamento corretto delle risorse e fallback
- Garantire build e distribuzioni affidabili delle app native per Android e iOS

## Ambito del Progetto
In ambito:
- Applicazione mobile per iOS e Android
- Backend Supabase con database PostgreSQL
- Sistema di autenticazione con email/password e Google Sign-In
- Sistema di notifica locale per gli avvisi di scadenza
- Funzionalità di gestione dei prodotti (aggiungi, modifica, elimina, contrassegna come consumato)
- Capacità di scansione di codici a barre e OCR
- Statistiche e report sui consumi
- Gestione delle impostazioni (preferenze di notifica, tema)
- Flusso di reimpostazione della password basato su OTP
- Integrazione OneSignal per le notifiche push
- Strumenti diagnostici avanzati per la risoluzione dei problemi
- Sistema di gestione delle icone con chiamate API remote e fallback locali
- Configurazione e distribuzione delle build native Android e iOS

Fuori ambito:
- Applicazione desktop
- Integrazione hardware fisico
- Integrazione con servizi di consegna di terze parti
- Gestione delle ricette (prevista per versioni future)
- Funzionalità sociali (previste per versioni future)