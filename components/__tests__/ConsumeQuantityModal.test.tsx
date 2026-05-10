// ConsumeQuantityModal.test.tsx — ConsumeQuantityModal.test module.
//
// exports: none
// used_by: none
// rules:   none

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ConsumeQuantityModal } from '../ConsumeQuantityModal';
import { Product } from '@/types/Product';

const mockTheme = {
  isDarkMode: false,
  toggleTheme: jest.fn(),
};

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => mockTheme,
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    initialize: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/hooks/useQuantityCalculation', () => ({
  useQuantityCalculation: (_quantities: any) => ({
    totalQuantity: 5,
    unit: 'pz',
    hasPz: true,
    hasConf: false,
    quantities: [{ quantity: 5, unit: 'pz' }],
    validateInput: (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return { isValid: false, error: 'Inserisci una quantità.' };
      const num = parseInt(trimmed, 10);
      if (isNaN(num)) return { isValid: false, error: 'Inserisci un numero valido.' };
      if (num < 1) return { isValid: false, error: 'La quantità deve essere almeno 1.' };
      if (num > 5) return { isValid: false, error: 'Inserisci un numero tra 1 e 5 (pz).' };
      return { isValid: true, error: '' };
    },
  }),
}));

jest.mock('../ConsumeQuantityModal.styles', () => ({
  getConsumeQuantityModalStyles: (_isDarkMode: boolean) => ({
    overlay: {},
    modalContainer: {},
    modalContent: {},
    header: {},
    title: {},
    closeButton: {},
    description: {},
    inputContainer: {},
    input: {},
    error: {},
    buttonsContainer: {},
    button: {},
    cancelButton: {},
    confirmButton: {},
    confirmButtonDisabled: {},
    buttonText: {},
    cancelButtonText: {},
  }),
}));

jest.mock('../QuantityInput', () => {
  const React = require('react');
  const { TextInput } = require('react-native');
  return {
    QuantityInput: (props: any) =>
      React.createElement(TextInput, {
        testID: 'quantity-input',
        value: props.value,
        onChangeText: props.onChangeText,
        placeholder: 'Quantità',
      }),
  };
});

jest.mock('../QuantityValidationMessage', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    QuantityValidationMessage: (props: any) =>
      props.error
        ? React.createElement(Text, { testID: 'validation-message' }, props.error)
        : null,
  };
});

jest.mock('../ConsumeActions', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    ConsumeActions: (props: any) =>
      React.createElement(View, { testID: 'consume-actions' }, [
        React.createElement(
          TouchableOpacity,
          { key: 'cancel', testID: 'cancel-button', onPress: props.onCancel },
          React.createElement(Text, null, 'Annulla')
        ),
        React.createElement(
          TouchableOpacity,
          { key: 'confirm', testID: 'confirm-button', onPress: props.onConfirm, disabled: props.isConfirmDisabled },
          React.createElement(Text, null, 'Conferma')
        ),
      ]),
  };
});

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    X: () => React.createElement(Text, { testID: 'x-icon' }, 'X'),
    Info: () => React.createElement(Text, { testID: 'info-icon' }, 'Info'),
  };
});

describe('ConsumeQuantityModal', () => {
  const mockProduct: Product = {
    id: '1',
    name: 'Latte',
    category: 'dairy',
    quantities: [{ quantity: 5, unit: 'pz' }],
    purchaseDate: '2026-01-01',
    expirationDate: '2026-06-01',
    status: 'active',
    addedMethod: 'manual',
  };

  const defaultProps = {
    visible: true,
    product: mockProduct,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal when visible is true', () => {
    const { getByText } = render(<ConsumeQuantityModal {...defaultProps} />);
    expect(getByText(/Consuma Latte/)).toBeTruthy();
  });

  it('returns null when visible is false', () => {
    const { queryByText } = render(
      <ConsumeQuantityModal {...defaultProps} visible={false} />
    );
    expect(queryByText(/Consuma Latte/)).toBeNull();
  });

  it('displays the product name in the title', () => {
    const { getByText } = render(<ConsumeQuantityModal {...defaultProps} />);
    expect(getByText('Consuma Latte')).toBeTruthy();
  });

  it('displays total quantity available in description', () => {
    const { getByText } = render(<ConsumeQuantityModal {...defaultProps} />);
    expect(getByText(/5 pz disponibili/)).toBeTruthy();
  });

  it('renders the quantity input', () => {
    const { getByTestId } = render(<ConsumeQuantityModal {...defaultProps} />);
    expect(getByTestId('quantity-input')).toBeTruthy();
  });

  it('renders the consume actions', () => {
    const { getByTestId } = render(<ConsumeQuantityModal {...defaultProps} />);
    expect(getByTestId('consume-actions')).toBeTruthy();
  });

  it('renders the close button (X icon)', () => {
    const { getByTestId } = render(<ConsumeQuantityModal {...defaultProps} />);
    expect(getByTestId('x-icon')).toBeTruthy();
  });

  it('renders the info icon', () => {
    const { getByTestId } = render(<ConsumeQuantityModal {...defaultProps} />);
    expect(getByTestId('info-icon')).toBeTruthy();
  });

  it('calls onCancel when cancel button is pressed', () => {
    const onCancel = jest.fn();
    const { getByTestId } = render(
      <ConsumeQuantityModal {...defaultProps} onCancel={onCancel} />
    );
    fireEvent.press(getByTestId('cancel-button'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders correctly in dark mode', () => {
    mockTheme.isDarkMode = true;
    const { getByText } = render(<ConsumeQuantityModal {...defaultProps} />);
    expect(getByText(/Consuma Latte/)).toBeTruthy();
    mockTheme.isDarkMode = false;
  });
});
