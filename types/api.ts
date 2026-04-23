/**
 * Type for products returned by the OpenFoodFacts API.
 * Based on the official API response structure.
 */
export interface OpenFoodFactsProduct {
  product: {
    barcode: string;
    product_name?: string;
    brands?: string;
    image_url?: string;
    categories?: string;
    categories_v2?: string[];
    nutriscore_grade?: string;
    ingredients_text?: string;
  };
}

/**
 * Simplified product interface for internal use after mapping from API.
 */
export interface OpenFoodFactsMappedProduct {
  barcode: string;
  name: string;
  brand: string;
  imageUrl: string;
  category: string;
}
