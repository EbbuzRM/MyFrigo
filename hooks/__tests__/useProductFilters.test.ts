import { renderHook } from '@testing-library/react-native';
import { useProductFilters } from '../useProductFilters';
import { Product } from '@/types/Product';

describe('useProductFilters', () => {
  const getDaysFromNow = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
  };

  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Latte Fresco',
      brand: 'Granarolo',
      category: 'dairy',
      expirationDate: getDaysFromNow(10), // 10 days (fresh)
      status: 'active',
      isFrozen: false,
      purchaseDate: getDaysFromNow(-1),
      addedAt: getDaysFromNow(-1),
      updatedAt: getDaysFromNow(-1),
      userId: 'user1',
      addedMethod: 'manual',
      quantities: []
    },
    {
      id: '2',
      name: 'Formaggio',
      brand: 'Parmigiano',
      category: 'dairy',
      expirationDate: getDaysFromNow(2), // 2 days (expiring)
      status: 'active',
      isFrozen: false,
      purchaseDate: getDaysFromNow(-5),
      addedAt: getDaysFromNow(-5),
      updatedAt: getDaysFromNow(-5),
      userId: 'user1',
      addedMethod: 'manual',
      quantities: []
    },
    {
      id: '3',
      name: 'Insalata',
      brand: 'Bonduelle',
      category: 'vegetables',
      expirationDate: getDaysFromNow(-2), // -2 days (expired)
      status: 'active',
      isFrozen: false,
      purchaseDate: getDaysFromNow(-10),
      addedAt: getDaysFromNow(-10),
      updatedAt: getDaysFromNow(-10),
      userId: 'user1',
      addedMethod: 'manual',
      quantities: []
    },
    {
      id: '4',
      name: 'Pizza',
      brand: 'Cameo',
      category: 'frozen',
      expirationDate: getDaysFromNow(-5), // expired but frozen
      status: 'active',
      isFrozen: true,
      purchaseDate: getDaysFromNow(-20),
      addedAt: getDaysFromNow(-20),
      updatedAt: getDaysFromNow(-20),
      userId: 'user1',
      addedMethod: 'manual',
      quantities: []
    },
    {
      id: '5',
      name: 'Pollo',
      brand: 'Aia',
      category: 'meat',
      expirationDate: getDaysFromNow(5),
      status: 'consumed', // should be excluded
      isFrozen: false,
      purchaseDate: getDaysFromNow(-2),
      addedAt: getDaysFromNow(-2),
      updatedAt: getDaysFromNow(-2),
      userId: 'user1',
      addedMethod: 'manual',
      quantities: []
    }
  ];

  it('should filter out non-active products', () => {
    const { result } = renderHook(() => useProductFilters({
      allProducts: mockProducts,
      selectedCategories: ['all'],
      searchQuery: '',
      selectedStatus: 'all',
    }));

    // Expecting 4 products (excluding the 'consumed' one)
    expect(result.current.filteredProducts.length).toBe(4);
    expect(result.current.activeProductsCount).toBe(4);
    expect(result.current.filteredProducts.some(p => p.id === '5')).toBe(false);
  });

  describe('Status Filtering', () => {
    it('should filter fresh products correctly', () => {
      const { result } = renderHook(() => useProductFilters({
        allProducts: mockProducts,
        selectedCategories: ['all'],
        searchQuery: '',
        selectedStatus: 'fresh',
        notificationDays: 4,
      }));

      // Latte Fresco (10 days) is fresh. Pizza is frozen but its diff is -5 so not fresh.
      expect(result.current.filteredProducts.length).toBe(1);
      expect(result.current.filteredProducts[0].id).toBe('1');
    });

    it('should filter expiring products correctly', () => {
      const { result } = renderHook(() => useProductFilters({
        allProducts: mockProducts,
        selectedCategories: ['all'],
        searchQuery: '',
        selectedStatus: 'expiring',
        notificationDays: 4,
      }));

      // Formaggio (2 days) is expiring
      expect(result.current.filteredProducts.length).toBe(1);
      expect(result.current.filteredProducts[0].id).toBe('2');
    });

    it('should filter expired products correctly (excluding frozen)', () => {
      const { result } = renderHook(() => useProductFilters({
        allProducts: mockProducts,
        selectedCategories: ['all'],
        searchQuery: '',
        selectedStatus: 'expired',
        notificationDays: 4,
      }));

      // Insalata (-2 days) is expired. Pizza is -5 days but frozen, so it's excluded.
      expect(result.current.filteredProducts.length).toBe(1);
      expect(result.current.filteredProducts[0].id).toBe('3');
    });
  });

  describe('Category Filtering', () => {
    it('should filter by specific category', () => {
      const { result } = renderHook(() => useProductFilters({
        allProducts: mockProducts,
        selectedCategories: ['dairy'],
        searchQuery: '',
        selectedStatus: 'all',
      }));

      // Latte Fresco, Formaggio
      expect(result.current.filteredProducts.length).toBe(2);
      expect(result.current.filteredProducts.every(p => p.category === 'dairy')).toBe(true);
    });

    it('should support multiple categories', () => {
      const { result } = renderHook(() => useProductFilters({
        allProducts: mockProducts,
        selectedCategories: ['dairy', 'vegetables'],
        searchQuery: '',
        selectedStatus: 'all',
      }));

      expect(result.current.filteredProducts.length).toBe(3);
    });
  });

  describe('Search Filtering', () => {
    it('should filter by product name', () => {
      const { result } = renderHook(() => useProductFilters({
        allProducts: mockProducts,
        selectedCategories: ['all'],
        searchQuery: 'Latte',
        selectedStatus: 'all',
      }));

      expect(result.current.filteredProducts.length).toBe(1);
      expect(result.current.filteredProducts[0].id).toBe('1');
    });

    it('should filter by brand', () => {
      const { result } = renderHook(() => useProductFilters({
        allProducts: mockProducts,
        selectedCategories: ['all'],
        searchQuery: 'cameo',
        selectedStatus: 'all',
      }));

      expect(result.current.filteredProducts.length).toBe(1);
      expect(result.current.filteredProducts[0].brand).toBe('Cameo');
    });

    it('should be case insensitive', () => {
      const { result } = renderHook(() => useProductFilters({
        allProducts: mockProducts,
        selectedCategories: ['all'],
        searchQuery: 'FORMAGGIO',
        selectedStatus: 'all',
      }));

      expect(result.current.filteredProducts.length).toBe(1);
      expect(result.current.filteredProducts[0].id).toBe('2');
    });
  });

  describe('Sorting', () => {
    it('should sort products by expiration date ascending', () => {
      const { result } = renderHook(() => useProductFilters({
        allProducts: mockProducts,
        selectedCategories: ['all'],
        searchQuery: '',
        selectedStatus: 'all',
      }));

      // Expected order: 3 (-2 days), 4 (-5 days), 2 (2 days), 1 (10 days)
      // Actually -5 is before -2, so 4, 3, 2, 1
      const sortedIds = result.current.filteredProducts.map(p => p.id);
      expect(sortedIds).toEqual(['4', '3', '2', '1']);
    });
  });
});
