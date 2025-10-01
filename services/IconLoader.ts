import { supabase } from './supabaseClient';
import { LoggingService } from '@/services/LoggingService';

export interface IconData {
  id: string;
  url: string;
  categoryId?: string;
  isValid: boolean;
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

    return data.map((item: any): IconData => ({
      id: item.id,
      url: item.icon_url || '',
      categoryId: item.id,
      isValid: true,
    }));
  },

  async loadFromOpenMoji(category: string): Promise<IconData[]> {
    try {
      const openMojiData = require('../../assets/data/openmoji.json');
      const filtered = openMojiData.filter((emoji: any) => 
        emoji.category === category
      );
      return filtered.map((emoji: any): IconData => ({
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
