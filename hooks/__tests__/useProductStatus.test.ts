import { renderHook } from '@testing-library/react-native';
import { useProductStatus } from '../useProductStatus';
import { useExpirationStatus } from '@/hooks/useExpirationStatus';
import { itCatalogs } from '@/i18n/catalogs/it';

jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    warning: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/hooks/useExpirationStatus', () => ({
  ...jest.requireActual('@/hooks/useExpirationStatus'),
  useExpirationStatus: jest.fn((date: string | undefined) => {
    if (date === undefined) {
      return {
        status: 'dateNotSet',
        color: 'green',
        backgroundColor: 'lightgreen',
      };
    }

    if (Number.isNaN(new Date(date).getTime())) {
      return {
        status: 'dateInvalid',
        color: 'orange',
        backgroundColor: 'lightorange',
      };
    }

    return {
      status: 'expiresInDays',
      daysUntil: 1,
      color: 'red',
      backgroundColor: 'pink',
    };
  }),
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
    expect(result.current.expirationInfo.text).toBe(
      itCatalogs.dashboard.statusExpiresInDays_one.replace('{{count}}', '1'),
    );
  });

  it('should handle invalid expiration date', () => {
    const invalidDate = 'invalid-date';
    const { result } = renderHook(() => useProductStatus(invalidDate, false, false));

    expect(result.current.safeExpirationDate).toBeNull();
    expect(result.current.formattedExpirationDate).toBe('N/A');
    expect(result.current.expirationInfo.text).toBe(itCatalogs.dashboard.statusDateInvalid);
    expect(useExpirationStatus).toHaveBeenCalledWith(invalidDate, false, false);
  });

  it('should handle undefined expiration date', () => {
    const { result } = renderHook(() => useProductStatus(undefined, false, false));

    expect(result.current.safeExpirationDate).toBeNull();
    expect(result.current.formattedExpirationDate).toBe('N/A');
    expect(result.current.expirationInfo.text).toBe(itCatalogs.dashboard.statusDateNotSet);
    expect(useExpirationStatus).toHaveBeenCalledWith(undefined, false, false);
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
