import { supabase } from './supabaseClient';
import { LoggingService } from '@/services/LoggingService';
import { Database } from '@/types/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface IconData {

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
    const cacheKey = `icons_cache_${userId}`;
    
    try {
      const cachedIcons = await AsyncStorage.getItem(cacheKey);
      if (cachedIcons) {
        return JSON.parse(cachedIcons);
      }
    } catch (e) {
      LoggingService.error('IconLoader', 'Errore lettura cache icone', e);
    }

    const { data, error } = await supabase
      .from('categories')
      .select('id, icon_url')
      .eq('user_id', userId);

    if (error) {
      LoggingService.error('IconLoader', 'Errore nel caricamento icone da Supabase', error);
      return [];
    }

    const icons = (data as SupabaseCategoryRow[]).map((item): IconData => ({
      id: item.id,
      url: item.icon_url || '',
      categoryId: item.id,
      isValid: true,
    }));

    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(icons));
    } catch (e) {
      LoggingService.error('IconLoader', 'Errore salvataggio cache icone', e);
    }

    return icons;
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
