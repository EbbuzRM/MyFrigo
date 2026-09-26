// dashboard.ts — italian catalog for the `dashboard` domain.
//
// exports: dashboardIt
// used_by: i18n/catalogs/it/index.ts
// rules:   Semantic keys only — never derived from the italian text.
//          Plural forms follow i18next `_one`/`_other` suffixes with `{{count}}`.
// agent:   executor | 2026-09-22 | Fase B i18n | gruppo 3a: dashboard

export const dashboardIt = {
  title: 'Dashboard',
  welcomeBack: 'Bentornato, {{name}}!',
  pantryTitle: 'La Tua Dispensa',
  subtitle: 'Tutto sotto controllo',
  titleExpiring: 'In Scadenza a Breve',
  titleStats: 'Statistiche Rapide',
  statsActive: 'Prodotti Attivi',
  statsExpired: 'Prodotti Scaduti',
  emptyExpiring_one: 'Nessun prodotto in scadenza nel prossimo {{count}} giorno. Ottimo!',
  emptyExpiring_other: 'Nessun prodotto in scadenza nei prossimi {{count}} giorni. Ottimo!',
  expiringProductBrand: ', marca {{brand}}',
  expiringProductLabel: '{{name}}{{brand}}, scade il {{date}}, stato: {{status}}',
  expiringProductWithoutDateLabel: '{{name}}{{brand}}, stato: {{status}}',
  expiringProductHint: 'Tocca per visualizzare i dettagli del prodotto',
  unnamedProduct: 'Prodotto senza nome',
  statusFrozen: 'Congelato',
  statusDateNotSet: 'Data non impostata',
  statusDateInvalid: 'Data non valida',
  statusExpired: 'Scaduto',
  statusExpiresToday: 'Scade oggi',
  statusExpiresInDays_one: '{{count}} giorno',
  statusExpiresInDays_other: '{{count}} giorni',
  notificationsLabel: 'Notifiche',
  profileLabel: 'Profilo',
  addProduct: 'Aggiungi',
  scanProduct: 'Scansiona',
  addProductLabel: 'Aggiungi prodotto',
  scanBarcodeLabel: 'Scansiona codice a barre',
  menuSettings: 'Impostazioni',
  menuLogout: 'Logout',
  closeMenuLabel: 'Chiudi menu',
  settingsLabel: 'Impostazioni',
  logoutLabel: 'Esci',
} satisfies Record<string, string>;
