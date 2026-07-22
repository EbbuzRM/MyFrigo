import { renderHook, act } from '@testing-library/react-native';
import { usePasswordForm } from '../usePasswordForm';

describe('usePasswordForm', () => {
  it('should initialize with empty password fields', () => {
    const { result } = renderHook(() => usePasswordForm());
    
    expect(result.current.values).toEqual({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  });

  it('should update currentPassword field', () => {
    const { result } = renderHook(() => usePasswordForm());
    
    act(() => {
      result.current.handleChange('currentPassword', 'MyOldPass123!');
    });
    
    expect(result.current.values.currentPassword).toBe('MyOldPass123!');
    expect(result.current.values.newPassword).toBe('');
    expect(result.current.values.confirmPassword).toBe('');
  });

  it('should update newPassword field', () => {
    const { result } = renderHook(() => usePasswordForm());
    
    act(() => {
      result.current.handleChange('newPassword', 'MyNewPass456!');
    });
    
    expect(result.current.values.currentPassword).toBe('');
    expect(result.current.values.newPassword).toBe('MyNewPass456!');
    expect(result.current.values.confirmPassword).toBe('');
  });

  it('should update confirmPassword field', () => {
    const { result } = renderHook(() => usePasswordForm());
    
    act(() => {
      result.current.handleChange('confirmPassword', 'MyNewPass456!');
    });
    
    expect(result.current.values.currentPassword).toBe('');
    expect(result.current.values.newPassword).toBe('');
    expect(result.current.values.confirmPassword).toBe('MyNewPass456!');
  });

  it('should update multiple fields independently', () => {
    const { result } = renderHook(() => usePasswordForm());
    
    act(() => {
      result.current.handleChange('currentPassword', 'Old123!');
      result.current.handleChange('newPassword', 'New456!');
      result.current.handleChange('confirmPassword', 'New456!');
    });
    
    expect(result.current.values).toEqual({
      currentPassword: 'Old123!',
      newPassword: 'New456!',
      confirmPassword: 'New456!',
    });
  });

  it('should overwrite existing field values', () => {
    const { result } = renderHook(() => usePasswordForm());
    
    act(() => {
      result.current.handleChange('newPassword', 'FirstValue');
    });
    expect(result.current.values.newPassword).toBe('FirstValue');
    
    act(() => {
      result.current.handleChange('newPassword', 'SecondValue');
    });
    expect(result.current.values.newPassword).toBe('SecondValue');
  });

  it('should reset all fields to empty strings', () => {
    const { result } = renderHook(() => usePasswordForm());
    
    act(() => {
      result.current.handleChange('currentPassword', 'Old123!');
      result.current.handleChange('newPassword', 'New456!');
      result.current.handleChange('confirmPassword', 'New456!');
    });
    
    expect(result.current.values.currentPassword).toBe('Old123!');
    
    act(() => {
      result.current.resetForm();
    });
    
    expect(result.current.values).toEqual({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  });

  it('should handle empty string values', () => {
    const { result } = renderHook(() => usePasswordForm());
    
    act(() => {
      result.current.handleChange('newPassword', 'SomePassword');
    });
    expect(result.current.values.newPassword).toBe('SomePassword');
    
    act(() => {
      result.current.handleChange('newPassword', '');
    });
    expect(result.current.values.newPassword).toBe('');
  });

  it('should handle special characters and spaces', () => {
    const { result } = renderHook(() => usePasswordForm());
    
    act(() => {
      result.current.handleChange('newPassword', 'P@ssw0rd! #$%');
    });
    
    expect(result.current.values.newPassword).toBe('P@ssw0rd! #$%');
  });

  it('should have correct return type structure', () => {
    const { result } = renderHook(() => usePasswordForm());
    
    expect(result.current).toHaveProperty('values');
    expect(result.current).toHaveProperty('handleChange');
    expect(result.current).toHaveProperty('resetForm');
    expect(typeof result.current.values).toBe('object');
    expect(typeof result.current.handleChange).toBe('function');
    expect(typeof result.current.resetForm).toBe('function');
  });

  it('should reset form after multiple operations', () => {
    const { result } = renderHook(() => usePasswordForm());
    
    act(() => {
      result.current.handleChange('currentPassword', 'Pass1');
      result.current.handleChange('newPassword', 'Pass2');
      result.current.resetForm();
      result.current.handleChange('confirmPassword', 'Pass3');
    });
    
    expect(result.current.values).toEqual({
      currentPassword: '',
      newPassword: '',
      confirmPassword: 'Pass3',
    });
  });
});
