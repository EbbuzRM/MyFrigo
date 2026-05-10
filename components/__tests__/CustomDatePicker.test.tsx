// CustomDatePicker.test.tsx — CustomDatePicker.test module.
//
// exports: none
// used_by: none
// rules:   none

import React from 'react';
import { Platform } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { CustomDatePicker } from '../CustomDatePicker';

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

jest.mock('@/utils/dateUtils', () => ({
  toLocalISOString: (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: any) =>
      React.createElement(View, {
        ...props,
      }),
    DateTimePickerEvent: {},
  };
});

jest.mock('react-native-calendars', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    Calendar: (props: any) =>
      React.createElement(View, { testID: 'calendar' }, [
        React.createElement(TouchableOpacity, {
          key: 'day1',
          testID: 'calendar-day-press',
          onPress: () => props.onDayPress && props.onDayPress({ dateString: '2026-06-20' }),
        }, [
          React.createElement(Text, { key: 'text' }, 'CalendarDay'),
        ]),
      ]),
  };
});

describe('CustomDatePicker', () => {
  const defaultProps = {
    value: new Date('2026-06-15'),
    onChange: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Web Platform', () => {
    beforeAll(() => {
      Object.defineProperty(Platform, 'OS', { get: () => 'web', configurable: true });
    });

    afterAll(() => {
      Object.defineProperty(Platform, 'OS', { get: () => 'ios', configurable: true });
    });

    it('renders Calendar component on web', () => {
      const { getByTestId } = render(<CustomDatePicker {...defaultProps} />);
      expect(getByTestId('calendar')).toBeTruthy();
    });

    it('renders modal title "Select Date"', () => {
      const { getByText } = render(<CustomDatePicker {...defaultProps} />);
      expect(getByText('Select Date')).toBeTruthy();
    });

    it('renders Close button', () => {
      const { getByText } = render(<CustomDatePicker {...defaultProps} />);
      expect(getByText('Close')).toBeTruthy();
    });

    it('calls onClose when Close button is pressed', () => {
      const onClose = jest.fn();
      const { getByText } = render(
        <CustomDatePicker {...defaultProps} onClose={onClose} />
      );
      fireEvent.press(getByText('Close'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onChange when a day is pressed in Calendar', () => {
      const onChange = jest.fn();
      const { getByText } = render(
        <CustomDatePicker {...defaultProps} onChange={onChange} />
      );
      fireEvent.press(getByText('CalendarDay'));
      expect(onChange).toHaveBeenCalled();
    });

    it('renders correctly in dark mode', () => {
      mockTheme.isDarkMode = true;
      const { getByText } = render(<CustomDatePicker {...defaultProps} />);
      expect(getByText('Select Date')).toBeTruthy();
      mockTheme.isDarkMode = false;
    });
  });

  describe('Mobile Platform', () => {
    beforeAll(() => {
      Object.defineProperty(Platform, 'OS', { get: () => 'ios', configurable: true });
    });

    it('renders DateTimePicker on mobile', () => {
      const { getByTestId } = render(<CustomDatePicker {...defaultProps} />);
      expect(getByTestId('dateTimePicker')).toBeTruthy();
    });

    it('passes value prop to DateTimePicker', () => {
      const { getByTestId } = render(<CustomDatePicker {...defaultProps} />);
      const picker = getByTestId('dateTimePicker');
      expect(picker.props.value).toEqual(defaultProps.value);
    });

    it('passes mode="date" to DateTimePicker', () => {
      const { getByTestId } = render(<CustomDatePicker {...defaultProps} />);
      const picker = getByTestId('dateTimePicker');
      expect(picker.props.mode).toBe('date');
    });

    it('passes minimumDate when provided', () => {
      const minDate = new Date('2026-01-01');
      const { getByTestId } = render(
        <CustomDatePicker {...defaultProps} minimumDate={minDate} />
      );
      const picker = getByTestId('dateTimePicker');
      expect(picker.props.minimumDate).toEqual(minDate);
    });

    it('passes maximumDate when provided', () => {
      const maxDate = new Date('2026-12-31');
      const { getByTestId } = render(
        <CustomDatePicker {...defaultProps} maximumDate={maxDate} />
      );
      const picker = getByTestId('dateTimePicker');
      expect(picker.props.maximumDate).toEqual(maxDate);
    });

    it('passes onChange handler to DateTimePicker', () => {
      const { getByTestId } = render(<CustomDatePicker {...defaultProps} />);
      const picker = getByTestId('dateTimePicker');
      expect(picker.props.onChange).toBe(defaultProps.onChange);
    });

    it('passes display="default" to DateTimePicker', () => {
      const { getByTestId } = render(<CustomDatePicker {...defaultProps} />);
      const picker = getByTestId('dateTimePicker');
      expect(picker.props.display).toBe('default');
    });
  });
});
