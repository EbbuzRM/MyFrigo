
import { renderHook } from '@testing-library/react-native';
import { useExpirationStatus } from '../useExpirationStatus';

// Mock colors for light mode
jest.mock('@/constants/colors', () => ({
  COLORS: {
    light: {
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      background: '#ffffff',
    }
  }
}));

describe('useExpirationStatus', () => {
  const getDate = (offsetDays: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString();
  };

  describe('Light Mode Tests', () => {
    it('should return "good" status for products expiring in more than 3 days', () => {
      const futureDate = getDate(5); // 5 giorni nel futuro

      const { result } = renderHook(() =>
        useExpirationStatus(futureDate, false) // isDarkMode = false
      );

      expect(result.current.text).toBe('Buono');
      expect(result.current.color).toBe('#10b981');
      expect(result.current.backgroundColor).toBe('#ffffff');
    });

    it('should return "warning" status for products expiring in 2 days', () => {
      const warningDate = getDate(2); // 2 giorni nel futuro

      const { result } = renderHook(() =>
        useExpirationStatus(warningDate, false)
      );

      expect(result.current.text).toBe('In Scadenza');
      expect(result.current.color).toBe('#f59e0b');
    });

    it('should return "expired" status for products already expired', () => {
      const expiredDate = getDate(-1); // 1 giorno fa

      const { result } = renderHook(() =>
        useExpirationStatus(expiredDate, false)
      );

      expect(result.current.text).toBe('Scaduto');
      expect(result.current.color).toBe('#ef4444');
    });

    it('should handle null/undefined dates gracefully', () => {
      const { result } = renderHook(() =>
        useExpirationStatus(undefined, false)
      );

      expect(result.current.text).toBe('Sconosciuto');
      expect(result.current.color).toBe('#6b7280');
    });
  });
});
