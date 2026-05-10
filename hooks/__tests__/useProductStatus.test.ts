import { renderHook } from '@testing-library/react-native';
import { useProductStatus } from '../useProductStatus';

jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    warning: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/hooks/useExpirationStatus', () => ({
  useExpirationStatus: jest.fn((date, isDarkMode, isFrozen) => {
    return {
      text: 'Expiring soon',
      color: 'red',
      backgroundColor: 'pink'
    };
  })
}));

describe('useProductStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle valid expiration date', () => {
    const validDate = '2025-10-10T00:00:00.000Z';
    const { result } = renderHook(() => useProductStatus(validDate, false, false));

    expect(result.current.safeExpirationDate).toBeInstanceOf(Date);
    expect(result.current.safeExpirationDate?.toISOString()).toBe(validDate);
    expect(result.current.formattedExpirationDate).not.toBe('N/A');
    expect(result.current.expirationInfo).toBeDefined();
  });

  it('should handle invalid expiration date', () => {
    const invalidDate = 'invalid-date';
    const { result } = renderHook(() => useProductStatus(invalidDate, false, false));

    expect(result.current.safeExpirationDate).toBeNull();
    expect(result.current.formattedExpirationDate).toBe('N/A');
  });

  it('should handle undefined expiration date', () => {
    const { result } = renderHook(() => useProductStatus(undefined, false, false));

    expect(result.current.safeExpirationDate).toBeNull();
    expect(result.current.formattedExpirationDate).toBe('N/A');
  });

  it('should format purchase date correctly', () => {
    const { result } = renderHook(() => useProductStatus('2025-10-10', false, false));

    const validPurchaseDate = '2025-01-01T00:00:00Z';
    const formatted = result.current.formattedPurchaseDate(validPurchaseDate);
    
    expect(formatted).not.toBe('N/A');
    expect(formatted).toContain('2025'); // e.g., '1/1/2025' depending on locale

    expect(result.current.formattedPurchaseDate(undefined)).toBe('N/A');
    expect(result.current.formattedPurchaseDate('invalid')).toBe('N/A');
  });
});
