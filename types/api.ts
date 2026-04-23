/**
 * Type for products returned by the OpenFoodFacts API.
 * Based on the official API response structure.
 */
export interface OpenFoodFactsProduct {
  barcode: string;
  product_name?: string;
  product_name_it?: string;
  generic_name?: string;
  generic_name_it?: string;
  abbreviated_product_name?: string;
  brands?: string;
  brands_tags?: string[];
  image_url?: string;
  image_front_url?: string;
  image_front_small_url?: string;
  categories?: string;
  categories_tags?: string[];
  categories_v2?: string[];
  nutriscore_grade?: string;
  ingredients_text?: string;
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
