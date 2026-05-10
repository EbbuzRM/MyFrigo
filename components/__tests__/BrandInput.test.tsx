// BrandInput.test.tsx — BrandInput.test module.
//
// exports: none
// used_by: none
// rules:   none

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BrandInput from '../BrandInput';

const mockTheme = {
  isDarkMode: false,
  toggleTheme: jest.fn(),
};

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => mockTheme,
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../ProductFormHeader.styles', () => ({
  getInputStyles: (_isDarkMode: boolean) => ({
    input: {
      borderWidth: 1,
      borderColor: '#cbd5e1',
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      fontSize: 16,
      backgroundColor: '#ffffff',
      color: '#1e293b',
    },
    disabledInput: {},
    placeholder: {
      color: '#64748b',
    },
  }),
}));

describe('BrandInput', () => {
  const defaultProps = {
    value: '',
    onChangeText: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the "Marca" label', () => {
    const { getByText } = render(<BrandInput {...defaultProps} />);
    expect(getByText('Marca')).toBeTruthy();
  });

  it('renders the text input', () => {
    const { getByTestId } = render(<BrandInput {...defaultProps} />);
    expect(getByTestId('brand-input')).toBeTruthy();
  });

  it('displays the current value', () => {
    const { getByTestId } = render(
      <BrandInput {...defaultProps} value="Granarolo" />
    );
    const input = getByTestId('brand-input');
    expect(input.props.value).toBe('Granarolo');
  });

  it('calls onChangeText when text changes', () => {
    const onChangeText = jest.fn();
    const { getByTestId } = render(
      <BrandInput {...defaultProps} onChangeText={onChangeText} />
    );
    fireEvent.changeText(getByTestId('brand-input'), 'Barilla');
    expect(onChangeText).toHaveBeenCalledWith('Barilla');
  });

  it('uses default placeholder "Es. Granarolo"', () => {
    const { getByPlaceholderText } = render(<BrandInput {...defaultProps} />);
    expect(getByPlaceholderText('Es. Granarolo')).toBeTruthy();
  });

  it('uses custom placeholder when provided', () => {
    const { getByPlaceholderText } = render(
      <BrandInput {...defaultProps} placeholder="Es. Barilla" />
    );
    expect(getByPlaceholderText('Es. Barilla')).toBeTruthy();
  });

  it('has default accessibility label "Product brand input"', () => {
    const { getByLabelText } = render(<BrandInput {...defaultProps} />);
    expect(getByLabelText('Product brand input')).toBeTruthy();
  });

  it('uses custom accessibility label when provided', () => {
    const { getByLabelText } = render(
      <BrandInput {...defaultProps} accessibilityLabel="Campo marca" />
    );
    expect(getByLabelText('Campo marca')).toBeTruthy();
  });

  it('has default testID "brand-input"', () => {
    const { getByTestId } = render(<BrandInput {...defaultProps} />);
    expect(getByTestId('brand-input')).toBeTruthy();
  });

  it('uses custom testID when provided', () => {
    const { getByTestId } = render(
      <BrandInput {...defaultProps} testID="custom-brand-input" />
    );
    expect(getByTestId('custom-brand-input')).toBeTruthy();
  });

  it('renders correctly in dark mode', () => {
    mockTheme.isDarkMode = true;
    const { getByText, getByTestId } = render(<BrandInput {...defaultProps} />);
    expect(getByText('Marca')).toBeTruthy();
    expect(getByTestId('brand-input')).toBeTruthy();
    mockTheme.isDarkMode = false;
  });

  it('sets autoCapitalize to "words"', () => {
    const { getByTestId } = render(<BrandInput {...defaultProps} />);
    const input = getByTestId('brand-input');
    expect(input.props.autoCapitalize).toBe('words');
  });

  it('sets maxLength to 50', () => {
    const { getByTestId } = render(<BrandInput {...defaultProps} />);
    const input = getByTestId('brand-input');
    expect(input.props.maxLength).toBe(50);
  });
});
