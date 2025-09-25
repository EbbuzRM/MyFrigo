import { supabase } from './supabaseClient';
import { LoggingService } from './LoggingService';
import { Product } from '@/types/Product';

export interface MostConsumedProduct {
  id: string;
  name: string;
  quantity: number;
}

export interface MostWastedProduct {
  id: string;
  name: string;
  quantity: number;
}


export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color: (opacity: number) => string;
  }[];
}


export class StatisticsService {
  /**
   * Ottiene i prodotti più consumati dell'utente
   */
  static async getMostConsumedProducts(limit: number = 5): Promise<MostConsumedProduct[]> {
    try {
      LoggingService.info('StatisticsService', 'Fetching most consumed products');

      const { data, error } = await supabase
        .from('products')
        .select('name, quantity, status')
        .eq('status', 'consumed')
        .not('quantity', 'is', null)
        .order('quantity', { ascending: false })
        .limit(limit);

      if (error) {
        LoggingService.error('StatisticsService', 'Error fetching most consumed products:', error);
        return [];
      }

      // Raggruppa per nome e somma le quantità
      const productMap = new Map<string, number>();

      data?.forEach(product => {
        const current = productMap.get(product.name) || 0;
        productMap.set(product.name, current + (product.quantity || 0));
      });

      return Array.from(productMap.entries())
        .map(([name, quantity], index) => ({
          id: `consumed-${index}`,
          name,
          quantity
        }))
        .sort((a, b) => b.quantity - a.quantity);

    } catch (error) {
      LoggingService.error('StatisticsService', 'Failed to get most consumed products:', error);
      return [];
    }
  }

  /**
   * Ottiene i prodotti più sprecati (scaduti senza essere consumati)
   */
  static async getMostWastedProducts(limit: number = 5): Promise<MostWastedProduct[]> {
    try {
      LoggingService.info('StatisticsService', 'Fetching most wasted products');

      const { data, error } = await supabase
        .from('products')
        .select('name, quantity, status, expiration_date')
        .eq('status', 'expired')
        .not('quantity', 'is', null)
        .order('quantity', { ascending: false })
        .limit(limit);

      if (error) {
        LoggingService.error('StatisticsService', 'Error fetching most wasted products:', error);
        return [];
      }

      // Raggruppa per nome e somma le quantità
      const productMap = new Map<string, number>();

      data?.forEach(product => {
        const current = productMap.get(product.name) || 0;
        productMap.set(product.name, current + (product.quantity || 0));
      });

      return Array.from(productMap.entries())
        .map(([name, quantity], index) => ({
          id: `wasted-${index}`,
          name,
          quantity
        }))
        .sort((a, b) => b.quantity - a.quantity);

    } catch (error) {
      LoggingService.error('StatisticsService', 'Failed to get most wasted products:', error);
      return [];
    }
  }


  /**
   * Genera dati per i grafici delle statistiche
   */
  static async getChartData(): Promise<ChartData> {
    try {
      LoggingService.info('StatisticsService', 'Generating chart data');

      const { data: products, error } = await supabase
        .from('products')
        .select('status, created_at, expiration_date, consumed_date')
        .in('status', ['consumed', 'expired', 'active']);

      if (error) {
        LoggingService.error('StatisticsService', 'Error fetching chart data:', error);
        return this.getEmptyChartData();
      }

      // Raggruppa per mese
      const monthlyData = new Map<string, { consumed: number; expired: number; active: number }>();

      products?.forEach(product => {
        const date = product.consumed_date || product.expiration_date || product.created_at;
        if (!date) return;

        const monthKey = new Date(date).toISOString().substring(0, 7); // YYYY-MM

        const current = monthlyData.get(monthKey) || { consumed: 0, expired: 0, active: 0 };

        if (product.status === 'consumed') {
          current.consumed++;
        } else if (product.status === 'expired') {
          current.expired++;
        } else if (product.status === 'active') {
          current.active++;
        }

        monthlyData.set(monthKey, current);
      });

      // Prepara i dati per il grafico
      const labels: string[] = [];
      const consumedData: number[] = [];
      const expiredData: number[] = [];
      const activeData: number[] = [];

      // Ordina per mese
      const sortedMonths = Array.from(monthlyData.keys()).sort();

      sortedMonths.forEach(month => {
        const data = monthlyData.get(month)!;
        labels.push(month);
        consumedData.push(data.consumed);
        expiredData.push(data.expired);
        activeData.push(data.active);
      });

      return {
        labels,
        datasets: [
          {
            data: consumedData,
            color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})` // Verde per consumati
          },
          {
            data: expiredData,
            color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})` // Rosso per scaduti
          },
          {
            data: activeData,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})` // Blu per attivi
          }
        ]
      };

    } catch (error) {
      LoggingService.error('StatisticsService', 'Failed to generate chart data:', error);
      return this.getEmptyChartData();
    }
  }


  /**
   * Restituisce dati vuoti per il grafico in caso di errore
   */
  private static getEmptyChartData(): ChartData {
    return {
      labels: [],
      datasets: [{
        data: [],
        color: () => 'rgba(0, 0, 0, 0.1)'
      }]
    };
  }

  /**
   * Ottiene tutte le statistiche in una volta
   */
  static async getAllStatistics() {
    try {
      LoggingService.info('StatisticsService', 'Fetching all statistics');

      const [mostConsumed, mostWasted, chartData] = await Promise.all([
        this.getMostConsumedProducts(),
        this.getMostWastedProducts(),
        this.getChartData()
      ]);

      return {
        mostConsumed,
        mostWasted,
        chartData
      };

    } catch (error) {
      LoggingService.error('StatisticsService', 'Failed to get all statistics:', error);
      return {
        mostConsumed: [],
        mostWasted: [],
        chartData: this.getEmptyChartData()
      };
    }
  }
}
