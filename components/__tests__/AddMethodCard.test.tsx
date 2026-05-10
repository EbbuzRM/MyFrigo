// AddMethodCard.test.tsx — AddMethodCard.test module.
//
// exports: none
// used_by: none
// rules:   none

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AddMethodCard } from '../AddMethodCard';

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
  },
}));

jest.mock('@/utils/accessibility', () => ({
  getAnimatedPressableAccessibilityProps: (label: string, hint: string) => ({
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityRole: 'button',
    accessible: true,
  }),
}));

jest.mock('../AnimatedPressable', () => {
  const React = require('react');
  const { Pressable } = require('react-native');
  const mockFn = (props: any) =>
    React.createElement(Pressable, {
      testID: props.testID || 'animated-pressable',
      onPress: props.onPress,
      accessibilityLabel: props.accessibilityProps?.accessibilityLabel,
      accessibilityHint: props.accessibilityProps?.accessibilityHint,
      accessibilityRole: props.accessibilityProps?.accessibilityRole || 'button',
      accessible: props.accessibilityProps?.accessible ?? true,
      style: props.style,
    }, props.children);
  return { AnimatedPressable: mockFn };
});

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    ChevronRight: (props: any) =>
      React.createElement(Text, { testID: 'chevron-icon' }, 'ChevronRight'),
    ScanBarcode: (props: any) =>
      React.createElement(Text, { testID: 'barcode-icon', ...props }, 'ScanBarcode'),
    PenLine: (props: any) =>
      React.createElement(Text, { testID: 'pen-icon', ...props }, 'PenLine'),
  };
});

describe('AddMethodCard', () => {
  const MockIcon = () => null;

  const barcodeProps = {
    title: 'Codice a barre',
    description: 'Scansiona il codice a barre del prodotto',
    icon: <MockIcon />,
    onPress: jest.fn(),
    variant: 'barcode' as const,
  };

  const manualProps = {
    title: 'Inserimento manuale',
    description: 'Inserisci i dati del prodotto manualmente',
    icon: <MockIcon />,
    onPress: jest.fn(),
    variant: 'manual' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders barcode variant with correct title', () => {
    const { getByText } = render(<AddMethodCard {...barcodeProps} />);
    expect(getByText('Codice a barre')).toBeTruthy();
  });

  it('renders barcode variant with correct description', () => {
    const { getByText } = render(<AddMethodCard {...barcodeProps} />);
    expect(getByText('Scansiona il codice a barre del prodotto')).toBeTruthy();
  });

  it('renders manual variant with correct title', () => {
    const { getByText } = render(<AddMethodCard {...manualProps} />);
    expect(getByText('Inserimento manuale')).toBeTruthy();
  });

  it('renders manual variant with correct description', () => {
    const { getByText } = render(<AddMethodCard {...manualProps} />);
    expect(getByText('Inserisci i dati del prodotto manualmente')).toBeTruthy();
  });

  it('renders chevron icon', () => {
    const { getByTestId } = render(<AddMethodCard {...barcodeProps} />);
    expect(getByTestId('chevron-icon')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <AddMethodCard {...barcodeProps} onPress={onPress} />
    );
    fireEvent.press(getByTestId('animated-pressable'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders with custom testID', () => {
    const { getByTestId } = render(
      <AddMethodCard {...barcodeProps} testID="add-barcode-card" />
    );
    expect(getByTestId('add-barcode-card')).toBeTruthy();
  });

  it('renders correctly in dark mode for barcode variant', () => {
    mockTheme.isDarkMode = true;
    const { getByText } = render(<AddMethodCard {...barcodeProps} />);
    expect(getByText('Codice a barre')).toBeTruthy();
    mockTheme.isDarkMode = false;
  });

  it('renders correctly in dark mode for manual variant', () => {
    mockTheme.isDarkMode = true;
    const { getByText } = render(<AddMethodCard {...manualProps} />);
    expect(getByText('Inserimento manuale')).toBeTruthy();
    mockTheme.isDarkMode = false;
  });

  it('has accessibility props for barcode variant', () => {
    const { getByRole } = render(<AddMethodCard {...barcodeProps} />);
    const button = getByRole('button');
    expect(button.props.accessibilityLabel).toBe('Codice a barre');
  });

  it('has accessibility hint describing the action', () => {
    const { getByRole } = render(<AddMethodCard {...barcodeProps} />);
    const button = getByRole('button');
    expect(button.props.accessibilityHint).toContain('scansionare');
  });
});
