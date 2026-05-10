// AnimatedTabItem.test.tsx — AnimatedTabItem.test module.
//
// exports: none
// used_by: none
// rules:   none

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AnimatedTabItem from '../AnimatedTabItem';

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

jest.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View: (props: any) => React.createElement(View, props, props.children),
    },
    useSharedValue: (initial: any) => ({ value: initial }),
    useAnimatedStyle: (cb: any) => ({}),
    withSpring: (toValue: any, config?: any) => toValue,
    useAnimatedProps: (cb: any) => ({}),
    runOnJS: (fn: any) => fn,
    useAnimatedReaction: jest.fn(),
    useDerivedValue: (cb: any) => ({ value: cb() }),
    interpolate: jest.fn(),
    Extrapolation: { CLAMP: 'clamp' },
  };
});

describe('AnimatedTabItem', () => {
  const mockTabBarIcon = jest.fn(({ focused, color, size }) => null);

  const defaultProps = {
    route: { key: 'Home', name: 'index' },
    index: 0,
    isFocused: true,
    label: 'Home',
    onPress: jest.fn(),
    onLongPress: jest.fn(),
    tabBarIcon: mockTabBarIcon,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the tab label', () => {
    const { getByText } = render(<AnimatedTabItem {...defaultProps} />);
    expect(getByText('Home')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AnimatedTabItem {...defaultProps} onPress={onPress} />
    );
    // Press on the label's parent which is the Pressable
    fireEvent.press(getByText('Home'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('calls onLongPress when long pressed', () => {
    const onLongPress = jest.fn();
    const { getByText } = render(
      <AnimatedTabItem {...defaultProps} onLongPress={onLongPress} />
    );
    fireEvent(getByText('Home'), 'onLongPress');
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('has accessibilityRole "button" on the Pressable', () => {
    const { getByText } = render(<AnimatedTabItem {...defaultProps} />);
    const label = getByText('Home');
    // Tree: Pressable > View (Animated.View mock) > Text
    // label.parent = View, label.parent.parent = Pressable
    const pressable = label.parent?.parent;
    expect(pressable?.props.accessibilityRole).toBe('button');
  });

  it('has accessibilityState selected when focused', () => {
    const { getByText } = render(
      <AnimatedTabItem {...defaultProps} isFocused={true} />
    );
    const label = getByText('Home');
    const pressable = label.parent?.parent;
    expect(pressable?.props.accessibilityState?.selected).toBe(true);
  });

  it('has accessibilityState not selected when not focused', () => {
    const { getByText } = render(
      <AnimatedTabItem {...defaultProps} isFocused={false} />
    );
    const label = getByText('Home');
    const pressable = label.parent?.parent;
    expect(pressable?.props.accessibilityState?.selected).toBe(false);
  });

  it('uses tabBarAccessibilityLabel when provided', () => {
    const { getByLabelText } = render(
      <AnimatedTabItem {...defaultProps} tabBarAccessibilityLabel="Home tab" />
    );
    expect(getByLabelText('Home tab')).toBeTruthy();
  });

  it('uses tabBarTestID when provided', () => {
    const { getByTestId } = render(
      <AnimatedTabItem {...defaultProps} tabBarTestID="home-tab" />
    );
    expect(getByTestId('home-tab')).toBeTruthy();
  });

  it('calls tabBarIcon with focused, color, and size', () => {
    render(<AnimatedTabItem {...defaultProps} isFocused={true} />);
    expect(mockTabBarIcon).toHaveBeenCalledWith({
      focused: true,
      color: '#2563EB',
      size: 24,
    });
  });

  it('passes grey color when not focused', () => {
    const iconFn = jest.fn(() => null);
    render(
      <AnimatedTabItem {...defaultProps} isFocused={false} tabBarIcon={iconFn} />
    );
    expect(iconFn).toHaveBeenCalledWith(
      expect.objectContaining({ color: '#64748B' })
    );
  });

  it('renders without tabBarIcon', () => {
    const { getByText } = render(
      <AnimatedTabItem {...defaultProps} tabBarIcon={undefined} />
    );
    expect(getByText('Home')).toBeTruthy();
  });

  it('renders correctly in dark mode', () => {
    mockTheme.isDarkMode = true;
    const { getByText } = render(<AnimatedTabItem {...defaultProps} />);
    expect(getByText('Home')).toBeTruthy();
    mockTheme.isDarkMode = false;
  });
});
