// content.ts — content module.
//
// exports: DASHBOARD_CONTENT
// used_by: app\(tabs)\index.tsx
//                   components\dashboard\DashboardHeader.tsx
//                   components\dashboard\ProfileMenu.tsx
//                   components\dashboard\QuickActions.tsx
//                   components\dashboard\__tests__\DashboardHeader.test.tsx
//                   components\dashboard\__tests__\ProfileMenu.test.tsx
//                   components\dashboard\__tests__\QuickActions.test.tsx
// rules:   All text strings must be defined inside `DASHBOARD_CONTENT`, not as raw strings in components or tests.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

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
