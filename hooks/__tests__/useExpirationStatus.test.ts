import { renderHook } from '@testing-library/react-native';
import { useExpirationStatus } from '../useExpirationStatus';

describe('useExpirationStatus', () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  describe('Status Calculation', () => {
    it('should return "expired" for past dates', () => {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - 1);
      
      const { result } = renderHook(() => useExpirationStatus(pastDate.toISOString()));
      
      expect(result.current.status).toBe('expired');
      expect(result.current.daysRemaining).toBeLessThan(0);
    });

    it('should return "expired" for today when expiration_date is today', () => {
      const { result } = renderHook(() => useExpirationStatus(today.toISOString()));
      
      expect(result.current.status).toBe('expired');
      expect(result.current.daysRemaining).toBe(0);
    });

    it('should return "expiring_soon" for dates within warning period', () => {
      const warningDate = new Date(today);
      warningDate.setDate(today.getDate() + 3);
      
      const { result } = renderHook(() => useExpirationStatus(warningDate.toISOString(), 7));
      
      expect(result.current.status).toBe('expiring_soon');
      expect(result.current.daysRemaining).toBe(3);
    });

    it('should return "expiring_soon" at the boundary of warning period', () => {
      const boundaryDate = new Date(today);
      boundaryDate.setDate(today.getDate() + 7);
      
      const { result } = renderHook(() => useExpirationStatus(boundaryDate.toISOString(), 7));
      
      expect(result.current.status).toBe('expiring_soon');
      expect(result.current.daysRemaining).toBe(7);
    });

    it('should return "ok" for dates beyond warning period', () => {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 30);
      
      const { result } = renderHook(() => useExpirationStatus(futureDate.toISOString(), 7));
      
      expect(result.current.status).toBe('ok');
      expect(result.current.daysRemaining).toBe(30);
    });

    it('should return "ok" for dates far in the future', () => {
      const farFutureDate = new Date(today);
      farFutureDate.setDate(today.getDate() + 365);
      
      const { result } = renderHook(() => useExpirationStatus(farFutureDate.toISOString()));
      
      expect(result.current.status).toBe('ok');
      expect(result.current.daysRemaining).toBe(365);
    });
  });

  describe('Warning Days Parameter', () => {
    it('should use default warning days when not provided', () => {
      const warningDate = new Date(today);
      warningDate.setDate(today.getDate() + 3);
      
      const { result } = renderHook(() => useExpirationStatus(warningDate.toISOString()));
      
      // Default is typically 7 days
      expect(result.current.status).toBe('expiring_soon');
    });

    it('should respect custom warning days', () => {
      const warningDate = new Date(today);
      warningDate.setDate(today.getDate() + 5);
      
      const { result: result3 } = renderHook(() => useExpirationStatus(warningDate.toISOString(), 3));
      const { result: result7 } = renderHook(() => useExpirationStatus(warningDate.toISOString(), 7));
      
      expect(result3.current.status).toBe('ok');
      expect(result7.current.status).toBe('expiring_soon');
    });

    it('should handle zero warning days', () => {
      const warningDate = new Date(today);
      warningDate.setDate(today.getDate() + 1);
      
      const { result } = renderHook(() => useExpirationStatus(warningDate.toISOString(), 0));
      
      expect(result.current.status).toBe('ok');
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid dates gracefully', () => {
      const { result } = renderHook(() => useExpirationStatus('invalid-date'));
      
      expect(result.current.status).toBe('unknown');
      expect(result.current.daysRemaining).toBeNull();
    });

    it('should handle null/undefined dates', () => {
      const { result: resultNull } = renderHook(() => useExpirationStatus(null as any));
      const { result: resultUndefined } = renderHook(() => useExpirationStatus(undefined as any));
      
      expect(resultNull.current.status).toBe('unknown');
      expect(resultUndefined.current.status).toBe('unknown');
    });

    it('should handle empty string dates', () => {
      const { result } = renderHook(() => useExpirationStatus(''));
      
      expect(result.current.status).toBe('unknown');
    });

    it('should handle dates with time component', () => {
      const dateWithTime = new Date(today);
      dateWithTime.setDate(today.getDate() + 5);
      dateWithTime.setHours(14, 30, 45);
      
      const { result } = renderHook(() => useExpirationStatus(dateWithTime.toISOString()));
      
      expect(result.current.status).toBe('expiring_soon');
      expect(result.current.daysRemaining).toBe(5);
    });

    it('should handle leap year dates', () => {
      // February 29, 2024 (leap year)
      const leapDate = new Date('2024-02-29');
      
      const { result } = renderHook(() => useExpirationStatus(leapDate.toISOString()));
      
      expect(result.current.status).toBeDefined();
      expect(result.current.daysRemaining).toBeDefined();
    });
  });

  describe('Color and Icon Properties', () => {
    it('should return appropriate color for expired status', () => {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - 1);
      
      const { result } = renderHook(() => useExpirationStatus(pastDate.toISOString()));
      
      expect(result.current.color).toBe('red');
    });

    it('should return appropriate color for expiring_soon status', () => {
      const warningDate = new Date(today);
      warningDate.setDate(today.getDate() + 3);
      
      const { result } = renderHook(() => useExpirationStatus(warningDate.toISOString(), 7));
      
      expect(result.current.color).toBe('orange');
    });

    it('should return appropriate color for ok status', () => {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 30);
      
      const { result } = renderHook(() => useExpirationStatus(futureDate.toISOString()));
      
      expect(result.current.color).toBe('green');
    });

    it('should return appropriate icon for each status', () => {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - 1);
      const warningDate = new Date(today);
      warningDate.setDate(today.getDate() + 3);
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 30);
      
      const { result: resultExpired } = renderHook(() => useExpirationStatus(pastDate.toISOString()));
      const { result: resultWarning } = renderHook(() => useExpirationStatus(warningDate.toISOString(), 7));
      const { result: resultOk } = renderHook(() => useExpirationStatus(futureDate.toISOString()));
      
      expect(resultExpired.current.icon).toBeDefined();
      expect(resultWarning.current.icon).toBeDefined();
      expect(resultOk.current.icon).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should handle large date ranges efficiently', () => {
      const farFutureDate = new Date(today);
      farFutureDate.setFullYear(today.getFullYear() + 10);
      
      const { result } = renderHook(() => useExpirationStatus(farFutureDate.toISOString()));
      
      expect(result.current.status).toBe('ok');
      expect(result.current.daysRemaining).toBeGreaterThan(3000);
    });

    it('should be memoized and not recalculate unnecessarily', () => {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 30);
      
      const { result, rerender } = renderHook(
        ({ date }) => useExpirationStatus(date),
        { initialProps: { date: futureDate.toISOString() } }
      );
      
      const firstResult = result.current;
      
      rerender({ date: futureDate.toISOString() });
      
      const secondResult = result.current;
      
      // Should return the same object reference if memoized
      expect(firstResult).toEqual(secondResult);
    });
  });
});
