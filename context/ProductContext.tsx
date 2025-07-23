import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { StorageService, AppSettings } from '@/services/StorageService';
import { NotificationService, eventEmitter } from '@/services/NotificationService';
import * as Notifications from 'expo-notifications'; // <-- ERRORE #1 CORRETTO
import { Product } from '@/types/Product';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';

interface ProductContextType {
  products: Product[];
  loading: boolean;
  refreshProducts: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Hook custom per tracciare lo stato precedente
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const prevProducts = usePrevious(products);
  const productsRef = useRef(products);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  const fetchProducts = useCallback(async () => {
    if (!user) {
      setProducts([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await StorageService.getProducts();
      if (error) {
        console.error("Failed to fetch products:", error.message);
        setProducts([]);
      } else {
        setProducts(data || []);
      }
    } catch (e) {
      console.error("An unexpected error occurred in fetchProducts:", e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleNotificationReschedule = useCallback(async (currentSettings: AppSettings) => {
    console.log('[ProductContext] handleNotificationReschedule triggered.');
    const activeProducts = productsRef.current.filter(p => p.status === 'active');
    await Notifications.cancelAllScheduledNotificationsAsync();
    await NotificationService.scheduleMultipleNotifications(activeProducts, currentSettings);
    console.log(`[ProductContext] Re-scheduling complete for ${activeProducts.length} products.`);
  }, []);

  useEffect(() => {
    if (user) {
      fetchProducts();
      const productsListener = StorageService.listenToProducts(() => {
        fetchProducts();
      });
      const settingsListener = eventEmitter.on('settingsChanged', (newSettings) => {
        handleNotificationReschedule(newSettings);
      });
      return () => {
        productsListener();
        settingsListener();
      };
    }
  }, [user, fetchProducts, handleNotificationReschedule]);

  useEffect(() => {
    if (!settings || !prevProducts) {
      return;
    }

    const prevMap = new Map(prevProducts.map(p => [p.id, p]));
    const currentMap = new Map(products.map(p => [p.id, p]));

    currentMap.forEach((currentProduct, id) => {
      const prevProduct = prevMap.get(id);
      if (!prevProduct && currentProduct.status === 'active') {
        NotificationService.scheduleExpirationNotification(currentProduct, settings.notificationDays);
      } else if (prevProduct && currentProduct.status === 'active') {
        const dateChanged = currentProduct.expirationDate !== prevProduct.expirationDate;
        const statusChangedToActive = prevProduct.status !== 'active';
        if (dateChanged || statusChangedToActive) {
          NotificationService.scheduleExpirationNotification(currentProduct, settings.notificationDays);
        }
      } else if (prevProduct && currentProduct.status !== 'active' && prevProduct.status === 'active') {
        NotificationService.cancelNotification(currentProduct.id!);
      }
    });

    prevMap.forEach((prevProduct, id) => {
      if (!currentMap.has(id)) {
        NotificationService.cancelNotification(prevProduct.id!);
      }
    });
  }, [products, prevProducts, settings]);

  return (
    <ProductContext.Provider value={{ products, loading, refreshProducts: fetchProducts }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = (): ProductContextType => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
