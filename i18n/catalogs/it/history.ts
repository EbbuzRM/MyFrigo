// history.ts — italian catalog for the `history` domain.
//
// exports: historyIt
// used_by: i18n/catalogs/it/index.ts
// rules:   Semantic keys only — never derived from the italian text.
// agent:   executor | 2026-09-22 | Fase B i18n | gruppo 3a: storico
//          (gruppo 1: caricamenti HistoryLoadingState)

export const historyIt = {
  title: 'Cronologia',
  empty: 'Nessun elemento nella cronologia',
  loadingStats: 'Caricamento statistiche...',
  loadingStatsSubtitle: 'Analisi dei tuoi prodotti e abitudini in corso',
  headerTitle: 'Le Tue Abitudini',
  headerSubtitle: 'Analisi dei tuoi consumi e sprechi',
  statsTotal: 'Totale Gestiti',
  statsConsumed: 'Consumati',
  statsWasted: 'Sprecati',
  statsWasteRate: '% Spreco',
  historyAllTitle: 'Storico Completo',
  consumedTitle: 'Prodotti Consumati',
  expiredTitle: 'Prodotti Scaduti',
  detailFallbackTitle: 'Dettaglio Storico',
  consumedEmpty: 'Nessun prodotto consumato di recente.',
  detailEmpty: 'Nessun prodotto da mostrare.',
  loadError: 'Si è verificato un errore durante il caricamento dei prodotti.',
  dataLoadError: 'Errore durante il caricamento dei dati',
  loadTimeoutError: 'Caricamento troppo lungo, riprova più tardi',
  restoreTitle: 'Prodotto Ripristinato',
  restoreMessage: 'Il prodotto è stato spostato nuovamente nella tua dispensa.',
  restoreErrorTitle: 'Errore',
  restoreErrorMessage: 'Si è verificato un errore durante il ripristino del prodotto.',
  restoreProductLabel: 'Ripristina prodotto',
  restoreProduct: 'Ripristina',
  restoreHint: 'Riporta il prodotto nella tua dispensa.',
  cardStatusLabel: 'Stato: {{status}}',
  cardDateLabel: '{{status}}: {{date}}',
  statusConsumed: 'Consumato',
  statusExpired: 'Scaduto',
  backLabel: 'Torna indietro',
  suggestionInfoTitle: 'Elemento consumato per errore?',
  suggestionInfoText: "Clicca sul riquadro 'Consumati' per visualizzare la lista e ripristinare i prodotti.",
  suggestionWarningTitle: 'Attenzione ai Prodotti Scaduti',
  suggestionWarningText: 'Circa il {{waste}}% dei tuoi prodotti è scaduto. Prova a controllare le date più spesso.',
  suggestionPositiveTitle: 'Ottima Gestione!',
  suggestionPositiveText: 'Meno del {{waste}}% dei tuoi prodotti scade. Continua così!',
} satisfies Record<string, string>;
