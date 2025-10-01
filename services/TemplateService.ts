import { Product } from '@/types/Product';
import { supabase } from './supabaseClient';
import {
  convertTemplateToCamelCase,
  convertTemplateToSnakeCase
} from '../utils/caseConverter';
import { LoggingService } from './LoggingService';

/**
 * Interfaccia per il template di prodotto
 */
export interface ProductTemplate {
  barcode: string;
  name: string;
  brand?: string;
  category: string;
  imageUrl?: string;
}

/**
 * Servizio per la gestione dei template di prodotti
 */
export class TemplateService {

  /**
   * Recupera un template di prodotto dal database
   * @param barcode Codice a barre del prodotto
   * @returns Promise con il template o null se non trovato
   */
  static async getProductTemplate(barcode: string): Promise<ProductTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('barcode_templates')
        .select('*')
        .eq('barcode', barcode)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data ? convertTemplateToCamelCase(data) : null;
    } catch (error: any) {
      LoggingService.error('TemplateService', `Error getting product template for barcode ${barcode}`, error);
      return null;
    }
  }

  /**
   * Salva un template di prodotto nel database
   * @param product Prodotto da cui creare il template
   * @returns Promise che si risolve quando il template è stato salvato
   */
  static async saveProductTemplate(product: Product): Promise<void> {
    // Verifica che il prodotto abbia un codice a barre
    if (!product.barcode) return;

    try {
      // Crea il template con i dati essenziali
      const templateData: ProductTemplate = {
        barcode: product.barcode,
        name: product.name,
        brand: product.brand,
        category: product.category,
        imageUrl: product.imageUrl,
      };

      // Converti le chiavi in snake_case e salva nel database
      const { error } = await supabase
        .from('barcode_templates')
        .upsert(convertTemplateToSnakeCase(templateData) as any);

      if (error) throw error;

      LoggingService.info('TemplateService', `Product template saved for barcode ${product.barcode}`);
    } catch (error: any) {
      LoggingService.error('TemplateService', `Error saving product template for barcode ${product.barcode}`, error);
      // Non propaghiamo l'errore per non bloccare il flusso principale
    }
  }
}