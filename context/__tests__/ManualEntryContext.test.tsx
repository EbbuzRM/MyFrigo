// ManualEntryContext.test.tsx — ManualEntryContext.test module.
//
// exports: none
// used_by: none
// rules: none

import React from 'react';
import { render, act, renderHook } from '@testing-library/react-native';
import { Text, View, TouchableOpacity } from 'react-native';
import { ManualEntryProvider, useManualEntry } from '../ManualEntryContext';
import { Product } from '@/types/Product';

// --- Mocks ---

// Override del global mock di ManualEntryContext da jest.setup.js
// per usare l'implementazione reale nei test
jest.mock('@/context/ManualEntryContext', () => jest.requireActual('../ManualEntryContext'));

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
  notes: 'Da consumare entro',
  imageUrl: 'https://example.com/latte.jpg',
  status: 'active',
  addedMethod: 'manual',
  isFrozen: false,
};

// --- Componente di Test ---
const TestComponent = () => {
  const ctx = useManualEntry();
  return (
    <View testID="context-view">
      <Text testID="field-name">{ctx.name}</Text>
      <Text testID="field-brand">{ctx.brand}</Text>
      <Text testID="field-category">{ctx.selectedCategory}</Text>
      <Text testID="field-purchaseDate">{ctx.purchaseDate}</Text>
      <Text testID="field-expirationDate">{ctx.expirationDate}</Text>
      <Text testID="field-notes">{ctx.notes}</Text>
      <Text testID="field-barcode">{ctx.barcode}</Text>
      <Text testID="field-imageUrl">{ctx.imageUrl || 'null'}</Text>
      <Text testID="field-isFrozen">{String(ctx.isFrozen)}</Text>
      <Text testID="field-isEditMode">{String(ctx.isEditMode)}</Text>
      <Text testID="field-isInitialized">{String(ctx.isInitialized)}</Text>
      <Text testID="field-originalProductId">{ctx.originalProductId || 'null'}</Text>
      <Text testID="field-hasManuallySelectedCategory">{String(ctx.hasManuallySelectedCategory)}</Text>
      <Text testID="field-quantities-count">{String(ctx.quantities.length)}</Text>
      {ctx.quantities.map((q, idx) => (
        <View key={q.id} testID={`quantity-${idx}`}>
          <Text testID={`quantity-${idx}-id`}>{q.id}</Text>
          <Text testID={`quantity-${idx}-qty`}>{q.quantity}</Text>
          <Text testID={`quantity-${idx}-unit`}>{q.unit}</Text>
        </View>
      ))}
      <TouchableOpacity
        testID="btn-setName"
        onPress={() => ctx.setName('Test Name')}
      />
      <TouchableOpacity
        testID="btn-setBrand"
        onPress={() => ctx.setBrand('Test Brand')}
      />
      <TouchableOpacity
        testID="btn-setSelectedCategory"
        onPress={() => ctx.setSelectedCategory('dairy')}
      />
      <TouchableOpacity
        testID="btn-setPurchaseDate"
        onPress={() => ctx.setPurchaseDate('2026-06-01')}
      />
      <TouchableOpacity
        testID="btn-setExpirationDate"
        onPress={() => ctx.setExpirationDate('2026-07-01')}
      />
      <TouchableOpacity
        testID="btn-setNotes"
        onPress={() => ctx.setNotes('Test notes')}
      />
      <TouchableOpacity
        testID="btn-setBarcode"
        onPress={() => ctx.setBarcode('8000000000000')}
      />
      <TouchableOpacity
        testID="btn-setImageUrl"
        onPress={() => ctx.setImageUrl('https://example.com/img.jpg')}
      />
      <TouchableOpacity
        testID="btn-setIsFrozen"
        onPress={() => ctx.setIsFrozen(true)}
      />
      <TouchableOpacity
        testID="btn-setIsEditMode"
        onPress={() => ctx.setIsEditMode(true)}
      />
      <TouchableOpacity
        testID="btn-setIsInitialized"
        onPress={() => ctx.setIsInitialized(true)}
      />
      <TouchableOpacity
        testID="btn-setOriginalProductId"
        onPress={() => ctx.setOriginalProductId('prod-original')}
      />
      <TouchableOpacity
        testID="btn-setHasManuallySelectedCategory"
        onPress={() => ctx.setHasManuallySelectedCategory(true)}
      />
      <TouchableOpacity
        testID="btn-addQuantity"
        onPress={() => ctx.addQuantity()}
      />
      <TouchableOpacity
        testID="btn-removeQuantity"
        onPress={() => {
          if (ctx.quantities.length > 0) {
            ctx.removeQuantity(ctx.quantities[0].id);
          }
        }}
      />
      <TouchableOpacity
        testID="btn-updateQuantity"
        onPress={() => {
          if (ctx.quantities.length > 0) {
            ctx.updateQuantity(ctx.quantities[0].id, 'quantity', '5');
          }
        }}
      />
      <TouchableOpacity
        testID="btn-clearForm"
        onPress={() => ctx.clearForm()}
      />
      <TouchableOpacity
        testID="btn-initializeForm"
        onPress={() => ctx.initializeForm({
          name: 'Initialized Name',
          brand: 'Initialized Brand',
        })}
      />
    </View>
  );
};

// --- Test Suite ---
describe('ManualEntryContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Stato iniziale
  it('should have default initial state', () => {
    const { result } = renderHook(() => useManualEntry(), {
      wrapper: ManualEntryProvider,
    });

    expect(result.current.name).toBe('');
    expect(result.current.brand).toBe('');
    expect(result.current.selectedCategory).toBe('');
    expect(result.current.notes).toBe('');
    expect(result.current.barcode).toBe('');
    expect(result.current.imageUrl).toBeNull();
    expect(result.current.isFrozen).toBe(false);
    expect(result.current.expirationDate).toBe('');
    expect(result.current.purchaseDate).toBeTruthy(); // today's date
    expect(result.current.quantities).toHaveLength(1);
    expect(result.current.quantities[0].quantity).toBe('1');
    expect(result.current.quantities[0].unit).toBe('pz');

    // Meta state initial
    expect(result.current.isEditMode).toBe(false);
    expect(result.current.originalProductId).toBeNull();
    expect(result.current.hasManuallySelectedCategory).toBe(false);
    expect(result.current.isInitialized).toBe(false);
  });

  // Test 2: setName updates the name field
  it('should update name field via setName', () => {
    const { result } = renderHook(() => useManualEntry(), {
      wrapper: ManualEntryProvider,
    });

    act(() => {
      result.current.setName('Latte Fresco');
    });

    expect(result.current.name).toBe('Latte Fresco');
  });

  // Test 3: setBrand updates brand field
  it('should update brand field via setBrand', () => {
    const { result } = renderHook(() => useManualEntry(), {
      wrapper: ManualEntryProvider,
    });

    act(() => {
      result.current.setBrand('Parmalat');
    });

    expect(result.current.brand).toBe('Parmalat');
  });

  // Test 4: setSelectedCategory updates category
  it('should update selectedCategory via setSelectedCategory', () => {
    const { result } = renderHook(() => useManualEntry(), {
      wrapper: ManualEntryProvider,
    });

    act(() => {
      result.current.setSelectedCategory('dairy');
    });

    expect(result.current.selectedCategory).toBe('dairy');
  });

  // Test 5: setExpirationDate updates expiration date
  it('should update expirationDate via setExpirationDate', () => {
    const { result } = renderHook(() => useManualEntry(), {
      wrapper: ManualEntryProvider,
    });

    act(() => {
      result.current.setExpirationDate('2026-07-15');
    });

    expect(result.current.expirationDate).toBe('2026-07-15');
  });

  // Test 6: setPurchaseDate updates purchase date
  it('should update purchaseDate via setPurchaseDate', () => {
    const { result } = renderHook(() => useManualEntry(), {
      wrapper: ManualEntryProvider,
    });

    act(() => {
      result.current.setPurchaseDate('2026-05-20');
    });

    expect(result.current.purchaseDate).toBe('2026-05-20');
  });

  // Test 7: setBarcode updates barcode
  it('should update barcode via setBarcode', () => {
    const { result } = renderHook(() => useManualEntry(), {
      wrapper: ManualEntryProvider,
    });

    act(() => {
      result.current.setBarcode('8001234567890');
    });

    expect(result.current.barcode).toBe('8001234567890');
  });

  // Test 8: setNotes updates notes
  it('should update notes via setNotes', () => {
    const { result } = renderHook(() => useManualEntry(), {
      wrapper: ManualEntryProvider,
    });

    act(() => {
      result.current.setNotes('Prodotto biologico');
    });

    expect(result.current.notes).toBe('Prodotto biologico');
  });

  // Test 9: setImageUrl updates imageUrl
  it('should update imageUrl via setImageUrl', () => {
    const { result } = renderHook(() => useManualEntry(), {
      wrapper: ManualEntryProvider,
    });

    act(() => {
      result.current.setImageUrl('https://example.com/img.png');
    });

    expect(result.current.imageUrl).toBe('https://example.com/img.png');
  });

  // Test 10: setIsFrozen updates frozen flag
  it('should update isFrozen via setIsFrozen', () => {
    const { result } = renderHook(() => useManualEntry(), {
      wrapper: ManualEntryProvider,
    });

    act(() => {
      result.current.setIsFrozen(true);
    });

    expect(result.current.isFrozen).toBe(true);
  });

  // Test 11: addQuantity adds a new quantity entry
  it('should add a new quantity via addQuantity', () => {
    const { result } = renderHook(() => useManualEntry(), {
      wrapper: ManualEntryProvider,
    });

    expect(result.current.quantities).toHaveLength(1);

    act(() => {
      result.current.addQuantity();
    });

    expect(result.current.quantities).toHaveLength(2);
    expect(result.current.quantities[1].quantity).toBe('1');
    expect(result.current.quantities[1].unit).toBe('pz');
    expect(result.current.quantities[1].id).toBeTruthy();
  });

  // Test 12: removeQuantity removes a quantity by id
  it('should remove a quantity via removeQuantity', () => {
    const { result } = renderHook(() => useManualEntry(), {
      wrapper: ManualEntryProvider,
    });

    act(() => {
      result.current.addQuantity();
    });
    expect(result.current.quantities).toHaveLength(2);

    const idToRemove = result.current.quantities[0].id;
    act(() => {
      result.current.removeQuantity(idToRemove);
    });

    expect(result.current.quantities).toHaveLength(1);
    expect(result.current.quantities[0].id).not.toBe(idToRemove);
  });

  // Test 13: updateQuantity updates a specific quantity field
  it('should update quantity field via updateQuantity', () => {
    const { result } = renderHook(() => useManualEntry(), {
      wrapper: ManualEntryProvider,
    });

    const qtyId = result.current.quantities[0].id;

    act(() => {
      result.current.updateQuantity(qtyId, 'quantity', '3');
    });

    expect(result.current.quantities[0].quantity).toBe('3');

    act(() => {
      result.current.updateQuantity(qtyId, 'unit', 'kg');
    });

    expect(result.current.quantities[0].unit).toBe('kg');
  });

  // Test 14: setQuantities replaces all quantities
  it('should replace all quantities via setQuantities', () => {
    const { result } = renderHook(() => useManualEntry(), {
      wrapper: ManualEntryProvider,
    });

    const newQuantities = [
      { id: 'custom-1', quantity: '500', unit: 'g' },
      { id: 'custom-2', quantity: '2', unit: 'pz' },
    ];

    act(() => {
      result.current.setQuantities(newQuantities);
    });

    expect(result.current.quantities).toHaveLength(2);
    expect(result.current.quantities[0].quantity).toBe('500');
    expect(result.current.quantities[0].unit).toBe('g');
    expect(result.current.quantities[1].quantity).toBe('2');
  });

  // Test 15: clearForm resets to initial state
  it('should reset form to initial state via clearForm', () => {
    const { result } = renderHook(() => useManualEntry(), {
      wrapper: ManualEntryProvider,
    });

    // Popola alcuni campi
    act(() => {
      result.current.setName('Test Name');
      result.current.setBrand('Test Brand');
      result.current.setExpirationDate('2026-07-01');
      result.current.setIsEditMode(true);
      result.current.setOriginalProductId('prod-123');
    });

    expect(result.current.name).toBe('Test Name');
    expect(result.current.isEditMode).toBe(true);

    // Clear form
    act(() => {
      result.current.clearForm();
    });

    // Verifica reset
    expect(result.current.name).toBe('');
    expect(result.current.brand).toBe('');
    expect(result.current.expirationDate).toBe('');
    expect(result.current.isEditMode).toBe(false);
    expect(result.current.originalProductId).toBeNull();
    expect(result.current.hasManuallySelectedCategory).toBe(false);
    expect(result.current.isInitialized).toBe(true);
    expect(result.current.imageUrl).toBeNull();
    expect(result.current.isFrozen).toBe(false);
    expect(result.current.quantities).toHaveLength(1);
  });

  // Test 16: initializeForm with product data
  it('should initialize form with product data', () => {
    const { result } = renderHook(() => useManualEntry(), {
      wrapper: ManualEntryProvider,
    });

    act(() => {
      result.current.initializeForm({ product: mockProduct });
    });

    expect(result.current.name).toBe('Latte');
    expect(result.current.brand).toBe('Parmalat');
    expect(result.current.selectedCategory).toBe('dairy');
    expect(result.current.barcode).toBe('8001234567890');
    expect(result.current.notes).toBe('Da consumare entro');
    expect(result.current.expirationDate).toBe('2026-06-15');
    expect(result.current.purchaseDate).toBe('2026-05-01');
    expect(result.current.imageUrl).toBe('https://example.com/latte.jpg');
    expect(result.current.isFrozen).toBe(false);
    expect(result.current.isEditMode).toBe(false);
    expect(result.current.isInitialized).toBe(true);
  });

  // Test 17: initializeForm with scanned data (barcode)
  it('should initialize form with scanned data', () => {
    const { result } = renderHook(() => useManualEntry(), {
      wrapper: ManualEntryProvider,
    });

    act(() => {
      result.current.initializeForm({
        barcode: '8009999999999',
        name: 'Pasta',
        brand: 'Barilla',
        category: 'pasta',
        quantity: '500',
        unit: 'g',
      });
    });

    expect(result.current.name).toBe('Pasta');
    expect(result.current.brand).toBe('Barilla');
    expect(result.current.selectedCategory).toBe('pasta');
    expect(result.current.barcode).toBe('8009999999999');
    expect(result.current.quantities).toHaveLength(1);
    expect(result.current.quantities[0].quantity).toBe('500');
    expect(result.current.quantities[0].unit).toBe('g');
    expect(result.current.isInitialized).toBe(true);
  });

  // Test 18: initializeForm with edit mode
  it('should initialize form in edit mode', () => {
    const { result } = renderHook(() => useManualEntry(), {
      wrapper: ManualEntryProvider,
    });

    act(() => {
      result.current.initializeForm({
        product: mockProduct,
        isEditMode: true,
        originalProductId: 'prod-1',
      });
    });

    expect(result.current.name).toBe('Latte');
    expect(result.current.isEditMode).toBe(true);
    expect(result.current.originalProductId).toBe('prod-1');
    expect(result.current.isInitialized).toBe(true);
  });

  // Test 19: initializeForm without data clears form
  it('should clear form when initializeForm is called without data', () => {
    const { result } = renderHook(() => useManualEntry(), {
      wrapper: ManualEntryProvider,
    });

    // Popola prima
    act(() => {
      result.current.setName('Something');
    });
    expect(result.current.name).toBe('Something');

    // Initialize senza dati
    act(() => {
      result.current.initializeForm({});
    });

    // Dovrebbe resettare
    expect(result.current.name).toBe('');
    expect(result.current.isInitialized).toBe(true);
  });

  // Test 20: Meta state - setIsEditMode
  it('should update isEditMode via setIsEditMode', () => {
    const { result } = renderHook(() => useManualEntry(), {
      wrapper: ManualEntryProvider,
    });

    expect(result.current.isEditMode).toBe(false);

    act(() => {
      result.current.setIsEditMode(true);
    });

    expect(result.current.isEditMode).toBe(true);

    act(() => {
      result.current.setIsEditMode(false);
    });

    expect(result.current.isEditMode).toBe(false);
  });

  // Test 21: Meta state - setIsInitialized
  it('should update isInitialized via setIsInitialized', () => {
    const { result } = renderHook(() => useManualEntry(), {
      wrapper: ManualEntryProvider,
    });

    expect(result.current.isInitialized).toBe(false);

    act(() => {
      result.current.setIsInitialized(true);
    });

    expect(result.current.isInitialized).toBe(true);
  });

  // Test 22: Meta state - setOriginalProductId
  it('should update originalProductId via setOriginalProductId', () => {
    const { result } = renderHook(() => useManualEntry(), {
      wrapper: ManualEntryProvider,
    });

    expect(result.current.originalProductId).toBeNull();

    act(() => {
      result.current.setOriginalProductId('prod-99');
    });

    expect(result.current.originalProductId).toBe('prod-99');

    act(() => {
      result.current.setOriginalProductId(null);
    });

    expect(result.current.originalProductId).toBeNull();
  });

  // Test 23: Meta state - setHasManuallySelectedCategory
  it('should update hasManuallySelectedCategory via setHasManuallySelectedCategory', () => {
    const { result } = renderHook(() => useManualEntry(), {
      wrapper: ManualEntryProvider,
    });

    expect(result.current.hasManuallySelectedCategory).toBe(false);

    act(() => {
      result.current.setHasManuallySelectedCategory(true);
    });

    expect(result.current.hasManuallySelectedCategory).toBe(true);
  });

  // Test 24: Rendering con componenti e interazione via bottoni
  it('should update fields when buttons are pressed', () => {
    const { getByTestId } = render(
      <ManualEntryProvider>
        <TestComponent />
      </ManualEntryProvider>
    );

    // Verifica stato iniziale
    expect(getByTestId('field-name').props.children).toBe('');
    expect(getByTestId('field-quantities-count').props.children).toBe('1');

    // Interagisci con i bottoni
    act(() => {
      getByTestId('btn-setName').props.onPress();
    });
    expect(getByTestId('field-name').props.children).toBe('Test Name');

    act(() => {
      getByTestId('btn-setBrand').props.onPress();
    });
    expect(getByTestId('field-brand').props.children).toBe('Test Brand');

    act(() => {
      getByTestId('btn-setIsEditMode').props.onPress();
    });
    expect(getByTestId('field-isEditMode').props.children).toBe('true');

    act(() => {
      getByTestId('btn-addQuantity').props.onPress();
    });
    expect(getByTestId('field-quantities-count').props.children).toBe('2');

    act(() => {
      getByTestId('btn-clearForm').props.onPress();
    });
    expect(getByTestId('field-quantities-count').props.children).toBe('1');
    expect(getByTestId('field-name').props.children).toBe('');
  });

  // Test 25: useManualEntry throws error outside provider
  it('should throw when useManualEntry is used outside provider', () => {
    // Sopprime gli errori di console per questo test atteso
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useManualEntry())).toThrow(
      'useManualEntry must be used within a ManualEntryProvider'
    );

    spy.mockRestore();
  });

  // Test 26: setIsFrozen toggles back to false
  it('should toggle isFrozen from true to false', () => {
    const { result } = renderHook(() => useManualEntry(), {
      wrapper: ManualEntryProvider,
    });

    act(() => {
      result.current.setIsFrozen(true);
    });
    expect(result.current.isFrozen).toBe(true);

    act(() => {
      result.current.setIsFrozen(false);
    });
    expect(result.current.isFrozen).toBe(false);
  });

  // Test 27: setImageUrl can set to null
  it('should set imageUrl to null', () => {
    const { result } = renderHook(() => useManualEntry(), {
      wrapper: ManualEntryProvider,
    });

    act(() => {
      result.current.setImageUrl('https://example.com/img.jpg');
    });
    expect(result.current.imageUrl).toBe('https://example.com/img.jpg');

    act(() => {
      result.current.setImageUrl(null);
    });
    expect(result.current.imageUrl).toBeNull();
  });
});
