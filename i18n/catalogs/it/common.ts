// common.ts — italian catalog for the `common` domain.
//
// exports: commonIt
// used_by: i18n/catalogs/it/index.ts
// rules:   Semantic keys only — never derived from the italian text.
// agent:   executor | 2026-09-22 | Fase B i18n | gruppo 1: navigazione, pulsanti, dialoghi, caricamenti, stati vuoti

export const commonIt = {
  loading: 'Caricamento…',
  loadingProducts: 'Caricamento prodotti...',
  retry: 'Riprova',
  cancel: 'Annulla',
  ok: 'OK',
  error: 'Errore',
  done: 'Finito',
  continue: 'Continua',
  delete: 'Elimina',
  back: 'Indietro',
  goBack: 'Torna indietro',
  requiredField: 'Campo obbligatorio',
  optionalField: 'Campo facoltativo',
  confirm: 'Conferma',
  save: 'Salva',
  close: 'Chiudi',

  // Navigation: tab bar labels (visible + accessibility)
  tabHome: 'Home',
  tabProducts: 'Prodotti',
  tabAdd: 'Aggiungi',
  tabHistory: 'Storico',
  tabSettings: 'Impostazioni',
  tabHomeLabel: 'Tab Home',
  tabProductsLabel: 'Tab Prodotti',
  tabAddLabel: 'Tab Aggiungi',
  tabHistoryLabel: 'Tab Storico',
  tabSettingsLabel: 'Tab Impostazioni',

  // Navigation: not-found screen
  notFoundTitle: 'Pagina non trovata',
  redirectingMessage: 'Stiamo per reindirizzarti...',

  // Error boundary fallback
  errorTitle: 'Qualcosa è andato storto',
  errorRetryMessage: "Riprova ad aprire l'app",
  errorRetryHint: "Tenta di ripristinare l'app dopo un errore",

  // Shared modal actions / headers
  saving: 'Salvataggio...',
  closeModalLabel: 'Chiudi modal',
  tapToCloseHint: 'Tocca per chiudere',

  // Shared password input
  passwordPlaceholder: 'Inserisci password',
  showPasswordLabel: 'Mostra password',
  hidePasswordLabel: 'Nascondi password',

  // Shared form action buttons
  saveProduct: 'Salva Prodotto',
  updateProduct: 'Aggiorna Prodotto',
  saveProductHint: 'Salva il nuovo prodotto',
  updateProductHint: 'Aggiorna il prodotto esistente',

  // Global update modal
  closeUpdateModalLabel: 'Chiudi modal aggiornamento',
  updateAvailableTitle: 'Aggiornamento Disponibile',
  updateDownloading: 'Download in corso... {{percent}}%',
  updateInstalling: 'Installazione in corso...',
  updateInstallComplete: 'Installazione completata!',
  updateDownloaded: 'Aggiornamento scaricato con successo!',
  updateError: "Errore durante l'aggiornamento. Riprova più tardi.",
  updateNewVersion: 'Nuova versione disponibile: {{version}}',
  currentVersion: 'Versione attuale:',
  newVersion: 'Nuova versione:',
  notAvailable: 'N/D',
  restartApp: 'Riavvia App',
  later: 'Più tardi',
  installNow: 'Installa ora',
} satisfies Record<string, string>;
