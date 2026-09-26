import { getCategoryLabel, sortCategoriesForLanguage } from '../categoryLabels';
import type { ProductCategory } from '@/types/Product';

const standard: ProductCategory = { id: 'fruits', name: 'Frutta', icon: '🍎', color: '#000', isDefault: true };
const custom: ProductCategory = { id: 'custom-fruit', name: 'My fruit', icon: '🍎', color: '#000', isDefault: false };

describe('category labels', () => {
  it('translates standard IDs without changing stored names or IDs', () => {
    expect(getCategoryLabel(standard, 'en')).toBe('Fruit');
    expect(getCategoryLabel(standard, 'it')).toBe('Frutta');
    expect(standard).toMatchObject({ id: 'fruits', name: 'Frutta' });
  });

  it('preserves custom and unknown standard category names', () => {
    expect(getCategoryLabel(custom, 'en')).toBe('My fruit');
    expect(getCategoryLabel({ id: 'future', name: 'Future category', isDefault: true }, 'en')).toBe('Future category');
  });

  it('sorts by the visible label for the chosen locale', () => {
    const ordered = sortCategoriesForLanguage([standard, custom], 'en');
    expect(ordered.map(category => category.id)).toEqual(['fruits', 'custom-fruit']);
  });
});
