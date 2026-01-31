import React, { useCallback } from 'react';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Product, ProductCategory } from '@/types/Product';
import { LoggingService } from '@/services/LoggingService';

/**
 * Props for CategoryFilterBar component
 */
interface CategoryFilterBarProps {
  /** Currently selected category IDs */
  selectedCategories: string[];
  /** Callback when category selection changes - receives new array */
  onCategoryChange: (categories: string[]) => void;
  /** All active products for count calculation */
  products: Product[];
  /** Available product categories */
  categories: ProductCategory[];
}

/**
 * Category filter bar component
 * Wraps CategoryFilter with selection logic for multiple categories
 * 
 * @param props - Component props
 * @returns CategoryFilterBar component
 */
export function CategoryFilterBar({
  selectedCategories,
  onCategoryChange,
  products,
  categories,
}: CategoryFilterBarProps): React.ReactElement {

  const handleCategoryToggle = useCallback((category: string) => {
    LoggingService.info('CategoryFilterBar', `Category filter toggled: ${category}`);

    const prev = selectedCategories;
    let newSelection: string[];

    // If clicking "all", reset to only ['all']
    if (category === 'all') {
      newSelection = ['all'];
    } else {
      // If was only "all", start fresh with new category
      newSelection = prev.includes('all') ? [] : [...prev];

      if (newSelection.includes(category)) {
        // Remove if already selected
        newSelection = newSelection.filter(c => c !== category);
      } else {
        // Add new category
        newSelection.push(category);
      }

      // If nothing selected, return to "all"
      if (newSelection.length === 0) {
        newSelection = ['all'];
      }
    }

    onCategoryChange(newSelection);
  }, [selectedCategories, onCategoryChange]);

  return (
    <CategoryFilter
      selectedCategories={selectedCategories}
      onCategoryChange={handleCategoryToggle}
      products={products}
      categories={categories}
    />
  );
}
