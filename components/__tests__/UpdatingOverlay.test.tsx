// UpdatingOverlay.test.tsx — UpdatingOverlay.test module.
//
// exports: none
// used_by: none
// rules: none

import React from 'react';
import { render } from '@testing-library/react-native';
import { Animated, Easing } from 'react-native';
import { UpdatingOverlay } from '../UpdatingOverlay';

// Il mock globale di react-native (jest.setup.js) non espone Animated.Value/loop: li completiamo qui
const animated = Animated as unknown as Record<string, unknown>;
animated.Value = class {
  setValue = jest.fn();
  interpolate = jest.fn(() => 0);
};
animated.timing = jest.fn(() => ({ start: jest.fn(), stop: jest.fn() }));
animated.loop = jest.fn(() => ({ start: jest.fn(), stop: jest.fn() }));
const easing = Easing as unknown as Record<string, unknown>;
easing.inOut = jest.fn((fn: unknown) => fn);
easing.ease = jest.fn();

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    isDarkMode: false,
    colors: {
      textPrimary: '#000', textSecondary: '#666', primary: '#2563EB',
      error: '#f00', success: '#0f0', cardBackground: '#eee', background: '#fff',
    },
  }),
}));

describe('UpdatingOverlay', () => {
  it('shows the updating title when visible', () => {
    const { getByTestId, getByText } = render(<UpdatingOverlay visible />);

    expect(getByTestId('updating-overlay')).toBeTruthy();
    expect(getByText('Aggiornamento in corso')).toBeTruthy();
  });

  it('renders nothing when hidden', () => {
    const { queryByTestId } = render(<UpdatingOverlay visible={false} />);

    expect(queryByTestId('updating-overlay')).toBeNull();
  });
});
