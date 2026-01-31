import { useMemo } from 'react';
import { Product } from '@/types/Product';
import { LoggingService } from '@/services/LoggingService';
import { ProductStatusFilter, DEFAULT_NOTIFICATION_DAYS } from '@/constants/productFilters';

/**
 * Parameters for useProductFilters hook
 */
export interface UseProductFiltersParams {
  /** All products from context */
  allProducts: Product[];
  /** Currently selected categories */
  selectedCategories: string[];
  /** Current search query */
  searchQuery: string;
  /** Currently selected status filter */
  selectedStatus: ProductStatusFilter;
  /** Number of days before expiration to show notification (from settings) */
  notificationDays?: number;
}

/**
 * Result interface for useProductFilters hook
 */
export interface UseProductFiltersResult {
  /** Filtered and sorted products */
  filteredProducts: Product[];
  /** Total count of filtered products */
  filteredCount: number;
  /** Count of active products before filtering */
  activeProductsCount: number;
}

/**
 * Calculates the difference in days between two dates
 * @param date1 - First date
 * @param date2 - Second date (defaults to today)
 * @returns Number of days difference
 */
function getDaysDifference(date1: Date, date2: Date = new Date()): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  return Math.ceil((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Determines if a product matches the selected status filter
 * @param product - Product to check
 * @param status - Selected status filter
 * @param notificationDays - Days threshold for expiring status
 * @returns Boolean indicating if product matches the filter
 */
function matchesStatusFilter(
  product: Product, 
  status: ProductStatusFilter, 
  notificationDays: number
): boolean {
  if (status === 'all') {
    return true;
  }

  const diffDays = getDaysDifference(new Date(product.expirationDate));

  switch (status) {
    case 'fresh':
      return diffDays > notificationDays;
    case 'expiring':
      // Exclude frozen products from expiring status
      if (product.isFrozen) {
        return false;
      }
      return diffDays >= 0 && diffDays <= notificationDays;
    case 'expired':
      // Exclude frozen products from expired status
      if (product.isFrozen) {
        return false;
      }
      return diffDays < 0;
    default:
      return true;
  }
}

/**
 * Filters products by category
 * @param products - Products to filter
 * @param selectedCategories - Selected category IDs
 * @returns Filtered products
 */
function filterByCategory(products: Product[], selectedCategories: string[]): Product[] {
  if (selectedCategories.includes('all')) {
    return products;
  }
  return products.filter(product => selectedCategories.includes(product.category));
}

/**
 * Filters products by search query (name or brand)
 * @param products - Products to filter
 * @param searchQuery - Search query string
 * @returns Filtered products
 */
function filterBySearch(products: Product[], searchQuery: string): Product[] {
  if (!searchQuery) {
    return products;
  }
  const query = searchQuery.toLowerCase();
  return products.filter(product =>
    product.name.toLowerCase().includes(query) ||
    product.brand?.toLowerCase().includes(query)
  );
}

/**
 * Sorts products by expiration date (earliest first)
 * @param products - Products to sort
 * @returns Sorted products
 */
function sortByExpirationDate(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const dateA = new Date(a.expirationDate).getTime();
    const dateB = new Date(b.expirationDate).getTime();
    return dateA - dateB;
  });
}

/**
 * Custom hook for filtering and sorting products
 * Implements multi-layer filtering: status → category → search → sort
 * 
 * @param params - Filter parameters
 * @returns Filtered products and metadata
 */
export function useProductFilters({
  allProducts,
  selectedCategories,
  searchQuery,
  selectedStatus,
  notificationDays = DEFAULT_NOTIFICATION_DAYS,
}: UseProductFiltersParams): UseProductFiltersResult {
  const filteredProducts = useMemo(() => {
    // Start with only active products
    let filtered = allProducts.filter(p => p.status === 'active');
    const activeProductsCount = filtered.length;

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(product => 
        matchesStatusFilter(product, selectedStatus, notificationDays)
      );
    }

    // Apply category filter
    filtered = filterByCategory(filtered, selectedCategories);

    // Apply search filter
    filtered = filterBySearch(filtered, searchQuery);

    // Sort by expiration date
    filtered = sortByExpirationDate(filtered);

    LoggingService.info('useProductFilters', 
      `Filtering complete. ${filtered.length} of ${activeProductsCount} active products displayed.`);

    return filtered;
  }, [allProducts, selectedCategories, searchQuery, selectedStatus, notificationDays]);

  return {
    filteredProducts,
    filteredCount: filteredProducts.length,
    activeProductsCount: allProducts.filter(p => p.status === 'active').length,
  };
}
