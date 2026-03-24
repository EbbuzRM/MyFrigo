import { ProductCategory } from '@/types/Product';
import { LoggingService } from '@/services/LoggingService';

/**
 * Centralized service for category matching and guessing.
 * Consolidates duplicate logic from useProductForm.ts and scanner.tsx
 */
export class CategoryMatcher {
  /**
   * Keyword map for matching Italian product names to categories.
   * Used primarily in manual entry form.
   */
  private static italianKeywordMap: Record<string, string[]> = {
    // Dairy (Latticini)
    'dairy': ['formaggio', 'yogurt', 'mozzarella', 'ricotta', 'burro', 'panna', 'mascarpone', 'parmigiano', 'pecorino', 'gorgonzola'],
    // Milk (Latte)
    'milk': ['latte', 'latte intero', 'latte scremato', 'latte parzialmente scremato'],
    // Meat (Carne)
    'meat': ['pollo', 'manzo', 'maiale', 'tacchino', 'agnello', 'bistecca', 'hamburger'],
    // Salumi
    'salumi': ['prosciutto', 'salame', 'salsiccia', 'wurstel', 'speck', 'mortadella', 'bresaola', 'pancetta', 'coppa', 'culatello', 'guanciale', 'nduja', 'capocollo', 'salumi', 'affettato'],
    // Fish (Pesce)
    'fish': ['tonno', 'salmone', 'merluzzo', 'gamber', 'vongole', 'cozze', 'sogliola', 'pesce', 'acciughe', 'sardine'],
    // Fruits (Frutta)
    'fruits': ['mela', 'banana', 'arancia', 'fragola', 'uva', 'pesca', 'albicocca', 'kiwi', 'pera', 'limone', 'mandarino', 'anguria', 'melone', 'ciliegia', 'prugna', 'pompelmo'],
    // Vegetables (Verdure)
    'vegetables': ['pomodoro', 'insalata', 'zucchina', 'melanzana', 'carota', 'patata', 'cipolla', 'spinaci', 'broccoli', 'cavolfiore', 'peperone', 'cetriolo', 'lattuga', 'radicchio', 'finocchio', 'carciofo'],
    // Frozen (Surgelati)
    'frozen': ['gelato', 'pizza surgelata', 'pasta surgelata', 'minestrone', 'patatine fritte', 'surgelato', 'congelato', 'basta'],
    // Beverages (Bevande)
    'beverages': ['acqua', 'succo', 'aranciata', 'cola', 'vino', 'birra', 'tè', 'caffè', 'bibita', 'spremuta', 'gassata', 'frizzante', 'mineral'],
    // Canned (Conserve)
    'canned': ['conserve', 'pelati', 'legumi', 'fagioli', 'ceci', 'lenticchie', 'tonno in scatola', 'sottolio', 'sottaceto'],
    // Snacks
    'snacks': ['patatine', 'cioccolato', 'caramelle', 'merendine', 'cracker', 'taralli', 'chips', 'popcorn', 'pretzel', 'biscotto'],
    // Grains (Cereali)
    'grains': ['cereali', 'fette biscottate', 'marmellata', 'croissant', 'brioche', 'pane', 'focaccia'],
    // Pasta
    'pasta': ['pasta', 'spaghetti', 'penne', 'fettuccine', 'lasagne', 'tagliatelle', 'fusilli', 'maccheroni', 'rigatoni'],
    // Rice (Riso)
    'rice': ['riso', 'basmati', 'arborio', 'carnaroli', 'risotto', 'riso integrale'],
    // Flour (Farine)
    'flour': ['farina', 'farina 00', 'farina integrale', 'semola', 'mais'],
    // Condiments
    'condiments': ['maionese', 'ketchup', 'senape', 'salsa', 'sugo', 'condimento', 'aceto', 'olio', 'sale'],
    // Sauces (Sughi)
    'sauces': ['sugo', 'sugo pronto', 'ragù', 'bolognese', 'pomarola', 'salsa di pomodoro', 'pesto', 'salsa pesto'],
    // Eggs (Uova)
    'eggs': ['uova', 'uovo', 'albume', 'tuorlo'],
    // Sweets (Dolci)
    'sweets': ['torta', 'crostata', 'budino', 'pasticcini', 'dolce', 'muffin', 'brownie', 'tiramisù', 'crostata'],
    // Cheese (Formaggi)
    'cheese': ['formaggio', 'grana', 'parmigiano', 'pecorino', 'fontina', 'asiago', 'taleggio', 'robiola', 'stracchino', 'scamorza', 'provola', 'gorgonzola'],
    // Legumes (Legumi)
    'legumes': ['legumi', 'fagioli', 'lenticchie', 'ceci', 'piselli', 'piselli secchi', 'fave', 'soia', 'ceci', 'fagioli'],
    // Jam (Marmellate)
    'jam': ['marmellata', 'confettura', 'composta'],
    // Honey (Miele)
    'honey': ['miele', 'miel'],
    // Ice Cream (Gelati)
    'ice_cream': ['gelato', 'sorbetto', ' semifreddo', 'coppa'],
    // Pomodoro
    'pomodoro': ['pomodoro', 'pelati', 'passata', 'concentrato', 'sugo di pomodoro'],
    // Vegan
    'vegan': ['vegano', 'vegan', 'vegetale', 'soia', 'tofu', 'seitan', 'tempeh'],
  };

  /**
   * Keyword map for matching OpenFoodFacts English categories to app categories.
   * Used primarily in barcode scanner.
   */
  private static offKeywordMap: Record<string, string[]> = {
    // Dairy (Latticini)
    'dairy': ['dairy', 'cheeses', 'yogurts', 'milks', 'butters', 'creams', 'milk', 'cheese', 'yogurt', 'butter', 'cream'],
    // Milk
    'milk': ['milk', 'milks', 'whole-milk', 'skimmed-milk', 'semi-skimmed-milk'],
    // Meat
    'meat': ['meats', 'poultry', 'beef', 'pork', 'turkey', 'lamb', 'chicken', 'steak', 'burger', 'meat'],
    // Salumi
    'salumi': ['sausages', 'hams', 'salami', 'bacon', 'ham', 'cold-cuts', 'prosciutto', 'charcuterie'],
    // Fish
    'fish': ['seafood', 'fishes', 'tuna', 'salmon', 'cod', 'shrimps', 'clams', 'mussels', 'fish', 'anchovies', 'sardines', 'prawns', 'lobster'],
    // Fruits
    'fruits': ['fruits', 'apples', 'bananas', 'oranges', 'strawberries', 'grapes', 'peaches', 'apricots', 'kiwis', 'pear', 'lemon', 'mandarin', 'watermelon', 'melon', 'cherry', 'plum', 'grapefruit'],
    // Vegetables
    'vegetables': ['vegetables', 'tomatoes', 'lettuces', 'zucchini', 'eggplants', 'carrots', 'potatoes', 'onions', 'spinach', 'broccoli', 'cauliflower', 'peppers', 'cucumber', 'lettuce', 'fennel', 'artichoke'],
    // Frozen
    'frozen': ['frozen-foods', 'ice-creams', 'frozen-pizzas', 'frozen-ready-meals', 'frozen-vegetables', 'frozen', 'ice-cream', 'frozen-pizza', 'freezer'],
    // Beverages
    'beverages': ['beverages', 'waters', 'juices', 'sodas', 'wines', 'beers', 'teas', 'coffees', 'water', 'juice', 'soda', 'wine', 'beer', 'tea', 'coffee', 'drink', 'sparkling'],
    // Canned
    'canned': ['canned-foods', 'pulses', 'beans', 'chickpeas', 'lentils', 'canned', 'preserve', 'preserves', 'tinned'],
    // Snacks
    'snacks': ['snacks', 'crisps', 'chocolates', 'sweets', 'crackers', 'chips', 'popcorn', 'pretzel', 'cookie'],
    // Grains
    'grains': ['breakfasts', 'cereals', 'rusks', 'jams', 'croissants', 'cereal', 'rusk', 'jam', 'bread', 'bakery'],
    // Pasta
    'pasta': ['pastas', 'spaghetti', 'penne', 'macaroni', 'pasta'],
    // Rice
    'rice': ['rices', 'basmati', 'arborio', 'risotto', 'rice'],
    // Flour
    'flour': ['flours', 'flour', 'semolina', 'cornmeal'],
    // Condiments
    'condiments': ['condiments', 'sauces', 'mayonnaises', 'ketchups', 'mustards', 'mayonnaise', 'ketchup', 'mustard', 'sauce', 'oil', 'vinegar', 'salt', 'oil', 'vinegar'],
    // Sauces
    'sauces': ['sauces', 'ragu', 'bolognese', 'pesto', 'tomato-sauce', 'sugo'],
    // Eggs
    'eggs': ['eggs', 'egg'],
    // Sweets
    'sweets': ['desserts', 'cakes', 'puddings', 'pastries', 'dessert', 'cake', 'pastry', 'muffin', 'brownie', 'tiramisu'],
    // Cheese
    'cheese': ['cheeses', 'parmesan', 'pecorino', 'gorgonzola', 'mozzarella', 'grana', 'fontina'],
    // Legumes
    'legumes': ['pulses', 'beans', 'lentils', 'chickpeas', 'soy', 'legumes', 'peas', 'green-peas', 'canned-peas'],
    // Jam
    'jam': ['jams', 'confiture', 'fruit-spreads'],
    // Honey
    'honey': ['honeys', 'honey'],
    // Ice Cream
    'ice_cream': ['ice-creams', 'sorbets', 'gelato', 'frozen-desserts'],
    // Pomodoro
    'pomodoro': ['tomatoes', 'tomato-sauces', 'tomato-puree', 'passata'],
    // Vegan
    'vegan': ['vegan', 'plant-based', 'soy', 'tofu', 'seitan', 'tempeh'],
  };

  /**
   * Guess category from product name and brand using Italian keywords.
   * @param name Product name
   * @param brand Product brand
   * @param availableCategories List of available categories to validate against
   * @returns Category ID or null if no match found
   */
  static guessCategory(
    name: string,
    brand: string,
    availableCategories: ProductCategory[]
  ): string | null {
    const fullText = `${name.toLowerCase()} ${brand.toLowerCase()}`;

    LoggingService.info('CategoryMatcher', `🔍 Guess category per: "${name}" (${brand})`);

    // Priorità alle categorie più specifiche (ordinamento manuale per importanza)
    const categoryPriority = [
      'legumes', 'cheese', 'dairy', 'salumi', 'meat', 'fish', 'fruits', 'vegetables',
      'pasta', 'rice', 'flour', 'grains', 'frozen', 'beverages', 'canned',
      'snacks', 'sweets', 'condiments', 'sauces', 'eggs', 'jam', 'honey',
      'ice_cream', 'pomodoro', 'vegan', 'milk'
    ];

    // Cerca match seguendo l'ordine di priorità
    for (const categoryId of categoryPriority) {
      if (this.italianKeywordMap[categoryId]) {
        if (this.italianKeywordMap[categoryId].some(keyword => fullText.includes(keyword))) {
          if (availableCategories.some(cat => cat.id === categoryId)) {
            LoggingService.info('CategoryMatcher', `✅ Match trovato: "${categoryId}"`);
            return categoryId;
          }
        }
      }
    }

    // Fallback: iterazione normale se nessun match con priorità
    for (const categoryId in this.italianKeywordMap) {
      if (this.italianKeywordMap[categoryId].some(keyword => fullText.includes(keyword))) {
        if (availableCategories.some(cat => cat.id === categoryId)) {
          LoggingService.info('CategoryMatcher', `⚠️ Match fallback: "${categoryId}"`);
          return categoryId;
        }
      }
    }

    LoggingService.info('CategoryMatcher', '❌ Nessun match trovato');
    return null;
  }

  /**
   * Map OpenFoodFacts categories to app categories using English keywords.
   * Prioritizes specific categories over generic ones to avoid false positives.
   * @param offCategories Array of OpenFoodFacts category strings
   * @param availableCategories List of available categories to validate against
   * @returns Category ID or null if no match found
   */
  static mapOpenFoodFactsCategories(
    offCategories: string[] | undefined,
    availableCategories: ProductCategory[]
  ): string | null {
    if (!offCategories || offCategories.length === 0) {
      return null;
    }

    const lowerCaseOffCategories = offCategories.map(c => c.toLowerCase());

    LoggingService.info('CategoryMatcher', '📋 Categorie OFF ricevute:', offCategories);

    // Categorie OFF troppo generiche da ignorare (causano falsi positivi)
    const genericCategoriesToIgnore = [
      'plant-based-foods-and-beverages',
      'plant-based-foods',
      'fruits-and-vegetables-based-foods',  // Ignora: contiene "fruits" ma è troppo generica
      'vegetables-based-foods',
      'canned-plant-based-foods',
      'foods-and-beverages',
      'processed-foods',
      'unknown'
    ];

    // Filtra categorie generiche
    const filteredCategories = lowerCaseOffCategories.filter(cat =>
      !genericCategoriesToIgnore.some(generic => cat.includes(generic))
    );

    LoggingService.info('CategoryMatcher', '✅ Categorie dopo filtro generiche:', filteredCategories);

    // Ordina le categorie per specificità (più specifiche = più parole = priorità)
    const sortedCategories = [...filteredCategories].sort((a, b) => {
      const aWords = a.split('-').length;
      const bWords = b.split('-').length;
      return bWords - aWords; // Più parole = più specifico = prima
    });

    LoggingService.info('CategoryMatcher', '📊 Categorie ordinate per specificità:', sortedCategories);

    // Cerca match partendo dalle categorie più specifiche
    for (const offCat of sortedCategories) {
      for (const categoryId in this.offKeywordMap) {
        const keywords = this.offKeywordMap[categoryId];

        // Match più preciso: keyword come parola intera o con prefisso/suffisso
        if (keywords.some(keyword =>
          offCat === keyword ||
          offCat.includes(`-${keyword}`) ||
          offCat.includes(`${keyword}-`) ||
          offCat.endsWith(`-${keyword}`)
        )) {
          if (availableCategories.some(cat => cat.id === categoryId)) {
            LoggingService.info('CategoryMatcher', `✅ Match specifico trovato: "${offCat}" → "${categoryId}"`);
            return categoryId;
          }
        }
      }
    }

    // Fallback: cerca generica su tutte le categorie originali (solo se nessun match specifico)
    LoggingService.info('CategoryMatcher', '⚠️ Nessun match specifico, provo fallback generico...');

    for (const categoryId in this.offKeywordMap) {
      const keywords = this.offKeywordMap[categoryId];
      if (keywords.some(keyword =>
        lowerCaseOffCategories.some(offCat => offCat.includes(keyword))
      )) {
        if (availableCategories.some(cat => cat.id === categoryId)) {
          LoggingService.info('CategoryMatcher', `⚠️ Match generico trovato: "${categoryId}"`);
          return categoryId;
        }
      }
    }

    LoggingService.warning('CategoryMatcher', '❌ Nessun match trovato per le categorie:', offCategories);
    return null;
  }

  /**
   * Get all keywords for a specific category (for testing or debugging).
   * @param categoryId Category ID
   * @param language 'italian' or 'english' (OFF)
   * @returns Array of keywords or empty array if category not found
   */
  static getKeywordsForCategory(
    categoryId: string,
    language: 'italian' | 'english' = 'italian'
  ): string[] {
    const map = language === 'italian' ? this.italianKeywordMap : this.offKeywordMap;
    return map[categoryId] || [];
  }

  /**
   * Add custom keywords to a category (for extensibility).
   * @param categoryId Category ID
   * @param keywords Array of keywords to add
   * @param language 'italian' or 'english' (OFF)
   */
  static addKeywords(
    categoryId: string,
    keywords: string[],
    language: 'italian' | 'english' = 'italian'
  ): void {
    const map = language === 'italian' ? this.italianKeywordMap : this.offKeywordMap;
    if (!map[categoryId]) {
      map[categoryId] = [];
    }
    map[categoryId] = [...new Set([...map[categoryId], ...keywords])];
  }
}
