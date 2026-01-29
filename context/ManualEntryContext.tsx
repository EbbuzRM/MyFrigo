import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { LoggingService } from '@/services/LoggingService';
import { Product } from '@/types/Product';

// Definisce la forma di una singola quantità
export interface Quantity {
  id: string;
  quantity: string;
  unit: string;
}

interface LegacyProduct extends Product {
  quantity?: number;
  unit?: string;
  is_frozen?: boolean;
}

// Definisce la forma dello stato del form
export interface ManualEntryFormData {
  name: string;
  brand: string;
  selectedCategory: string;
  quantities: Quantity[]; // Modificato
  purchaseDate: string;
  expirationDate: string;
  notes: string;
  barcode: string;
  imageUrl: string | null;
  isEditMode: boolean;
  originalProductId: string | null;
  hasManuallySelectedCategory: boolean;
  isInitialized: boolean; // Flag to track initialization
  isFrozen: boolean;
}

// Definisce il contesto completo con stato e funzioni
interface ManualEntryContextType {
  // Stato del form
  name: string;
  brand: string;
  selectedCategory: string;
  quantities: Quantity[]; // Modificato
  purchaseDate: string;
  expirationDate: string;
  notes: string;
  barcode: string;
  imageUrl: string | null;
  isEditMode: boolean;
  originalProductId: string | null;
  hasManuallySelectedCategory: boolean;
  isInitialized: boolean; // Flag to track initialization
  isFrozen: boolean;

  // Funzioni per aggiornare lo stato
  setName: (name: string) => void;
  setBrand: (brand: string) => void;
  setSelectedCategory: (category: string) => void;
  setQuantities: (quantities: Quantity[]) => void; // Modificato
  addQuantity: () => void; // Nuovo
  removeQuantity: (id: string) => void; // Nuovo
  updateQuantity: (id: string, field: 'quantity' | 'unit', value: string) => void; // Nuovo
  setPurchaseDate: (date: string) => void;
  setExpirationDate: (date: string) => void;
  setNotes: (notes: string) => void;
  setBarcode: (barcode: string) => void;
  setImageUrl: (url: string | null) => void;
  setHasManuallySelectedCategory: (manual: boolean) => void;
  setIsEditMode: (editMode: boolean) => void;
  setOriginalProductId: (productId: string | null) => void;
  setIsInitialized: (initialized: boolean) => void; // Setter for the flag
  setIsFrozen: (frozen: boolean) => void;

  // Funzioni helper
  initializeForm: (initialData?: Partial<ManualEntryFormData & { product?: Product, category?: string, quantity?: string, unit?: string, productName?: string }>) => void;
  clearForm: () => void;
}

// Crea il contesto
const ManualEntryContext = createContext<ManualEntryContextType | undefined>(undefined);

// Definisce lo stato iniziale
const getInitialState = (): ManualEntryFormData => ({
  name: '',
  brand: '',
  selectedCategory: '',
  quantities: [{ id: uuidv4(), quantity: '1', unit: 'pz' }], // Modificato
  purchaseDate: new Date().toISOString().split('T')[0],
  expirationDate: '',
  notes: '',
  barcode: '',
  imageUrl: null,
  isEditMode: false,
  originalProductId: null,
  hasManuallySelectedCategory: false,
  isInitialized: false, // Initial value for the flag
  isFrozen: false,
});

// Crea il Provider
export const ManualEntryProvider = ({ children }: { children: ReactNode }) => {
  const [formData, setFormData] = useState<ManualEntryFormData>(getInitialState());

  const setName = useCallback((name: string) => {
    LoggingService.info('ManualEntryContext', `Setting name to: ${name}`);
    setFormData(prev => ({ ...prev, name }));
  }, []);
  const setBrand = useCallback((brand: string) => {
    LoggingService.info('ManualEntryContext', `Setting brand to: ${brand}`);
    setFormData(prev => ({ ...prev, brand }));
  }, []);
  const setSelectedCategory = useCallback((category: string) => {
    LoggingService.info('ManualEntryContext', `Setting selectedCategory to: ${category}`);
    setFormData(prev => ({ ...prev, selectedCategory: category }));
  }, []);
  const setQuantities = useCallback((quantities: Quantity[]) => setFormData(prev => ({ ...prev, quantities })), []);

  const addQuantity = useCallback(() => {
    LoggingService.info('ManualEntryContext', 'Adding new quantity');
    setFormData(prev => ({
      ...prev,
      quantities: [...prev.quantities, { id: uuidv4(), quantity: '1', unit: 'pz' }]
    }));
  }, []);

  const removeQuantity = useCallback((id: string) => {
    LoggingService.info('ManualEntryContext', `Removing quantity with id: ${id}`);
    setFormData(prev => ({
      ...prev,
      quantities: prev.quantities.filter(q => q.id !== id)
    }));
  }, []);

  const updateQuantity = useCallback((id: string, field: 'quantity' | 'unit', value: string) => {
    LoggingService.info('ManualEntryContext', `Updating quantity ${id}, field ${field} to: ${value}`);
    setFormData(prev => ({
      ...prev,
      quantities: prev.quantities.map(q =>
        q.id === id ? { ...q, [field]: value } : q
      )
    }));
  }, []);

  const setPurchaseDate = useCallback((date: string) => {
    LoggingService.info('ManualEntryContext', `Setting purchaseDate TO: ${date}`);
    setFormData(prev => {
      LoggingService.info('ManualEntryContext', `Previous purchaseDate: ${prev.purchaseDate}, new: ${date}`);
      return { ...prev, purchaseDate: date };
    });
  }, []);

  const setExpirationDate = useCallback((date: string) => {
    LoggingService.info('ManualEntryContext', `Setting expirationDate TO: ${date}`);
    setFormData(prev => {
      LoggingService.info('ManualEntryContext', `Previous expirationDate: ${prev.expirationDate}, new: ${date}`);
      return { ...prev, expirationDate: date };
    });
  }, []);
  const setNotes = useCallback((notes: string) => {
    LoggingService.info('ManualEntryContext', `Setting notes to: ${notes}`);
    setFormData(prev => ({ ...prev, notes }));
  }, []);
  const setBarcode = useCallback((barcode: string) => {
    LoggingService.info('ManualEntryContext', `Setting barcode to: ${barcode}`);
    setFormData(prev => ({ ...prev, barcode }));
  }, []);
  const setImageUrl = useCallback((url: string | null) => {
    LoggingService.info('ManualEntryContext', `Setting imageUrl to: ${url}`);
    setFormData(prev => ({ ...prev, imageUrl: url }));
  }, []);
  const setHasManuallySelectedCategory = useCallback((manual: boolean) => {
    LoggingService.info('ManualEntryContext', `Setting hasManuallySelectedCategory to: ${manual}`);
    setFormData(prev => ({ ...prev, hasManuallySelectedCategory: manual }));
  }, []);
  const setIsEditMode = useCallback((editMode: boolean) => {
    LoggingService.info('ManualEntryContext', `Setting isEditMode to: ${editMode}`);
    setFormData(prev => ({ ...prev, isEditMode: editMode }));
  }, []);
  const setOriginalProductId = useCallback((productId: string | null) => {
    LoggingService.info('ManualEntryContext', `Setting originalProductId to: ${productId}`);
    setFormData(prev => ({ ...prev, originalProductId: productId }));
  }, []);
  const setIsInitialized = useCallback((initialized: boolean) => {
    LoggingService.info('ManualEntryContext', `Setting isInitialized to: ${initialized}`);
    setFormData(prev => ({ ...prev, isInitialized: initialized }));
  }, []);
  const setIsFrozen = useCallback((frozen: boolean) => {
    LoggingService.info('ManualEntryContext', `Setting isFrozen to: ${frozen}`);
    setFormData(prev => ({ ...prev, isFrozen: frozen }));
  }, []);

  const initializeForm = useCallback((initialData: Partial<ManualEntryFormData & { product?: Product, category?: string, quantity?: string, unit?: string, productName?: string }> = {}) => {
    LoggingService.info('ManualEntryContext', `Initializing form with: ${JSON.stringify(initialData, null, 2)}`);

    setFormData(prevState => {
      LoggingService.info('ManualEntryContext', `Previous state: ${JSON.stringify(prevState, null, 2)}`);

      // Check if we have meaningful data to initialize with
      const hasProductData = initialData.product;
      const hasScannedData = initialData.barcode || initialData.name || initialData.productName;
      const hasSignificantData = hasProductData || hasScannedData;

      // If no significant data, start with a completely fresh state
      let newState: ManualEntryFormData;
      if (!hasSignificantData) {
        LoggingService.info('ManualEntryContext', 'No significant data - starting with fresh state');
        newState = getInitialState();
      } else {
        // Merge the initial data with the previous state only if we have significant data
        // Gestione sicura dei booleani provenienti dai parametri di navigazione (che sono spesso stringhe)
        const safeIsEditMode = String(initialData.isEditMode) === 'true';
        const safeHasManuallySelected = String(initialData.hasManuallySelectedCategory) === 'true';

        newState = {
          ...prevState,
          ...initialData,
          isEditMode: initialData.isEditMode !== undefined ? safeIsEditMode : prevState.isEditMode,
          hasManuallySelectedCategory: initialData.hasManuallySelectedCategory !== undefined ? safeHasManuallySelected : prevState.hasManuallySelectedCategory,
          isFrozen: initialData.isFrozen !== undefined ? initialData.isFrozen : prevState.isFrozen
        };
      }

      if (initialData.product) {
        LoggingService.info('ManualEntryContext', `Processing product data: ${JSON.stringify(initialData.product, null, 2)}`);

        // Destructure quantities out to avoid type mismatch during spread
        const { quantities: productQuantities, ...restProduct } = initialData.product;

        // When loading a full product, start from a clean slate to avoid merging old data.
        // MA preserviamo i flag critici passati in initialData come isEditMode e originalProductId
        newState = {
          ...getInitialState(),
          ...restProduct,
          isEditMode: String(initialData.isEditMode) === 'true',
          originalProductId: initialData.originalProductId || null,
          isFrozen: initialData.product.isFrozen || (initialData.product as LegacyProduct).is_frozen || false
        };

        // Map the 'category' field from the product to 'selectedCategory' for the form state
        if (initialData.product.category) {
          newState.selectedCategory = initialData.product.category;
          LoggingService.info('ManualEntryContext', `Set selectedCategory from product: ${initialData.product.category}`);
        }

        // Handle quantities
        if (Array.isArray(productQuantities) && productQuantities.length > 0) {
          newState.quantities = productQuantities.map((q) => ({
            ...q,
            quantity: q.quantity !== undefined && q.quantity !== null ? String(q.quantity) : '1',
            unit: q.unit || 'pz',
            id: uuidv4()
          }));
          LoggingService.info('ManualEntryContext', `Processed quantities array: ${JSON.stringify(newState.quantities)}`);
        } else if ((initialData.product as LegacyProduct).quantity !== undefined && (initialData.product as LegacyProduct).quantity !== null) {
          const legacyProduct = initialData.product as LegacyProduct;
          newState.quantities = [{ id: uuidv4(), quantity: String(legacyProduct.quantity), unit: legacyProduct.unit || 'pz' }];
          LoggingService.info('ManualEntryContext', `Processed single quantity: ${JSON.stringify(newState.quantities)}`);
        }
        // Cleanup temporary product field
        const { product, ...rest } = newState as any;
        newState = rest;
      }

      // This handles the case where 'category' is passed directly, not inside a product object
      if (initialData.category) {
        newState.selectedCategory = initialData.category;
        LoggingService.info('ManualEntryContext', `Set selectedCategory from direct param: ${initialData.category}`);
      }

      // Clean up legacy fields
      // Clean up legacy fields by destructuring
      const { category, quantity, unit, ...finalState } = newState as any;
      newState = finalState;

      LoggingService.info('ManualEntryContext', `Final new state: ${JSON.stringify(newState, null, 2)}`);
      return newState;
    });
  }, []);

  const clearForm = useCallback(() => {
    LoggingService.info('ManualEntryContext', 'Clearing form');
    const newInitialState = getInitialState();
    LoggingService.info('ManualEntryContext', `Clearing form. New initial state: ${JSON.stringify(newInitialState)}`);
    setFormData(newInitialState);
    LoggingService.info('ManualEntryContext', 'Form cleared to initial state');
  }, []);

  const value = useMemo(() => ({
    ...formData,
    setName,
    setBrand,
    setSelectedCategory,
    setQuantities,
    addQuantity,
    removeQuantity,
    updateQuantity,
    setPurchaseDate,
    setExpirationDate,
    setNotes,
    setBarcode,
    setImageUrl,
    setHasManuallySelectedCategory,
    setIsEditMode,
    setOriginalProductId,
    setIsInitialized,
    setIsFrozen,
    initializeForm,
    clearForm,
  }), [formData, setName, setBrand, setSelectedCategory, setQuantities, addQuantity, removeQuantity, updateQuantity, setPurchaseDate, setExpirationDate, setNotes, setBarcode, setImageUrl, setHasManuallySelectedCategory, setIsEditMode, setOriginalProductId, setIsInitialized, initializeForm, clearForm]);

  return (
    <ManualEntryContext.Provider value={value}>
      {children}
    </ManualEntryContext.Provider>
  );
};

// Hook personalizzato per un facile accesso
export const useManualEntry = () => {
  const context = useContext(ManualEntryContext);
  if (context === undefined) {
    throw new Error('useManualEntry must be used within a ManualEntryProvider');
  }
  return context;
};