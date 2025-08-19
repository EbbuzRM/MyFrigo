/**
 * Sistema di colori centralizzato per MyFrigo
 * 
 * Questo file definisce tutti i colori utilizzati nell'applicazione,
 * sia per il tema chiaro che per quello scuro.
 * 
 * Utilizzare queste costanti invece di colori hardcoded per garantire
 * coerenza visiva e facilitare la manutenzione.
 */

// Colori base - tema chiaro
export const LIGHT = {
  // Colori primari
  PRIMARY: '#2563EB',
  PRIMARY_LIGHT: '#3b82f6',
  PRIMARY_DARK: '#1d4ed8',
  
  // Colori di stato
  SUCCESS: '#16a34a',
  SUCCESS_LIGHT: '#4ade80',
  SUCCESS_DARK: '#15803d',
  
  WARNING: '#f59e0b',
  WARNING_LIGHT: '#fcd34d',
  WARNING_DARK: '#d97706',
  
  ERROR: '#dc2626',
  ERROR_LIGHT: '#ef4444',
  ERROR_DARK: '#b91c1c',
  
  INFO: '#2563eb',
  INFO_LIGHT: '#60a5fa',
  INFO_DARK: '#1d4ed8',
  
  // Colori di testo
  textPrimary: '#000000',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  textDisabled: '#d1d5db',
  
  // Colori di sfondo
  BACKGROUND: '#f8f9fa',
  CARD_BACKGROUND: '#ffffff',
  INPUT_BACKGROUND: '#f1f5f9',
  
  // Colori di bordo
  BORDER: '#e2e8f0',
  BORDER_LIGHT: '#f1f5f9',
  BORDER_DARK: '#cbd5e1',
};

// Colori base - tema scuro
export const DARK = {
  // Colori primari
  PRIMARY: '#58a6ff',
  PRIMARY_LIGHT: '#79c0ff',
  PRIMARY_DARK: '#388bfd',
  
  // Colori di stato
  SUCCESS: '#4ade80',
  SUCCESS_LIGHT: '#86efac',
  SUCCESS_DARK: '#22c55e',
  
  WARNING: '#fcd34d',
  WARNING_LIGHT: '#fde68a',
  WARNING_DARK: '#f59e0b',
  
  ERROR: '#f87171',
  ERROR_LIGHT: '#fca5a5',
  ERROR_DARK: '#ef4444',
  
  INFO: '#60a5fa',
  INFO_LIGHT: '#93c5fd',
  INFO_DARK: '#3b82f6',
  
  // Colori di testo
  textPrimary: '#ffffff',
  textSecondary: '#c9d1d9',
  textTertiary: '#8b949e',
  textDisabled: '#6e7681',
  
  // Colori di sfondo
  BACKGROUND: '#0d1117',
  CARD_BACKGROUND: '#161b22',
  INPUT_BACKGROUND: '#21262d',
  
  // Colori di bordo
  BORDER: '#30363d',
  BORDER_LIGHT: '#21262d',
  BORDER_DARK: '#484f58',
};

// Colori semantici per componenti specifici
export const COMPONENT_COLORS = {
  // Colori per le categorie di prodotti
  CATEGORY: {
    DEFAULT: '#808080',
    DAIRY: '#3b82f6',    // Latticini
    FRUIT: '#ef4444',    // Frutta
    VEGETABLE: '#22c55e', // Verdura
    MEAT: '#f97316',     // Carne
    FISH: '#06b6d4',     // Pesce
    BAKERY: '#f59e0b',   // Panetteria
    OTHER: '#8b5cf6',    // Altro
  },
  
  // Colori per i tipi di notifica
  NOTIFICATION: {
    EXPIRING_SOON: '#f59e0b',
    EXPIRED: '#ef4444',
  },
  
  // Colori per i tipi di prodotto
  PRODUCT_STATUS: {
    ACTIVE: '#22c55e',
    CONSUMED: '#3b82f6',
    EXPIRED: '#ef4444',
  },
};

/**
 * Funzione di utilità per ottenere i colori in base al tema corrente
 * @param isDarkMode Indica se il tema corrente è scuro
 * @returns Un oggetto contenente tutti i colori per il tema corrente
 */
export const getThemeColors = (isDarkMode: boolean) => {
  return isDarkMode ? DARK : LIGHT;
};

/**
 * Funzione di utilità per ottenere un colore con opacità
 * @param color Il colore in formato esadecimale
 * @param opacity L'opacità desiderata (0-1)
 * @returns Il colore con l'opacità specificata
 */
export const withOpacity = (color: string, opacity: number): string => {
  // Converti l'opacità in formato esadecimale
  const hexOpacity = Math.round(opacity * 255).toString(16).padStart(2, '0');
  
  // Se il colore è in formato #RGB, convertilo in #RRGGBB
  if (color.length === 4) {
    const r = color[1];
    const g = color[2];
    const b = color[3];
    color = `#${r}${r}${g}${g}${b}${b}`;
  }
  
  // Rimuovi il carattere # e aggiungi l'opacità
  return `${color}${hexOpacity}`;
};

// Esporta un oggetto COLORS per un accesso più semplice
export const COLORS = {
  LIGHT,
  DARK,
  COMPONENT: COMPONENT_COLORS,
  getThemeColors,
  withOpacity,
};

export default COLORS;
