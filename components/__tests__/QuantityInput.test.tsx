// QuantityInput.test.tsx — QuantityInput test module.
//
// exports: none
// used_by: none
// rules: none

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QuantityInput } from '../QuantityInput';

describe('QuantityInput', () => {
  const defaultProps = {
    value: '',
    onChangeText: jest.fn(),
    totalQuantity: 5,
    hasError: false,
    maxLength: 3,
    isDarkMode: false,
    inputStyle: { fontSize: 16, color: '#000' },
    containerStyle: { marginVertical: 8 },
    placeholderTextColor: '#999',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the TextInput', () => {
      const { getByTestId } = render(<QuantityInput {...defaultProps} />);

      const input = getByTestId('quantity-input');
      expect(input).toBeTruthy();
    });

    it('should display the current value', () => {
      const { getByTestId } = render(
        <QuantityInput {...defaultProps} value="3" />
      );

      const input = getByTestId('quantity-input');
      expect(input.props.value).toBe('3');
    });

    it('should set keyboardType to numeric', () => {
      const { getByTestId } = render(<QuantityInput {...defaultProps} />);

      const input = getByTestId('quantity-input');
      expect(input.props.keyboardType).toBe('numeric');
    });

    it('should have autoFocus enabled', () => {
      const { getByTestId } = render(<QuantityInput {...defaultProps} />);

      const input = getByTestId('quantity-input');
      expect(input.props.autoFocus).toBe(true);
    });

    it('should respect maxLength prop', () => {
      const { getByTestId } = render(
        <QuantityInput {...defaultProps} maxLength={2} />
      );

      const input = getByTestId('quantity-input');
      expect(input.props.maxLength).toBe(2);
    });
  });

  describe('Placeholder', () => {
    it('should show range placeholder when totalQuantity > 1', () => {
      const { getByTestId } = render(<QuantityInput {...defaultProps} />);

      const input = getByTestId('quantity-input');
      expect(input.props.placeholder).toBe('Es. 1-5');
    });

    it('should show single number placeholder when totalQuantity is 1', () => {
      const { getByTestId } = render(
        <QuantityInput {...defaultProps} totalQuantity={1} />
      );

      const input = getByTestId('quantity-input');
      expect(input.props.placeholder).toBe('1');
    });
  });

  describe('Input Validation', () => {
    it('should filter non-numeric characters', () => {
      const { getByTestId } = render(<QuantityInput {...defaultProps} />);

      const input = getByTestId('quantity-input');
      fireEvent.changeText(input, 'abc123');
      expect(defaultProps.onChangeText).toHaveBeenCalledWith('123');
    });

    it('should allow only digits', () => {
      const { getByTestId } = render(<QuantityInput {...defaultProps} />);

      const input = getByTestId('quantity-input');
      fireEvent.changeText(input, '42');
      expect(defaultProps.onChangeText).toHaveBeenCalledWith('42');
    });

    it('should handle empty string', () => {
      const { getByTestId } = render(<QuantityInput {...defaultProps} />);

      const input = getByTestId('quantity-input');
      fireEvent.changeText(input, '');
      expect(defaultProps.onChangeText).toHaveBeenCalledWith('');
    });

    it('should remove special characters entirely', () => {
      const { getByTestId } = render(<QuantityInput {...defaultProps} />);

      const input = getByTestId('quantity-input');
      fireEvent.changeText(input, '12.5');
      expect(defaultProps.onChangeText).toHaveBeenCalledWith('125');
    });
  });

  describe('Error State', () => {
    it('should show red border when hasError is true and light mode', () => {
      const { getByTestId } = render(
        <QuantityInput {...defaultProps} hasError={true} />
      );

      const input = getByTestId('quantity-input');
      expect(input.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ borderColor: '#ef4444' }),
        ])
      );
    });

    it('should show dark border when hasError is false and dark mode', () => {
      const { getByTestId } = render(
        <QuantityInput {...defaultProps} hasError={false} isDarkMode={true} />
      );

      const input = getByTestId('quantity-input');
      expect(input.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ borderColor: '#30363d' }),
        ])
      );
    });

    it('should show light border when hasError is false and light mode', () => {
      const { getByTestId } = render(
        <QuantityInput {...defaultProps} hasError={false} isDarkMode={false} />
      );

      const input = getByTestId('quantity-input');
      expect(input.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ borderColor: '#e2e8f0' }),
        ])
      );
    });
  });

  describe('Accessibility', () => {
    it('should have accessible prop', () => {
      const { getByTestId } = render(<QuantityInput {...defaultProps} />);

      const input = getByTestId('quantity-input');
      expect(input.props.accessible).toBe(true);
    });

    it('should have proper accessibilityLabel', () => {
      const { getByTestId } = render(<QuantityInput {...defaultProps} />);

      const input = getByTestId('quantity-input');
      expect(input.props.accessibilityLabel).toBe('Quantità da consumare');
    });

    it('should have proper accessibilityRole', () => {
      const { getByTestId } = render(<QuantityInput {...defaultProps} />);

      const input = getByTestId('quantity-input');
      expect(input.props.accessibilityRole).toBe('text');
    });
  });
});
