// DiagnosticPanel.test.tsx — DiagnosticPanel.test module.
//
// exports: none
// used_by: none
// rules:   none

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { DiagnosticPanel } from '../DiagnosticPanel';

const mockTheme = {
  isDarkMode: false,
  toggleTheme: jest.fn(),
};

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => mockTheme,
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/hooks/useDiagnosticTests', () => ({
  useDiagnosticTests: () => ({
    availableTests: [
      { id: 'auth-1', name: 'Auth Login', category: 'auth', run: jest.fn() },
      { id: 'db-1', name: 'DB Connection', category: 'database', run: jest.fn() },
      { id: 'perf-1', name: 'API Latency', category: 'performance', run: jest.fn() },
    ],
    isRunning: false,
    results: [],
    runAllTests: jest.fn(),
    runTest: jest.fn(),
  }),
}));

jest.mock('@/components/diagnostic/AuthTestSection', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    AuthTestSection: (props: any) =>
      React.createElement(View, { testID: 'auth-test-section' }, [
        React.createElement(Text, { key: 'label' }, 'Auth Test Section'),
      ]),
  };
});

jest.mock('@/components/diagnostic/DatabaseTestSection', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    DatabaseTestSection: (props: any) =>
      React.createElement(View, { testID: 'db-test-section' }, [
        React.createElement(Text, { key: 'label' }, 'Database Test Section'),
      ]),
  };
});

jest.mock('@/components/diagnostic/PerformanceTestSection', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    PerformanceTestSection: (props: any) =>
      React.createElement(View, { testID: 'perf-test-section' }, [
        React.createElement(Text, { key: 'label' }, 'Performance Test Section'),
      ]),
  };
});

jest.mock('@/components/diagnostic/DiagnosticControls', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    DiagnosticControls: (props: any) =>
      React.createElement(View, { testID: 'diagnostic-controls' }, [
        React.createElement(
          TouchableOpacity,
          { key: 'run-all', testID: 'run-all-tests-btn', onPress: props.onRunAllTests },
          React.createElement(Text, null, 'Run All')
        ),
      ]),
  };
});

jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    initialize: jest.fn().mockResolvedValue(undefined),
    getLogs: jest.fn().mockResolvedValue('Sample log content'),
    clearLogs: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('DiagnosticPanel', () => {
  const defaultProps = {
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header with "Pannello Diagnostico" title', () => {
    const { getByText } = render(<DiagnosticPanel {...defaultProps} />);
    expect(getByText('Pannello Diagnostico')).toBeTruthy();
  });

  it('renders the close button with "Chiudi" text', () => {
    const { getByText } = render(<DiagnosticPanel {...defaultProps} />);
    expect(getByText('Chiudi')).toBeTruthy();
  });

  it('calls onClose when close button is pressed', () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <DiagnosticPanel {...defaultProps} onClose={onClose} />
    );
    fireEvent.press(getByText('Chiudi'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders the diagnostic controls section', () => {
    const { getByTestId } = render(<DiagnosticPanel {...defaultProps} />);
    expect(getByTestId('diagnostic-controls')).toBeTruthy();
  });

  it('renders the auth test section', () => {
    const { getByTestId } = render(<DiagnosticPanel {...defaultProps} />);
    expect(getByTestId('auth-test-section')).toBeTruthy();
  });

  it('renders the database test section', () => {
    const { getByTestId } = render(<DiagnosticPanel {...defaultProps} />);
    expect(getByTestId('db-test-section')).toBeTruthy();
  });

  it('renders the performance test section', () => {
    const { getByTestId } = render(<DiagnosticPanel {...defaultProps} />);
    expect(getByTestId('perf-test-section')).toBeTruthy();
  });

  it('renders the log section title', () => {
    const { getByText } = render(<DiagnosticPanel {...defaultProps} />);
    expect(getByText("Log dell'App")).toBeTruthy();
  });

  it('renders "Cancella Log" button', () => {
    const { getByText } = render(<DiagnosticPanel {...defaultProps} />);
    expect(getByText('Cancella Log')).toBeTruthy();
  });

  it('renders log button (either "Aggiorna Log" or "Caricamento...")', () => {
    const { getByText } = render(<DiagnosticPanel {...defaultProps} />);
    // The button shows "Caricamento..." while loading, then "Aggiorna Log"
    const logButtonText = getByText(/Aggiorna Log|Caricamento\.\.\./);
    expect(logButtonText).toBeTruthy();
  });

  it('calls LoggingService.getLogs on mount', () => {
    render(<DiagnosticPanel {...defaultProps} />);
    const { LoggingService } = require('@/services/LoggingService');
    expect(LoggingService.getLogs).toHaveBeenCalled();
  });

  it('calls LoggingService.clearLogs when "Cancella Log" is pressed', async () => {
    const { getByText } = render(<DiagnosticPanel {...defaultProps} />);
    fireEvent.press(getByText('Cancella Log'));
    const { LoggingService } = require('@/services/LoggingService');
    expect(LoggingService.clearLogs).toHaveBeenCalled();
  });

  it('renders info text about diagnostic tests', () => {
    const { getByText } = render(<DiagnosticPanel {...defaultProps} />);
    expect(getByText(/Questi test verificano/)).toBeTruthy();
  });

  it('renders log content or "Nessun log disponibile"', () => {
    const { getByText } = render(<DiagnosticPanel {...defaultProps} />);
    expect(getByText(/Nessun log disponibile|Sample log content/)).toBeTruthy();
  });

  it('renders correctly in dark mode', () => {
    mockTheme.isDarkMode = true;
    const { getByText } = render(<DiagnosticPanel {...defaultProps} />);
    expect(getByText('Pannello Diagnostico')).toBeTruthy();
    mockTheme.isDarkMode = false;
  });

  it('renders the run all tests button', () => {
    const { getByTestId } = render(<DiagnosticPanel {...defaultProps} />);
    expect(getByTestId('run-all-tests-btn')).toBeTruthy();
  });
});
