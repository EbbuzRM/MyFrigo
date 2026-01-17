import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { ProductStorage } from '@/services/ProductStorage';
import { NotificationService, eventEmitter } from '@/services/NotificationService';
import * as Notifications from 'expo-notifications';
import { Product } from '@/types/Product';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import { LoggingService } from '@/services/LoggingService';
import { AppSettings } from '@/services/SettingsService';

interface ProductContextType {
  products: Product[];
  loading: boolean;
  refreshProducts: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Hook custom per tracciare lo stato precedente
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
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
      // Tipizzazione più specifica per i risultati delle operazioni
      const { data, error } = await ProductStorage.getProducts() as {
        data: Product[] | null;
        error: { message: string } | null;
      };
      if (error) {
        LoggingService.error("ProductContext", `Failed to fetch products: ${error.message}`);
        setProducts([]);
      } else {
        setProducts(data || []);
      }
    } catch (e) {
      LoggingService.error("ProductContext", `An unexpected error occurred in fetchProducts: ${e}`);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Funzione di utilità per validare le date di scadenza
  const isValidExpirationDate = useCallback((dateString?: string): boolean => {
    if (!dateString) return false;

    // Verifica che la data sia in formato ISO
    if (!/^\d{4}-\d{2}-\d{2}/.test(dateString)) return false;

    try {
      // Verifica che la data sia valida
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return false;

      // Verifica che la data sia nel futuro o oggi
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expirationDate = new Date(dateString);
      expirationDate.setHours(0, 0, 0, 0);

      return expirationDate >= today;
    } catch (e) {
      LoggingService.error("ProductContext", `Invalid date format: ${dateString}`, e);
      return false;
    }
  }, []);

  const handleNotificationReschedule = useCallback(async (currentSettings: AppSettings) => {
    LoggingService.info('ProductContext', 'handleNotificationReschedule triggered.');

    // Filtra prodotti attivi con date di scadenza valide
    const activeProducts = productsRef.current.filter(p =>
      p.status === 'active' && isValidExpirationDate(p.expirationDate)
    );

    if (activeProducts.length !== productsRef.current.filter(p => p.status === 'active').length) {
      LoggingService.warning('ProductContext',
        `Filtered out ${productsRef.current.filter(p => p.status === 'active').length - activeProducts.length} products with invalid expiration dates`);
    }

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await NotificationService.scheduleMultipleNotifications(activeProducts, currentSettings);
      LoggingService.info('ProductContext', `Re-scheduling complete for ${activeProducts.length} products.`);
    } catch (error) {
      LoggingService.error('ProductContext', 'Error rescheduling notifications', error);
    }
  }, [isValidExpirationDate]);

  useEffect(() => {
    if (user) {
      // Riferimenti alle funzioni di cleanup
      let productsUnsubscribe: (() => void) | null = null;
      let settingsUnsubscribe: (() => void) | null = null;

      // Flag per tracciare se il componente è montato
      let isMounted = true;

      // Carica i prodotti iniziali
      fetchProducts().catch(error => {
        if (isMounted) {
          LoggingService.error("ProductContext", "Error fetching initial products", error);
        }
      });

      // Imposta il listener per i prodotti
      try {
        productsUnsubscribe = ProductStorage.listenToProducts(() => {
          // Re-enable real-time updates to keep data synchronized across devices
          // The UI interruption issue should be handled at component level, not by disabling real-time
          LoggingService.info("ProductContext", "Products listener triggered, fetching updated products");
          fetchProducts().catch(error => {
            LoggingService.error("ProductContext", "Error fetching products from listener", error);
          });
        });
        LoggingService.info("ProductContext", "Products listener registered successfully");
      } catch (error) {
        LoggingService.error("ProductContext", "Error setting up products listener", error);
      }

      // Imposta il listener per le impostazioni
      if (eventEmitter) {
        try {
          settingsUnsubscribe = eventEmitter.on('settingsChanged', (newSettings) => {
            if (isMounted) {
              handleNotificationReschedule(newSettings);
            }
          });
          LoggingService.info("ProductContext", "Settings listener registered successfully");
        } catch (error) {
          LoggingService.error("ProductContext", "Error setting up settings listener", error);
        }
      } else {
        LoggingService.warning("ProductContext", "Event emitter not available, settings changes won't trigger notification reschedule");
      }

      // Funzione di cleanup
      return () => {
        isMounted = false;

        // Rimuovi il listener dei prodotti
        if (productsUnsubscribe) {
          try {
            productsUnsubscribe();
            LoggingService.info("ProductContext", "Products listener unsubscribed");
          } catch (error) {
            LoggingService.error("ProductContext", "Error unsubscribing products listener", error);
          }
        }

        // Rimuovi il listener delle impostazioni
        if (eventEmitter && settingsUnsubscribe) {
          try {
            settingsUnsubscribe();
            LoggingService.info("ProductContext", "Settings listener unsubscribed");
          } catch (error) {
            LoggingService.error("ProductContext", "Error unsubscribing settings listener", error);
          }
        }
      };
    }
  }, [user?.id, fetchProducts, handleNotificationReschedule]);

  useEffect(() => {
    if (!settings || !prevProducts) {
      return;
    }

    // Crea mappe per confronto efficiente con tipizzazione esplicita
    const prevMap = new Map<string, Product>(
      prevProducts.filter(p => p.id).map(p => [p.id as string, p])
    );
    const currentMap = new Map<string, Product>(
      products.filter(p => p.id).map(p => [p.id as string, p])
    );

    // Traccia le operazioni di notifica per logging
    let scheduledCount = 0;
    let cancelledCount = 0;
    let skippedCount = 0;

    // Processa i prodotti correnti (non serve più verificare l'ID perché abbiamo già filtrato)
    currentMap.forEach((currentProduct, id) => {

      const prevProduct = prevMap.get(id);

      // Nuovo prodotto attivo
      if (!prevProduct && currentProduct.status === 'active') {
        if (isValidExpirationDate(currentProduct.expirationDate)) {
          NotificationService.scheduleExpirationNotification(currentProduct, settings.notificationDays)
            .catch(error => LoggingService.error("ProductContext", `Error scheduling notification for new product ${id}`, error));
          scheduledCount++;
        } else {
          LoggingService.warning("ProductContext", `Skipping notification for new product ${id} with invalid date: ${currentProduct.expirationDate}`);
          skippedCount++;
        }
      }
      // Prodotto esistente attivo con modifiche
      else if (prevProduct && currentProduct.status === 'active') {
        const dateChanged = currentProduct.expirationDate !== prevProduct.expirationDate;
        const statusChangedToActive = prevProduct.status !== 'active';

        if (dateChanged || statusChangedToActive) {
          if (isValidExpirationDate(currentProduct.expirationDate)) {
            NotificationService.scheduleExpirationNotification(currentProduct, settings.notificationDays)
              .catch(error => LoggingService.error("ProductContext", `Error scheduling notification for updated product ${id}`, error));
            scheduledCount++;
          } else {
            LoggingService.warning("ProductContext", `Skipping notification for updated product ${id} with invalid date: ${currentProduct.expirationDate}`);
            skippedCount++;
          }
        }
      }
      // Prodotto cambiato da attivo a non attivo
      else if (prevProduct && currentProduct.status !== 'active' && prevProduct.status === 'active') {
        NotificationService.cancelNotification(id)
          .catch(error => LoggingService.error("ProductContext", `Error cancelling notification for product ${id}`, error));
        cancelledCount++;
      }
    });

    // Gestisci prodotti rimossi
    prevMap.forEach((prevProduct, id) => {
      if (!currentMap.has(id) && prevProduct.status === 'active') {
        NotificationService.cancelNotification(id)
          .catch(error => LoggingService.error("ProductContext", `Error cancelling notification for removed product ${id}`, error));
        cancelledCount++;
      }
    });

    // Log delle operazioni di notifica
    if (scheduledCount > 0 || cancelledCount > 0 || skippedCount > 0) {
      LoggingService.info("ProductContext",
        `Notification operations: ${scheduledCount} scheduled, ${cancelledCount} cancelled, ${skippedCount} skipped due to invalid dates`);
    }
  }, [products, prevProducts, settings, isValidExpirationDate]);

  // Memoizziamo il valore del contesto per evitare re-render inutili
  const contextValue = React.useMemo(() => ({
    products,
    loading,
    refreshProducts: fetchProducts
  }), [products, loading, fetchProducts]);

  return (
    <ProductContext.Provider value={contextValue}>
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
