import { LoggingService } from '@/services/LoggingService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import { Image } from 'react-native';

// Dizionario di traduzione italiano-inglese per categorie comuni
const translationDict: Record<string, string> = {
  // Categorie alimentari
  'latticini': 'dairy',
  'latte': 'milk',
  'formaggio': 'cheese',
  'yogurt': 'yogurt',
  'carne': 'meat',
  'pollo': 'chicken',
  'manzo': 'beef',
  'maiale': 'pork',
  'pesce': 'fish',
  'tonno': 'tuna',
  'salmone': 'salmon',
  'frutta': 'fruit',
  'mela': 'apple',
  'banana': 'banana',
  'arancia': 'orange',
  'verdura': 'vegetable',
  'pomodoro': 'tomato',
  'insalata': 'salad',
  'patata': 'potato',
  'surgelati': 'frozen food',
  'gelato': 'ice cream',
  'pizza': 'pizza',
  'pasta': 'pasta',
  'bevande': 'drinks',
  'acqua': 'water',
  'succo': 'juice',
  'vino': 'wine',
  'birra': 'beer',
  'caffè': 'coffee',
  'tè': 'tea',
  'pane': 'bread',
  'biscotti': 'cookies',
  'cereali': 'cereals',
  'riso': 'rice',
  'farina': 'flour',
  'zucchero': 'sugar',
  'sale': 'salt',
  'olio': 'oil',
  'aceto': 'vinegar',
  'spezie': 'spices',
  'snack': 'snack',
  'cioccolato': 'chocolate',
  'caramelle': 'candy',
  'uova': 'eggs',
  'dolci': 'sweets',
  'torta': 'cake',
  'salame': 'salami',
  'salumi': 'salami',
  'castagne': 'chestnuts',
  'pancetta': 'bacon',
  'cibo animali': 'pet food',
  
  // Categorie generiche
  'prodotti': 'products',
  'cibo': 'food',
  'cucina': 'kitchen',
  'casa': 'home',
  'pulizia': 'cleaning',
  'igiene': 'hygiene',
  'salute': 'health',
  'bellezza': 'beauty',
  'bambini': 'children',
  'animali': 'pets',
  'elettronica': 'electronics',
  'ufficio': 'office',
  'sport': 'sports',
  'giardinaggio': 'gardening',
  'auto': 'car',
  'abbigliamento': 'clothing'
};

// Icone di fallback per categorie comuni
const fallbackIcons: Record<string, string> = {
  'latticini': '🧀',
  'carne': '🥩',
  'pesce': '🐟',
  'frutta': '🍎',
  'verdura': '🥦',
  'surgelati': '🧊',
  'bevande': '🥤',
  'pane': '🍞',
  'pasta': '🍝',
  'snack': '🍫',
  'uova': '🥚',
  'dolci': '🍰',
  'olive': '🫒',
  'cibo animali': '🐈',
};

// Chiave per la cache delle icone
const ICON_CACHE_KEY = 'myfrigo_icon_cache';

const localIconMap: Record<string, number> = {
  'brioches': require('../assets/icon_products/brioches.png'),
  'castagne': require('../assets/icon_products/castagne.png'),
  'croissant': require('../assets/icon_products/croissant.png'),
  'pancetta': require('../assets/icon_products/pancetta.png'),
  'pizza': require('../assets/icon_products/pizza.png'),
  'potato': require('../assets/icon_products/potato.png'),
  'salami': require('../assets/icon_products/salami.png'),
  'salumi': require('../assets/icon_products/salami.png'),
};

export class IconService {
  /**
   * Traduce un termine italiano in inglese per migliorare la ricerca di icone
   * @param term Termine in italiano da tradurre
   * @returns Termine tradotto in inglese o il termine originale se non trovato
   */
  static translateToEnglish(term: string): string {
    const lowerTerm = term.toLowerCase();
    
    LoggingService.info('IconService', `Translating term: "${term}" (lowercase: "${lowerTerm}")`);
    
    // Controlla se il termine esatto esiste nel dizionario
    if (translationDict[lowerTerm]) {
      const translated = translationDict[lowerTerm];
      LoggingService.info('IconService', `Found exact translation: "${term}" -> "${translated}"`);
      return translated;
    }
    
    // Cerca la corrispondenza parziale più lunga
    let bestMatch = '';
    let longestMatch = 0;

    for (const [italian, english] of Object.entries(translationDict)) {
      if (lowerTerm.includes(italian) && italian.length > longestMatch) {
        bestMatch = english;
        longestMatch = italian.length;
      }
    }

    if (bestMatch) {
      LoggingService.info('IconService', `Found best partial translation for "${term}": -> "${bestMatch}"`);
      return bestMatch;
    }
    
    // Se non trova corrispondenze, ritorna il termine originale
    LoggingService.info('IconService', `No translation found for: "${term}", returning original`);
    return term;
  }

  /**
   * Carica la cache delle icone da AsyncStorage
   */
  static async loadIconCache(): Promise<Record<string, string>> {
    try {
      const cacheJson = await AsyncStorage.getItem(ICON_CACHE_KEY);
      if (cacheJson) {
        return JSON.parse(cacheJson);
      }
    } catch (error) {
      LoggingService.error('IconService', 'Error loading icon cache', error);
    }
    return {};
  }

  /**
   * Salva la cache delle icone in AsyncStorage
   */
  static async saveIconCache(cache: Record<string, string>): Promise<void> {
    try {
      await AsyncStorage.setItem(ICON_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      LoggingService.error('IconService', 'Error saving icon cache', error);
    }
  }

  /**
   * Ottiene un'icona dalla cache o null se non presente
   */
  static async getIconFromCache(term: string): Promise<string | null> {
    const cache = await this.loadIconCache();
    return cache[term] || null;
  }

  /**
   * Aggiunge un'icona alla cache
   */
  static async addIconToCache(term: string, iconUrl: string): Promise<void> {
    const cache = await this.loadIconCache();
    cache[term] = iconUrl;
    await this.saveIconCache(cache);
  }

  /**
   * Ottiene un'icona di fallback per una categoria
   */
  static getFallbackIcon(categoryName: string): string | null {
    const lowerName = categoryName.toLowerCase();
    
    // Cerca corrispondenze esatte
    if (fallbackIcons[lowerName]) {
      return fallbackIcons[lowerName];
    }
    
    // Cerca corrispondenze parziali
    for (const [key, icon] of Object.entries(fallbackIcons)) {
      if (lowerName.includes(key) && key !== 'default') {
        return icon;
      }
    }
    
    // Se nessuna icona di fallback viene trovata, restituisce null
    return null;
  }

  static loadLocalEmojiData(): any[] {
    try {
      // Carica direttamente il file JSON dal pacchetto npm installato
      const openmojiData = require('openmoji/data/openmoji.json');
      return openmojiData;
    } catch (error) {
      LoggingService.error('IconService', 'Error loading local emoji data from require', error);
      return [];
    }
  }

  static searchInLocalData(searchTerm: string): any[] {
    const openmojiData = this.loadLocalEmojiData();
    if (openmojiData.length === 0) {
      return [];
    }

    // 1. Traduci l'intera frase per ottenere un contesto generale (es. "cibo animali" -> "pet food")
    const fullTranslatedTerm = this.translateToEnglish(searchTerm).toLowerCase();

    // 2. Scomponi il termine originale e traduci ogni parola singolarmente
    const individualWords = searchTerm.toLowerCase().split(' ');
    const translatedWords = individualWords.map(word => this.translateToEnglish(word).toLowerCase());

    // 3. Unisci tutte le parole chiave, rimuovendo duplicati
    const allKeywords = [...new Set([fullTranslatedTerm, ...translatedWords, ...individualWords])];
    LoggingService.info('IconService', `Searching with combined keywords: ${JSON.stringify(allKeywords)}`);

    // 4. Filtra e ordina
    const filteredData = openmojiData.filter((emoji: any) => {
      if (!emoji.annotation) return false;
      const annotation = emoji.annotation.toLowerCase();
      return allKeywords.some(keyword => annotation.includes(keyword));
    });

    if (filteredData.length > 0) {
      LoggingService.info('IconService', `Found ${filteredData.length} potential icons for "${searchTerm}"`);
      
      filteredData.sort((a, b) => {
        const aScore = allKeywords.filter(k => a.annotation.toLowerCase().includes(k)).length;
        const bScore = allKeywords.filter(k => b.annotation.toLowerCase().includes(k)).length;
        return bScore - aScore;
      });

      return filteredData.map((emoji: any) => ({
        id: emoji.hexcode,
        name: emoji.annotation,
        svg: `https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji@latest/color/svg/${emoji.hexcode}.svg`
      })).slice(0, 5);
    }

    LoggingService.warning('IconService', `No local icons found for "${searchTerm}"`);
    return [];
  }

  

  static getLocalIconPath(iconName: string): string {
    // Usa percorso relativo per le icone locali nella cartella assets
    return `assets/icon_products/${iconName}`;
  }


  static getLocalProductIcon(categoryName: string): number | null {
    const lowerCategoryName = categoryName.toLowerCase();
    const translatedName = this.translateToEnglish(lowerCategoryName);

    LoggingService.info('IconService', `Searching for local icon for: "${categoryName}" (translated: "${translatedName}")`);
    
    const availableIcons = Object.keys(localIconMap);

    // Cerca corrispondenze esatte prima
    const exactMatch = availableIcons.find((icon: string) =>
      lowerCategoryName === icon || translatedName === icon
    );
    
    if (exactMatch) {
      LoggingService.info('IconService', `Found exact local product icon for: ${categoryName} -> ${exactMatch}`);
      return localIconMap[exactMatch];
    }

    // Cerca corrispondenze parziali
    const partialMatch = availableIcons.find((icon: string) =>
      lowerCategoryName.includes(icon) || translatedName.includes(icon)
    );

    if (partialMatch) {
      LoggingService.info('IconService', `Found partial local product icon for: ${categoryName} -> ${partialMatch}`);
      return localIconMap[partialMatch];
    }

    LoggingService.info('IconService', `No local icon found for: ${categoryName}`);
    return null;
  }

  /**
   * Converte un percorso di icona locale in un oggetto LocalIcon
   * @param iconPath Percorso dell'icona locale (es. 'icon_products/pizza.png')
   * @returns Oggetto LocalIcon o undefined se il percorso non è valido
   */
  static convertToLocalIcon(iconPath: string | any): { uri: string } | number | undefined {
    if (!iconPath) {
      LoggingService.warning('IconService', 'Invalid iconPath provided to convertToLocalIcon');
      return undefined;
    }

    LoggingService.info('IconService', `Converting iconPath to LocalIcon:`, iconPath);

    // Se è già un numero (risorsa require), restituiscilo
    if (typeof iconPath === 'number') {
      LoggingService.info('IconService', 'Icon path is already a require() resource number.');
      return iconPath;
    }

    // Se è già un oggetto Asset (con localUri), restituiscilo così com'è
    if (iconPath.localUri) {
      const localIcon = { uri: iconPath.localUri };
      LoggingService.info('IconService', 'Converted to local icon object from Asset:', localIcon);
      return localIcon;
    }

    // Se è una stringa, controlla se è un percorso di icona locale
    if (typeof iconPath === 'string' && (iconPath.startsWith('icon_products/') || iconPath.startsWith('assets/icon_products/'))) {
      // Per le icone nella cartella icon_products, usa l'URI con percorso assoluto
      const localIcon = { uri: iconPath };
      LoggingService.info('IconService', 'Converted to local icon object using uri:', localIcon);
      return localIcon;
    }

    // Se non è un percorso di icona locale, restituisci undefined
    LoggingService.info('IconService', 'Icon path is not a local icon path, returning undefined');
    return undefined;
  }
  
  /**
   * Scarica un'icona per una categoria specifica
   * @param categoryName Nome della categoria
   * @returns URI dell'icona scaricata o null se non trovata
   */
  static async fetchIconForCategory(categoryName: string): Promise<string | number | null> {
    try {
      const englishName = this.translateToEnglish(categoryName);
      LoggingService.info('IconService', `Fetching icon for category: ${categoryName} (translated: ${englishName})`);

      // 1. Controlla prima le icone locali personalizzate (immagini)
      const localProductIcon = this.getLocalProductIcon(categoryName);
      if (localProductIcon) {
        LoggingService.info('IconService', `Using local product icon for category: ${categoryName}`);
        return localProductIcon;
      }

      // 2. Controlla la mappa di fallback per emoji specifici (NUOVO E PRIORITARIO)
      const fallbackIcon = this.getFallbackIcon(categoryName);
      if (fallbackIcon) {
        LoggingService.info('IconService', `Using specific fallback emoji for: ${categoryName}`);
        return fallbackIcon;
      }

      // 3. Controlla la cache per icone trovate in precedenza
      const cachedIcon = await this.getIconFromCache(englishName);
      if (cachedIcon) {
        LoggingService.info('IconService', `Using cached icon for category: ${categoryName}`);
        return cachedIcon;
      }

      // 4. Cerca nei dati locali di OpenMoji (come ultima risorsa per la ricerca online)
      const localIcons = this.searchInLocalData(englishName);
      if (localIcons.length > 0) {
        const iconUrl = localIcons[0].svg;
        await this.addIconToCache(englishName, iconUrl);
        LoggingService.info('IconService', `Found and cached icon from local OpenMoji data for: ${categoryName}`);
        return iconUrl;
      }

      // 5. Se tutto il resto fallisce, restituisce null
      LoggingService.warning('IconService', `No icon found for ${categoryName}`);
      return null;

    } catch (error) {
      LoggingService.error('IconService', 'Error fetching icon for category', error);
      // In caso di errore, prova comunque i fallback come ultima spiaggia
      const fallbackAfterError = this.getFallbackIcon(categoryName);
      if (fallbackAfterError) return fallbackAfterError;
      
      const localProductIcon = this.getLocalProductIcon(categoryName);
      if (localProductIcon) return localProductIcon;
      
      return null;
    }
  }
}