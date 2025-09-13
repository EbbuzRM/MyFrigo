import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import { Alert } from 'react-native';
import { ProductCategory, PRODUCT_CATEGORIES } from '@/types/Product';
import { StorageService } from '@/services/StorageService';
import { IconService } from '@/services/IconService';
import { useAuth } from './AuthContext';
import { randomUUID } from 'expo-crypto';
import { LoggingService } from '@/services/LoggingService';

interface CategoryContextType {
  categories: ProductCategory[];
  addCategory: (name: string) => Promise<ProductCategory | null>;
  deleteCategory: (id: string) => Promise<void>;
  updateCategory: (id: string, name: string) => Promise<void>;
  getCategoryById: (id: string) => ProductCategory | undefined;
  loading: boolean;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const migrateIconPaths = useCallback(async (categoriesToMigrate: ProductCategory[]) => {
    try {
      const categoriesToUpdate = categoriesToMigrate.filter(cat =>
        cat.icon && cat.icon.startsWith('icon_products/') && !cat.icon.startsWith('assets/icon_products/')
      );
      
      if (categoriesToUpdate.length > 0) {
        LoggingService.info('CategoryContext', `Migrating ${categoriesToUpdate.length} categories with old icon paths`);
        
        for (const category of categoriesToUpdate) {
          const newIconPath = category.icon!.replace('icon_products/', 'assets/icon_products/');
          const newLocalIcon = IconService.convertToLocalIcon(newIconPath);
          
          await StorageService.updateCategory({
            id: category.id,
            icon: newIconPath,
            localIcon: newLocalIcon !== undefined ? newLocalIcon : undefined
          });
          
          LoggingService.info('CategoryContext', `Migrated category ${category.name} icon path from ${category.icon} to ${newIconPath}`);
        }
      }
    } catch (error) {
      LoggingService.error('CategoryContext', `Error migrating icon paths: ${error}`);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const dbCategories = await StorageService.getAllCategories();

      const finalCategories = [
        ...dbCategories,
        ...PRODUCT_CATEGORIES.filter(hardcodedCat => 
          !dbCategories.some(dbCat => dbCat.id === hardcodedCat.id)
        )
      ];

      finalCategories.sort((a, b) => a.name.localeCompare(b.name));

      await migrateIconPaths(finalCategories);

      setCategories(finalCategories);
    } catch (error) {
      LoggingService.error('CategoryContext', `Errore durante il caricamento delle categorie: ${error}`);
      setCategories(PRODUCT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  }, [migrateIconPaths]);

  useEffect(() => {
    if (user) {
      loadCategories();
    } else {
      const sortedDefaultCategories = [...PRODUCT_CATEGORIES].sort((a, b) => a.name.localeCompare(b.name));
      setCategories(sortedDefaultCategories);
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

    LoggingService.info('CategoryContext', `Creating new category: ${trimmedName}`);

    const newCategoryData: ProductCategory = {
      id: randomUUID(),
      name: trimmedName,
      icon: '',
      color: '#808080',
      userId: user.id,
      isDefault: false,
    };

    const savedCategory = await StorageService.addCategory(newCategoryData);

    if (savedCategory) {
      setCategories(prev => [...prev, savedCategory].sort((a, b) => a.name.localeCompare(b.name)));

      const fetchedIcon = await IconService.fetchIconForCategory(trimmedName);
      LoggingService.info('CategoryContext', `Fetched icon for ${trimmedName}:`, fetchedIcon);
      
      if (fetchedIcon) {
        const localIcon = IconService.convertToLocalIcon(fetchedIcon);
        LoggingService.info('CategoryContext', `Converted icon to local format:`, localIcon);
        
        const finalCategory = {
          ...savedCategory,
          icon: typeof fetchedIcon === 'string' ? fetchedIcon : '',
          localIcon: localIcon
        };
        
        LoggingService.info('CategoryContext', 'Updating category with icon data:', finalCategory);
        
        await StorageService.updateCategory({
          id: finalCategory.id,
          icon: finalCategory.icon,
          localIcon: finalCategory.localIcon
        });
        
        setCategories(prev => prev.map(cat =>
          cat.id === finalCategory.id ? finalCategory : cat
        ).sort((a, b) => a.name.localeCompare(b.name)));
        
        LoggingService.info('CategoryContext', `Category ${finalCategory.id} created successfully with icon`);
        return finalCategory;
      } else {
        LoggingService.warning('CategoryContext', `No icon found for category: ${trimmedName}. It will be displayed without one.`);
        
        setTimeout(() => {
          Alert.alert(
            'Icona non trovata', 
            `Non è stata trovata un'icona per la categoria "${trimmedName}". La categoria verrà visualizzata senza icona.`,
            [{ text: 'OK', style: 'default' }]
          );
        }, 100);
        
        const categoryWithoutIcon = {
          ...savedCategory,
          iconNotFound: true
        };
        
        setCategories(prev => prev.map(cat =>
          cat.id === categoryWithoutIcon.id ? categoryWithoutIcon : cat
        ).sort((a, b) => a.name.localeCompare(b.name)));
        
        return categoryWithoutIcon;
      }
    } else {
      LoggingService.error('CategoryContext', `Failed to save category: ${trimmedName}`);
    }
    
    return null;
  }, [categories, user]);

  const deleteCategory = useCallback(async (id: string) => {
    const originalCategories = categories;
    setCategories(prev => prev.filter(cat => cat.id !== id));
    try {
      await StorageService.deleteCategory(id);
    } catch (error) {
      LoggingService.error('CategoryContext', `Errore durante l'eliminazione della categoria, ripristino: ${error}`);
      setCategories(originalCategories);
    }
  }, [categories]);

  const updateCategory = useCallback(async (id: string, name: string) => {
    if (!user) {
      throw new Error('Devi essere loggato per modificare una categoria.');
    }

    const trimmedName = name.trim();
    if (trimmedName === '') {
      throw new Error('Il nome della categoria non può essere vuoto.');
    }
    
    if (categories.some(cat => cat.id !== id && cat.name.toLowerCase() === trimmedName.toLowerCase())) {
      throw new Error('Una categoria con questo nome esiste già.');
    }

    const existingCategory = categories.find(cat => cat.id === id);
    if (!existingCategory) {
      throw new Error('Categoria non trovata.');
    }

    const updatedCategory = {
      ...existingCategory,
      name: trimmedName
    };

    try {
      await StorageService.updateCategory(updatedCategory);
      
      setCategories(prev => prev.map(cat =>
        cat.id === id ? updatedCategory : cat
      ).sort((a, b) => a.name.localeCompare(b.name)));
      
      LoggingService.info('CategoryContext', `Categoria ${id} aggiornata con successo`);
    } catch (error) {
      LoggingService.error('CategoryContext', `Errore durante l'aggiornamento della categoria: ${error}`);
      throw error;
    }
  }, [categories, user]);

  const getCategoryById = useCallback((id: string) => {
    return categories.find(cat => cat.id === id);
  }, [categories]);

  const value = React.useMemo(() => ({
    categories,
    addCategory,
    deleteCategory,
    updateCategory,
    getCategoryById,
    loading,
  }), [categories, addCategory, deleteCategory, updateCategory, getCategoryById, loading]);

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
