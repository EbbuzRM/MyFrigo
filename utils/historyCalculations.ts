/**
 * History Calculations Utilities
 * @module utils/historyCalculations
 * @description Utility functions for calculating history statistics and generating suggestions
 */

import { Product } from '@/types/Product';
import { 
  HistoryStatsData, 
  HistoryCalculationResult, 
  Suggestion 
} from '@/types/history';
import { LoggingService } from '@/services/LoggingService';

/**
 * Costanti per la generazione di suggerimenti
 */
const WASTE_WARNING_THRESHOLD = 30; // Percentuale oltre la quale mostrare avvertimento
const WASTE_POSITIVE_THRESHOLD = 10; // Percentuale sotto la quale mostrare feedback positivo
const MIN_PRODUCTS_FOR_POSITIVE = 5; // Minimo prodotti per feedback positivo

/**
 * Calcola le statistiche dalla cronologia prodotti
 * @param products - Lista di prodotti dalla cronologia
 * @returns Dati statistici calcolati
 */
export function calculateHistoryStats(products: Product[]): HistoryStatsData {
  const startTime = performance.now();
  
  let consumedCount = 0;
  let expiredCount = 0;
  
  for (let i = 0; i < products.length; i++) {
    if (products[i].status === 'consumed') {
      consumedCount++;
    } else {
      expiredCount++;
    }
  }
  
  const totalCount = consumedCount + expiredCount;
  const wastePercentage = totalCount > 0 ? Math.round((expiredCount / totalCount) * 100) : 0;
  
  const endTime = performance.now();
  LoggingService.debug('HistoryCalculations', `Stats calculated in ${endTime - startTime}ms`);
  
  return {
    consumedCount,
    expiredCount,
    wastePercentage,
    totalCount,
  };
}

/**
 * Genera suggerimenti basati sulle statistiche della cronologia
 * @param stats - Dati statistici calcolati
 * @returns Lista di suggerimenti personalizzati
 */
export function generateSuggestions(stats: HistoryStatsData): Suggestion[] {
  const suggestions: Suggestion[] = [
    {
      type: 'info',
      title: 'Elemento consumato per errore?',
      text: "Clicca sul riquadro 'Consumati' per visualizzare la lista e ripristinare i prodotti."
    }
  ];
  
  if (stats.totalCount > 0) {
    if (stats.wastePercentage > WASTE_WARNING_THRESHOLD) {
      suggestions.push({
        type: 'warning',
        title: 'Attenzione ai Prodotti Scaduti',
        text: `Circa il ${stats.wastePercentage}% dei tuoi prodotti è scaduto. Prova a controllare le date più spesso.`
      });
    } else if (stats.wastePercentage < WASTE_POSITIVE_THRESHOLD && stats.totalCount > MIN_PRODUCTS_FOR_POSITIVE) {
      suggestions.push({
        type: 'positive',
        title: 'Ottima Gestione!',
        text: `Meno del ${stats.wastePercentage}% dei tuoi prodotti scade. Continua così!`
      });
    }
  }
  
  return suggestions;
}

/**
 * Calcola statistiche e genera suggerimenti in un'unica operazione
 * @param products - Lista di prodotti dalla cronologia
 * @returns Risultato completo con statistiche e suggerimenti
 */
export function calculateHistoryData(products: Product[]): HistoryCalculationResult {
  const stats = calculateHistoryStats(products);
  const suggestions = generateSuggestions(stats);
  
  return {
    stats,
    suggestions,
  };
}
