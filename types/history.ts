// history.ts — history module.
//
// exports: SuggestionType | Suggestion | HistoryStatsData | HistoryCalculationResult | HistoryLoadingState | UseHistoryDataReturn
// used_by: components\history\HistorySuggestions.tsx
//                   hooks\useHistoryData.ts
//                   utils\historyCalculations.ts
// rules:   - Module must maintain strict separation between types, data fetching (hooks/useHistoryData.ts), and computation (utils/historyCalculations.ts) - no business logic in types
//          - All interfaces must remain exported as they are consumed by three separate modules (components, hooks, utils)
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

/**
 * History Module Types
 * @module types/history
 */

import { Product } from './Product';

/**
 * Tipo di suggerimento per la schermata storico
 */
export type SuggestionType = 'info' | 'warning' | 'positive';

/**
 * Rappresenta un suggerimento per l'utente nella schermata storico
 */
export interface Suggestion {
  /** Tipo di suggerimento che determina lo stile visivo */
  type: SuggestionType;
  /** Titolo del suggerimento */
  title: string;
  /** Testo descrittivo del suggerimento */
  text: string;
}

/**
 * Statistiche calcolate dalla cronologia prodotti
 */
export interface HistoryStatsData {
  /** Numero totale di prodotti consumati */
  consumedCount: number;
  /** Numero totale di prodotti scaduti */
  expiredCount: number;
  /** Percentuale di spreco (prodotti scaduti / totale) */
  wastePercentage: number;
  /** Numero totale di prodotti nella cronologia */
  totalCount: number;
}

/**
 * Risultato del calcolo statistiche con suggerimenti
 */
export interface HistoryCalculationResult {
  /** Dati statistici */
  stats: HistoryStatsData;
  /** Lista di suggerimenti generati */
  suggestions: Suggestion[];
}

/**
 * Stato del caricamento dati storico
 */
export interface HistoryLoadingState {
  /** Indica se i dati sono in caricamento */
  loading: boolean;
  /** Indica se è in corso un refresh manuale */
  refreshing: boolean;
  /** Messaggio di errore se presente */
  error: string | null;
}

/**
 * Hook return type per useHistoryData
 */
export interface UseHistoryDataReturn extends HistoryLoadingState {
  /** Lista completa della cronologia prodotti */
  allHistory: Product[];
  /** Funzione per caricare i dati */
  loadData: (forceRefresh?: boolean) => Promise<void>;
  /** Funzione per impostare lo stato di refresh */
  setRefreshing: (value: boolean) => void;
  /** Funzione per pulire i timeout */
  cleanup: () => void;
  /** Riferimento per tracciare se i dati sono stati caricati */
  dataLoadedRef: React.MutableRefObject<boolean>;
  /** Riferimento per tracciare l'ultimo caricamento */
  lastLoadTimeRef: React.MutableRefObject<number>;
}
