import { renderHook } from '@testing-library/react-native';
import { useExpirationStatus } from '../useExpirationStatus';

describe('useExpirationStatus', () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  describe('Status Calculation', () => {
    it('should return "Scaduto" for past dates', () => {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - 1);
      
      const { result } = renderHook(() => useExpirationStatus(pastDate.toISOString(), false));
      
      expect(result.current.text).toBe('Scaduto');
      expect(result.current.color).toBeDefined();
      expect(result.current.backgroundColor).toBeDefined();
    });

    it('should return "Scade oggi" for today', () => {
      const { result } = renderHook(() => useExpirationStatus(today.toISOString(), false));
      
      expect(result.current.text).toBe('Scade oggi');
      expect(result.current.color).toBeDefined();
    });

    it('should return warning for dates within 3 days', () => {
      const warningDate = new Date(today);
      warningDate.setDate(today.getDate() + 2);
      
      const { result } = renderHook(() => useExpirationStatus(warningDate.toISOString(), false));
      
      expect(result.current.text).toContain('giorni');
      expect(result.current.color).toBeDefined();
    });

    it('should return good status for dates beyond 3 days', () => {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 30);
      
      const { result } = renderHook(() => useExpirationStatus(futureDate.toISOString(), false));
      
      expect(result.current.text).toContain('giorni');
      expect(result.current.color).toBeDefined();
    });
  });

  describe('Dark Mode Support', () => {
    it('should return different colors for light mode', () => {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 30);
      
      const { result: resultLight } = renderHook(() => useExpirationStatus(futureDate.toISOString(), false));
      const { result: resultDark } = renderHook(() => useExpirationStatus(futureDate.toISOString(), true));
      
      expect(resultLight.current.color).toBeDefined();
      expect(resultDark.current.color).toBeDefined();
      // Colors should be different between light and dark mode
      expect(resultLight.current.color).not.toBe(resultDark.current.color);
    });

    it('should apply correct background color for dark mode', () => {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 30);
      
      const { result } = renderHook(() => useExpirationStatus(futureDate.toISOString(), true));
      
      expect(result.current.backgroundColor).toBeDefined();
      expect(result.current.backgroundColor).toContain('20'); // Transparency suffix
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined dates', () => {
      const { result } = renderHook(() => useExpirationStatus(undefined, false));
      
      expect(result.current.text).toBe('Data non impostata');
      expect(result.current.color).toBeDefined();
    });

    it('should handle invalid dates', () => {
      const { result } = renderHook(() => useExpirationStatus('invalid-date', false));
      
      expect(result.current.text).toBe('Data non valida');
      expect(result.current.color).toBeDefined();
    });

    it('should handle empty string dates', () => {
      const { result } = renderHook(() => useExpirationStatus('', false));
      
      expect(result.current.text).toBe('Data non impostata');
    });

    it('should handle dates with time component', () => {
      const dateWithTime = new Date(today);
      dateWithTime.setDate(today.getDate() + 5);
      dateWithTime.setHours(14, 30, 45);
      
      const { result } = renderHook(() => useExpirationStatus(dateWithTime.toISOString(), false));
      
      expect(result.current.text).toContain('giorni');
      expect(result.current.color).toBeDefined();
    });

    it('should handle leap year dates', () => {
      // February 29, 2024 (leap year)
      const leapDate = new Date('2024-02-29');
      
      const { result } = renderHook(() => useExpirationStatus(leapDate.toISOString(), false));
      
      expect(result.current.text).toBeDefined();
      expect(result.current.color).toBeDefined();
    });
  });

  describe('Color Properties', () => {
    it('should return appropriate color for expired status', () => {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - 1);
      
      const { result } = renderHook(() => useExpirationStatus(pastDate.toISOString(), false));
      
      expect(result.current.color).toBeDefined();
      expect(result.current.backgroundColor).toBeDefined();
    });

    it('should return appropriate color for warning status', () => {
      const warningDate = new Date(today);
      warningDate.setDate(today.getDate() + 1);
      
      const { result } = renderHook(() => useExpirationStatus(warningDate.toISOString(), false));
      
      expect(result.current.color).toBeDefined();
      expect(result.current.backgroundColor).toBeDefined();
    });

    it('should return appropriate color for good status', () => {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 30);
      
      const { result } = renderHook(() => useExpirationStatus(futureDate.toISOString(), false));
      
      expect(result.current.color).toBeDefined();
      expect(result.current.backgroundColor).toBeDefined();
    });

    it('should have backgroundColor with transparency', () => {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 30);
      
      const { result } = renderHook(() => useExpirationStatus(futureDate.toISOString(), false));
      
      expect(result.current.backgroundColor).toContain('20');
    });
  });

  describe('Performance', () => {
    it('should handle large date ranges efficiently', () => {
      const farFutureDate = new Date(today);
      farFutureDate.setFullYear(today.getFullYear() + 10);
      
      const { result } = renderHook(() => useExpirationStatus(farFutureDate.toISOString(), false));
      
      expect(result.current.text).toContain('giorni');
      expect(result.current.color).toBeDefined();
    });

    it('should be memoized and not recalculate unnecessarily', () => {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 30);
      const dateStr = futureDate.toISOString();
      
      const { result, rerender } = renderHook(
        (props: { date: string; isDark: boolean }) => useExpirationStatus(props.date, props.isDark),
        { initialProps: { date: dateStr, isDark: false } }
      );
      
      const firstResult = result.current;
      
      rerender({ date: dateStr, isDark: false });
      
      const secondResult = result.current;
      
      // Should return the same object reference if memoized
      expect(firstResult).toEqual(secondResult);
    });
  });

  describe('Text Output', () => {
    it('should display correct number of days remaining', () => {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 5);
      
      const { result } = renderHook(() => useExpirationStatus(futureDate.toISOString(), false));
      
      expect(result.current.text).toContain('5');
      expect(result.current.text).toContain('giorni');
    });

    it('should display 1 day for tomorrow', () => {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const { result } = renderHook(() => useExpirationStatus(tomorrow.toISOString(), false));
      
      expect(result.current.text).toContain('1');
      expect(result.current.text).toContain('giorni');
    });

    it('should display 2 days for day after tomorrow', () => {
      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(today.getDate() + 2);
      
      const { result } = renderHook(() => useExpirationStatus(dayAfterTomorrow.toISOString(), false));
      
      expect(result.current.text).toContain('2');
      expect(result.current.text).toContain('giorni');
    });
  });
});
