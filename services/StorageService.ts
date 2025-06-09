import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '@/types/Product';
import { NotificationService } from './NotificationService'; // Import NotificationService
import * as Notifications from 'expo-notifications'; // Import expo-notifications

export interface AppSettings {
  notificationsEnabled: boolean;
  notificationDays: number;
  theme: 'light' | 'dark' | 'auto';
}

export class StorageService {
  private static readonly PRODUCTS_KEY = 'food_manager_products';
  private static readonly HISTORY_KEY = 'food_manager_history';
  private static readonly SETTINGS_KEY = 'food_manager_settings';

  // Products
  static async getProducts(): Promise<Product[]> {
    try {
      const products = await AsyncStorage.getItem(this.PRODUCTS_KEY);
      return products ? JSON.parse(products) : [];
    } catch (error) {
      console.error('Error getting products:', error);
      return [];
    }
  }

  static async saveProduct(product: Product): Promise<void> {
    try {
      const products = await this.getProducts();
      const existingProduct = products.find(p => p.id === product.id);
      const settings = await this.getSettings();

      if (existingProduct) {
        // Product updated
        const existingIndex = products.findIndex(p => p.id === product.id);
        products[existingIndex] = product;
        // If expiration date changed or status changed to active, (re)schedule
        if (existingProduct.expirationDate !== product.expirationDate || (existingProduct.status !== 'active' && product.status === 'active')) {
          await NotificationService.cancelNotification(product.id); // Cancel old one first
          if (product.status === 'active' && settings.notificationsEnabled) {
            await NotificationService.scheduleExpirationNotification(product, settings.notificationDays);
          }
        }
      } else {
        // New product
        products.push(product);
        if (product.status === 'active' && settings.notificationsEnabled) {
          await NotificationService.scheduleExpirationNotification(product, settings.notificationDays);
        }
      }
      
      await AsyncStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(products));
    } catch (error) {
      console.error('Error saving product:', error);
      throw error;
    }
  }

  static async deleteProduct(productId: string): Promise<void> {
    try {
      const products = await this.getProducts();
      const updatedProducts = products.filter(p => p.id !== productId);
      await AsyncStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(updatedProducts));
      await NotificationService.cancelNotification(productId); // Cancel notification
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  static async updateProductStatus(productId: string, status: Product['status']): Promise<void> {
    try {
      const products = await this.getProducts();
      const productIndex = products.findIndex(p => p.id === productId);
      
      if (productIndex >= 0) {
        const product = products[productIndex];
        const oldStatus = product.status;
        product.status = status;

        if (status === 'consumed' || status === 'expired') {
          product.consumedDate = (status === 'consumed' && !product.consumedDate) ? new Date().toISOString() : product.consumedDate;
          // Cancel notification if it was active and now consumed/expired
          if (oldStatus === 'active') {
            await NotificationService.cancelNotification(productId);
          }
        } else if (status === 'active' && oldStatus !== 'active') {
          // If product becomes active again (e.g., from 'consumed' by mistake), reschedule notification
          const settings = await this.getSettings();
          if (settings.notificationsEnabled) {
            await NotificationService.scheduleExpirationNotification(product, settings.notificationDays);
          }
        }
        
        await AsyncStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(products));
        
        if (status === 'consumed') {
          const consumedProduct = { ...product }; 
          await this.addToHistory(consumedProduct);
          // Remove from active products list
          const activeProducts = products.filter(p => p.id !== productId);
          await AsyncStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(activeProducts));
          // Notification is already cancelled above if it was active
        }
      }
    } catch (error) {
      console.error('Error updating product status:', error);
      throw error;
    }
  }

  // History
  static async getProductHistory(): Promise<Product[]> {
    try {
      const history = await AsyncStorage.getItem(this.HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error getting product history:', error);
      return [];
    }
  }

  static async addToHistory(product: Product): Promise<void> {
    try {
      const history = await this.getProductHistory();
      history.push(product);
      await AsyncStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error adding to history:', error);
      throw error;
    }
  }

  // Settings
  static async getSettings(): Promise<AppSettings> {
    try {
      const settings = await AsyncStorage.getItem(this.SETTINGS_KEY);
      return settings ? JSON.parse(settings) : {
        notificationsEnabled: true,
        notificationDays: 3,
        theme: 'auto',
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return {
        notificationsEnabled: true,
        notificationDays: 3,
        theme: 'auto',
      };
    }
  }

  static async updateSettings(newSettings: Partial<AppSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...newSettings };
      await AsyncStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updatedSettings));

      // If notification settings changed, reschedule all active product notifications
      if (newSettings.notificationsEnabled !== undefined || newSettings.notificationDays !== undefined) {
        const activeProducts = (await this.getProducts()).filter(p => p.status === 'active');
        // First, cancel all existing notifications to avoid duplicates or outdated ones
        await Notifications.cancelAllScheduledNotificationsAsync(); // Corrected: Use Notifications directly
        
        if (updatedSettings.notificationsEnabled) {
          // Reschedule with new settings
          for (const product of activeProducts) {
            await NotificationService.scheduleExpirationNotification(product, updatedSettings.notificationDays);
          }
        }
        // If notificationsEnabled is false, all notifications are already cancelled.
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  // Data management
  static async exportData(): Promise<string> {
    try {
      const products = await this.getProducts();
      const history = await this.getProductHistory();
      const settings = await this.getSettings();
      
      const exportData = {
        products,
        history,
        settings,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  static async importData(data: string): Promise<void> {
    try {
      const importedData = JSON.parse(data);
      
      if (importedData.products) {
        await AsyncStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(importedData.products));
      }
      
      if (importedData.history) {
        await AsyncStorage.setItem(this.HISTORY_KEY, JSON.stringify(importedData.history));
      }
      
      if (importedData.settings) {
        await AsyncStorage.setItem(this.SETTINGS_KEY, JSON.stringify(importedData.settings));
      }
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }

  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.PRODUCTS_KEY,
        this.HISTORY_KEY,
        this.SETTINGS_KEY,
      ]);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }
}
