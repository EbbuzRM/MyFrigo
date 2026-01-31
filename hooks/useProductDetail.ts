import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { ProductStorage } from '@/services/ProductStorage';
import { Product, ProductDetailState } from '@/types/Product';
import { LoggingService } from '@/services/LoggingService';

// usa ProductDetailState da types/Product

export interface ProductDetailActions {
  loadProduct: () => Promise<void>;
  handleConsume: () => void;
  handleModalConfirm: (consumedQuantity: number) => Promise<void>;
  handleModalCancel: () => void;
  handleDelete: () => Promise<void>;
  handleEdit: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
  hideToast: () => void;
}

type UIStateExtras = {
  isModalVisible: boolean;
  toastVisible: boolean;
  toastMessage: string;
  toastType: 'success' | 'error';
};

type DetailState = ProductDetailState & UIStateExtras;

export const useProductDetail = (productId: string | undefined) => {
  const [state, setState] = useState<DetailState>({
    product: null,
    isLoading: true,
    error: undefined,
    isModalVisible: false,
    toastVisible: false,
    toastMessage: '',
    toastType: 'success',
    relatedIcons: [],
  });

  const updateState = useCallback((updates: Partial<DetailState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    updateState({
      toastMessage: message,
      toastType: type,
      toastVisible: true,
    });
  }, [updateState]);

  const hideToast = useCallback(() => {
    updateState({ toastVisible: false });
  }, [updateState]);

  const loadProduct = useCallback(async () => {
    if (!productId) {
      updateState({ isLoading: false, error: 'ID prodotto non valido' });
      return;
    }

    try {
      updateState({ isLoading: true, error: undefined });
      const { data: productData, success } = await ProductStorage.getProductById(productId);

      if (!success || !productData) {
        updateState({ isLoading: false, error: 'Prodotto non trovato' });
        return;
      }

      updateState({ product: productData, isLoading: false });

      LoggingService.info('ProductDetail', `Prodotto caricato: ${productData.name}`);
    } catch (error) {
      LoggingService.error('ProductDetail', 'Errore nel caricamento prodotto:', error);
      updateState({ isLoading: false, error: 'Impossibile caricare il prodotto' });
      showToast('Impossibile caricare i dettagli del prodotto.', 'error');
    }
  }, [productId, updateState, showToast]);

  const loadRelatedIcons = useCallback(async (categoryId?: string) => {
    if (!categoryId) return;
    try {
      // placeholder: integrare IconService.getIconsForCategory quando disponibile
      updateState({ relatedIcons: [] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Errore caricamento icone correlate';
      updateState({ error: message, relatedIcons: [] });
    }
  }, [updateState]);

  const handleConsume = useCallback(() => {
    const { product } = state;

    if (!product) {
      showToast('Prodotto non disponibile', 'error');
      return;
    }

    if (!Array.isArray(product.quantities) || product.quantities.length === 0) {
      LoggingService.error('ProductDetail', 'Quantità prodotto non disponibile');
      showToast('Errore: quantità del prodotto non disponibile.', 'error');
      return;
    }

    const quantities = product.quantities;
    const totalQuantity = quantities.reduce((sum, q) => sum + q.quantity, 0);

    if (quantities.length === 1 && totalQuantity === 1) {
      handleModalConfirm(1);
    } else {
      updateState({ isModalVisible: true });
    }
  }, [state.product, showToast, updateState]);

  const handleModalConfirm = useCallback(async (consumedQuantity: number) => {
    const { product } = state;

    if (!product) {
      showToast('Prodotto non disponibile', 'error');
      return;
    }

    try {
      if (!Array.isArray(product.quantities) || product.quantities.length === 0) {
        LoggingService.error('ProductDetail', 'Quantità prodotto non disponibile');
        showToast('Errore: quantità del prodotto non disponibile.', 'error');
        return;
      }

      LoggingService.info('ProductDetail', `Consuming ${consumedQuantity} from product ${product.id}`);

      // Crea una copia delle quantità per aggiornare
      const updatedQuantities = product.quantities.map(q => ({ ...q }));
      let remainingToConsume = consumedQuantity;

      // Riduci le quantità in ordine
      for (let i = 0; i < updatedQuantities.length && remainingToConsume > 0; i++) {
        const quantity = updatedQuantities[i];
        if (quantity.quantity > 0) {
          const consumeFromThis = Math.min(remainingToConsume, quantity.quantity);
          quantity.quantity -= consumeFromThis;
          remainingToConsume -= consumeFromThis;
          LoggingService.info('ProductDetail', `Reduced quantity ${i} by ${consumeFromThis}, remaining: ${quantity.quantity}`);
        }
      }

      // Calcola il totale rimanente
      const totalRemaining = updatedQuantities.reduce((sum, q) => sum + q.quantity, 0);
      LoggingService.info('ProductDetail', `Total remaining quantity: ${totalRemaining}`);

      // Aggiorna il prodotto
      const updatedProduct = { ...product, quantities: updatedQuantities };

      if (totalRemaining <= 0) {
        // Se completamente consumato, sposta nello storico
        updatedProduct.status = 'consumed';
        updatedProduct.consumedDate = new Date().toISOString();
        LoggingService.info('ProductDetail', `Product ${product.id} fully consumed, moving to history`);
        showToast('Prodotto consumato e spostato nello storico.', 'success');
      } else {
        // Parzialmente consumato, rimane attivo
        LoggingService.info('ProductDetail', `Product ${product.id} partially consumed, remaining: ${totalRemaining}`);
        showToast('Quantità del prodotto aggiornata.', 'success');
      }

      await ProductStorage.saveProduct(updatedProduct);
      updateState({ product: updatedProduct, isModalVisible: false });
      router.back();
    } catch (error) {
      LoggingService.error('ProductDetail', 'Error during partial consumption:', error);
      showToast('Si è verificato un errore durante l\'operazione.', 'error');
    } finally {
      updateState({ isModalVisible: false });
    }
  }, [state.product, showToast, updateState]);

  const handleModalCancel = useCallback(() => {
    updateState({ isModalVisible: false });
  }, [updateState]);

  const handleDelete = useCallback(async () => {
    const { product } = state;

    if (!product) {
      showToast('Prodotto non disponibile', 'error');
      return;
    }

    Alert.alert(
      'Elimina Prodotto',
      `Sei sicuro di voler eliminare definitivamente "${product.name}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              await ProductStorage.deleteProduct(product.id);
              showToast('Prodotto eliminato definitivamente.', 'success');
              router.back();
            } catch (error) {
              LoggingService.error('ProductDetail', 'Error deleting product:', error);
              showToast('Si è verificato un errore durante l\'eliminazione.', 'error');
            }
          }
        }
      ]
    );
  }, [state.product, showToast]);

  const handleEdit = useCallback(() => {
    const { product } = state;

    if (!product) {
      showToast('Prodotto non disponibile', 'error');
      return;
    }

    router.push({
      pathname: '/manual-entry',
      params: {
        productId: product.id
      }
    });
  }, [state.product, showToast]);

  // Computed values
  const canConsume = useMemo(() => {
    return state.product?.status === 'active' &&
      state.product?.quantities &&
      state.product.quantities.length > 0;
  }, [state.product]);

  const totalQuantity = useMemo(() => {
    if (!state.product?.quantities) return 0;
    return state.product.quantities.reduce((sum, q) => sum + q.quantity, 0);
  }, [state.product]);

  const isSingleQuantity = useMemo(() => {
    return state.product?.quantities?.length === 1 && totalQuantity === 1;
  }, [state.product, totalQuantity]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const actions: ProductDetailActions = {
    loadProduct,
    handleConsume,
    handleModalConfirm,
    handleModalCancel,
    handleDelete,
    handleEdit,
    showToast,
    hideToast,
  };

  return {
    state,
    loadRelatedIcons,
    actions,
    computed: {
      canConsume,
      totalQuantity,
      isSingleQuantity,
    }
  };
};