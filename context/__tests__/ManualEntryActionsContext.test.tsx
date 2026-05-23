// ManualEntryActionsContext.test.tsx — ManualEntryActionsContext.test module.
//
// exports: none
// used_by: none
// rules: none

import React from 'react';
import { render, act, renderHook } from '@testing-library/react-native';
import { ManualEntryActionsProvider, useManualEntryActions, InitializeFormData } from '../ManualEntryActionsContext';
import { useManualEntryForm } from '../ManualEntryFormContext';
import { useManualEntryMeta } from '../ManualEntryMetaContext';
import { Product } from '@/types/Product';

// --- Mocks per i sub-context ---

const mockDispatch = jest.fn();
const mockSetEditMode = jest.fn();
const mockSetOriginalProductId = jest.fn();
const mockSetInitialized = jest.fn();
const mockSetManuallySelectedCategory = jest.fn();

jest.mock('../ManualEntryFormContext', () => ({
  useManualEntryForm: jest.fn(),
}));

jest.mock('../ManualEntryMetaContext', () => ({
  useManualEntryMeta: jest.fn(),
}));

// Mock uuid per ID deterministici
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

// Mock del LoggingService
jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    debug: jest.fn(),
  },
}));

// Type assertion per i mock
const mockedUseManualEntryForm = useManualEntryForm as jest.Mock;
const mockedUseManualEntryMeta = useManualEntryMeta as jest.Mock;

// --- Dati di test ---

const mockProduct: Product = {
  id: 'prod-1',
  name: 'Latte',
  brand: 'Parmalat',
  category: 'dairy',
  quantities: [{ quantity: 2, unit: 'L' }],
  purchaseDate: '2026-05-01',
  expirationDate: '2026-06-15',
  barcode: '8001234567890',
  notes: 'Note di test',
  imageUrl: 'https://example.com/latte.jpg',
  status: 'active',
  addedMethod: 'manual',
  isFrozen: false,
};

// --- Test Suite ---
describe('ManualEntryActionsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Valori di default per i mock dei sub-context
    mockedUseManualEntryForm.mockReturnValue({
      dispatch: mockDispatch,
    });

    mockedUseManualEntryMeta.mockReturnValue({
      isEditMode: false,
      originalProductId: null,
      hasManuallySelectedCategory: false,
      isInitialized: false,
      setEditMode: mockSetEditMode,
      setOriginalProductId: mockSetOriginalProductId,
      setManuallySelectedCategory: mockSetManuallySelectedCategory,
      setInitialized: mockSetInitialized,
      resetMeta: jest.fn(),
    });
  });

  // Test 1: setField dispatches SET_FIELD
  it('should dispatch SET_FIELD when setField is called', () => {
    const { result } = renderHook(() => useManualEntryActions(), {
      wrapper: ManualEntryActionsProvider,
    });

    act(() => {
      result.current.setField('name', 'Latte Fresco');
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_FIELD',
      field: 'name',
      value: 'Latte Fresco',
    });
  });

  // Test 2: setField con field e value diversi
  it('should dispatch SET_FIELD for different field types', () => {
    const { result } = renderHook(() => useManualEntryActions(), {
      wrapper: ManualEntryActionsProvider,
    });

    act(() => {
      result.current.setField('brand', 'Parmalat');
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_FIELD',
      field: 'brand',
      value: 'Parmalat',
    });

    act(() => {
      result.current.setField('isFrozen', true);
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_FIELD',
      field: 'isFrozen',
      value: true,
    });
  });

  // Test 3: setField con valore null
  it('should dispatch SET_FIELD with null value', () => {
    const { result } = renderHook(() => useManualEntryActions(), {
      wrapper: ManualEntryActionsProvider,
    });

    act(() => {
      result.current.setField('imageUrl', null);
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_FIELD',
      field: 'imageUrl',
      value: null,
    });
  });

  // Test 4: addQuantity dispatches ADD_QUANTITY
  it('should dispatch ADD_QUANTITY when addQuantity is called', () => {
    const { result } = renderHook(() => useManualEntryActions(), {
      wrapper: ManualEntryActionsProvider,
    });

    act(() => {
      result.current.addQuantity();
    });

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'ADD_QUANTITY' });
  });

  // Test 5: removeQuantity dispatches REMOVE_QUANTITY with id
  it('should dispatch REMOVE_QUANTITY when removeQuantity is called', () => {
    const { result } = renderHook(() => useManualEntryActions(), {
      wrapper: ManualEntryActionsProvider,
    });

    act(() => {
      result.current.removeQuantity('qty-123');
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'REMOVE_QUANTITY',
      id: 'qty-123',
    });
  });

  // Test 6: updateQuantity dispatches UPDATE_QUANTITY
  it('should dispatch UPDATE_QUANTITY when updateQuantity is called', () => {
    const { result } = renderHook(() => useManualEntryActions(), {
      wrapper: ManualEntryActionsProvider,
    });

    act(() => {
      result.current.updateQuantity('qty-123', 'quantity', '3');
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_QUANTITY',
      id: 'qty-123',
      field: 'quantity',
      value: '3',
    });
  });

  // Test 7: updateQuantity per il campo unit
  it('should dispatch UPDATE_QUANTITY for unit field', () => {
    const { result } = renderHook(() => useManualEntryActions(), {
      wrapper: ManualEntryActionsProvider,
    });

    act(() => {
      result.current.updateQuantity('qty-456', 'unit', 'kg');
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_QUANTITY',
      id: 'qty-456',
      field: 'unit',
      value: 'kg',
    });
  });

  // Test 8: setQuantities dispatches SET_QUANTITIES
  it('should dispatch SET_QUANTITIES when setQuantities is called', () => {
    const { result } = renderHook(() => useManualEntryActions(), {
      wrapper: ManualEntryActionsProvider,
    });

    const newQuantities = [
      { id: 'q1', quantity: '500', unit: 'g' },
      { id: 'q2', quantity: '2', unit: 'pz' },
    ];

    act(() => {
      result.current.setQuantities(newQuantities);
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_QUANTITIES',
      quantities: newQuantities,
    });
  });

  // Test 9: initializeForm con product dispatches INITIALIZE
  it('should dispatch INITIALIZE when initializeForm is called with product', () => {
    const { result } = renderHook(() => useManualEntryActions(), {
      wrapper: ManualEntryActionsProvider,
    });

    act(() => {
      result.current.initializeForm({ product: mockProduct });
    });

    // Dovrebbe aver dispatchato INITIALIZE con i dati del prodotto processati
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'INITIALIZE',
      state: expect.objectContaining({
        name: 'Latte',
        brand: 'Parmalat',
        selectedCategory: 'dairy',
        barcode: '8001234567890',
        expirationDate: '2026-06-15',
        purchaseDate: '2026-05-01',
        notes: 'Note di test',
        imageUrl: 'https://example.com/latte.jpg',
        isFrozen: false,
      }),
    });

    // Verifica che il meta stato sia stato resettato correttamente
    expect(mockSetEditMode).toHaveBeenCalledWith(false);
    expect(mockSetOriginalProductId).toHaveBeenCalledWith(null);
    expect(mockSetManuallySelectedCategory).toHaveBeenCalledWith(false);
    expect(mockSetInitialized).toHaveBeenCalledWith(true);
  });

  // Test 10: initializeForm con scanned data (barcode)
  it('should dispatch INITIALIZE when initializeForm is called with scanned data', () => {
    const { result } = renderHook(() => useManualEntryActions(), {
      wrapper: ManualEntryActionsProvider,
    });

    const scannedData: InitializeFormData = {
      barcode: '8009999999999',
      name: 'Pasta',
      brand: 'Barilla',
      category: 'pasta',
      quantity: '500',
      unit: 'g',
    };

    act(() => {
      result.current.initializeForm(scannedData);
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'INITIALIZE',
      state: expect.objectContaining({
        name: 'Pasta',
        brand: 'Barilla',
        barcode: '8009999999999',
        selectedCategory: 'pasta',
      }),
    });

    expect(mockSetInitialized).toHaveBeenCalledWith(true);
  });

  // Test 11: initializeForm senza dati dispatches CLEAR
  it('should dispatch CLEAR when initializeForm is called without data', () => {
    const { result } = renderHook(() => useManualEntryActions(), {
      wrapper: ManualEntryActionsProvider,
    });

    act(() => {
      result.current.initializeForm({});
    });

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'CLEAR' });
    expect(mockSetEditMode).toHaveBeenCalledWith(false);
    expect(mockSetOriginalProductId).toHaveBeenCalledWith(null);
    expect(mockSetManuallySelectedCategory).toHaveBeenCalledWith(false);
    expect(mockSetInitialized).toHaveBeenCalledWith(true);
  });

  // Test 12: initializeForm con edit mode
  it('should set edit mode when initializeForm is called with isEditMode', () => {
    const { result } = renderHook(() => useManualEntryActions(), {
      wrapper: ManualEntryActionsProvider,
    });

    act(() => {
      result.current.initializeForm({
        product: mockProduct,
        isEditMode: true,
        originalProductId: 'prod-1',
      });
    });

    expect(mockSetEditMode).toHaveBeenCalledWith(true);
    expect(mockSetOriginalProductId).toHaveBeenCalledWith('prod-1');
    expect(mockSetManuallySelectedCategory).toHaveBeenCalledWith(false);
    expect(mockSetInitialized).toHaveBeenCalledWith(true);
  });

  // Test 13: clearForm dispatches CLEAR e resetta meta stato
  it('should dispatch CLEAR and reset meta state when clearForm is called', () => {
    const { result } = renderHook(() => useManualEntryActions(), {
      wrapper: ManualEntryActionsProvider,
    });

    act(() => {
      result.current.clearForm();
    });

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'CLEAR' });
    expect(mockSetEditMode).toHaveBeenCalledWith(false);
    expect(mockSetOriginalProductId).toHaveBeenCalledWith(null);
    expect(mockSetManuallySelectedCategory).toHaveBeenCalledWith(false);
    expect(mockSetInitialized).toHaveBeenCalledWith(true);
  });

  // Test 14: initializeForm con hasManuallySelectedCategory
  it('should set hasManuallySelectedCategory from initializeForm', () => {
    const { result } = renderHook(() => useManualEntryActions(), {
      wrapper: ManualEntryActionsProvider,
    });

    act(() => {
      result.current.initializeForm({
        name: 'Yogurt',
        hasManuallySelectedCategory: true,
      });
    });

    expect(mockSetManuallySelectedCategory).toHaveBeenCalledWith(true);
    expect(mockSetInitialized).toHaveBeenCalledWith(true);
  });

  // Test 15: initializeForm con productName (fallback per name)
  it('should use productName as fallback when name is not provided', () => {
    const { result } = renderHook(() => useManualEntryActions(), {
      wrapper: ManualEntryActionsProvider,
    });

    act(() => {
      result.current.initializeForm({
        productName: 'Yogurt Greco',
        barcode: '8001111111111',
      });
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'INITIALIZE',
      state: expect.objectContaining({
        name: 'Yogurt Greco',
        barcode: '8001111111111',
      }),
    });
  });

  // Test 16: useManualEntryActions throws error outside provider
  it('should throw when useManualEntryActions is used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useManualEntryActions())).toThrow(
      'useManualEntryActions must be used within ManualEntryActionsProvider'
    );

    spy.mockRestore();
  });
});
