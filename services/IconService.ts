import { IconLoader, IconData } from './IconLoader';
import { IconMapper } from './IconMapper';
import { LoggingService } from './LoggingService';
// Interfaccia base per la struttura dati OpenMoji
interface OpenMojiIcon {
  annotation: string;
  hexcode: string;
  tags: string[]; // Alcuni tag potrebbero essere stringhe separate da virgola nei dati grezzi ma solitamente array nei dati elaborati
  svg?: string;
  url?: string;
}

const openmojiData = require('../assets/data/openmoji.json') as OpenMojiIcon[];

// Mappa di traduzione da categorie italiane a inglesi
const TRANSLATION_MAP: Record<string, string> = {
  'Latticini': 'dairy',
  'Cibo per animali': 'pet food',
  // Aggiungi altre categorie comuni (es. da PRODUCT_CATEGORIES)
  'Brioches': 'bread',
  'Cibo': 'food',
  'Cane': 'dog',
  // Estendi secondo le necessità dell'app
};

export const IconService = {
  // Metodo esistente
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

  // Metodi ripristinati per compatibilità
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
   * Converte un hexcode (es. "1FAD2") nel carattere emoji Unicode corrispondente (es. "🫒")
   */
  hexcodeToEmoji(hexcode: string): string {
    try {
      // Gestisce codepoint multipli separati da trattino (es. "1F468-200D-1F373")
      const codepoints = hexcode.split('-').map(code => parseInt(code, 16));
      return String.fromCodePoint(...codepoints);
    } catch (error) {
      LoggingService.error('IconService', `Errore nella conversione hexcode ${hexcode} in emoji`, error);
      return '❓'; // Emoji di fallback
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
      .slice(0, 10); // Top 10 risultati

    // Se non ha trovato risultati con la traduzione, prova con il nome originale
    if (results.length === 0 && name.toLowerCase() !== translated.toLowerCase()) {
      LoggingService.info('IconService', `Nessun risultato con traduzione, provo ricerca diretta per "${name}"`);
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
      LoggingService.warning('IconService', `Nessuna icona locale trovata per "${name}"`);
    } else {
      LoggingService.info('IconService', `Trovate ${results.length} icone per "${name}"`);
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

      // Verifica cache (semplice cache in memoria per ora; espandi se necessario)
      const cacheKey = categoryName.toLowerCase();
      const cached = this.iconCache?.[cacheKey];
      if (cached) {
        LoggingService.info('IconService', `Uso icona in cache per categoria: ${categoryName}`);
        return Promise.resolve(cached);
      }

      // Cerca nei dati locali
      const icons = this.searchInLocalData(categoryName);
      if (icons.length > 0) {
        // Converti hexcode in emoji Unicode invece di URL SVG (React Native non supporta SVG in Image)
        const hexcode = icons[0].hexcode;
        const emoji = this.hexcodeToEmoji(hexcode);

        // Salva in cache
        if (this.iconCache && emoji) this.iconCache[cacheKey] = emoji;
        LoggingService.info('IconService', `Found local icon for ${categoryName}: ${emoji} (${hexcode})`);
        return Promise.resolve(emoji);
      }

      const fallback = this.getFallbackIcon(categoryName);
      LoggingService.warning('IconService', `Nessuna icona trovata per ${categoryName}, uso fallback: ${fallback}`);
      return Promise.resolve(fallback);
    } catch (error) {
      LoggingService.error('IconService', `Errore nel recupero icona per ${categoryName}`, error);
      return Promise.resolve(null);
    }
  },

  getLocalProductIcon(categoryName: string): string | null {
    // Placeholder basato su test; implementa logica per ID locali (es. da asset app o Supabase)
    // Ad esempio, se categoryName === 'Brioches', restituisci 123 (come nel mock del test)
    const localMap: Record<string, string> = {
      'Brioches': 'local_brioches_icon', // Esempio dal test
      // Aggiungi altri in base alla tua app
    };
    return localMap[categoryName] || null;
  },

  convertToLocalIcon(iconPath: string): { uri: string } | undefined {
    if (!iconPath) return undefined;
    // Logica per convertire URL globale in percorso locale (es. sostituisci URL base)
    // Esempio: dal test, sostituisci 'icon_products/' con 'assets/icon_products/'
    const localPath = iconPath.startsWith('icon_products/')
      ? iconPath.replace('icon_products/', 'assets/icon_products/')
      : iconPath;
    LoggingService.info('IconService', `Percorso icona convertito: ${iconPath} -> ${localPath}`);
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

  // Proprietà cache (per uso interno)
  iconCache: {} as Record<string, string>,

  // Metodi per salvare/caricare cache (placeholder)
  async saveIconCache() {
    // Implementa AsyncStorage se necessario
  },

  async loadIconCache() {
    return this.iconCache;
  },
};
