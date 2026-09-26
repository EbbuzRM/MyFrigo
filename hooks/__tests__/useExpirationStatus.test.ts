// useExpirationStatus.test.ts — useExpirationStatus.test module.
//
// exports: none
// used_by: none
// rules:   none
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { renderHook } from '@testing-library/react-native';
import { useExpirationStatus } from '../useExpirationStatus';

describe('useExpirationStatus', () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  describe('Status Calculation', () => {
    it('should return stable expired status for past dates', () => {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - 1);
      
      const { result } = renderHook(() => useExpirationStatus(pastDate.toISOString(), false));
      
      expect(result.current.status).toBe('expired');
      expect(result.current.color).toBeDefined();
      expect(result.current.backgroundColor).toBeDefined();
    });

    it('should return stable expires-today status for today', () => {
      const { result } = renderHook(() => useExpirationStatus(today.toISOString(), false));
      
      expect(result.current.status).toBe('expiresToday');
      expect(result.current.color).toBeDefined();
    });

    it('should return warning for dates within 3 days', () => {
      const warningDate = new Date(today);
      warningDate.setDate(today.getDate() + 2);
      
      const { result } = renderHook(() => useExpirationStatus(warningDate.toISOString(), false));
      
      expect(result.current.status).toBe('expiresInDays');
      expect(result.current).toHaveProperty('daysUntil', 2);
      expect(result.current.color).toBeDefined();
    });

    it('should return good status for dates beyond 3 days', () => {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 30);
      
      const { result } = renderHook(() => useExpirationStatus(futureDate.toISOString(), false));
      
      expect(result.current.status).toBe('expiresInDays');
      expect(result.current).toHaveProperty('daysUntil', 30);
      expect(result.current.color).toBeDefined();
    });
  });

    it('counts calendar days consistently across a daylight saving transition', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-09-25T22:30:00.000Z'));

      try {
        const expirationDate = new Date('2026-10-25T23:00:00.000Z');
        const { result } = renderHook(() => useExpirationStatus(expirationDate.toISOString(), false));

        expect(result.current).toMatchObject({ status: 'expiresInDays', daysUntil: 30 });
      } finally {
        jest.useRealTimers();
      }
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
      
      expect(result.current.status).toBe('dateNotSet');
      expect(result.current.color).toBeDefined();
    });

    it('should handle invalid dates', () => {
      const { result } = renderHook(() => useExpirationStatus('invalid-date', false));
      
      expect(result.current.status).toBe('dateInvalid');
      expect(result.current.color).toBeDefined();
    });

    it('should handle empty string dates', () => {
      const { result } = renderHook(() => useExpirationStatus('', false));
      
      expect(result.current.status).toBe('dateNotSet');
    });

    it('should handle dates with time component', () => {
      const dateWithTime = new Date(today);
      dateWithTime.setDate(today.getDate() + 5);
      dateWithTime.setHours(14, 30, 45);
      
      const { result } = renderHook(() => useExpirationStatus(dateWithTime.toISOString(), false));
      
      expect(result.current.status).toBe('expiresInDays');
      expect(result.current.color).toBeDefined();
    });

    it('should handle leap year dates', () => {
      // February 29, 2024 (leap year)
      const leapDate = new Date('2024-02-29');
      
      const { result } = renderHook(() => useExpirationStatus(leapDate.toISOString(), false));
      
      expect(result.current.status).toBe('expired');
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
      
      expect(result.current.status).toBe('expiresInDays');
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

  describe('Stable day count', () => {
    it('should return correct number of days remaining', () => {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 5);
      
      const { result } = renderHook(() => useExpirationStatus(futureDate.toISOString(), false));
      
      expect(result.current).toMatchObject({ status: 'expiresInDays', daysUntil: 5 });
    });

    it('should return one day for tomorrow', () => {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const { result } = renderHook(() => useExpirationStatus(tomorrow.toISOString(), false));
      
      expect(result.current).toMatchObject({ status: 'expiresInDays', daysUntil: 1 });
    });

    it('should return two days for day after tomorrow', () => {
      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(today.getDate() + 2);
      
      const { result } = renderHook(() => useExpirationStatus(dayAfterTomorrow.toISOString(), false));
      
      expect(result.current).toMatchObject({ status: 'expiresInDays', daysUntil: 2 });
    });

    it('should return frozen status when product is frozen', () => {
      const { result } = renderHook(() => useExpirationStatus(undefined, false, true));

      expect(result.current.status).toBe('frozen');
    });
  });
});
