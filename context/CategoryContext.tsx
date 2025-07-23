import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import { ProductCategory, PRODUCT_CATEGORIES } from '@/types/Product';
import { StorageService } from '@/services/StorageService';
import { IconService } from '@/services/IconService';
import { useAuth } from './AuthContext';
import { randomUUID } from 'expo-crypto';

interface CategoryContextType {
  categories: ProductCategory[];
  addCategory: (name: string) => Promise<ProductCategory | null>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryById: (id: string) => ProductCategory | undefined;
  loading: boolean;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (user) {
      loadCategories();
    } else {
      setCategories(PRODUCT_CATEGORIES);
      setLoading(false);
    }
  }, [user, loadCategories]);

  const addCategory = useCallback(async (name: string): Promise<ProductCategory | null> => {
    if (!user) {
      throw new Error('Devi essere loggato per creare una categoria.');
    }

    const trimmedName = name.trim();
    if (trimmedName === '') {
      throw new Error('Il nome della categoria non può essere vuoto.');
    }
    if (categories.some(cat => cat.name.toLowerCase() === trimmedName.toLowerCase())) {
      throw new Error('Una categoria con questo nome esiste già.');
    }

    const newCategoryData = {
      name: trimmedName,
      icon: trimmedName.charAt(0).toUpperCase(),
      color: '#808080',
      user_id: user.id,
      is_default: false,
      id: randomUUID(),
    };

    const savedCategory = await StorageService.addCategory(newCategoryData);

    if (savedCategory) {
      setCategories(prev => [...prev, savedCategory]);

      const iconUrl = await IconService.fetchIconForCategory(trimmedName);
      if (iconUrl) {
        const finalCategory = { ...savedCategory, iconUrl };
        await StorageService.updateCategory(finalCategory);
        setCategories(prev => prev.map(cat => cat.id === finalCategory.id ? finalCategory : cat));
        return finalCategory;
      }
      return savedCategory;
    }
    
    return null;
  }, [categories, user]);

  const deleteCategory = useCallback(async (id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
    try {
      await StorageService.deleteCategory(id);
    } catch (error) {
      console.error("Errore durante l'eliminazione della categoria, ripristino.", error);
      loadCategories();
    }
  }, [loadCategories]);

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

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};
