import { renderHook, act } from '@testing-library/react-native';
import { useProductSearch } from '../useProductSearch';
import { LoggingService } from '@/services/LoggingService';

jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    debug: jest.fn(),
  }
}));

describe('useProductSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with empty search query', () => {
    const { result } = renderHook(() => useProductSearch());
    
    expect(result.current.searchQuery).toBe('');
    expect(result.current.debouncedQuery).toBe('');
    expect(result.current.hasSearchQuery).toBe(false);
  });

  it('should update search query immediately', () => {
    const { result } = renderHook(() => useProductSearch());
    
    act(() => {
      result.current.setSearchQuery('latte');
    });

    expect(result.current.searchQuery).toBe('latte');
    expect(result.current.hasSearchQuery).toBe(true);
    // Debounced query shouldn't update immediately
    expect(result.current.debouncedQuery).toBe('');
  });

  it('should update debounced query after timeout', () => {
    const { result } = renderHook(() => useProductSearch());
    
    act(() => {
      result.current.setSearchQuery('latte');
    });

    expect(result.current.debouncedQuery).toBe('');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.debouncedQuery).toBe('latte');
  });

  it('should clear search query and debounced query', () => {
    const { result } = renderHook(() => useProductSearch());
    
    act(() => {
      result.current.setSearchQuery('latte');
    });
    
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.debouncedQuery).toBe('latte');

    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.searchQuery).toBe('');
    expect(result.current.hasSearchQuery).toBe(false);
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    expect(result.current.debouncedQuery).toBe('');
  });

  it('should log when search query changes', () => {
    const { result } = renderHook(() => useProductSearch());
    
    act(() => {
      result.current.setSearchQuery('latte');
    });

    expect(LoggingService.debug).toHaveBeenCalledWith('useProductSearch', 'Search query changed: "latte"');
  });

  it('should log when search is cleared', () => {
    const { result } = renderHook(() => useProductSearch());
    
    act(() => {
      result.current.clearSearch();
    });

    expect(LoggingService.debug).toHaveBeenCalledWith('useProductSearch', 'Clearing search query');
  });
});
