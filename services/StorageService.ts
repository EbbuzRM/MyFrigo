import { Product, ProductCategory, PRODUCT_CATEGORIES } from '@/types/Product';
import { NotificationService } from './NotificationService';
import * as Notifications from 'expo-notifications';
import { firestoreDB } from './firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  query,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';

export interface AppSettings {
  notificationsEnabled: boolean;
  notificationDays: number;
  theme: 'light' | 'dark' | 'auto';
}

export class StorageService {
  private static readonly CATEGORIES_DOC = 'appData/categories';
  private static readonly PRODUCTS_COLLECTION = 'products';
  private static readonly HISTORY_COLLECTION = 'productHistory';
  private static readonly SETTINGS_DOC = 'appData/settings';

  // Categories
  static async getCategories(): Promise<ProductCategory[]> {
    try {
      const docRef = doc(firestoreDB, this.CATEGORIES_DOC);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data()?.custom) {
        const customCategories = docSnap.data()?.custom as ProductCategory[];
        const combined = [...PRODUCT_CATEGORIES];
        customCategories.forEach(storedCat => {
          if (!combined.some(defaultCat => defaultCat.id === storedCat.id)) {
            combined.push(storedCat);
          }
        });
        return combined;
      }
      return [...PRODUCT_CATEGORIES];
    } catch (error) {
      console.error('Error getting categories from Firestore:', error);
      return [...PRODUCT_CATEGORIES];
    }
  }

  static async saveCategories(categories: ProductCategory[]): Promise<void> {
    try {
      const defaultCategoryIds = PRODUCT_CATEGORIES.map(c => c.id);
      const customCategoriesToSave = categories.filter(c => !defaultCategoryIds.includes(c.id));
      const docRef = doc(firestoreDB, this.CATEGORIES_DOC);
      await setDoc(docRef, { custom: customCategoriesToSave }, { merge: true });
    } catch (error) {
      console.error('Error saving custom categories to Firestore:', error);
      throw error;
    }
  }

  // Products
  static async getProducts(): Promise<Product[]> {
    try {
      const productsCollectionRef = collection(firestoreDB, StorageService.PRODUCTS_COLLECTION);
      const querySnapshot = await getDocs(productsCollectionRef);
      const products: Product[] = [];
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() } as Product);
      });
      return products;
    } catch (error) {
      console.error('Error getting products from Firestore:', error);
      return [];
    }
  }

  static listenToProducts(callback: (products: Product[]) => void): () => void {
    const productsCollectionRef = collection(firestoreDB, StorageService.PRODUCTS_COLLECTION);
    const q = query(productsCollectionRef, orderBy('expirationDate', 'asc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const products: Product[] = [];
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() } as Product);
      });
      callback(products);
    }, (error) => {
      console.error("Error listening to products:", error);
      callback([]);
    });

    return unsubscribe;
  }

  static async getProductById(productId: string): Promise<Product | null> {
    try {
      const productDocRef = doc(firestoreDB, StorageService.PRODUCTS_COLLECTION, productId);
      const docSnap = await getDoc(productDocRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Product;
      }
      return null;
    } catch (error) {
      console.error(`Error getting product by ID ${productId}:`, error);
      return null;
    }
  }

  static async saveProduct(product: Product): Promise<void> {
    try {
      const productDocRef = doc(firestoreDB, StorageService.PRODUCTS_COLLECTION, product.id);
      const settings = await this.getSettings();
      const docSnap = await getDoc(productDocRef);
      const existingProductData = docSnap.exists() ? docSnap.data() as Product : null;

      await setDoc(productDocRef, product);

      if (existingProductData) {
        if (existingProductData.expirationDate !== product.expirationDate ||
            (existingProductData.status !== 'active' && product.status === 'active') ||
            (existingProductData.status === 'active' && product.status !== 'active')) {
          await NotificationService.cancelNotification(product.id);
          if (product.status === 'active' && settings.notificationsEnabled) {
            await NotificationService.scheduleExpirationNotification(product, settings.notificationDays);
          }
        }
      } else {
        if (product.status === 'active' && settings.notificationsEnabled) {
          await NotificationService.scheduleExpirationNotification(product, settings.notificationDays);
        }
      }
    } catch (error) {
      console.error('Error saving product to Firestore:', error);
      throw error;
    }
  }

  static async deleteProduct(productId: string): Promise<void> {
    try {
      const productDocRef = doc(firestoreDB, StorageService.PRODUCTS_COLLECTION, productId);
      await deleteDoc(productDocRef);
      await NotificationService.cancelNotification(productId);
    } catch (error) {
      console.error('Error deleting product from Firestore:', error);
      throw error;
    }
  }

  static async updateProductStatus(productId: string, status: Product['status']): Promise<void> {
    try {
      const productDocRef = doc(firestoreDB, StorageService.PRODUCTS_COLLECTION, productId);
      const docSnap = await getDoc(productDocRef);

      if (!docSnap.exists()) {
        console.error(`Product with ID ${productId} not found in Firestore.`);
        return;
      }

      const product = { id: docSnap.id, ...docSnap.data() } as Product;
      const oldStatus = product.status;
      
      const updatedFields: Partial<Product> = { status };

      if (status === 'consumed' || status === 'expired') {
        updatedFields.consumedDate = (status === 'consumed' && !product.consumedDate)
          ? new Date().toISOString()
          : product.consumedDate;
        
        if (oldStatus === 'active') {
          await NotificationService.cancelNotification(productId);
        }
      } else if (status === 'active' && oldStatus !== 'active') {
        const settings = await this.getSettings();
        if (settings.notificationsEnabled) {
          const tempProductForNotification = { ...product, status: 'active' as Product['status'] };
          await NotificationService.scheduleExpirationNotification(tempProductForNotification, settings.notificationDays);
        }
      }
      
      await updateDoc(productDocRef, updatedFields);

      if (status === 'consumed') {
        const consumedDateValue = updatedFields.consumedDate || new Date().toISOString();
        const { status: originalStatus, consumedDate: originalConsumedDate, ...restOfProduct } = product;
        const consumedProductEntry: Product = {
          ...restOfProduct,
          id: product.id, 
          status: 'consumed',
          consumedDate: consumedDateValue,
        };
        await this.addToHistory(consumedProductEntry);
      }
    } catch (error) {
      console.error('Error updating product status in Firestore:', error);
      throw error;
    }
  }

  // History
  static listenToHistory(callback: (history: Product[]) => void): () => void {
    const historyCollectionRef = collection(firestoreDB, StorageService.HISTORY_COLLECTION);
    const q = query(historyCollectionRef, orderBy('consumedDate', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const history: Product[] = [];
      querySnapshot.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() } as Product);
      });
      callback(history);
    }, (error) => {
      console.error("Error listening to history:", error);
      callback([]);
    });

    return unsubscribe;
  }

  static async addToHistory(product: Product): Promise<void> {
    try {
      const historyDocRef = doc(collection(firestoreDB, StorageService.HISTORY_COLLECTION));
      await setDoc(historyDocRef, { ...product, id: historyDocRef.id });
    } catch (error) {
      console.error('Error adding to history in Firestore:', error);
      throw error;
    }
  }

  // Settings
  static listenToSettings(callback: (settings: AppSettings) => void): () => void {
    const settingsDocRef = doc(firestoreDB, StorageService.SETTINGS_DOC);
    
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as AppSettings);
      } else {
        // Se il documento non esiste, restituisce le impostazioni di default
        callback({
          notificationsEnabled: true,
          notificationDays: 3,
          theme: 'auto',
        });
      }
    }, (error) => {
      console.error("Error listening to settings:", error);
      // In caso di errore, restituisce le impostazioni di default
      callback({
        notificationsEnabled: true,
        notificationDays: 3,
        theme: 'auto',
      });
    });

    return unsubscribe;
  }

  static async getSettings(): Promise<AppSettings> {
    try {
      const settingsDocRef = doc(firestoreDB, StorageService.SETTINGS_DOC);
      const docSnap = await getDoc(settingsDocRef);
      if (docSnap.exists()) {
        return docSnap.data() as AppSettings;
      }
      return {
        notificationsEnabled: true,
        notificationDays: 3,
        theme: 'auto',
      };
    } catch (error) {
      console.error('Error getting settings from Firestore:', error);
      return {
        notificationsEnabled: true,
        notificationDays: 3,
        theme: 'auto',
      };
    }
  }

  static async updateSettings(newSettings: Partial<AppSettings>): Promise<void> {
    try {
      const settingsDocRef = doc(firestoreDB, StorageService.SETTINGS_DOC);
      await setDoc(settingsDocRef, newSettings, { merge: true }); 
      
      const updatedSettings = await this.getSettings();

      if (newSettings.notificationsEnabled !== undefined || newSettings.notificationDays !== undefined) {
        const activeProducts = (await this.getProducts()).filter(p => p.status === 'active');
        await Notifications.cancelAllScheduledNotificationsAsync();
        if (updatedSettings.notificationsEnabled) {
          await NotificationService.scheduleMultipleNotifications(activeProducts, updatedSettings);
        }
      }
    } catch (error) {
      console.error('Error updating settings in Firestore:', error);
      throw error;
    }
  }

  // Data management
  static async exportData(): Promise<string> {
    try {
      const products = await this.getProducts();
      const historySnapshot = await getDocs(collection(firestoreDB, StorageService.HISTORY_COLLECTION));
      const history = historySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      const settings = await this.getSettings();
      
      const exportData = {
        products,
        history,
        settings,
        exportDate: new Date().toISOString(),
        version: '2.0.0',
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
      const batch = writeBatch(firestoreDB);

      if (importedData.products && Array.isArray(importedData.products)) {
        importedData.products.forEach((product: Product) => {
          const productDocRef = doc(firestoreDB, StorageService.PRODUCTS_COLLECTION, product.id);
          batch.set(productDocRef, product);
        });
      }
      
      if (importedData.history && Array.isArray(importedData.history)) {
        importedData.history.forEach((historyEntry: Product) => {
          const historyDocRef = doc(collection(firestoreDB, StorageService.HISTORY_COLLECTION), historyEntry.id || undefined);
          batch.set(historyDocRef, historyEntry);
        });
      }
      
      if (importedData.settings) {
        const settingsDocRef = doc(firestoreDB, StorageService.SETTINGS_DOC);
        batch.set(settingsDocRef, importedData.settings, { merge: true });
      }

      await batch.commit();
      
      const settings = await this.getSettings();
      if (settings.notificationsEnabled) {
        const activeProducts = (await this.getProducts()).filter(p => p.status === 'active');
        await Notifications.cancelAllScheduledNotificationsAsync();
        await NotificationService.scheduleMultipleNotifications(activeProducts, settings);
      }

    } catch (error) {
      console.error('Error importing data to Firestore:', error);
      throw error;
    }
  }

  static async clearAllData(): Promise<void> {
    try {
      const productsSnapshot = await getDocs(collection(firestoreDB, StorageService.PRODUCTS_COLLECTION));
      const productBatch = writeBatch(firestoreDB);
      productsSnapshot.forEach(doc => productBatch.delete(doc.ref));
      await productBatch.commit();

      const historySnapshot = await getDocs(collection(firestoreDB, StorageService.HISTORY_COLLECTION));
      const historyBatch = writeBatch(firestoreDB);
      historySnapshot.forEach(doc => historyBatch.delete(doc.ref));
      await historyBatch.commit();

      const settingsDocRef = doc(firestoreDB, StorageService.SETTINGS_DOC);
      const defaultSettings: AppSettings = {
        notificationsEnabled: true,
        notificationDays: 3,
        theme: 'auto',
      };
      await setDoc(settingsDocRef, defaultSettings);
      
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All data cleared from Firestore and notifications cancelled.');

    } catch (error) {
      console.error('Error clearing data from Firestore:', error);
      throw error;
    }
  }
}
