# Pattern di Sistema: MyFrigo - Gestore Intelligente degli Alimenti

## Architettura del Sistema
MyFrigo segue un'architettura client-server con un client mobile React Native e un backend Supabase. L'app mobile utilizza Expo per lo sviluppo cross-platform e sfrutta varie librerie Expo per le capacità del dispositivo. Il backend è costituito da un database PostgreSQL, Supabase Auth per l'autenticazione e Supabase Functions per le operazioni serverless. OneSignal viene utilizzato per le notifiche push remote, mentre Expo Notifications gestisce le notifiche locali.

L'app è strutturata con un sistema di navigazione basato su schede, con ogni scheda che rappresenta un'area funzionale principale. La gestione dello stato è gestita tramite React Context, con contesti separati per autenticazione, prodotti, impostazioni, categorie e tema. I servizi vengono utilizzati per interagire con sistemi esterni e operazioni complesse.

## Decisioni Tecniche Chiave
- Scelto React Native con Expo per lo sviluppo mobile cross-platform per mirare sia a iOS che ad Android con un'unica codebase
- Selezionato Supabase come soluzione backend per il suo approccio integrato a database, autenticazione e funzioni serverless
- Rimosso il sistema di resilienza poiché causava più problemi che benefici
- Implementati meccanismi standard di gestione degli errori e di retry dove necessario
- Utilizzate notifiche locali per gli avvisi di scadenza per garantire l'affidabilità senza richiedere una connettività di rete costante
- Implementata la Row Level Security in Supabase per garantire la privacy e la sicurezza dei dati
- Scelto Expo Router per la navigazione per sfruttare il routing basato su file e le capacità di deep linking
- Migrato al flusso di reimpostazione della password basato su OTP anziché sui link per una migliore affidabilità mobile
- Implementato il flusso PKCE per l'autenticazione Google con una corretta configurazione OAuth
- Integrato IconService per una robusta gestione delle icone di categoria con ricerca local-first e feedback chiaro all'utente per le icone mancanti.
- Utilizzato il sistema di build di Expo per la distribuzione nativa Android e iOS
- Gestita la compatibilità della versione Kotlin per le build Android

## Pattern di Design in Uso
- API Context per la gestione dello stato con un pattern provider per ogni area funzionale principale
- Pattern Service per incapsulare la logica di business e le interazioni API esterne
- Architettura UI basata su componenti con componenti riutilizzabili e componibili
- Pattern Hook per incapsulare la logica riutilizzabile (es. useProducts, useAuth, useSettings)
- Pattern Error Boundary per la gestione elegante degli errori imprevisti
- Pattern Event Emitter per la comunicazione tra componenti poco accoppiati
- Pattern Deep Linking per la gestione della navigazione esterna e dei flussi di autenticazione
- Pattern Fallback per il caricamento delle risorse con degrado elegante
- Pattern Native Module per funzionalità specifiche di Android/iOS
- Pattern Version Compatibility per la gestione delle dipendenze

## Relazioni tra Componenti
- AuthProvider avvolge l'intera applicazione per fornire lo stato di autenticazione
- ProductProvider dipende da AuthProvider e SettingsProvider per gestire i dati dei prodotti e le notifiche
- SettingsProvider gestisce le impostazioni dell'app e i permessi di notifica
- ThemeProvider fornisce il contesto della modalità scura/chiara in tutta l'app
- CategoryProvider gestisce le categorie di prodotti e si integra con IconService
- Vari componenti UI consumano questi contesti per visualizzare i dati e gestire le interazioni dell'utente
- I servizi agiscono come intermediari tra contesti e sistemi esterni (Supabase, OneSignal, IconService, ecc.)
- Il componente NotFound gestisce il deep linking e il routing per i flussi di navigazione esterni
- Il flusso di reimpostazione della password è separato nei componenti ForgotPassword e PasswordResetForm

## Percorsi Critici di Implementazione
- Flusso di autenticazione con Supabase, inclusi registrazione, login, reimpostazione della password e gestione del profilo
- Gestione dei prodotti con sincronizzazione in tempo reale tra lo stato locale e il database Supabase
- Sistema di notifica con pianificazione, cancellazione e gestione delle notifiche locali e remote
- Strategie di caricamento e caching dei dati per fornire un'esperienza utente reattiva
- Gestione delle immagini per le foto dei prodotti con caching e gestione della memoria adeguati
- Gestione del deep linking per la reimpostazione della password, la conferma dell'email e la navigazione esterna
- Flusso di reimpostazione della password basato su OTP con gestione della sessione adeguata
- Autenticazione Google con flusso PKCE e corretta integrazione OAuth
- Caricamento e caching delle icone tramite IconService con chiamate API remote e fallback locali
- Configurazione e distribuzione della build nativa Android tramite Expo e Gradle
- Gestione della compatibilità della versione Kotlin per le build Android