/**
 * Costanti testuali utilizzate nell'applicazione,
 * raggruppate per facilitare future integrazioni di internazionalizzazione (i18n).
 */
export const DASHBOARD_CONTENT = {
    TITLE: 'La Tua Dispensa',
    SUBTITLE: 'Tutto sotto controllo',
    TITLE_EXPIRING: 'In Scadenza a Breve',
    TITLE_STATS: 'Statistiche Rapide',
    BTN_ADD: 'Aggiungi',
    BTN_SCAN: 'Scansiona',
    MENU_SETTINGS: 'Impostazioni',
    MENU_LOGOUT: 'Logout',
    STATS_ACTIVE: 'Prodotti Attivi',
    STATS_EXPIRED: 'Prodotti Scaduti',
    EMPTY_EXPIRING: (days: number) => `Nessun prodotto in scadenza nei prossimi ${days} giorni. Ottimo!`,
};
