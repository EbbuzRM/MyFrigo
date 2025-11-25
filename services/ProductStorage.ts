
import { Product } from '@/types/Product';
import { supabase } from './supabaseClient';
import {
  convertProductToCamelCase,
  convertProductToSnakeCase,
  convertProductsToCamelCase,
} from '../utils/caseConverter';
import { randomUUID } from 'expo-crypto';
import { LoggingService } from './LoggingService';
import { TemplateService } from './TemplateService'; // Import for template saving

export class ProductStorage {

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
        .eq('user_id', userId);

      if (error) throw error;

      const products = data ? convertProductsToCamelCase(data) : [];

      products.sort((a, b) => {
        const dateA = new Date(a.expirationDate);
        const dateB = new Date(b.expirationDate);
        return dateA.getTime() - dateB.getTime();
      });

      return { data: products, error: null };
    } catch (error: any) {
      LoggingService.error('ProductStorage', 'Error in getProducts', error);
      return { data: null, error: error as Error };
    }
  }

  static listenToProducts(callback: () => void): (() => void) {
    const channel = supabase
      .channel('public:products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          LoggingService.info('ProductStorage', 'Change detected in products table, invoking callback');
          callback();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          LoggingService.info('ProductStorage', 'Realtime channel subscribed for products');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }

  static async getProductById(productId: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      if (error) throw error;
      return convertProductToCamelCase(data);
    } catch (error: any) {
      LoggingService.error('ProductStorage', `Error getting product by ID ${productId}`, error);
      return null;
    }
  }

  static async saveProduct(product: Partial<Product>): Promise<void> {
    try {
      LoggingService.info('ProductStorage', 'Starting product save process');

      // Aumentato timeout a 30s per debug
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout during product save')), 15000);
      });

      const savePromise = this.performSave(product);

      await Promise.race([savePromise, timeoutPromise]);

    } catch (error: any) {
      LoggingService.error('ProductStorage', 'Error saving product to Supabase', error);
      throw error;
    }
  }

  private static async performSave(product: Partial<Product>): Promise<void> {
    LoggingService.info('ProductStorage', 'performSave: Getting session...');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('User not authenticated to save product.');
    }
    const userId = session.user.id;
    LoggingService.info('ProductStorage', 'performSave: User authenticated, proceeding with save');

    const productToUpsert: Partial<Product> = { ...product };

    if (!productToUpsert.id) {
      productToUpsert.id = randomUUID();
      if (!productToUpsert.status) {
        productToUpsert.status = 'active';
      }
    }

    const productWithUser: Partial<Product> & { userId: string } = {
      ...productToUpsert,
      userId: userId,
    };

    const snakeCaseProduct = convertProductToSnakeCase(productWithUser);
    LoggingService.info('ProductStorage', `performSave: Attempting to upsert product to Supabase. Data: ${JSON.stringify(snakeCaseProduct)}`);

    const { error } = await supabase
      .from('products')
      .upsert(snakeCaseProduct as any);

    if (error) {
      LoggingService.error('ProductStorage', 'Supabase upsert error:', error);
      throw error;
    }

    LoggingService.info('ProductStorage', 'Product successfully saved to Supabase');

    // Salva il template se c'è un barcode, ma non bloccare il salvataggio principale
    if (productWithUser.barcode) {
      try {
        LoggingService.info('ProductStorage', 'Saving product template');
        await TemplateService.saveProductTemplate(productWithUser as Product);
        LoggingService.info('ProductStorage', 'Product template saved successfully');
      } catch (templateError) {
        LoggingService.error('ProductStorage', 'Error saving template (non-blocking):', templateError);
        // Non propaghiamo l'errore del template per non bloccare il salvataggio principale
      }
    }

    LoggingService.info('ProductStorage', 'Product save process completed successfully');
  }

  static async deleteProduct(productId: string): Promise<void> {
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
    } catch (error: any) {
      LoggingService.error('ProductStorage', 'Error deleting product from Supabase', error);
      throw error;
    }
  }

  static async updateProductStatus(productId: string, status: Product['status']): Promise<void> {
    try {
      const updatedFields: Partial<Product> = { status };

      if (status === 'consumed') {
        updatedFields.consumedDate = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('products')
        .update(convertProductToSnakeCase(updatedFields) as any)
        .eq('id', productId);

      if (updateError) throw updateError;

    } catch (error: any) {
      LoggingService.error('ProductStorage', 'Error updating product status in Supabase', error);
      throw error;
    }
  }

  static async getExpiredProducts(): Promise<Product[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return [];
      }
      const userId = session.user.id;

      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      twoDaysAgo.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .lt('expiration_date', twoDaysAgo.toISOString())
        .order('expiration_date', { ascending: true });

      if (error) {
        LoggingService.error('ProductStorage', 'Error getting expired products', error);
        throw error;
      }

      return data ? convertProductsToCamelCase(data) : [];
    } catch (error: any) {
      LoggingService.error('ProductStorage', 'Error in getExpiredProducts', error);
      return [];
    }
  }

  static async getTrulyExpiredProducts(): Promise<Product[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return [];
      }
      const userId = session.user.id;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'expired');

      if (error) {
        LoggingService.error('ProductStorage', 'Error getting truly expired products', error);
        throw error;
      }

      return data ? convertProductsToCamelCase(data) : [];
    } catch (error: any) {
      LoggingService.error('ProductStorage', 'Error in getTrulyExpiredProducts', error);
      return [];
    }
  }

  static async moveProductsToHistory(productIds: string[]): Promise<void> {
    if (productIds.length === 0) {
      LoggingService.info('ProductStorage', 'No product IDs provided to move to history.');
      return;
    }

    try {
      const updateData = { status: 'expired' as const };
      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .in('id', productIds);

      if (updateError) {
        LoggingService.error('ProductStorage', 'Error updating products status to expired', updateError);
        throw updateError;
      }

      LoggingService.info('ProductStorage', `${productIds.length} products moved to history as expired.`);
    } catch (error: any) {
      LoggingService.error('ProductStorage', 'Error in moveProductsToHistory', error);
      throw error;
    }
  }

  static async updateProductImage(productId: string, imageUrl: string): Promise<void> {
    try {
      const updateData = { image_url: imageUrl };
      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId);

      if (error) {
        throw error;
      }
      LoggingService.info('ProductStorage', `Immagine aggiornata per il prodotto ${productId}`);
    } catch (error: any) {
      LoggingService.error('ProductStorage', `Errore durante l'aggiornamento dell'immagine per il prodotto ${productId}`, error);
      throw error;
    }
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
        .order('consumed_date', { ascending: false });
      if (error) throw error;
      return data ? convertProductsToCamelCase(data) : [];
    } catch (error: any) {
      LoggingService.error('ProductStorage', 'Error getting history from Supabase', error);
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
      LoggingService.info('ProductStorage', `Product ${productId} restored successfully`);
    } catch (error: any) {
      LoggingService.error('ProductStorage', `Error restoring product ${productId}`, error);
      throw error;
    }
  }
}
