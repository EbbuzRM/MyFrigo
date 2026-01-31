import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { LoggingService } from '@/services/LoggingService';
import { Product } from '@/types/Product';
import { ManualEntryFormProvider, useManualEntryForm, Quantity, FormState } from './ManualEntryFormContext';
import { ManualEntryActionsProvider, useManualEntryActions, InitializeFormData } from './ManualEntryActionsContext';
import { ManualEntryMetaProvider, useManualEntryMeta, MetaState } from './ManualEntryMetaContext';

export type { Quantity, FormState as ManualEntryFormData, InitializeFormData };
export type { MetaState };

interface ManualEntryContextType extends FormState, MetaState {
  setName: (name: string) => void;
  setBrand: (brand: string) => void;
  setSelectedCategory: (category: string) => void;
  setQuantities: (quantities: Quantity[]) => void;
  setPurchaseDate: (date: string) => void;
  setExpirationDate: (date: string) => void;
  setNotes: (notes: string) => void;
  setBarcode: (barcode: string) => void;
  setImageUrl: (url: string | null) => void;
  setIsFrozen: (frozen: boolean) => void;
  setIsEditMode: (editMode: boolean) => void;
  setOriginalProductId: (productId: string | null) => void;
  setHasManuallySelectedCategory: (manual: boolean) => void;
  setIsInitialized: (initialized: boolean) => void;
  addQuantity: () => void;
  removeQuantity: (id: string) => void;
  updateQuantity: (id: string, field: 'quantity' | 'unit', value: string) => void;
  initializeForm: (initialData?: InitializeFormData) => void;
  clearForm: () => void;
}

const ManualEntryContext = createContext<ManualEntryContextType | undefined>(undefined);

export const ManualEntryProvider = ({ children }: { children: ReactNode }) => (
  <ManualEntryMetaProvider>
    <ManualEntryFormProvider>
      <ManualEntryActionsProvider>
        <ManualEntryCompositeProvider>{children}</ManualEntryCompositeProvider>
      </ManualEntryActionsProvider>
    </ManualEntryFormProvider>
  </ManualEntryMetaProvider>
);

const ManualEntryCompositeProvider = ({ children }: { children: ReactNode }) => {
  const { state: formState } = useManualEntryForm();
  const { setField, addQuantity, removeQuantity, updateQuantity, setQuantities, initializeForm, clearForm } = useManualEntryActions();
  const metaState = useManualEntryMeta();

  const setters = useMemo(() => ({
    setName: (name: string) => setField('name', name),
    setBrand: (brand: string) => setField('brand', brand),
    setSelectedCategory: (category: string) => setField('selectedCategory', category),
    setPurchaseDate: (date: string) => setField('purchaseDate', date),
    setExpirationDate: (date: string) => setField('expirationDate', date),
    setNotes: (notes: string) => setField('notes', notes),
    setBarcode: (barcode: string) => setField('barcode', barcode),
    setImageUrl: (url: string | null) => setField('imageUrl', url),
    setIsFrozen: (frozen: boolean) => setField('isFrozen', frozen),
    setQuantities,
    setIsEditMode: metaState.setEditMode,
    setOriginalProductId: metaState.setOriginalProductId,
    setHasManuallySelectedCategory: metaState.setManuallySelectedCategory,
    setIsInitialized: metaState.setInitialized,
  }), [setField, setQuantities, metaState.setEditMode, metaState.setOriginalProductId, metaState.setManuallySelectedCategory, metaState.setInitialized]);

  const actions = useMemo(() => ({
    addQuantity,
    removeQuantity,
    updateQuantity,
    initializeForm,
    clearForm,
  }), [addQuantity, removeQuantity, updateQuantity, initializeForm, clearForm]);

  const value = useMemo<ManualEntryContextType>(() => ({
    ...formState,
    isEditMode: metaState.isEditMode,
    originalProductId: metaState.originalProductId,
    hasManuallySelectedCategory: metaState.hasManuallySelectedCategory,
    isInitialized: metaState.isInitialized,
    ...setters,
    ...actions,
  }), [formState, metaState, setters, actions]);

  LoggingService.debug('ManualEntryContext', 'Context value updated');

  return (
    <ManualEntryContext.Provider value={value}>
      {children}
    </ManualEntryContext.Provider>
  );
};

export const useManualEntry = (): ManualEntryContextType => {
  const context = useContext(ManualEntryContext);
  if (context === undefined) {
    throw new Error('useManualEntry must be used within a ManualEntryProvider');
  }
  return context;
};

export type { ManualEntryContextType };
