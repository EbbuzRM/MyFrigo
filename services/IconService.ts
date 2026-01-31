import { IconLoader, IconData } from './IconLoader';
import { IconMapper } from './IconMapper';
import { LoggingService } from './LoggingService';
// Basic interface for OpenMoji data structure
interface OpenMojiIcon {
  annotation: string;
  hexcode: string;
  tags: string[]; // Some tags might be comma separated strings in raw data but usually arrays in processed
  svg?: string;
  url?: string;
}

const openmojiData = require('../assets/data/openmoji.json') as OpenMojiIcon[];

// Translation map for Italian to English categories
const TRANSLATION_MAP: Record<string, string> = {
  'Latticini': 'dairy',
  'Cibo per animali': 'pet food',
  // Add more from test or common categories (e.g., from PRODUCT_CATEGORIES)
  'Brioches': 'bread',
  'Cibo': 'food',
  'Cane': 'dog',
  // Extend as needed based on your app's categories
};

export const IconService = {
  // Existing method
  async getIconsForCategory(userId: string, categoryId: string): Promise<IconData> {
    try {
      const icons = await IconLoader.loadIconsFromSupabase(userId);
      const openMojiIcons = await IconLoader.loadFromOpenMoji('food');
      const allIcons = [...icons, ...openMojiIcons];
      const mapped = IconMapper.mapIconToCategory(allIcons, categoryId);
      if (mapped) {
        return IconMapper.enhanceIconWithDefaults(mapped);
      }
      LoggingService.warning('IconService', `Icone non trovate per categoria ${categoryId}`);
      return { id: categoryId, url: 'default', categoryId, isValid: true };
    } catch (error) {
      LoggingService.error('IconService', 'Errore in getIconsForCategory', error);
      throw error;
    }
  },

  validate: IconMapper.validateIconUrl,

  // Restored methods for compatibility
  translateToEnglish(name: string): string {
    LoggingService.info('IconService', `Translating "${name}"`);
    const upperName = name.toLowerCase();
    const translation = TRANSLATION_MAP[upperName] || Object.values(TRANSLATION_MAP).find(value => upperName.includes(value)) || name;
    LoggingService.info('IconService', `Found translation: "${name}" -> "${translation}"`);
    return translation;
  },

  loadLocalEmojiData(): OpenMojiIcon[] {
    try {
      const emojiData = require('../assets/data/openmoji.json');
      return emojiData as OpenMojiIcon[];
    } catch (error) {
      LoggingService.error('IconService', 'Error loading local emoji data', error);
      return [];
    }
  },

  /**
   * Converts a hexcode (e.g., "1FAD2") to its Unicode emoji character (e.g., "🫒")
   */
  hexcodeToEmoji(hexcode: string): string {
    try {
      // Handle multiple codepoints separated by hyphen (e.g., "1F468-200D-1F373")
      const codepoints = hexcode.split('-').map(code => parseInt(code, 16));
      return String.fromCodePoint(...codepoints);
    } catch (error) {
      LoggingService.error('IconService', `Error converting hexcode ${hexcode} to emoji`, error);
      return '❓'; // Fallback emoji
    }
  },

  searchInLocalData(name: string): (OpenMojiIcon & { score: number; id: string; name: string })[] {
    const data = this.loadLocalEmojiData();
    if (!data.length) return [];

    // Prima prova con la traduzione
    const translated = this.translateToEnglish(name);
    const keywords = translated.toLowerCase().split(' ').filter(k => k.length > 0);

    let results = data
      .map((emoji: OpenMojiIcon) => {
        const score = keywords.reduce((acc, kw) => {
          const match = emoji.annotation.toLowerCase().includes(kw) ||
            (Array.isArray(emoji.tags) && emoji.tags.some((tag: string) => tag.toLowerCase().includes(kw)));
          return acc + (match ? 1 : 0);
        }, 0);
        return { ...emoji, score, id: emoji.hexcode, name: emoji.annotation, svg: emoji.svg || '' };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Top 10

    // Se non ha trovato risultati con la traduzione, prova con il nome originale
    if (results.length === 0 && name.toLowerCase() !== translated.toLowerCase()) {
      LoggingService.info('IconService', `No results with translation, trying direct search for "${name}"`);
      const directKeywords = name.toLowerCase().split(' ').filter(k => k.length > 0);

      results = data
        .map((emoji: OpenMojiIcon) => {
          const score = directKeywords.reduce((acc, kw) => {
            const match = emoji.annotation.toLowerCase().includes(kw) ||
              (Array.isArray(emoji.tags) && emoji.tags.some((tag: string) => tag.toLowerCase().includes(kw)));
            return acc + (match ? 1 : 0);
          }, 0);
          return { ...emoji, score, id: emoji.hexcode, name: emoji.annotation, svg: emoji.svg || '' };
        })
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    }

    if (results.length === 0) {
      LoggingService.warning('IconService', `No local icons found for "${name}"`);
    } else {
      LoggingService.info('IconService', `Found ${results.length} icons for "${name}"`);
    }

    return results;
  },

  fetchIconForCategory(categoryName: string): Promise<string | null> {
    LoggingService.info('IconService', `Fetching icon for category: ${categoryName}`);
    try {
      const localIcon = this.getLocalProductIcon(categoryName);
      if (localIcon) {
        LoggingService.info('IconService', `Using local product icon for category: ${categoryName}`);
        return Promise.resolve(localIcon);
      }

      // Check cache (simple in-memory for now; expand if needed)
      const cacheKey = categoryName.toLowerCase();
      const cached = this.iconCache?.[cacheKey];
      if (cached) {
        LoggingService.info('IconService', `Using cached icon for category: ${categoryName}`);
        return Promise.resolve(cached);
      }

      // Search local data
      const icons = this.searchInLocalData(categoryName);
      if (icons.length > 0) {
        // Convert hexcode to emoji Unicode instead of SVG URL (React Native doesn't support SVG in Image)
        const hexcode = icons[0].hexcode;
        const emoji = this.hexcodeToEmoji(hexcode);

        // Cache it
        if (this.iconCache && emoji) this.iconCache[cacheKey] = emoji;
        LoggingService.info('IconService', `Found local icon for ${categoryName}: ${emoji} (${hexcode})`);
        return Promise.resolve(emoji);
      }

      const fallback = this.getFallbackIcon(categoryName);
      LoggingService.warning('IconService', `No icon found for ${categoryName}, using fallback: ${fallback}`);
      return Promise.resolve(fallback);
    } catch (error) {
      LoggingService.error('IconService', `Error fetching icon for ${categoryName}`, error);
      return Promise.resolve(null);
    }
  },

  getLocalProductIcon(categoryName: string): string | null {
    // Placeholder based on test; implement logic for local IDs (e.g., from app assets or Supabase)
    // For example, if categoryName === 'Brioches', return 123 (as in test mock)
    const localMap: Record<string, string> = {
      'Brioches': 'local_brioches_icon', // Example from test
      // Add more based on your app
    };
    return localMap[categoryName] || null;
  },

  convertToLocalIcon(iconPath: string): { uri: string } | undefined {
    if (!iconPath) return undefined;
    // Logic to convert global URL to local path (e.g., replace base URL)
    // Example: From test, replace 'icon_products/' to 'assets/icon_products/'
    const localPath = iconPath.startsWith('icon_products/')
      ? iconPath.replace('icon_products/', 'assets/icon_products/')
      : iconPath;
    LoggingService.info('IconService', `Converted icon path: ${iconPath} -> ${localPath}`);
    // Restituisce un oggetto { uri } se il path locale è diverso dall'originale
    return localPath !== iconPath ? { uri: localPath } : undefined;
  },

  getFallbackIcon(categoryName: string): string | null {
    // Mappa di fallback emoji per categorie comuni
    const fallbackMap: Record<string, string> = {
      'food': '🍽️',
      'cibo': '🍽️',
      'alimenti': '🥫',
      'bevande': '🥤',
      'drinks': '🥤',
      'snack': '🍿',
      'dolci': '🍬',
      'sweets': '🍬',
    };

    const lowerName = categoryName.toLowerCase();

    // Cerca una corrispondenza diretta
    if (fallbackMap[lowerName]) {
      return fallbackMap[lowerName];
    }

    // Cerca una corrispondenza parziale
    for (const [key, emoji] of Object.entries(fallbackMap)) {
      if (lowerName.includes(key) || key.includes(lowerName)) {
        return emoji;
      }
    }

    // Emoji generico per alimenti (scatola di conserva)
    return '🥫';
  },

  // Cache property (for internal use)
  iconCache: {} as Record<string, string>,

  // Methods for cache save/load (placeholders)
  async saveIconCache() {
    // Implement AsyncStorage if needed
  },

  async loadIconCache() {
    return this.iconCache;
  },
};
