// ManualEntryMetaContext.test.tsx — ManualEntryMetaContext.test module.
//
// exports: none
// used_by: none
// rules: none

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { ManualEntryMetaProvider, useManualEntryMeta } from '../ManualEntryMetaContext';
import { LoggingService } from '@/services/LoggingService';

// --- Mocks ---

jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('ManualEntryMetaContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct default initial meta state', () => {
    const { result } = renderHook(() => useManualEntryMeta(), {
      wrapper: ManualEntryMetaProvider,
    });

    expect(result.current.isEditMode).toBe(false);
    expect(result.current.originalProductId).toBeNull();
    expect(result.current.hasManuallySelectedCategory).toBe(false);
    expect(result.current.isInitialized).toBe(false);
  });

  describe('Setter functions', () => {
    it('should update isEditMode via setEditMode', () => {
      const { result } = renderHook(() => useManualEntryMeta(), {
        wrapper: ManualEntryMetaProvider,
      });

      act(() => {
        result.current.setEditMode(true);
      });
      expect(result.current.isEditMode).toBe(true);
      expect(LoggingService.info).toHaveBeenCalledWith('ManualEntryMeta', 'Setting isEditMode to: true');

      act(() => {
        result.current.setEditMode(false);
      });
      expect(result.current.isEditMode).toBe(false);
    });

    it('should update originalProductId via setOriginalProductId', () => {
      const { result } = renderHook(() => useManualEntryMeta(), {
        wrapper: ManualEntryMetaProvider,
      });

      act(() => {
        result.current.setOriginalProductId('prod-123');
      });
      expect(result.current.originalProductId).toBe('prod-123');
      expect(LoggingService.info).toHaveBeenCalledWith('ManualEntryMeta', 'Setting originalProductId to: prod-123');

      act(() => {
        result.current.setOriginalProductId(null);
      });
      expect(result.current.originalProductId).toBeNull();
    });

    it('should update hasManuallySelectedCategory via setManuallySelectedCategory', () => {
      const { result } = renderHook(() => useManualEntryMeta(), {
        wrapper: ManualEntryMetaProvider,
      });

      act(() => {
        result.current.setManuallySelectedCategory(true);
      });
      expect(result.current.hasManuallySelectedCategory).toBe(true);
      expect(LoggingService.info).toHaveBeenCalledWith('ManualEntryMeta', 'Setting hasManuallySelectedCategory to: true');

      act(() => {
        result.current.setManuallySelectedCategory(false);
      });
      expect(result.current.hasManuallySelectedCategory).toBe(false);
    });

    it('should update isInitialized via setInitialized', () => {
      const { result } = renderHook(() => useManualEntryMeta(), {
        wrapper: ManualEntryMetaProvider,
      });

      act(() => {
        result.current.setInitialized(true);
      });
      expect(result.current.isInitialized).toBe(true);
      expect(LoggingService.info).toHaveBeenCalledWith('ManualEntryMeta', 'Setting isInitialized to: true');

      act(() => {
        result.current.setInitialized(false);
      });
      expect(result.current.isInitialized).toBe(false);
    });
  });

  it('should reset all meta state to defaults via resetMeta', () => {
    const { result } = renderHook(() => useManualEntryMeta(), {
      wrapper: ManualEntryMetaProvider,
    });

    // Dirty the state
    act(() => {
      result.current.setEditMode(true);
      result.current.setOriginalProductId('prod-abc');
      result.current.setManuallySelectedCategory(true);
      result.current.setInitialized(true);
    });

    expect(result.current.isEditMode).toBe(true);
    expect(result.current.originalProductId).toBe('prod-abc');

    act(() => {
      result.current.resetMeta();
    });

    expect(result.current.isEditMode).toBe(false);
    expect(result.current.originalProductId).toBeNull();
    expect(result.current.hasManuallySelectedCategory).toBe(false);
    expect(result.current.isInitialized).toBe(false);
    expect(LoggingService.info).toHaveBeenCalledWith('ManualEntryMeta', 'Resetting meta state');
  });

  it('should throw error when used outside of ManualEntryMetaProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useManualEntryMeta())).toThrow(
      'useManualEntryMeta must be used within ManualEntryMetaProvider'
    );
    spy.mockRestore();
  });
});
