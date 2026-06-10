// manual-entry.test.tsx — ManualEntryScreen test module.
//
// exports: none
// used_by: none
// rules: none

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ManualEntryScreen from '../manual-entry';

// Override SafeAreaView mock to preserve testID
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children, style, testID, ...props }: any) =>
      React.createElement(View, { style, testID, ...props }, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// Mock ProductFormHeader
jest.mock('@/components/ProductFormHeader', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  const ProductFormHeader = (props: any) => (
    <View testID="product-form-header">
      <Text>ProductFormHeader</Text>
      <Text testID="header-name">{props.productData?.name}</Text>
      <Text testID="header-brand">{props.productData?.brand}</Text>
    </View>
  );
  return {
    __esModule: true,
    default: ProductFormHeader,
  };
});

// Mock ProductFormFooter
jest.mock('@/components/ProductFormFooter', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  const ProductFormFooter = (props: any) => (
    <View testID="product-form-footer">
      <Text>ProductFormFooter</Text>
      <Text testID="footer-name">{props.formData?.name}</Text>
      <TouchableOpacity
        testID="save-product-button"
        onPress={props.handleSaveProduct}
        accessibilityLabel="Salva prodotto"
        accessibilityRole="button"
      >
        <Text>Salva</Text>
      </TouchableOpacity>
    </View>
  );
  return {
    __esModule: true,
    default: ProductFormFooter,
  };
});

// Mock useProductForm
const mockHandleSaveProduct = jest.fn();
const mockHandleAddNewCategory = jest.fn();
const mockHandleCategoryChange = jest.fn();
const mockSetIsCategoryModalVisible = jest.fn();
const mockSetNewCategoryNameInput = jest.fn();
const mockSetName = jest.fn();
const mockSetBrand = jest.fn();
const mockSetIsFrozen = jest.fn();
const mockOnChangePurchaseDate = jest.fn();
const mockOnChangeExpirationDate = jest.fn();
const mockAddQuantity = jest.fn();
const mockRemoveQuantity = jest.fn();
const mockUpdateQuantity = jest.fn();
const mockSetNotes = jest.fn();

const createDefaultUseProductForm = () => ({
  name: '',
  setName: mockSetName,
  brand: '',
  setBrand: mockSetBrand,
  selectedCategory: '',
  quantities: [],
  addQuantity: mockAddQuantity,
  removeQuantity: mockRemoveQuantity,
  updateQuantity: mockUpdateQuantity,
  purchaseDate: '',
  expirationDate: '',
  notes: '',
  setNotes: mockSetNotes,
  barcode: '',
  imageUrl: null,
  isEditMode: false,
  originalProductId: null,
  isLoading: false,
  categoriesLoading: false,
  showPurchaseDatePicker: false,
  setShowPurchaseDatePicker: jest.fn(),
  showExpirationDatePicker: false,
  setShowExpirationDatePicker: jest.fn(),
  isCategoryModalVisible: false,
  setIsCategoryModalVisible: mockSetIsCategoryModalVisible,
  newCategoryNameInput: '',
  setNewCategoryNameInput: mockSetNewCategoryNameInput,
  navigatingToPhotoCapture: false,
  categories: [],
  categoryData: [],
  handleAddNewCategory: mockHandleAddNewCategory,
  handleCategoryChange: mockHandleCategoryChange,
  onChangePurchaseDate: mockOnChangePurchaseDate,
  onChangeExpirationDate: mockOnChangeExpirationDate,
  handleSaveProduct: mockHandleSaveProduct,
  isFrozen: false,
  setIsFrozen: mockSetIsFrozen,
  hasManuallySelectedCategory: false,
});

const mockUseProductForm = jest.fn(createDefaultUseProductForm);

jest.mock('@/hooks/useProductForm', () => ({
  useProductForm: () => mockUseProductForm(),
}));

// Mock LoggingService
jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    debug: jest.fn(),
  },
}));

// --- Helpers ---

const renderManualEntryScreen = () => render(<ManualEntryScreen />);

// --- Test Suite ---

describe('ManualEntryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseProductForm.mockImplementation(createDefaultUseProductForm);
  });

  // ── Rendering ──────────────────────────────────────────────────────

  describe('rendering', () => {
    it('should render the manual entry screen with testID', () => {
      const { getByTestId } = renderManualEntryScreen();
      expect(getByTestId('manual-entry-screen')).toBeTruthy();
    });

    it('should render ProductFormHeader', () => {
      const { getByTestId } = renderManualEntryScreen();
      expect(getByTestId('product-form-header')).toBeTruthy();
    });

    it('should render ProductFormFooter', () => {
      const { getByTestId } = renderManualEntryScreen();
      expect(getByTestId('product-form-footer')).toBeTruthy();
    });
  });

  // ── Loading State ──────────────────────────────────────────────────

  describe('loading state', () => {
    it('should show loading indicator when isLoading is true', () => {
      mockUseProductForm.mockReturnValue({
        ...createDefaultUseProductForm(),
        isLoading: true,
      });

      const { getByText } = renderManualEntryScreen();
      expect(getByText('Caricamento dati prodotto...')).toBeTruthy();
    });

    it('should show loading indicator when categoriesLoading is true', () => {
      mockUseProductForm.mockReturnValue({
        ...createDefaultUseProductForm(),
        categoriesLoading: true,
      });

      const { getByText } = renderManualEntryScreen();
      expect(getByText('Caricamento dati prodotto...')).toBeTruthy();
    });

    it('should NOT show loading content when not loading', () => {
      const { queryByText } = renderManualEntryScreen();
      expect(queryByText('Caricamento dati prodotto...')).toBeNull();
    });

    it('should render the screen normally when not loading', () => {
      const { getByTestId, getByText } = renderManualEntryScreen();
      expect(getByTestId('manual-entry-screen')).toBeTruthy();
      expect(getByText('ProductFormHeader')).toBeTruthy();
      expect(getByText('ProductFormFooter')).toBeTruthy();
    });
  });

  // ── New Category Modal ─────────────────────────────────────────────

  describe('new category modal', () => {
    it('should show the category modal when isCategoryModalVisible is true', () => {
      mockUseProductForm.mockReturnValue({
        ...createDefaultUseProductForm(),
        isCategoryModalVisible: true,
      });

      const { getByText } = renderManualEntryScreen();
      expect(getByText('Aggiungi Nuova Categoria')).toBeTruthy();
    });

    it('should render category name input in modal', () => {
      mockUseProductForm.mockReturnValue({
        ...createDefaultUseProductForm(),
        isCategoryModalVisible: true,
      });

      const { getByPlaceholderText } = renderManualEntryScreen();
      expect(getByPlaceholderText('Nome della nuova categoria')).toBeTruthy();
    });

    it('should call handleAddNewCategory when OK is pressed in modal', () => {
      mockUseProductForm.mockReturnValue({
        ...createDefaultUseProductForm(),
        isCategoryModalVisible: true,
        newCategoryNameInput: 'Nuova Cat',
      });

      const { getByText } = renderManualEntryScreen();
      act(() => {
        fireEvent.press(getByText('OK'));
      });

      expect(mockHandleAddNewCategory).toHaveBeenCalled();
    });

    it('should close modal when Annulla is pressed', () => {
      mockUseProductForm.mockReturnValue({
        ...createDefaultUseProductForm(),
        isCategoryModalVisible: true,
      });

      const { getByText } = renderManualEntryScreen();
      act(() => {
        fireEvent.press(getByText('Annulla'));
      });

      expect(mockSetIsCategoryModalVisible).toHaveBeenCalledWith(false);
    });
  });

  // ── Save Product ───────────────────────────────────────────────────

  describe('save product', () => {
    it('should call handleSaveProduct when save button is pressed', () => {
      const { getByTestId } = renderManualEntryScreen();
      act(() => {
        fireEvent.press(getByTestId('save-product-button'));
      });

      expect(mockHandleSaveProduct).toHaveBeenCalled();
    });
  });

  // ── Form Data Passthrough ──────────────────────────────────────────

  describe('form data passthrough', () => {
    it('should pass name to ProductFormHeader', () => {
      mockUseProductForm.mockReturnValue({
        ...createDefaultUseProductForm(),
        name: 'Latte',
      });

      const { getByTestId } = renderManualEntryScreen();
      expect(getByTestId('header-name').props.children).toBe('Latte');
    });

    it('should pass brand to ProductFormHeader', () => {
      mockUseProductForm.mockReturnValue({
        ...createDefaultUseProductForm(),
        brand: 'Brand X',
      });

      const { getByTestId } = renderManualEntryScreen();
      expect(getByTestId('header-brand').props.children).toBe('Brand X');
    });

    it('should pass name to ProductFormFooter', () => {
      mockUseProductForm.mockReturnValue({
        ...createDefaultUseProductForm(),
        name: 'Yogurt',
      });

      const { getByTestId } = renderManualEntryScreen();
      expect(getByTestId('footer-name').props.children).toBe('Yogurt');
    });
  });

  // ── Edit Mode ──────────────────────────────────────────────────────

  describe('edit mode', () => {
    it('should handle edit mode with originalProductId', () => {
      mockUseProductForm.mockReturnValue({
        ...createDefaultUseProductForm(),
        isEditMode: true,
        originalProductId: '123' as any,
        name: 'Prodotto Edit',
      });

      const { getByTestId } = renderManualEntryScreen();
      expect(getByTestId('manual-entry-screen')).toBeTruthy();
      expect(getByTestId('header-name').props.children).toBe('Prodotto Edit');
    });
  });

  // ── Edge Cases ─────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should render with barcode param', () => {
      mockUseProductForm.mockReturnValue({
        ...createDefaultUseProductForm(),
        barcode: '1234567890123',
      });

      const { getByTestId } = renderManualEntryScreen();
      expect(getByTestId('manual-entry-screen')).toBeTruthy();
    });

    it('should render with imageUrl', () => {
      mockUseProductForm.mockReturnValue({
        ...createDefaultUseProductForm(),
        imageUrl: 'file://test-image.jpg' as any,
      });

      const { getByTestId } = renderManualEntryScreen();
      expect(getByTestId('manual-entry-screen')).toBeTruthy();
    });

    it('should render with isFrozen true', () => {
      mockUseProductForm.mockReturnValue({
        ...createDefaultUseProductForm(),
        isFrozen: true,
      });

      const { getByTestId } = renderManualEntryScreen();
      expect(getByTestId('manual-entry-screen')).toBeTruthy();
    });

    it('should render form with prefilled values', () => {
      mockUseProductForm.mockReturnValue({
        ...createDefaultUseProductForm(),
        name: 'Mozzarella',
        brand: 'LatteSano',
        selectedCategory: 'dairy',
        notes: 'Da consumare entro Natale',
      });

      const { getByTestId } = renderManualEntryScreen();
      expect(getByTestId('header-name').props.children).toBe('Mozzarella');
      expect(getByTestId('header-brand').props.children).toBe('LatteSano');
    });
  });
});
