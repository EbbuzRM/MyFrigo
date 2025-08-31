import React, { createContext, useState, useContext, ReactNode } from 'react';

// Definisce la forma dello stato del form
interface ManualEntryFormData {
  name: string;
  brand: string;
  selectedCategory: string;
  quantity: string;
  unit: string;
  purchaseDate: string;
  expirationDate: string;
  notes: string;
  barcode: string;
  imageUrl: string | null;
  isEditMode: boolean;
  originalProductId: string | null;
  hasManuallySelectedCategory: boolean;
}

// Definisce il contesto completo con stato e funzioni
interface ManualEntryContextType {
  // Stato del form
  name: string;
  brand: string;
  selectedCategory: string;
  quantity: string;
  unit: string;
  purchaseDate: string;
  expirationDate: string;
  notes: string;
  barcode: string;
  imageUrl: string | null;
  isEditMode: boolean;
  originalProductId: string | null;
  hasManuallySelectedCategory: boolean;
  
  // Funzioni per aggiornare lo stato
  setName: (name: string) => void;
  setBrand: (brand: string) => void;
  setSelectedCategory: (category: string) => void;
  setQuantity: (quantity: string) => void;
  setUnit: (unit: string) => void;
  setPurchaseDate: (date: string) => void;
  setExpirationDate: (date: string) => void;
  setNotes: (notes: string) => void;
  setBarcode: (barcode: string) => void;
  setImageUrl: (url: string | null) => void;
  setHasManuallySelectedCategory: (manual: boolean) => void;
  setIsEditMode: (editMode: boolean) => void;
  setOriginalProductId: (productId: string | null) => void;

  // Funzioni helper
  initializeForm: (initialData?: Partial<ManualEntryFormData>) => void;
  clearForm: () => void;
}

// Crea il contesto
const ManualEntryContext = createContext<ManualEntryContextType | undefined>(undefined);

// Definisce lo stato iniziale
const getInitialState = (): ManualEntryFormData => ({
  name: '',
  brand: '',
  selectedCategory: '',
  quantity: '1',
  unit: 'pz',
  purchaseDate: new Date().toISOString().split('T')[0],
  expirationDate: '',
  notes: '',
  barcode: '',
  imageUrl: null,
  isEditMode: false,
  originalProductId: null,
  hasManuallySelectedCategory: false,
});

// Crea il Provider
export const ManualEntryProvider = ({ children }: { children: ReactNode }) => {
  const [formData, setFormData] = useState<ManualEntryFormData>(getInitialState());

  const setName = (name: string) => setFormData(prev => ({ ...prev, name }));
  const setBrand = (brand: string) => setFormData(prev => ({ ...prev, brand }));
  const setSelectedCategory = (category: string) => setFormData(prev => ({ ...prev, selectedCategory: category }));
  const setQuantity = (quantity: string) => setFormData(prev => ({ ...prev, quantity }));
  const setUnit = (unit: string) => setFormData(prev => ({ ...prev, unit }));
  const setPurchaseDate = (date: string) => setFormData(prev => ({ ...prev, purchaseDate: date }));
  const setExpirationDate = (date: string) => setFormData(prev => ({ ...prev, expirationDate: date }));
  const setNotes = (notes: string) => setFormData(prev => ({ ...prev, notes }));
  const setBarcode = (barcode: string) => setFormData(prev => ({ ...prev, barcode }));
  const setImageUrl = (url: string | null) => setFormData(prev => ({ ...prev, imageUrl: url }));
  const setHasManuallySelectedCategory = (manual: boolean) => setFormData(prev => ({ ...prev, hasManuallySelectedCategory: manual }));
  const setIsEditMode = (editMode: boolean) => setFormData(prev => ({ ...prev, isEditMode: editMode }));
  const setOriginalProductId = (productId: string | null) => setFormData(prev => ({ ...prev, originalProductId: productId }));

  const initializeForm = (initialData: Partial<ManualEntryFormData & { category?: string }> = {}) => {
    // Mappa esplicitamente `category` (dal DB) a `selectedCategory` (nello stato del form)
    if (initialData.category) {
      initialData.selectedCategory = initialData.category;
      delete initialData.category; // Rimuovi per evitare conflitti
    }
    setFormData({ ...getInitialState(), ...initialData });
  };

  const clearForm = () => {
    setFormData(getInitialState());
  };

  const value: ManualEntryContextType = {
    ...formData,
    setName,
    setBrand,
    setSelectedCategory,
    setQuantity,
    setUnit,
    setPurchaseDate,
    setExpirationDate,
    setNotes,
    setBarcode,
    setImageUrl,
    setHasManuallySelectedCategory,
    setIsEditMode,
    setOriginalProductId,
    initializeForm,
    clearForm,
  };

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
