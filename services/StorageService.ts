
import { Product, ProductCategory } from '@/types/Product';
import { NotificationService } from './NotificationService';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabaseClient';
import { Platform } from 'react-native';
import { convertObjectKeys, toCamelCase, toSnakeCase } from '../utils/caseConverter';
import { randomUUID } from 'expo-crypto';

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

  static async getCustomCategories(): Promise<ProductCategory[]> {
    try {
      const { data, error } = await supabase.from('categories').select('*').eq('is_default', false);
      if (error) throw error;
      return data ? convertObjectKeys(data, toCamelCase) : [];
    } catch (error) {
      console.error('Error getting categories from Supabase:', error);
      return [];
    }
  }

  static async addCategory(category: ProductCategory): Promise<ProductCategory> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(convertObjectKeys(category, toSnakeCase))
        .select()
        .single();
      if (error) throw error;
      return convertObjectKeys(data, toCamelCase);
    } catch (error) {
      console.error('Error adding category to Supabase:', error);
      throw error;
    }
  }

  static async updateCategory(category: Partial<ProductCategory>): Promise<void> {
    try {
      const { error } = await supabase
        .from('categories')
        .update(convertObjectKeys(category, toSnakeCase))
        .eq('id', category.id!);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating category in Supabase:', error);
      throw error;
    }
  }

  static async deleteCategory(categoryId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting category from Supabase:', error);
      throw error;
    }
  }

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

      return { data: convertObjectKeys(data, toCamelCase) || [], error: null };
    } catch (error) {
      console.error('Error in getProducts:', error);
      return { data: null, error: error as Error };
    }
  }

  static listenToProducts(callback: () => void): () => void {
    const channel = supabase
      .channel('public:products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          console.log('Change detected in products table, invoking callback...');
          callback();
        }
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime channel subscribed for products.');
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
      return convertObjectKeys(data, toCamelCase);
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
        if (!productToUpsert.status) {
          productToUpsert.status = 'active';
        }
      }

      const productWithUser = {
        ...productToUpsert,
        user_id: userId,
      };
      
      const { error } = await supabase.from('products').upsert(convertObjectKeys(productWithUser, toSnakeCase));
      if (error) throw error;

      if (product.barcode) {
        await this.saveProductTemplate(convertObjectKeys(productWithUser, toCamelCase) as Product);
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
    } catch (error) {
      console.error('Error deleting product from Supabase:', error);
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
            .update(convertObjectKeys(updatedFields, toSnakeCase))
            .eq('id', productId);

        if (updateError) throw updateError;

    } catch (error) {
        console.error('Error updating product status in Supabase:', error);
        throw error;
    }
  }

  static async getProductTemplate(barcode: string): Promise<ProductTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('barcode_templates')
        .select('*')
        .eq('barcode', barcode)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return convertObjectKeys(data, toCamelCase);
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
      const { error } = await supabase.from('barcode_templates').upsert(convertObjectKeys(templateData, toSnakeCase));
      if (error) throw error;
    } catch (error) {
      console.error(`Error saving product template for barcode ${product.barcode}:`, error);
    }
  }

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
      return convertObjectKeys(data, toCamelCase) || [];
    } catch (error) {
      console.error('Error getting history from Supabase:', error);
      return [];
    }
  }
  
  static async restoreConsumedProduct(productId: string): Promise<void> {
    try {
        await this.updateProductStatus(productId, 'active');
        console.log(`Product ${productId} restored successfully.`);
    } catch (error) {
        console.error(`Error restoring product ${productId}:`, error);
        throw error;
    }
  }

  static listenToSettings(callback: (settings: AppSettings) => void): () => void {
    const channel = supabase
      .channel('public:app_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, async () => {
        const settings = await this.getSettings(true);
        callback(settings);
      })
      .subscribe();

    this.getSettings(true).then(callback);

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

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        return convertObjectKeys(data, toCamelCase);
      }

      console.log('No settings found, creating default settings...');
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
      
      return convertObjectKeys(defaultSettings, toCamelCase);

    } catch (error) {
      console.error('Error getting or creating settings in Supabase:', error);
      return {
        notificationDays: 3,
        theme: 'auto',
      };
    }
  }

  static async updateSettings(newSettings: Partial<AppSettings>): Promise<AppSettings | null> {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .upsert({ id: 1, ...convertObjectKeys(newSettings, toSnakeCase) })
        .select()
        .single();
        
      if (error) throw error;
      
      const updatedSettings = convertObjectKeys(data, toCamelCase);

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
    } catch (error) {
      console.error('Error updating settings in Supabase:', error);
      throw error;
    }
  }

  static async exportData(): Promise<string> {
    console.warn("exportData is not implemented for Supabase yet.");
    return "{}";
  }

  static async importData(data: string): Promise<void> {
    console.warn("importData is not implemented for Supabase yet.");
  }

  static async clearAllData(): Promise<void> {
    try {
        const { error: productError } = await supabase.from('products').delete().neq('id', 0);
        if(productError) throw productError;

        const { error: templateError } = await supabase.from('barcode_templates').delete().neq('barcode', '0');
        if(templateError) throw templateError;

        await Notifications.cancelAllScheduledNotificationsAsync();
        console.log('All data cleared from Supabase and notifications cancelled.');
    } catch (error) {
        console.error('Error clearing data from Supabase:', error);
        throw error;
    }
  }
}
