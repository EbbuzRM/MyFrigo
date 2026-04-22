import { supabase } from './supabaseClient';
import { LoggingService } from '@/services/LoggingService';
import { Database } from '@/types/supabase';

export interface IconData {
  id: string;
  url: string;
  categoryId?: string;
  isValid: boolean;
}

interface SupabaseCategoryRow {
  id: string;
  icon_url: string | null;
}

interface OpenMojiEmoji {
  id: string;
  url: string;
  category: string;
}

export const IconLoader = {
  async loadIconsFromSupabase(userId: string): Promise<IconData[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('id, icon_url')
      .eq('user_id', userId);

    if (error) {
      LoggingService.error('IconLoader', 'Errore nel caricamento icone da Supabase', error);
      return [];
    }

    return (data as SupabaseCategoryRow[]).map((item): IconData => ({
      id: item.id,
      url: item.icon_url || '',
      categoryId: item.id,
      isValid: true,
    }));
  },

  async loadFromOpenMoji(category: string): Promise<IconData[]> {
    try {
      const openMojiData = require('../../assets/data/openmoji.json') as OpenMojiEmoji[];
      const filtered = openMojiData.filter((emoji) => 
        emoji.category === category
      );
      return filtered.map((emoji): IconData => ({
        id: emoji.id,
        url: emoji.url,
        isValid: true,
      }));
    } catch (error) {
      LoggingService.error('IconLoader', 'Errore caricamento OpenMoji', error);
      return [];
    }
  },
};
