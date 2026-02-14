import React from 'react';
import { Text, Pressable } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/context/ThemeContext';
import { QuantityButton } from '../QuantityButton';

const mockTheme = {
  isDarkMode: false,
  toggleTheme: jest.fn(),
};

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => mockTheme,
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../AnimatedPressable', () => {
  const React = require('react');
  const { Pressable } = require('react-native');
  const mockFn = (props: any) => {
    return React.createElement(Pressable, {
      testID: "animated-pressable",
      onPress: props.disabled ? undefined : props.onPress,
      style: props.style,
      accessibilityRole: props.accessibilityRole,
      accessibilityLabel: props.accessibilityLabel,
      accessibilityState: { disabled: props.disabled }
    }, props.children);
  };
  return { AnimatedPressable: mockFn };
});

describe('QuantityButton', () => {
  it('renders increment button correctly', () => {
    const { getByText } = render(
      <ThemeProvider>
        <QuantityButton operation="increment" onPress={jest.fn()} />
      </ThemeProvider>
    );

    expect(getByText('+')).toBeTruthy();
  });

  it('renders decrement button correctly', () => {
    const { getByText } = render(
      <ThemeProvider>
        <QuantityButton operation="decrement" onPress={jest.fn()} />
      </ThemeProvider>
    );

    expect(getByText('-')).toBeTruthy();
  });

  it('calls onPress when increment button is pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <ThemeProvider>
        <QuantityButton operation="increment" onPress={onPress} />
      </ThemeProvider>
    );

    fireEvent.press(getByText('+'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('calls onPress when decrement button is pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <ThemeProvider>
        <QuantityButton operation="decrement" onPress={onPress} />
      </ThemeProvider>
    );

    fireEvent.press(getByText('-'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <ThemeProvider>
        <QuantityButton operation="increment" onPress={onPress} disabled={true} />
      </ThemeProvider>
    );

    fireEvent.press(getByText('+'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('has correct accessibility labels', () => {
    const { getByLabelText } = render(
      <ThemeProvider>
        <QuantityButton operation="increment" onPress={jest.fn()} />
      </ThemeProvider>
    );

    expect(getByLabelText('Aumenta quantità')).toBeTruthy();
  });

  it('has correct accessibility labels for decrement', () => {
    const { getByLabelText } = render(
      <ThemeProvider>
        <QuantityButton operation="decrement" onPress={jest.fn()} />
      </ThemeProvider>
    );

    expect(getByLabelText('Diminuisci quantità')).toBeTruthy();
  });
});
