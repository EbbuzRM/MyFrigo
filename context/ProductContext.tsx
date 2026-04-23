import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { ProductStorage } from '@/services/ProductStorage';
import { Product } from '@/types/Product';
import { useAuth } from './AuthContext';
import { supabase, getCachedSession } from '@/services/supabaseClient';
import { LoggingService } from '@/services/LoggingService';

interface ProductContextType {
  products: Product[];
  loading: boolean;
  refreshProducts: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const isFetchingRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!user) {
      setProducts([]);
      return;
    }
    if (isFetchingRef.current) {
      LoggingService.info('ProductContext', 'fetchProducts already in progress, skipping');
      return;
    }
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const { data, error } = await ProductStorage.getProducts() as {
        data: Product[] | null;
        error: { message: string } | null;
      };
      if (error) {
        LoggingService.error('ProductContext', `Failed to fetch products: ${error.message}`);
        setProducts([]);
      } else {
        setProducts(data || []);
      }
    } catch (e) {
      LoggingService.error('ProductContext', `Unexpected error in fetchProducts: ${e}`);
      setProducts([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;

    let productsUnsubscribe: (() => void) | null = null;
    let isMounted = true;

    // Carica i prodotti iniziali
    fetchProducts().catch(error => {
      if (isMounted) {
        LoggingService.error('ProductContext', 'Error fetching initial products', error);
      }
    });

    // Ensure session is fresh for the listener if needed, but getCachedSession handles it.
    // We just need to use the logic in ProductStorage.
    try {
      productsUnsubscribe = ProductStorage.listenToProducts(() => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          LoggingService.info('ProductContext', 'Products listener triggered (debounced), fetching updated products');
          fetchProducts().catch(error => {
            LoggingService.error('ProductContext', 'Error fetching products from listener', error);
          });
        }, 100);
      });
      LoggingService.info('ProductContext', 'Products listener registered successfully');
    } catch (error) {
      LoggingService.error('ProductContext', 'Error setting up products listener', error);
    }

    return () => {
      isMounted = false;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      if (productsUnsubscribe) {
        try {
          productsUnsubscribe();
          LoggingService.info('ProductContext', 'Products listener unsubscribed');
        } catch (error) {
          LoggingService.error('ProductContext', 'Error unsubscribing products listener', error);
        }
      }
    };
  }, [user?.id, fetchProducts]);

  const contextValue = React.useMemo(() => ({
    products,
    loading,
    refreshProducts: fetchProducts,
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
