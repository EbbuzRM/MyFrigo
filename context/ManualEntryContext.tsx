import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { LoggingService } from '@/services/LoggingService';

// Definisce la forma di una singola quantità
export interface Quantity {
  id: string;
  quantity: string;
  unit: string;
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

  // Funzioni helper
  initializeForm: (initialData?: Partial<ManualEntryFormData & { product?: any }>) => void;
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
});

// Crea il Provider
export const ManualEntryProvider = ({ children }: { children: ReactNode }) => {
  const [formData, setFormData] = useState<ManualEntryFormData>(getInitialState());

  const setName = useCallback((name: string) => setFormData(prev => ({ ...prev, name })), []);
  const setBrand = useCallback((brand: string) => setFormData(prev => ({ ...prev, brand })), []);
  const setSelectedCategory = useCallback((category: string) => setFormData(prev => ({ ...prev, selectedCategory: category })), []);
  const setQuantities = useCallback((quantities: Quantity[]) => setFormData(prev => ({ ...prev, quantities })), []);
  
  const addQuantity = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      quantities: [...prev.quantities, { id: uuidv4(), quantity: '1', unit: 'pz' }]
    }));
  }, []);

  const removeQuantity = useCallback((id: string) => {
    setFormData(prev => ({
      ...prev,
      quantities: prev.quantities.filter(q => q.id !== id)
    }));
  }, []);

  const updateQuantity = useCallback((id: string, field: 'quantity' | 'unit', value: string) => {
    setFormData(prev => ({
      ...prev,
      quantities: prev.quantities.map(q =>
        q.id === id ? { ...q, [field]: value } : q
      )
    }));
  }, []);

  const setPurchaseDate = useCallback((date: string) => {
    LoggingService.info('ManualEntryContext', `Setting purchaseDate TO: ${date}`);
    setFormData(prev => ({ ...prev, purchaseDate: date }));
  }, []); // Dipendenza vuota perché formData è usato solo per il log

  const setExpirationDate = useCallback((date: string) => {
    LoggingService.info('ManualEntryContext', `Setting expirationDate TO: ${date}`);
    setFormData(prev => ({ ...prev, expirationDate: date }));
  }, []); // Dipendenza vuota perché formData è usato solo per il log
  const setNotes = useCallback((notes: string) => setFormData(prev => ({ ...prev, notes })), []);
  const setBarcode = useCallback((barcode: string) => setFormData(prev => ({ ...prev, barcode })), []);
  const setImageUrl = useCallback((url: string | null) => setFormData(prev => ({ ...prev, imageUrl: url })), []);
  const setHasManuallySelectedCategory = useCallback((manual: boolean) => setFormData(prev => ({ ...prev, hasManuallySelectedCategory: manual })), []);
  const setIsEditMode = useCallback((editMode: boolean) => setFormData(prev => ({ ...prev, isEditMode: editMode })), []);
  const setOriginalProductId = useCallback((productId: string | null) => setFormData(prev => ({ ...prev, originalProductId: productId })), []);
  const setIsInitialized = useCallback((initialized: boolean) => setFormData(prev => ({ ...prev, isInitialized: initialized })), []);

  const initializeForm = useCallback((initialData: Partial<ManualEntryFormData & { product?: any, category?: string, quantity?: string, unit?: string }> = {}) => {
    LoggingService.info('ManualEntryContext', `Initializing form with: ${JSON.stringify(initialData, null, 2)}`);
    
    setFormData(prevState => {
      // Merge the initial data with the previous state instead of resetting completely.
      let newState = { ...prevState, ...initialData };

      if (initialData.product) {
          // When loading a full product, start from a clean slate to avoid merging old data.
          newState = { ...getInitialState(), ...initialData.product };

          // Map the 'category' field from the product to 'selectedCategory' for the form state
          if (initialData.product.category) {
              newState.selectedCategory = initialData.product.category;
          }

          // Handle quantities
          if (Array.isArray(initialData.product.quantities) && initialData.product.quantities.length > 0) {
              newState.quantities = initialData.product.quantities.map((q: any) => ({
                  ...q,
                  quantity: q.quantity !== undefined && q.quantity !== null ? String(q.quantity) : '1',
                  unit: q.unit || 'pz',
                  id: uuidv4()
              }));
          } else if (initialData.product.quantity !== undefined && initialData.product.quantity !== null) {
              newState.quantities = [{ id: uuidv4(), quantity: String(initialData.product.quantity), unit: initialData.product.unit || 'pz' }];
          }
          delete newState.product; 
      }

      // This handles the case where 'category' is passed directly, not inside a product object
      if (initialData.category) {
        newState.selectedCategory = initialData.category;
      }
      
      // Clean up legacy fields
      delete newState.category;
      delete newState.quantity;
      delete newState.unit;

      return newState;
    });
  }, []);

  const clearForm = useCallback(() => {
    LoggingService.info('ManualEntryContext', 'Clearing form');
    setFormData(getInitialState());
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