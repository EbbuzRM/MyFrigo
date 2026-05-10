// AnimatedTabBar.test.tsx — AnimatedTabBar.test module.
//
// exports: none
// used_by: none
// rules:   none

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AnimatedTabBar from '../AnimatedTabBar';

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

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../AnimatedTabItem', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return {
    __esModule: true,
    default: (props: any) =>
      React.createElement(TouchableOpacity, {
        testID: props.tabBarTestID || `tab-item-${props.route.name}`,
        onPress: props.onPress,
        onLongPress: props.onLongPress,
        accessibilityLabel: props.tabBarAccessibilityLabel || props.label,
        accessibilityState: { selected: props.isFocused },
        accessibilityRole: 'button',
      }, [
        React.createElement(Text, { key: 'label' }, props.label),
      ]),
  };
});

describe('AnimatedTabBar', () => {
  const mockNavigation = {
    emit: jest.fn(() => ({ defaultPrevented: false })),
    navigate: jest.fn(),
    jumpTo: jest.fn(),
  };

  const mockState = {
    index: 0,
    routes: [
      { key: 'Home', name: 'index' },
      { key: 'Products', name: 'products' },
      { key: 'Settings', name: 'settings' },
    ],
  };

  const mockDescriptors = {
    Home: {
      options: { title: 'Home', tabBarIcon: jest.fn() },
    },
    Products: {
      options: { title: 'Prodotti', tabBarIcon: jest.fn() },
    },
    Settings: {
      options: { title: 'Impostazioni', tabBarIcon: jest.fn() },
    },
  };

  // Cast as any to satisfy complex BottomTabBarProps type
  const defaultProps = {
    state: mockState,
    descriptors: mockDescriptors,
    navigation: mockNavigation,
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the tab bar container', () => {
    const { getByTestId } = render(<AnimatedTabBar {...defaultProps} />);
    expect(getByTestId('tab-bar')).toBeTruthy();
  });

  it('renders all tab items', () => {
    const { getByText } = render(<AnimatedTabBar {...defaultProps} />);
    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Prodotti')).toBeTruthy();
    expect(getByText('Impostazioni')).toBeTruthy();
  });

  it('calls navigation when a non-focused tab is pressed', () => {
    const { getByText } = render(<AnimatedTabBar {...defaultProps} />);
    fireEvent.press(getByText('Prodotti'));
    // Navigation should be called (navigate or jumpTo)
    expect(mockNavigation.emit).toHaveBeenCalled();
  });

  it('skips tabs with href === null', () => {
    const descriptorsWithHidden = {
      ...mockDescriptors,
      Products: {
        options: { title: 'Prodotti', tabBarIcon: jest.fn(), href: null },
      },
    };
    const { queryByText } = render(
      <AnimatedTabBar {...{ ...defaultProps, descriptors: descriptorsWithHidden }} />
    );
    expect(queryByText('Prodotti')).toBeNull();
  });

  it('renders correctly in dark mode', () => {
    mockTheme.isDarkMode = true;
    const { getByTestId, getByText } = render(<AnimatedTabBar {...defaultProps} />);
    expect(getByTestId('tab-bar')).toBeTruthy();
    expect(getByText('Home')).toBeTruthy();
    mockTheme.isDarkMode = false;
  });

  it('uses route name as label when title is not defined', () => {
    const descriptorsNoTitle = {
      Home: { options: {} },
      Products: { options: {} },
      Settings: { options: {} },
    };
    const { getByText } = render(
      <AnimatedTabBar {...{ ...defaultProps, descriptors: descriptorsNoTitle }} />
    );
    expect(getByText('index')).toBeTruthy();
  });

  it('handles navigation error gracefully', () => {
    const navWithError = {
      emit: jest.fn(() => ({ defaultPrevented: false })),
      navigate: jest.fn(() => { throw new Error('Navigation failed'); }),
      jumpTo: undefined,
    };
    const { getByText } = render(
      <AnimatedTabBar {...{ ...defaultProps, navigation: navWithError }} />
    );
    // Should not throw even with navigation error
    expect(() => fireEvent.press(getByText('Prodotti'))).not.toThrow();
  });
});
