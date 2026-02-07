import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';
import { LoggingService } from '@/services/LoggingService';
import { Product } from '@/types/Product';
import { Quantity, useManualEntryForm, FormState } from './ManualEntryFormContext';
import { useManualEntryMeta } from './ManualEntryMetaContext';

interface LegacyProduct extends Product {
  quantity?: number; unit?: string; is_frozen?: boolean;
}

export interface InitializeFormData {
  product?: Product; category?: string; quantity?: string; unit?: string;
  productName?: string; name?: string; brand?: string; selectedCategory?: string;
  quantities?: Quantity[]; purchaseDate?: string; expirationDate?: string; notes?: string;
  barcode?: string; imageUrl?: string | null; isEditMode?: boolean;
  originalProductId?: string | null; hasManuallySelectedCategory?: boolean;
  isInitialized?: boolean; isFrozen?: boolean;
}

interface ActionsContextValue {
  setField: (field: keyof Omit<FormState, 'quantities'>, value: string | null | boolean) => void;
  addQuantity: () => void; removeQuantity: (id: string) => void;
  updateQuantity: (id: string, field: 'quantity' | 'unit', value: string) => void;
  setQuantities: (quantities: Quantity[]) => void;
  initializeForm: (initialData?: InitializeFormData) => void; clearForm: () => void;
}

const ActionsContext = createContext<ActionsContextValue | undefined>(undefined);

function processProductData(product: Product): Partial<FormState> {
  const { quantities: productQuantities, ...restProduct } = product;
  const legacyProduct = product as LegacyProduct;
  const state: Partial<FormState> = {
    ...restProduct,
    selectedCategory: product.category || '',
    isFrozen: product.isFrozen || legacyProduct.is_frozen || false,
  };
  if (Array.isArray(productQuantities) && productQuantities.length > 0) {
    state.quantities = productQuantities.map(q => ({
      ...q,
      quantity: q.quantity != null ? String(q.quantity) : '1',
      unit: q.unit || 'pz',
      id: uuidv4(),
    }));
  } else if (legacyProduct.quantity != null) {
    state.quantities = [{ id: uuidv4(), quantity: String(legacyProduct.quantity), unit: legacyProduct.unit || 'pz' }];
  }
  return state;
}

function processScannedData(data: InitializeFormData): Partial<FormState> {
  const state: Partial<FormState> = {
    name: data.name || data.productName || '',
    brand: data.brand || '',
    barcode: data.barcode || '',
    selectedCategory: data.category || data.selectedCategory || '',
    imageUrl: data.imageUrl || null,
    expirationDate: data.expirationDate || '',
    purchaseDate: data.purchaseDate || '',
    notes: data.notes || '',
  };
  if (data.quantity != null) {
    state.quantities = [{ id: uuidv4(), quantity: String(data.quantity), unit: data.unit || 'pz' }];
  }
  return state;
}

export const ManualEntryActionsProvider = ({ children }: { children: ReactNode }) => {
  const { dispatch } = useManualEntryForm();
  const { setEditMode, setOriginalProductId, setInitialized, setManuallySelectedCategory } = useManualEntryMeta();

  const setField = useCallback((field: keyof Omit<FormState, 'quantities'>, value: string | null | boolean) => {
    LoggingService.debug('ManualEntryActions', `Setting ${field}`);
    dispatch({ type: 'SET_FIELD', field, value });
  }, [dispatch]);

  const addQuantity = useCallback(() => dispatch({ type: 'ADD_QUANTITY' }), [dispatch]);
  const removeQuantity = useCallback((id: string) => dispatch({ type: 'REMOVE_QUANTITY', id }), [dispatch]);
  const updateQuantity = useCallback((id: string, field: 'quantity' | 'unit', value: string) => {
    dispatch({ type: 'UPDATE_QUANTITY', id, field, value });
  }, [dispatch]);
  const setQuantities = useCallback((quantities: Quantity[]) => dispatch({ type: 'SET_QUANTITIES', quantities }), [dispatch]);

  const initializeForm = useCallback((initialData: InitializeFormData = {}) => {
    LoggingService.debug('ManualEntryActions', 'Initializing form');
    const hasProductData = !!initialData.product;
    const hasScannedData = !!(initialData.barcode || initialData.name || initialData.productName);
    if (!hasProductData && !hasScannedData) {
      dispatch({ type: 'CLEAR' });
      setEditMode(false);
      setOriginalProductId(null);
      setManuallySelectedCategory(false);
      setInitialized(true);
      return;
    }
    let newState: Partial<FormState> = {};
    if (hasProductData && initialData.product) newState = processProductData(initialData.product);
    else if (hasScannedData) newState = processScannedData(initialData);
    dispatch({ type: 'INITIALIZE', state: newState });
    setEditMode(String(initialData.isEditMode) === 'true');
    setOriginalProductId(initialData.originalProductId || null);
    setManuallySelectedCategory(String(initialData.hasManuallySelectedCategory) === 'true');
    setInitialized(true);
  }, [dispatch, setEditMode, setOriginalProductId, setManuallySelectedCategory, setInitialized]);

  const clearForm = useCallback(() => {
    dispatch({ type: 'CLEAR' });
    setEditMode(false);
    setOriginalProductId(null);
    setManuallySelectedCategory(false);
    setInitialized(true);
  }, [dispatch, setEditMode, setOriginalProductId, setManuallySelectedCategory, setInitialized]);

  const value: ActionsContextValue = {
    setField,
    addQuantity,
    removeQuantity,
    updateQuantity,
    setQuantities,
    initializeForm,
    clearForm,
  };

  return (
    <ActionsContext.Provider value={value}>
      {children}
    </ActionsContext.Provider>
  );
};

export const useManualEntryActions = (): ActionsContextValue => {
  const context = useContext(ActionsContext);
  if (!context) {
    throw new Error('useManualEntryActions must be used within ManualEntryActionsProvider');
  }
  return context;
};

export type { ActionsContextValue };
