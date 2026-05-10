import { calculateHistoryStats, generateSuggestions, calculateHistoryData } from '../historyCalculations';
import { Product } from '@/types/Product';

jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    debug: jest.fn(),
  },
}));

describe('historyCalculations', () => {
  const mockProducts: Partial<Product>[] = [
    { id: '1', status: 'consumed' },
    { id: '2', status: 'consumed' },
    { id: '3', status: 'expired' },
    { id: '4', status: 'consumed' },
  ];

  describe('calculateHistoryStats', () => {
    it('should calculate stats correctly for a mixed list', () => {
      const stats = calculateHistoryStats(mockProducts as Product[]);
      expect(stats.totalCount).toBe(4);
      expect(stats.consumedCount).toBe(3);
      expect(stats.expiredCount).toBe(1);
      expect(stats.wastePercentage).toBe(25); // (1/4) * 100
    });

    it('should return zeros for empty list', () => {
      const stats = calculateHistoryStats([]);
      expect(stats.totalCount).toBe(0);
      expect(stats.wastePercentage).toBe(0);
    });

    it('should handle only consumed products', () => {
      const products: Partial<Product>[] = [{ status: 'consumed' }, { status: 'consumed' }];
      const stats = calculateHistoryStats(products as Product[]);
      expect(stats.wastePercentage).toBe(0);
    });

    it('should handle only expired products', () => {
      const products: Partial<Product>[] = [{ status: 'expired' }, { status: 'expired' }];
      const stats = calculateHistoryStats(products as Product[]);
      expect(stats.wastePercentage).toBe(100);
    });
  });

  describe('generateSuggestions', () => {
    it('should always include the default info suggestion', () => {
      const suggestions = generateSuggestions({ consumedCount: 0, expiredCount: 0, wastePercentage: 0, totalCount: 0 });
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].type).toBe('info');
    });

    it('should generate a warning for high waste', () => {
      const suggestions = generateSuggestions({ consumedCount: 1, expiredCount: 1, wastePercentage: 50, totalCount: 2 });
      expect(suggestions.find(s => s.type === 'warning')).toBeDefined();
    });

    it('should generate a positive feedback for low waste and enough products', () => {
      const suggestions = generateSuggestions({ consumedCount: 9, expiredCount: 1, wastePercentage: 10, totalCount: 10 });
      // WASTE_POSITIVE_THRESHOLD is 10, but wastePercentage < threshold. 
      // Wait, 10 is not < 10. Let's try 9%.
      const suggestions2 = generateSuggestions({ consumedCount: 91, expiredCount: 9, wastePercentage: 9, totalCount: 100 });
      expect(suggestions2.find(s => s.type === 'positive')).toBeDefined();
    });
  });

  describe('calculateHistoryData', () => {
    it('should combine stats and suggestions', () => {
      const result = calculateHistoryData(mockProducts as Product[]);
      expect(result.stats.totalCount).toBe(4);
      expect(result.suggestions.length).toBeGreaterThanOrEqual(1);
    });
  });
});
