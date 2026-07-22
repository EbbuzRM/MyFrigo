// ManualEntryContext.tsx — ManualEntryContext module.
//
// exports: Quantity | FormState | InitializeFormData | MetaState | ManualEntryProvider | useManualEntry | ManualEntryContextType
// used_by: components\AppProviders.tsx
//                   components\ProductFormFooter.tsx
//                   components\QuantityInputRow.tsx
//                   components\QuantitySection.tsx
//                   hooks\__tests__\useProductForm.test.ts
//                   hooks\__tests__\useProductInitialization.test.ts
//                   hooks\__tests__\useProductSave.test.ts
//                   hooks\useCategorySelection.ts
//                   hooks\usePhotoActions.ts
//                   hooks\useProductForm.ts
//                   hooks\useProductInitialization.ts
//                   hooks\useProductSave.ts
// rules:   - The ManualEntryContext is composed from three nested providers (Meta, Form, Actions) and a composite wrapper, so any modifications to state management or provider structure must maintain this hierarchy to avoid breaking context dependencies.
//          - All setter functions, form operations, and state types are exported through the unified ManualEntryContextType interface, meaning any new state or operations must be added to this interface and implemented consistently across all sub-contexts.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

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

  // Destruttura metaState per evitare cambi di riferimento nell'useMemo
  const { isEditMode, originalProductId, hasManuallySelectedCategory, isInitialized, setEditMode, setOriginalProductId, setManuallySelectedCategory, setInitialized } = metaState;

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
    setIsEditMode: setEditMode,
    setOriginalProductId: setOriginalProductId,
    setHasManuallySelectedCategory: setManuallySelectedCategory,
    setIsInitialized: setInitialized,
  }), [setField, setQuantities, setEditMode, setOriginalProductId, setManuallySelectedCategory, setInitialized]);

  const actions = useMemo(() => ({
    addQuantity,
    removeQuantity,
    updateQuantity,
    initializeForm,
    clearForm,
  }), [addQuantity, removeQuantity, updateQuantity, initializeForm, clearForm]);

  const value = useMemo<ManualEntryContextType>(() => ({
    ...formState,
    isEditMode,
    originalProductId,
    hasManuallySelectedCategory,
    isInitialized,
    ...setters,
    ...actions,
  }), [formState, isEditMode, originalProductId, hasManuallySelectedCategory, isInitialized, setters, actions]);

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
