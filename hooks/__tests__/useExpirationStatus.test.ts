import { renderHook, act } from '@testing-library/react-native';
import { useExpirationStatus } from '../useExpirationStatus';
import { useTheme } from '@/context/ThemeContext';

// Mock del contesto del tema
jest.mock('@/context/ThemeContext', () => ({
  useTheme: jest.fn(() => ({ isDarkMode: false })),
}));

// Type assertion per il mock
const mockedUseTheme = useTheme as jest.Mock;

describe('useExpirationStatus', () => {
  
  // Funzione helper per creare date
  const getDate = (offsetDays: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString();
  };

  it('should return "good" status for products expiring in more than 3 days', () => {
    const { result } = renderHook(() => useExpirationStatus(getDate(5)));
    
    expect(result.current.text).toBe('5 giorni');
    expect(result.current.color).toBe('#16a34a'); // Colore "good" per tema chiaro
  });

  it('should return "warning" status for products expiring in 3 days or less', () => {
    const { result } = renderHook(() => useExpirationStatus(getDate(3)));
    
    expect(result.current.text).toBe('3 giorni');
    expect(result.current.color).toBe('#f59e0b'); // Colore "warning" per tema chiaro
  });

  it('should return "expiring today" status for products expiring today', () => {
    const { result } = renderHook(() => useExpirationStatus(getDate(0)));
    
    expect(result.current.text).toBe('Scade oggi');
    expect(result.current.color).toBe('#f59e0b'); // Colore "warning" per tema chiaro
  });

  it('should return "expired" status for products that have expired', () => {
    const { result } = renderHook(() => useExpirationStatus(getDate(-2)));
    
    expect(result.current.text).toBe('Scaduto');
    expect(result.current.color).toBe('#dc2626'); // Colore "expired" per tema chiaro
  });

  it('should return correct colors for dark mode', () => {
    // Imposta il mock per restituire isDarkMode = true
    mockedUseTheme.mockImplementation(() => ({ isDarkMode: true }));

    // Test per lo stato "good" in dark mode
    const { result: goodResult } = renderHook(() => useExpirationStatus(getDate(5)));
    expect(goodResult.current.color).toBe('#4ade80');

    // Test per lo stato "warning" in dark mode
    const { result: warningResult } = renderHook(() => useExpirationStatus(getDate(2)));
    expect(warningResult.current.color).toBe('#fcd34d');

    // Test per lo stato "expired" in dark mode
    const { result: expiredResult } = renderHook(() => useExpirationStatus(getDate(-1)));
    expect(expiredResult.current.color).toBe('#f87171');

    // Ripristina il mock al valore predefinito dopo il test
    mockedUseTheme.mockImplementation(() => ({ isDarkMode: false }));
  });
});
