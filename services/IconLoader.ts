// IconLoader.ts — IconLoader module.
//
// exports: IconData | IconLoader
// used_by: services\IconMapper.ts
//                   services\IconService.ts
// rules:   - Caching via AsyncStorage must be attempted before any Supabase fetch, with errors caught silently via LoggingService
//          - The module must always use the 'icon' column (not 'icon_url') when querying categories table
//          - Return type must always be `Promise<IconData[]>` and never throw exceptions to callers
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { supabase } from './supabaseClient';
import { LoggingService } from '@/services/LoggingService';
import { Database } from '@/types/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface IconData {
  id: string;
  url: string;
  categoryId?: string;
  isValid: boolean;
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

    // FIX RADICE: La tabella categories ha 'icon', non 'icon_url' (vedi types/supabase.ts)
    // Cambiamo la query per usare la colonna corretta
    const { data, error } = await supabase
      .from('categories')
      .select('id, icon')
      .eq('user_id', userId);

    if (error) {
      LoggingService.error('IconLoader', 'Errore nel caricamento icone da Supabase', error);
      return [];
    }

    // FIX RADICE: Gestiamo correttamente il tipo senza cast unsafe
    // data è di tipo Tables<'categories'>[] | null secondo il tipo Supabase
    const icons = (data || []).map((item): IconData => ({
      id: item.id,
      url: item.icon || '',  // Usiamo 'icon' invece di 'icon_url'
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
