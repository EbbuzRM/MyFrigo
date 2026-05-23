// useQuantityCalculation.test.ts — useQuantityCalculation test module.
//
// exports: none
// used_by: none
// rules: none

import { renderHook, act } from '@testing-library/react-native';
import { useQuantityCalculation } from '../useQuantityCalculation';
import { Quantity } from '@/types/Product';

describe('useQuantityCalculation', () => {
  describe('Basic Initialization', () => {
    it('should initialize with empty quantities', () => {
      const { result } = renderHook(() => useQuantityCalculation([]));

      expect(result.current.totalQuantity).toBe(0);
      expect(result.current.unit).toBe('unità');
      expect(result.current.hasPz).toBe(false);
      expect(result.current.hasConf).toBe(false);
      expect(result.current.quantities).toEqual([]);
    });

    it('should initialize with undefined quantities', () => {
      const { result } = renderHook(() => useQuantityCalculation(undefined));

      expect(result.current.totalQuantity).toBe(0);
      expect(result.current.unit).toBe('unità');
      expect(result.current.quantities).toEqual([]);
    });

    it('should calculate total for single unit type (pz)', () => {
      const quantities: Quantity[] = [
        { quantity: 2, unit: 'pz' },
        { quantity: 3, unit: 'pz' },
      ];

      const { result } = renderHook(() => useQuantityCalculation(quantities));

      expect(result.current.totalQuantity).toBe(5);
      expect(result.current.unit).toBe('pz');
      expect(result.current.hasPz).toBe(true);
      expect(result.current.hasConf).toBe(false);
    });

    it('should calculate total for single unit type (conf)', () => {
      const quantities: Quantity[] = [
        { quantity: 1, unit: 'conf' },
        { quantity: 2, unit: 'conf' },
      ];

      const { result } = renderHook(() => useQuantityCalculation(quantities));

      expect(result.current.totalQuantity).toBe(3);
      expect(result.current.unit).toBe('conf');
      expect(result.current.hasPz).toBe(false);
      expect(result.current.hasConf).toBe(true);
    });
  });

  describe('Mixed Units', () => {
    it('should calculate total using pz when both pz and conf are present', () => {
      const quantities: Quantity[] = [
        { quantity: 3, unit: 'pz' },
        { quantity: 2, unit: 'conf' },
      ];

      const { result } = renderHook(() => useQuantityCalculation(quantities));

      // When mixed, only pz units are summed
      expect(result.current.totalQuantity).toBe(3);
      expect(result.current.unit).toBe('pz');
      expect(result.current.hasPz).toBe(true);
      expect(result.current.hasConf).toBe(true);
    });

    it('should handle multiple pz with conf units correctly', () => {
      const quantities: Quantity[] = [
        { quantity: 1, unit: 'pz' },
        { quantity: 4, unit: 'pz' },
        { quantity: 1, unit: 'conf' },
      ];

      const { result } = renderHook(() => useQuantityCalculation(quantities));

      expect(result.current.totalQuantity).toBe(5);
      expect(result.current.unit).toBe('pz');
    });
  });

  describe('validateInput', () => {
    it('should return error for empty input', () => {
      const { result } = renderHook(() =>
        useQuantityCalculation([{ quantity: 5, unit: 'pz' }])
      );

      const validation = result.current.validateInput('');

      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Inserisci una quantità.');
    });

    it('should return error for whitespace-only input', () => {
      const { result } = renderHook(() =>
        useQuantityCalculation([{ quantity: 5, unit: 'pz' }])
      );

      const validation = result.current.validateInput('   ');

      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Inserisci una quantità.');
    });

    it('should return error for non-numeric input', () => {
      const { result } = renderHook(() =>
        useQuantityCalculation([{ quantity: 5, unit: 'pz' }])
      );

      const validation = result.current.validateInput('abc');

      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Inserisci un numero valido.');
    });

    it('should return error for input less than 1', () => {
      const { result } = renderHook(() =>
        useQuantityCalculation([{ quantity: 5, unit: 'pz' }])
      );

      const validation = result.current.validateInput('0');

      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('La quantità deve essere almeno 1.');
    });

    it('should return error for input exceeding total quantity', () => {
      const { result } = renderHook(() =>
        useQuantityCalculation([{ quantity: 5, unit: 'pz' }])
      );

      const validation = result.current.validateInput('10');

      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe(
        'Inserisci un numero tra 1 e 5 (pz).'
      );
    });

    it('should return valid for input within range', () => {
      const { result } = renderHook(() =>
        useQuantityCalculation([{ quantity: 5, unit: 'pz' }])
      );

      const validation = result.current.validateInput('3');

      expect(validation.isValid).toBe(true);
      expect(validation.error).toBe('');
    });

    it('should validate with unit in error message for conf', () => {
      const { result } = renderHook(() =>
        useQuantityCalculation([{ quantity: 3, unit: 'conf' }])
      );

      const validation = result.current.validateInput('5');

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('conf');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single item total correctly', () => {
      const quantities: Quantity[] = [{ quantity: 1, unit: 'pz' }];

      const { result } = renderHook(() => useQuantityCalculation(quantities));

      expect(result.current.totalQuantity).toBe(1);
      expect(result.current.unit).toBe('pz');
    });

    it('should accept exactly 1 as valid input', () => {
      const { result } = renderHook(() =>
        useQuantityCalculation([{ quantity: 1, unit: 'pz' }])
      );

      const validation = result.current.validateInput('1');

      expect(validation.isValid).toBe(true);
    });

    it('should use first unit type for unknown units', () => {
      const quantities: Quantity[] = [
        { quantity: 2, unit: 'kg' },
        { quantity: 3, unit: 'kg' },
      ];

      const { result } = renderHook(() => useQuantityCalculation(quantities));

      expect(result.current.totalQuantity).toBe(5);
      expect(result.current.unit).toBe('kg');
      expect(result.current.hasPz).toBe(false);
      expect(result.current.hasConf).toBe(false);
    });
  });
});
