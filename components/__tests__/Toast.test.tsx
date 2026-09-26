import React from 'react';
import { Animated } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { Toast } from '../Toast';

const mockUseReducedMotion = jest.fn(() => false);

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

jest.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => mockUseReducedMotion(),
}));

describe('Toast', () => {
  beforeAll(() => {
    Object.defineProperty(Animated, 'Value', {
      configurable: true,
      value: jest.fn(() => ({ setValue: jest.fn(), stopAnimation: jest.fn() })),
    });
    Object.defineProperty(Animated, 'timing', {
      configurable: true,
      value: jest.fn(() => ({
        start: (callback?: Animated.EndCallback) => callback?.({ finished: true }),
        stop: jest.fn(),
        reset: jest.fn(),
      })),
    });
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('dismisses after the visible interval', () => {
    const onDismiss = jest.fn();
    render(<Toast message="Salvato" visible onDismiss={onDismiss} />);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('cancels the pending dismiss when unmounted', () => {
    const onDismiss = jest.fn();
    const { unmount } = render(<Toast message="Salvato" visible onDismiss={onDismiss} />);

    unmount();
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(onDismiss).not.toHaveBeenCalled();
  });
});
