import { Product, ProductCategory } from '@/types/Product';
import { NotificationService } from './NotificationService';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabaseClient';
import { Platform } from 'react-native';
import {
  convertProductToCamelCase,
  convertProductToSnakeCase,
  convertCategoryToCamelCase,
  convertCategoryToSnakeCase,
  convertSettingsToCamelCase,
  convertSettingsToSnakeCase,
  convertProductsToCamelCase,
  convertCategoriesToCamelCase,
  convertTemplateToCamelCase,
  convertTemplateToSnakeCase
} from '../utils/caseConverter';
import { randomUUID } from 'expo-crypto';
import { LoggingService } from './LoggingService';

/**
 * Interfaccia per il profilo utente
 */
export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  one_signal_player_id?: string | null;
  push_token?: string | null;
  updated_at: string | null;
  created_at: string | null;
}

export interface AppSettings {
  notificationDays: number;
  theme: 'light' | 'dark' | 'auto';
}

export interface ProductTemplate {
  barcode: string;
  name: string;
  brand?: string;
  category: string;
  imageUrl?: string;
}

export class StorageService {

  /**
   * Recupera tutte le categorie personalizzate
   * @returns Promise con la lista delle categorie personalizzate
   */
  static async getCustomCategories(): Promise<ProductCategory[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_default', false)
        .returns<Record<string, unknown>[]>();
      if (error) throw error;
      if (!data) return [];

      const camelCasedData = convertCategoriesToCamelCase(data);

      // THIS IS THE FIX
      const parsedData = camelCasedData.map(category => {
        if (category.localIcon && typeof category.localIcon === 'string') {
          try {
            return { ...category, localIcon: JSON.parse(category.localIcon) };
          } catch (e) {
            LoggingService.error('StorageService', `Failed to parse localIcon for category ${category.id}`, e);
            return { ...category, localIcon: undefined }; // or some fallback
          }
        }
        return category;
      });

      return parsedData;
    } catch (error: any) {
      LoggingService.error('StorageService', 'Error getting categories from Supabase', error);
      return [];
    }
  }

  /**
   * Aggiunge una nuova categoria
   * @param category Categoria da aggiungere
   * @returns Promise con la categoria aggiunta
   * @throws Error se si verifica un errore durante l'aggiunta
   */
  static async addCategory(category: ProductCategory): Promise<ProductCategory> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(convertCategoryToSnakeCase(category))
        .select()
        .single();
      if (error) throw error;
      return convertCategoryToCamelCase(data);
    } catch (error: any) {
      LoggingService.error('StorageService', 'Error adding category to Supabase', error);
      throw error;
    }
  }

  /**
   * Aggiorna una categoria esistente
   * @param category Dati parziali della categoria da aggiornare
   * @returns Promise che si risolve quando la categoria è stata aggiornata
   * @throws Error se si verifica un errore durante l'aggiornamento
   */
  static async updateCategory(category: Partial<ProductCategory>): Promise<void> {
    try {
      LoggingService.info('StorageService', `Updating category ${category.id} with data:`, category);
      
      // Prepara i dati per l'aggiornamento
      const updateData = { ...category };
      
      // Se c'è un icon o localIcon, crea un oggetto specifico per l'aggiornamento
      if (updateData.icon || updateData.localIcon !== undefined) {
        // Crea un oggetto specifico per l'aggiornamento che include solo i campi necessari
        const dataToUpdate: Record<string, unknown> = {
          id: updateData.id
        };
        
        // Aggiungi l'icona se presente
        if (updateData.icon) {
          dataToUpdate.icon = updateData.icon;
          LoggingService.info('StorageService', `Updating icon to: ${updateData.icon}`);
        }
        
        // Aggiungi l'icona locale se presente
        if (updateData.localIcon !== undefined) {
          dataToUpdate.local_icon = JSON.stringify(updateData.localIcon);
          LoggingService.info('StorageService', `Updating localIcon to:`, updateData.localIcon);
        }
        
        // Esegui l'aggiornamento
        const { error } = await supabase
          .from('categories')
          .update(dataToUpdate)
          .eq('id', category.id!);
          
        if (error) {
          LoggingService.error('StorageService', 'Supabase update error', error);
          throw error;
        }
        
        LoggingService.info('StorageService', `Category ${category.id} updated successfully`);
      } else {
        LoggingService.info('StorageService', `No icon or localIcon to update for category ${category.id}`);
        
        const { error } = await supabase
          .from('categories')
          .update(convertCategoryToSnakeCase(updateData))
          .eq('id', category.id!);
          
        if (error) throw error;
      }
    } catch (error: any) {
      LoggingService.error('StorageService', 'Error updating category in Supabase', error);
      throw error;
    }
  }

  /**
   * Elimina una categoria
   * @param categoryId ID della categoria da eliminare
   * @returns Promise che si risolve quando la categoria è stata eliminata
   * @throws Error se si verifica un errore durante l'eliminazione
   */
  static async deleteCategory(categoryId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);
      if (error) throw error;
    } catch (error: any) {
      LoggingService.error('StorageService', 'Error deleting category from Supabase', error);
      throw error;
    }
  }

  /**
   * Recupera tutti i prodotti dell'utente corrente, ordinati per data di scadenza.
   * @returns Promise con i prodotti e l'eventuale errore
   */
  static async getProducts(): Promise<{ data: Product[] | null, error: Error | null }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return { data: [], error: null };
      }
      const userId = session.user.id;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .returns<Record<string, unknown>[]>();
        
      if (error) throw error;

      const products = data ? convertProductsToCamelCase(data) : [];
      
      // Ordina i prodotti per data di scadenza (più vicina prima)
      products.sort((a, b) => {
        const dateA = new Date(a.expirationDate);
        const dateB = new Date(b.expirationDate);
        return dateA.getTime() - dateB.getTime();
      });

      return { data: products, error: null };
    } catch (error: any) {
      LoggingService.error('StorageService', 'Error in getProducts', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Ascolta i cambiamenti nella tabella dei prodotti
   * @param callback Funzione da chiamare quando ci sono cambiamenti
   * @returns Funzione per annullare la sottoscrizione
   */
  static listenToProducts(callback: () => void): (() => void) {
    const channel = supabase
      .channel('public:products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          LoggingService.info('StorageService', 'Change detected in products table, invoking callback');
          callback();
        }
      )
      .subscribe((status: 'SUBSCRIBED' | 'CLOSED' | 'CHANNEL_ERROR') => {
        if (status === 'SUBSCRIBED') {
          LoggingService.info('StorageService', 'Realtime channel subscribed for products');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Recupera un prodotto specifico dal database
   * @param productId ID del prodotto da recuperare
   * @returns Promise con il prodotto o null se non trovato
   */
  static async getProductById(productId: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()
        .returns<Record<string, unknown>>();
      if (error) throw error;
      return convertProductToCamelCase(data);
    } catch (error: any) {
      LoggingService.error('StorageService', `Error getting product by ID ${productId}`, error);
      return null;
    }
  }


  /**
   * Recupera il profilo utente dal database
   * @param userId ID dell'utente
   * @returns Profilo utente o null se non trovato
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
        .returns<Record<string, unknown>>();
      if (error) throw error;
      return data as unknown as UserProfile;
    } catch (error: any) {
      LoggingService.error('StorageService', 'Error getting user profile', error);
      return null;
    }
  }

  /**
   * Salva un prodotto nel database
   * @param product Prodotto da salvare
   * @returns Promise che si risolve quando il prodotto è stato salvato
   * @throws Error se l'utente non è autenticato o se si verifica un errore durante il salvataggio
   */
  static async saveProduct(product: Partial<Product>): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('User not authenticated to save product.');
      }
      const userId = session.user.id;

      // Crea una copia del prodotto per evitare modifiche all'oggetto originale
      const productToUpsert: Partial<Product> = { ...product };
      
      // Genera un ID se non presente e imposta lo stato predefinito
      if (!productToUpsert.id) {
        productToUpsert.id = randomUUID();
        if (!productToUpsert.status) {
          productToUpsert.status = 'active';
        }
      }

      // Aggiungi l'ID utente al prodotto
      const productWithUser = {
        ...productToUpsert,
        user_id: userId,
      };
      
      // Converti le chiavi in snake_case e salva nel database
      const { error } = await supabase
        .from('products')
        .upsert(convertProductToSnakeCase(productWithUser));
        
      if (error) throw error;

      // Se il prodotto ha un codice a barre, salva anche il template
      if (product.barcode) {
        await this.saveProductTemplate(convertProductToCamelCase(productWithUser) as Product);
      }
    } catch (error: any) {
      LoggingService.error('StorageService', 'Error saving product to Supabase', error);
      throw error;
    }
  }

  /**
   * Elimina un prodotto dal database
   * @param productId ID del prodotto da eliminare
   * @returns Promise che si risolve quando il prodotto è stato eliminato
   * @throws Error se si verifica un errore durante l'eliminazione
   */
  static async deleteProduct(productId: string): Promise<void> {
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
    } catch (error: any) {
      LoggingService.error('StorageService', 'Error deleting product from Supabase', error);
      throw error;
    }
  }

  /**
   * Aggiorna lo stato di un prodotto
   * @param productId ID del prodotto da aggiornare
   * @param status Nuovo stato del prodotto
   * @returns Promise che si risolve quando lo stato è stato aggiornato
   * @throws Error se si verifica un errore durante l'aggiornamento
   */
  static async updateProductStatus(productId: string, status: Product['status']): Promise<void> {
    try {
        const updatedFields: Partial<Product> = { status };

        if (status === 'consumed') {
            updatedFields.consumedDate = new Date().toISOString();
        }

        const { error: updateError } = await supabase
            .from('products')
            .update(convertProductToSnakeCase(updatedFields))
            .eq('id', productId);

        if (updateError) throw updateError;

    } catch (error: any) {
      LoggingService.error('StorageService', 'Error updating product status in Supabase', error);
      throw error;
    }
  }

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
        .single()
        .returns<Record<string, unknown>>();
      if (error && error.code !== 'PGRST116') throw error;
      return data ? convertTemplateToCamelCase(data) : null;
    } catch (error: any) {
      LoggingService.error('StorageService', `Error getting product template for barcode ${barcode}`, error);
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
        .upsert(convertTemplateToSnakeCase(templateData));
        
      if (error) throw error;
      
      LoggingService.info('StorageService', `Product template saved for barcode ${product.barcode}`);
    } catch (error: any) {
      LoggingService.error('StorageService', `Error saving product template for barcode ${product.barcode}`, error);
      // Non propaghiamo l'errore per non bloccare il flusso principale
    }
  }

  /**
   * Ascolta i cambiamenti nella cronologia dei prodotti consumati
   * @param callback Funzione da chiamare quando ci sono cambiamenti
   * @returns Funzione per annullare la sottoscrizione
   */
  static listenToHistory(callback: (history: Product[]) => void): (() => void) {
     const channel = supabase
      .channel('public:products:history')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: 'status=eq.consumed' }, async () => {
        const history = await this.getHistory();
        callback(history);
      })
      .subscribe();
      
    this.getHistory().then(callback);

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Recupera la cronologia dei prodotti consumati
   * @returns Promise con la lista dei prodotti consumati
   */
  static async getHistory(): Promise<Product[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return [];
      const userId = session.user.id;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'consumed')
        .order('consumed_date', { ascending: false })
        .returns<Record<string, unknown>[]>();
      if (error) throw error;
      return data ? convertProductsToCamelCase(data) : [];
    } catch (error: any) {
      LoggingService.error('StorageService', 'Error getting history from Supabase', error);
      return [];
    }
  }
  
  /**
   * Ripristina un prodotto consumato impostandolo come attivo
   * @param productId ID del prodotto da ripristinare
   * @returns Promise che si risolve quando il prodotto è stato ripristinato
   * @throws Error se si verifica un errore durante il ripristino
   */
  static async restoreConsumedProduct(productId: string): Promise<void> {
    try {
        await this.updateProductStatus(productId, 'active');
        LoggingService.info('StorageService', `Product ${productId} restored successfully`);
    } catch (error: any) {
        LoggingService.error('StorageService', `Error restoring product ${productId}`, error);
        throw error;
    }
  }

  /**
   * Ascolta i cambiamenti nelle impostazioni dell'app
   * @param callback Funzione da chiamare quando ci sono cambiamenti
   * @returns Funzione per annullare la sottoscrizione
   */
  static listenToSettings(callback: (settings: AppSettings) => void): (() => void) {
    const channel = supabase
      .channel('public:app_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, async () => {
        const settings = await this.getSettings();
        callback(settings);
      })
      .subscribe();

    this.getSettings().then(callback);

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Recupera le impostazioni dell'app
   * @returns Promise con le impostazioni dell'app
   */
  static async getSettings(): Promise<AppSettings> {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .single()
        .returns<Record<string, unknown>>();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        return convertSettingsToCamelCase(data);
      }

      LoggingService.info('StorageService', 'No settings found, creating default settings');
      const defaultSettings = {
        id: 1,
        notification_days: 3,
        theme: 'auto',
      };
      
      const { error: insertError } = await supabase
        .from('app_settings')
        .insert(defaultSettings);

      if (insertError) {
        throw insertError;
      }
      
      return convertSettingsToCamelCase(defaultSettings);

    } catch (error: any) {
      LoggingService.error('StorageService', 'Error getting or creating settings in Supabase', error);
      return {
        notificationDays: 3,
        theme: 'auto',
      };
    }
  }

  /**
   * Aggiorna le impostazioni dell'app
   * @param newSettings Nuove impostazioni da applicare
   * @returns Promise con le impostazioni aggiornate o null in caso di errore
   * @throws Error se si verifica un errore durante l'aggiornamento
   */
  static async updateSettings(newSettings: Partial<AppSettings>): Promise<AppSettings | null> {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .upsert({ id: 1, ...convertSettingsToSnakeCase(newSettings) })
        .select()
        .single()
        .returns<Record<string, unknown>>();
        
      if (error) throw error;
      
      const updatedSettings = convertSettingsToCamelCase(data);

      if (Platform.OS !== 'web') {
        if (Object.prototype.hasOwnProperty.call(newSettings, 'notificationDays')) {
          const { data: products, error: productsError } = await this.getProducts();
          if (products && !productsError) {
            const activeProducts = products.filter(p => p.status === 'active');
            await Notifications.cancelAllScheduledNotificationsAsync();
            await NotificationService.scheduleMultipleNotifications(activeProducts, updatedSettings);
          }
        }
      }
      return updatedSettings;
    } catch (error: any) {
      LoggingService.error('StorageService', 'Error updating settings in Supabase', error);
      throw error;
    }
  }

  /**
   * Esporta tutti i dati dell'utente in formato JSON
   * @returns Promise con i dati esportati in formato stringa JSON
   */
  static async exportData(): Promise<string> {
    LoggingService.info('StorageService', "exportData is not implemented for Supabase yet.");
    return "{}";
  }

  /**
   * Importa i dati dell'utente da una stringa JSON
   * @param data Dati da importare in formato stringa JSON
   * @returns Promise che si risolve quando i dati sono stati importati
   */
  static async importData(data: string): Promise<void> {
    LoggingService.info('StorageService', "importData is not implemented for Supabase yet.");
  }

  /**
   * Cancella tutti i dati dell'utente
   * @returns Promise che si risolve quando tutti i dati sono stati cancellati
   * @throws Error se si verifica un errore durante la cancellazione
   */
  static async clearAllData(): Promise<void> {
    try {
        const { error: productError } = await supabase.from('products').delete().neq('id', 0);
        if(productError) throw productError;

        const { error: templateError } = await supabase.from('barcode_templates').delete().neq('barcode', '0');
        if(templateError) throw templateError;

        await Notifications.cancelAllScheduledNotificationsAsync();
        LoggingService.info('StorageService', 'All data cleared from Supabase and notifications cancelled');
    } catch (error: any) {
        LoggingService.error('StorageService', 'Error clearing data from Supabase', error);
        throw error;
    }
  }

  /**
   * Recupera i prodotti scaduti da più di un giorno e che sono ancora attivi.
   * Questi prodotti sono candidati per essere spostati nella cronologia.
   * @returns Promise con la lista dei prodotti scaduti da più di un giorno.
   */
  static async getExpiredProducts(): Promise<Product[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return [];
      }
      const userId = session.user.id;

      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      oneDayAgo.setHours(0, 0, 0, 0); // Inizio del giorno (00:00:00)

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active') // Solo prodotti ancora attivi
        .lt('expiration_date', oneDayAgo.toISOString()) // Scaduti prima di un giorno fa
        .order('expiration_date', { ascending: true }) // Ordina per data di scadenza
        .returns<Record<string, unknown>[]>();
        
      if (error) {
        LoggingService.error('StorageService', 'Error getting expired products', error);
        throw error;
      }

      return data ? convertProductsToCamelCase(data) : [];
    } catch (error: any) {
      LoggingService.error('StorageService', 'Error in getExpiredProducts', error);
      return [];
    }
  }

  /**
   * Sposta i prodotti specificati nella cronologia impostandone lo stato a 'consumed'.
   * @param productIds ID dei prodotti da spostare.
   * @returns Promise che si risolve quando i prodotti sono stati spostati.
   */
  static async moveProductsToHistory(productIds: string[]): Promise<void> {
    if (productIds.length === 0) {
      LoggingService.info('StorageService', 'No product IDs provided to move to history.');
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          status: 'consumed',
          consumed_date: new Date().toISOString() // Imposta la data di consumo
        })
        .in('id', productIds);

      if (updateError) {
        LoggingService.error('StorageService', 'Error updating products status to consumed', updateError);
        throw updateError;
      }

      LoggingService.info('StorageService', `${productIds.length} products moved to history.`);
    } catch (error: any) {
      LoggingService.error('StorageService', 'Error in moveProductsToHistory', error);
      throw error; // Propaga l'errore per permettere la gestione al chiamante
    }
  }
}
