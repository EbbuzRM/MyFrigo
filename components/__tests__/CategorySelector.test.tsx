// CategorySelector.test.tsx — CategorySelector.test module.
//
// exports: none
// used_by: none
// rules:   none

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CategorySelector from '../CategorySelector';

const mockTheme = {
  isDarkMode: false,
  toggleTheme: jest.fn(),
};

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => mockTheme,
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('CategorySelector', () => {
  const defaultProps = {
    selectedCategory: 'Alimentari',
    onSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default label "Categoria"', () => {
    const { getByText } = render(<CategorySelector {...defaultProps} />);
    expect(getByText('Categoria')).toBeTruthy();
  });

  it('renders with custom label', () => {
    const { getByText } = render(
      <CategorySelector {...defaultProps} label="Scegli" />
    );
    expect(getByText('Scegli')).toBeTruthy();
  });

  it('renders default categories when none provided', () => {
    const { getByText } = render(<CategorySelector {...defaultProps} />);
    expect(getByText('Alimentari')).toBeTruthy();
    expect(getByText('Bevande')).toBeTruthy();
    expect(getByText('Latticini')).toBeTruthy();
  });

  it('renders custom categories', () => {
    const customCategories = ['Food', 'Drink', 'Snack'];
    const { getByText, queryByText } = render(
      <CategorySelector {...defaultProps} categories={customCategories} />
    );
    expect(getByText('Food')).toBeTruthy();
    expect(getByText('Drink')).toBeTruthy();
    expect(getByText('Snack')).toBeTruthy();
    expect(queryByText('Alimentari')).toBeNull();
  });

  it('calls onSelect when a category chip is pressed', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <CategorySelector {...defaultProps} onSelect={onSelect} />
    );
    fireEvent.press(getByText('Bevande'));
    expect(onSelect).toHaveBeenCalledWith('Bevande');
  });

  it('marks the selected category chip with selected accessibility state', () => {
    const { getByTestId } = render(
      <CategorySelector {...defaultProps} selectedCategory="Bevande" />
    );
    const bevandeButton = getByTestId('category-selector-chip-Bevande');
    expect(bevandeButton.props.accessibilityState?.selected).toBe(true);
  });

  it('marks non-selected categories as not selected', () => {
    const { getByTestId } = render(
      <CategorySelector {...defaultProps} selectedCategory="Bevande" />
    );
    const alimentariButton = getByTestId('category-selector-chip-Alimentari');
    expect(alimentariButton.props.accessibilityState?.selected).toBe(false);
  });

  it('renders with custom accessibility label', () => {
    const { getByLabelText } = render(
      <CategorySelector
        {...defaultProps}
        accessibilityLabel="Selettore categoria prodotto"
      />
    );
    expect(getByLabelText('Selettore categoria prodotto')).toBeTruthy();
  });

  it('renders with default testID', () => {
    const { getByTestId } = render(<CategorySelector {...defaultProps} />);
    expect(getByTestId('category-selector')).toBeTruthy();
  });

  it('renders with custom testID', () => {
    const { getByTestId } = render(
      <CategorySelector {...defaultProps} testID="custom-selector" />
    );
    expect(getByTestId('custom-selector')).toBeTruthy();
  });

  it('renders chip testIDs for each category', () => {
    const categories = ['A', 'B'];
    const { getByTestId } = render(
      <CategorySelector {...defaultProps} categories={categories} testID="sel" />
    );
    expect(getByTestId('sel-chip-A')).toBeTruthy();
    expect(getByTestId('sel-chip-B')).toBeTruthy();
  });

  it('renders correctly in dark mode', () => {
    mockTheme.isDarkMode = true;
    const { getByText } = render(<CategorySelector {...defaultProps} />);
    expect(getByText('Categoria')).toBeTruthy();
    expect(getByText('Alimentari')).toBeTruthy();
    mockTheme.isDarkMode = false;
  });
});
