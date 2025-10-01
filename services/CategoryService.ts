import { ProductCategory } from '@/types/Product';
import { supabase } from './supabaseClient';
import {
  convertCategoryToCamelCase,
  convertCategoryToSnakeCase,
  convertCategoriesToCamelCase,
} from '../utils/caseConverter';
import { LoggingService } from './LoggingService';

/**
 * Servizio per la gestione delle categorie di prodotti
 */
export class CategoryService {

  /**
   * Recupera tutte le categorie personalizzate
   * @returns Promise con la lista delle categorie personalizzate
   */
  static async getCustomCategories(): Promise<ProductCategory[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_default', false);
      if (error) throw error;
      if (!data) return [];

      const camelCasedData = convertCategoriesToCamelCase(data);

      // THIS IS THE FIX
      const parsedData = camelCasedData.map(category => {
        if (category.localIcon && typeof category.localIcon === 'string') {
          try {
            return { ...category, localIcon: JSON.parse(category.localIcon) };
          } catch (e) {
            LoggingService.error('CategoryService', `Failed to parse localIcon for category ${category.id}`, e);
            return { ...category, localIcon: undefined }; // or some fallback
          }
        }
        return category;
      });

      return parsedData;
    } catch (error: any) {
      LoggingService.error('CategoryService', 'Error getting categories from Supabase', error);
      return [];
    }
  }

  /**
   * Recupera tutte le categorie, sia quelle predefinite che quelle personalizzate dall'utente.
   * @returns Promise con la lista completa delle categorie.
   */
  static async getAllCategories(): Promise<ProductCategory[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        // Se l'utente non è loggato, restituisce solo le categorie predefinite
      // @ts-ignore - Supabase type inference issue
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_default', true);
        if (error) throw error;
        return data ? convertCategoriesToCamelCase(data) : [];
      }

      const userId = session.user.id;
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .or(`is_default.eq.true,user_id.eq.${userId}`);

      if (error) throw error;
      if (!data) return [];

      const camelCasedData = convertCategoriesToCamelCase(data);

      const parsedData = camelCasedData.map(category => {
        if (category.localIcon && typeof category.localIcon === 'string') {
          try {
            return { ...category, localIcon: JSON.parse(category.localIcon) };
          } catch (e) {
            LoggingService.error('CategoryService', `Failed to parse localIcon for category ${category.id}`, e);
            return { ...category, localIcon: undefined };
          }
        }
        return category;
      });

      return parsedData;
    } catch (error: any) {
      LoggingService.error('CategoryService', 'Error getting all categories from Supabase', error);
      return [];
    }
  }

  /**
   * Aggiunge una nuova categoria
   * @param category Categoria da aggiungere
   * @returns Promise con la categoria aggiunta
   * @throws Error se si verifica un errore durante l'aggiunta
   */
  static async addCategory(category: ProductCategory): Promise<ProductCategory> {
    try {
      const categoryData = convertCategoryToSnakeCase(category);
      const { data, error } = await supabase
        .from('categories')
        .insert(categoryData as any)
        .select()
        .single();
      if (error) throw error;
      return convertCategoryToCamelCase(data);
    } catch (error: any) {
      LoggingService.error('CategoryService', 'Error adding category to Supabase', error);
      throw error;
    }
  }

  /**
   * Aggiorna una categoria esistente
   * @param category Dati parziali della categoria da aggiornare
   * @returns Promise che si risolve quando la categoria è stata aggiornata
   * @throws Error se si verifica un errore durante l'aggiornamento
   */
  static async updateCategory(category: Partial<ProductCategory>): Promise<void> {
    try {
      LoggingService.info('CategoryService', `Updating category ${category.id} with data:`, category);

      // Prepara i dati per l'aggiornamento
      const updateData = { ...category };

      // Se c'è un icon o localIcon, crea un oggetto specifico per l'aggiornamento
      if (updateData.icon || updateData.localIcon !== undefined) {
        // Crea un oggetto specifico per l'aggiornamento che include solo i campi necessari
        const dataToUpdate: any = {
          id: updateData.id
        };

        // Aggiungi l'icona se presente
        if (updateData.icon) {
          dataToUpdate.icon = updateData.icon;
          LoggingService.info('CategoryService', `Updating icon to: ${updateData.icon}`);
        }

        // Aggiungi l'icona locale se presente
        if (updateData.localIcon !== undefined) {
          dataToUpdate.local_icon = JSON.stringify(updateData.localIcon);
          LoggingService.info('CategoryService', `Updating localIcon to:`, updateData.localIcon);
        }

        // Esegui l'aggiornamento
      // @ts-ignore - Supabase type inference issue
      const { error } = await supabase
        .from('categories')
        .update(dataToUpdate)
        .eq('id', category.id!);

        if (error) {
          LoggingService.error('CategoryService', 'Supabase update error', error);
          throw error;
        }

        LoggingService.info('CategoryService', `Category ${category.id} updated successfully`);
      } else {
        LoggingService.info('CategoryService', `No icon or localIcon to update for category ${category.id}`);

        const updateDataTyped = convertCategoryToSnakeCase(updateData);
        const { error } = await supabase
          .from('categories')
          .update(updateDataTyped as any)
          .eq('id', category.id!);

        if (error) throw error;
      }
    } catch (error: any) {
      LoggingService.error('CategoryService', 'Error updating category in Supabase', error);
      throw error;
    }
  }

  /**
   * Elimina una categoria
   * @param categoryId ID della categoria da eliminare
   * @returns Promise che si risolve quando la categoria è stata eliminata
   * @throws Error se si verifica un errore durante l'eliminazione
   */
  static async deleteCategory(categoryId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);
      if (error) throw error;
    } catch (error: any) {
      LoggingService.error('CategoryService', 'Error deleting category from Supabase', error);
      throw error;
    }
  }
}