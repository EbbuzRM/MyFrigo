import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import { ProductCategory, PRODUCT_CATEGORIES } from '@/types/Product';
import { StorageService } from '@/services/StorageService';
import { IconService } from '@/services/IconService';

interface CategoryContextType {
  categories: ProductCategory[];
  addCategory: (name: string) => Promise<ProductCategory | null>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryById: (id: string) => ProductCategory | undefined;
  loading: boolean;
}

/**
 * @context CategoryContext
 * @description Fornisce uno stato globale per le categorie di prodotti, gestendo il caricamento,
 * l'aggiunta, l'eliminazione e la sincronizzazione con lo storage.
 * Centralizza la logica per evitare discrepanze tra le diverse schermate.
 */
const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

/**
 * @provider CategoryProvider
 * @description Il provider che avvolge l'applicazione e fornisce i dati delle categorie.
 * Gestisce il ciclo di vita dello stato delle categorie, incluso il download in background delle icone.
 */
export const CategoryProvider = ({ children }: { children: ReactNode }) => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        const customCategories = await StorageService.getCustomCategories();
        const mergedCategories = [...PRODUCT_CATEGORIES, ...customCategories];
        setCategories(mergedCategories);
      } catch (error) {
        console.error('[CategoryContext] Errore durante il caricamento delle categorie:', error);
        setCategories(PRODUCT_CATEGORIES);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const saveCustomCategories = async (cats: ProductCategory[]) => {
    const customCategories = cats.filter(c => !PRODUCT_CATEGORIES.some(pc => pc.id === c.id));
    await StorageService.saveCustomCategories(customCategories);
  };

  /**
   * @function addCategory
   * @description Aggiunge una nuova categoria personalizzata.
   * 1. Crea la categoria e aggiorna immediatamente l'UI (aggiornamento ottimistico).
   * 2. Salva la nuova categoria nello storage.
   * 3. Avvia il download dell'icona in background.
   * 4. Se il download ha successo, aggiorna di nuovo l'UI e lo storage con l'URL dell'icona.
   * @param {string} name - Il nome della nuova categoria.
   */
  const addCategory = useCallback(async (name: string): Promise<ProductCategory | null> => {
    const trimmedName = name.trim();
    if (trimmedName === '') {
      throw new Error('Il nome della categoria non può essere vuoto.');
    }
    if (categories.some(cat => cat.name.toLowerCase() === trimmedName.toLowerCase())) {
      throw new Error('Una categoria con questo nome esiste già.');
    }

    const newId = trimmedName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    const newCategory: ProductCategory = {
      id: newId,
      name: trimmedName,
      icon: trimmedName.charAt(0).toUpperCase(),
      color: '#808080',
    };

    const optimisticCategories = [...categories, newCategory];
    setCategories(optimisticCategories);
    await saveCustomCategories(optimisticCategories);

    const iconUrl = await IconService.fetchIconForCategory(trimmedName);

    if (iconUrl) {
      const finalCategory = { ...newCategory, iconUrl };
      const finalCategories = optimisticCategories.map(cat => cat.id === newId ? finalCategory : cat);
      setCategories(finalCategories);
      await saveCustomCategories(finalCategories);
      return finalCategory;
    }
    
    return newCategory;
  }, [categories]);

  /**
   * @function deleteCategory
   * @description Elimina una categoria personalizzata dallo stato e dallo storage.
   * @param {string} id - L'ID della categoria da eliminare.
   */
  const deleteCategory = useCallback(async (id: string) => {
    const updatedCategories = categories.filter(cat => cat.id !== id);
    setCategories(updatedCategories);
    await saveCustomCategories(updatedCategories);
  }, [categories]);

  const getCategoryById = useCallback((id: string) => {
    return categories.find(cat => cat.id === id);
  }, [categories]);

  const value = {
    categories,
    addCategory,
    deleteCategory,
    getCategoryById,
    loading,
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};

/**
 * @hook useCategories
 * @description Hook personalizzato per accedere facilmente al CategoryContext da qualsiasi componente.
 */
export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};