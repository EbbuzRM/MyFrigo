
import { Product, ProductCategory } from '@/types/Product';
import { NotificationService } from './NotificationService';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabaseClient';
import { Platform } from 'react-native';
import { snakeToCamel, camelToSnake } from '../utils/caseConverter';
import { randomUUID } from 'expo-crypto';

export interface AppSettings {
  notifications_enabled: boolean;
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

// Note: In Supabase, we don't need to define collection names as constants
// as we interact with tables directly.

export class StorageService {

  // Categories are now stored in the 'categories' table, not in a JSON document.
  // This part needs to be redesigned based on the new table structure if needed.
  // For now, we'll return an empty array as a placeholder.
  static async getCustomCategories(): Promise<ProductCategory[]> {
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      return snakeToCamel(data) || [];
    } catch (error) {
      console.error('Error getting categories from Supabase:', error);
      return [];
    }
  }

  static async saveCustomCategories(categories: ProductCategory[]): Promise<void> {
    try {
      // Assuming 'categories' table has 'id' as primary key.
      // Upsert will insert new categories and update existing ones.
      const { error } = await supabase.from('categories').upsert(camelToSnake(categories));
      if (error) throw error;
    } catch (error) {
      console.error('Error saving categories to Supabase:', error);
      throw error;
    }
  }

  // Products
  static async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      return snakeToCamel(data) || [];
    } catch (error) {
      console.error('Error getting products from Supabase:', error);
      return [];
    }
  }

  static listenToProducts(callback: (products: Product[]) => void): () => void {
    const channel = supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
        const products = await this.getProducts();
        callback(products);
      })
      .subscribe();

    // Initial fetch
    this.getProducts().then(callback);

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
      return snakeToCamel(data);
    } catch (error) {
      console.error(`Error getting product by ID ${productId}:`, error);
      return null;
    }
  }

  static async getUserProfile(userId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  static async saveProduct(product: Partial<Product>): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('User not authenticated to save product.');
      }
      const userId = session.user.id;

      const productToUpsert = { ...product };
      if (!productToUpsert.id) {
        productToUpsert.id = randomUUID();
      }

      const productWithUser = {
        ...productToUpsert,
        userId: userId,
      };

      const { data: existingProduct, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productToUpsert.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') { // Ignore 'not found' errors
        throw fetchError;
      }
      
      const { error } = await supabase.from('products').upsert(camelToSnake(productWithUser));
      if (error) throw error;

      const settings = await this.getSettings();
      const fullProduct = productWithUser as Product;

      if (existingProduct) {
         if (existingProduct.expiration_date !== fullProduct.expirationDate ||
            (existingProduct.status !== 'active' && fullProduct.status === 'active') ||
            (existingProduct.status === 'active' && fullProduct.status !== 'active')) {
          await NotificationService.cancelNotification(fullProduct.id!);
          if (fullProduct.status === 'active' && settings.notifications_enabled) {
            await NotificationService.scheduleExpirationNotification(fullProduct, settings.notificationDays);
          }
        }
      } else {
         if (fullProduct.status === 'active' && settings.notifications_enabled) {
            await NotificationService.scheduleExpirationNotification(fullProduct, settings.notificationDays);
        }
      }

      if (fullProduct.barcode) {
        await this.saveProductTemplate(fullProduct);
      }
    } catch (error) {
      console.error('Error saving product to Supabase:', error);
      throw error;
    }
  }

  static async deleteProduct(productId: string): Promise<void> {
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      await NotificationService.cancelNotification(productId);
    } catch (error) {
      console.error('Error deleting product from Supabase:', error);
      throw error;
    }
  }

  static async updateProductStatus(productId: string, status: Product['status']): Promise<void> {
    try {
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (fetchError) throw fetchError;
        if (!product) {
            console.error(`Product with ID ${productId} not found.`);
            return;
        }

        const oldStatus = product.status;
        const updatedFields: Partial<Product> = { status };

        if (status === 'consumed' || status === 'expired') {
            updatedFields.consumedDate = (status === 'consumed' && !product.consumed_date)
                ? new Date().toISOString()
                : product.consumed_date;

            if (oldStatus === 'active') {
                await NotificationService.cancelNotification(productId);
            }
        } else if (status === 'active' && oldStatus !== 'active') {
            const settings = await this.getSettings();
            if (settings.notifications_enabled) {
                await NotificationService.scheduleExpirationNotification(snakeToCamel(product), settings.notificationDays);
            }
        }

        const { error: updateError } = await supabase
            .from('products')
            .update(camelToSnake(updatedFields))
            .eq('id', productId);

        if (updateError) throw updateError;

    } catch (error) {
        console.error('Error updating product status in Supabase:', error);
        throw error;
    }
  }

  // Barcode Templates
  static async getProductTemplate(barcode: string): Promise<ProductTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('barcode_templates')
        .select('*')
        .eq('barcode', barcode)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return snakeToCamel(data);
    } catch (error) {
      console.error(`Error getting product template for barcode ${barcode}:`, error);
      return null;
    }
  }

  static async saveProductTemplate(product: Product): Promise<void> {
    if (!product.barcode) return;
    try {
      const templateData: Partial<ProductTemplate> = {
        barcode: product.barcode,
        name: product.name,
        brand: product.brand,
        category: product.category,
        imageUrl: product.imageUrl ?? undefined,
      };
      const { error } = await supabase.from('barcode_templates').upsert(camelToSnake(templateData));
      if (error) throw error;
    } catch (error) {
      console.error(`Error saving product template for barcode ${product.barcode}:`, error);
    }
  }

  // History is now just a filter on the products table
  static listenToHistory(callback: (history: Product[]) => void): () => void {
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

  static async getHistory(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'consumed')
        .order('consumed_date', { ascending: false });
      if (error) throw error;
      return snakeToCamel(data) || [];
    } catch (error) {
      console.error('Error getting history from Supabase:', error);
      return [];
    }
  }
  
  // No need for addToHistory, as updateProductStatus handles it.

  static async restoreConsumedProduct(productId: string): Promise<void> {
    try {
        await this.updateProductStatus(productId, 'active');
        console.log(`Product ${productId} restored successfully.`);
    } catch (error) {
        console.error(`Error restoring product ${productId}:`, error);
        throw error;
    }
  }

  // Settings
  static listenToSettings(callback: (settings: AppSettings) => void): () => void {
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

  static async getSettings(): Promise<AppSettings> {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .single();
      if (error) throw error;
      return snakeToCamel(data);
    } catch (error) {
      console.error('Error getting settings from Supabase:', error);
      return {
        notifications_enabled: true,
        notificationDays: 3,
        theme: 'auto',
      };
    }
  }

  static async updateSettings(newSettings: Partial<AppSettings>): Promise<void> {
    try {
      const { error } = await supabase
        .from('app_settings')
        .update(camelToSnake(newSettings))
        .eq('id', 1);
      if (error) throw error;
      
      if (Platform.OS !== 'web') {
        const updatedSettings = await this.getSettings();
        if (Object.prototype.hasOwnProperty.call(newSettings, 'notifications_enabled') || Object.prototype.hasOwnProperty.call(newSettings, 'notificationDays')) {
          const products = await this.getProducts();
          const activeProducts = products.filter(p => p.status === 'active');
          await Notifications.cancelAllScheduledNotificationsAsync();
          if (updatedSettings.notifications_enabled) {
            await NotificationService.scheduleMultipleNotifications(activeProducts, updatedSettings);
          }
        }
      }
    } catch (error) {
      console.error('Error updating settings in Supabase:', error);
      throw error;
    }
  }

  // Data management - These need to be re-implemented for Supabase
  static async exportData(): Promise<string> {
    console.warn("exportData is not implemented for Supabase yet.");
    return "{}";
  }

  static async importData(data: string): Promise<void> {
    console.warn("importData is not implemented for Supabase yet.");
  }

  static async clearAllData(): Promise<void> {
    try {
        const { error: productError } = await supabase.from('products').delete().neq('id', 0); // delete all
        if(productError) throw productError;

        const { error: templateError } = await supabase.from('barcode_templates').delete().neq('barcode', '0'); // delete all
        if(templateError) throw templateError;

        await Notifications.cancelAllScheduledNotificationsAsync();
        console.log('All data cleared from Supabase and notifications cancelled.');
    } catch (error) {
        console.error('Error clearing data from Supabase:', error);
        throw error;
    }
  }
}
