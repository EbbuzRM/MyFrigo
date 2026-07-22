import { renderHook, act } from '@testing-library/react-native';
import { usePasswordVisibility } from '../usePasswordVisibility';

describe('usePasswordVisibility', () => {
  it('should initialize with password hidden', () => {
    const { result } = renderHook(() => usePasswordVisibility());
    
    expect(result.current.showPassword).toBe(false);
  });

  it('should toggle password visibility from hidden to visible', () => {
    const { result } = renderHook(() => usePasswordVisibility());
    
    act(() => {
      result.current.togglePasswordVisibility();
    });
    
    expect(result.current.showPassword).toBe(true);
  });

  it('should toggle password visibility from visible to hidden', () => {
    const { result } = renderHook(() => usePasswordVisibility());
    
    act(() => {
      result.current.togglePasswordVisibility();
      result.current.togglePasswordVisibility();
    });
    
    expect(result.current.showPassword).toBe(false);
  });

  it('should toggle password visibility multiple times', () => {
    const { result } = renderHook(() => usePasswordVisibility());
    
    act(() => {
      result.current.togglePasswordVisibility();
    });
    expect(result.current.showPassword).toBe(true);
    
    act(() => {
      result.current.togglePasswordVisibility();
    });
    expect(result.current.showPassword).toBe(false);
    
    act(() => {
      result.current.togglePasswordVisibility();
    });
    expect(result.current.showPassword).toBe(true);
  });

  it('should maintain independent state across multiple hook instances', () => {
    const { result: result1 } = renderHook(() => usePasswordVisibility());
    const { result: result2 } = renderHook(() => usePasswordVisibility());
    
    act(() => {
      result1.current.togglePasswordVisibility();
    });
    
    expect(result1.current.showPassword).toBe(true);
    expect(result2.current.showPassword).toBe(false);
  });

  it('should have correct return type structure', () => {
    const { result } = renderHook(() => usePasswordVisibility());
    
    expect(result.current).toHaveProperty('showPassword');
    expect(result.current).toHaveProperty('togglePasswordVisibility');
    expect(typeof result.current.showPassword).toBe('boolean');
    expect(typeof result.current.togglePasswordVisibility).toBe('function');
  });
});
