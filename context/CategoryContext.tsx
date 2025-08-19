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

  const migrateIconPaths = useCallback(async (categories: ProductCategory[]) => {
    try {
      const categoriesToUpdate = categories.filter(cat =>
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
      const customCategories = await StorageService.getCustomCategories();
      
      // Migrare i percorsi delle icone se necessario
      await migrateIconPaths(customCategories);
      
      // Ricaricare le categorie dopo la migrazione
      const updatedCategories = await StorageService.getCustomCategories();
      const mergedCategories = [...PRODUCT_CATEGORIES, ...updatedCategories];
      setCategories(mergedCategories);
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

    LoggingService.info('CategoryContext', `Creating new category: ${trimmedName}`);

    const newCategoryData = {
      name: trimmedName,
      icon: '', // Inizialmente vuoto, verrà aggiornato dopo
      color: '#808080',
      user_id: user.id,
      is_default: false,
      id: randomUUID(),
    };

    const savedCategory = await StorageService.addCategory(newCategoryData);

    if (savedCategory) {
      setCategories(prev => [...prev, savedCategory]);

      const fetchedIcon = await IconService.fetchIconForCategory(trimmedName);
      LoggingService.info('CategoryContext', `Fetched icon for ${trimmedName}:`, fetchedIcon);
      
      if (fetchedIcon) {
        // Converti l'icona nel formato locale per il rendering corretto
        const localIcon = IconService.convertToLocalIcon(fetchedIcon);
        LoggingService.info('CategoryContext', `Converted icon to local format:`, localIcon);
        
        // Aggiorna sia il campo icon che il campo localIcon
        const finalCategory = {
          ...savedCategory,
          icon: typeof fetchedIcon === 'string' ? fetchedIcon : '',
          localIcon: localIcon
        };
        
        LoggingService.info('CategoryContext', 'Updating category with icon data:', finalCategory);
        
        // Aggiorna la categoria nel database con entrambi i campi
        await StorageService.updateCategory({
          id: finalCategory.id,
          icon: finalCategory.icon,
          localIcon: finalCategory.localIcon
        });
        
        // Aggiorna lo stato locale
        setCategories(prev => prev.map(cat =>
          cat.id === finalCategory.id ? finalCategory : cat
        ));
        
        LoggingService.info('CategoryContext', `Category ${finalCategory.id} created successfully with icon`);
        return finalCategory;
      } else {
        LoggingService.warning('CategoryContext', `No icon found for category: ${trimmedName}. It will be displayed without one.`);
        
        // Mostra l'alert con un piccolo ritardo per assicurarsi che sia visibile
        setTimeout(() => {
          Alert.alert(
            'Icona non trovata', 
            `Non è stata trovata un'icona per la categoria "${trimmedName}". La categoria verrà visualizzata senza icona.`,
            [{ text: 'OK', style: 'default' }]
          );
        }, 100);
        
        // Aggiorna lo stato locale con la categoria senza icona
        const categoryWithoutIcon = {
          ...savedCategory,
          iconNotFound: true
        };
        
        setCategories(prev => prev.map(cat =>
          cat.id === categoryWithoutIcon.id ? categoryWithoutIcon : cat
        ));
        
        return categoryWithoutIcon;
      }
    } else {
      LoggingService.error('CategoryContext', `Failed to save category: ${trimmedName}`);
    }
    
    return null;
  }, [categories, user]);

  const deleteCategory = useCallback(async (id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
    try {
      await StorageService.deleteCategory(id);
    } catch (error) {
      LoggingService.error('CategoryContext', `Errore durante l'eliminazione della categoria, ripristino: ${error}`);
      loadCategories();
    }
  }, [loadCategories]);

  const updateCategory = useCallback(async (id: string, name: string) => {
    if (!user) {
      throw new Error('Devi essere loggato per modificare una categoria.');
    }

    const trimmedName = name.trim();
    if (trimmedName === '') {
      throw new Error('Il nome della categoria non può essere vuoto.');
    }
    
    // Verifica se esiste già una categoria con lo stesso nome
    if (categories.some(cat => cat.id !== id && cat.name.toLowerCase() === trimmedName.toLowerCase())) {
      throw new Error('Una categoria con questo nome esiste già.');
    }

    // Trova la categoria esistente
    const existingCategory = categories.find(cat => cat.id === id);
    if (!existingCategory) {
      throw new Error('Categoria non trovata.');
    }

    // Aggiorna solo il nome, mantenendo gli altri campi invariati
    const updatedCategory = {
      ...existingCategory,
      name: trimmedName
    };

    try {
      // Aggiorna la categoria nel database
      await StorageService.updateCategory(updatedCategory);
      
      // Aggiorna lo stato locale
      setCategories(prev => prev.map(cat =>
        cat.id === id ? updatedCategory : cat
      ));
      
      LoggingService.info('CategoryContext', `Categoria ${id} aggiornata con successo`);
    } catch (error) {
      LoggingService.error('CategoryContext', `Errore durante l'aggiornamento della categoria: ${error}`);
      throw error;
    }
  }, [categories, user]);

  const getCategoryById = useCallback((id: string) => {
    return categories.find(cat => cat.id === id);
  }, [categories]);

  const value = {
    categories,
    addCategory,
    deleteCategory,
    updateCategory,
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
