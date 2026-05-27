// ManualEntryFormContext.test.tsx — ManualEntryFormContext.test module.
//
// exports: none
// used_by: none
// rules: none

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { ManualEntryFormProvider, useManualEntryForm } from '../ManualEntryFormContext';

// --- Mocks ---

// Mock uuid for deterministic IDs
jest.mock('uuid', () => {
  let counter = 0;
  return {
    v4: jest.fn(() => {
      counter += 1;
      return `test-uuid-${counter}`;
    }),
  };
});

// Mock react-native-get-random-values
jest.mock('react-native-get-random-values', () => ({}));

describe('ManualEntryFormContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct default initial state', () => {
    const { result } = renderHook(() => useManualEntryForm(), {
      wrapper: ManualEntryFormProvider,
    });

    expect(result.current.state.name).toBe('');
    expect(result.current.state.brand).toBe('');
    expect(result.current.state.selectedCategory).toBe('');
    expect(result.current.state.notes).toBe('');
    expect(result.current.state.barcode).toBe('');
    expect(result.current.state.imageUrl).toBeNull();
    expect(result.current.state.isFrozen).toBe(false);
    expect(result.current.state.expirationDate).toBe('');
    expect(result.current.state.purchaseDate).toBeTruthy(); // should be today's date
    expect(result.current.state.quantities).toHaveLength(1);
    expect(result.current.state.quantities[0].quantity).toBe('1');
    expect(result.current.state.quantities[0].unit).toBe('pz');
  });

  describe('SET_FIELD action', () => {
    it('should update a string field and preserve others', () => {
      const { result } = renderHook(() => useManualEntryForm(), {
        wrapper: ManualEntryFormProvider,
      });

      act(() => {
        result.current.dispatch({ type: 'SET_FIELD', field: 'name', value: 'Test Product' });
      });

      expect(result.current.state.name).toBe('Test Product');
      expect(result.current.state.brand).toBe(''); // preserve
    });

    it('should update a boolean field', () => {
      const { result } = renderHook(() => useManualEntryForm(), {
        wrapper: ManualEntryFormProvider,
      });

      act(() => {
        result.current.dispatch({ type: 'SET_FIELD', field: 'isFrozen', value: true });
      });

      expect(result.current.state.isFrozen).toBe(true);
    });

    it('should update a field to null', () => {
      const { result } = renderHook(() => useManualEntryForm(), {
        wrapper: ManualEntryFormProvider,
      });

      // First set it to something
      act(() => {
        result.current.dispatch({ type: 'SET_FIELD', field: 'imageUrl', value: 'https://example.com/img.jpg' });
      });
      expect(result.current.state.imageUrl).toBe('https://example.com/img.jpg');

      act(() => {
        result.current.dispatch({ type: 'SET_FIELD', field: 'imageUrl', value: null });
      });
      expect(result.current.state.imageUrl).toBeNull();
    });
  });

  describe('Quantity management actions', () => {
    it('should add a new quantity entry via ADD_QUANTITY', () => {
      const { result } = renderHook(() => useManualEntryForm(), {
        wrapper: ManualEntryFormProvider,
      });

      expect(result.current.state.quantities).toHaveLength(1);

      act(() => {
        result.current.dispatch({ type: 'ADD_QUANTITY' });
      });

      expect(result.current.state.quantities).toHaveLength(2);
      expect(result.current.state.quantities[1].quantity).toBe('1');
      expect(result.current.state.quantities[1].unit).toBe('pz');
      expect(result.current.state.quantities[1].id).toMatch(/test-uuid-\d+/);
    });

    it('should remove a specific quantity via REMOVE_QUANTITY', () => {
      const { result } = renderHook(() => useManualEntryForm(), {
        wrapper: ManualEntryFormProvider,
      });

      act(() => {
        result.current.dispatch({ type: 'ADD_QUANTITY' });
      });
      const idToRemove = result.current.state.quantities[0].id;

      act(() => {
        result.current.dispatch({ type: 'REMOVE_QUANTITY', id: idToRemove });
      });

      expect(result.current.state.quantities).toHaveLength(1);
      expect(result.current.state.quantities.find(q => q.id === idToRemove)).toBeUndefined();
    });

    it('should update quantity field via UPDATE_QUANTITY', () => {
      const { result } = renderHook(() => useManualEntryForm(), {
        wrapper: ManualEntryFormProvider,
      });

      const qtyId = result.current.state.quantities[0].id;

      act(() => {
        result.current.dispatch({ type: 'UPDATE_QUANTITY', id: qtyId, field: 'quantity', value: '5' });
      });
      expect(result.current.state.quantities[0].quantity).toBe('5');

      act(() => {
        result.current.dispatch({ type: 'UPDATE_QUANTITY', id: qtyId, field: 'unit', value: 'kg' });
      });
      expect(result.current.state.quantities[0].unit).toBe('kg');
    });

    it('should replace all quantities via SET_QUANTITIES', () => {
      const { result } = renderHook(() => useManualEntryForm(), {
        wrapper: ManualEntryFormProvider,
      });

      const newQuantities = [
        { id: 'q1', quantity: '10', unit: 'g' },
        { id: 'q2', quantity: '2', unit: 'pz' },
      ];

      act(() => {
        result.current.dispatch({ type: 'SET_QUANTITIES', quantities: newQuantities });
      });

      expect(result.current.state.quantities).toEqual(newQuantities);
    });
  });

  describe('Form lifecycle actions', () => {
    it('should merge partial state via INITIALIZE', () => {
      const { result } = renderHook(() => useManualEntryForm(), {
        wrapper: ManualEntryFormProvider,
      });

      act(() => {
        result.current.dispatch({ 
          type: 'INITIALIZE', 
          state: { name: 'Initialized Name', brand: 'Init Brand' } 
        });
      });

      expect(result.current.state.name).toBe('Initialized Name');
      expect(result.current.state.brand).toBe('Init Brand');
      expect(result.current.state.selectedCategory).toBe(''); // preserve default
    });

    it('should reset to initial state via CLEAR', () => {
      const { result } = renderHook(() => useManualEntryForm(), {
        wrapper: ManualEntryFormProvider,
      });

      // Dirty the state
      act(() => {
        result.current.dispatch({ type: 'SET_FIELD', field: 'name', value: 'Dirty Name' });
        result.current.dispatch({ type: 'ADD_QUANTITY' });
      });

      expect(result.current.state.name).toBe('Dirty Name');
      expect(result.current.state.quantities).toHaveLength(2);

      act(() => {
        result.current.dispatch({ type: 'CLEAR' });
      });

      expect(result.current.state.name).toBe('');
      expect(result.current.state.quantities).toHaveLength(1);
      expect(result.current.state.quantities[0].quantity).toBe('1');
    });
  });

  it('should throw error when used outside of ManualEntryFormProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useManualEntryForm())).toThrow(
      'useManualEntryForm must be used within ManualEntryFormProvider'
    );
    spy.mockRestore();
  });
});
