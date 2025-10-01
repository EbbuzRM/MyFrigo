import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/context/ThemeContext';
import { DiagnosticControls } from '../DiagnosticControls';

// Mock del tema
const mockTheme = {
  isDarkMode: false,
  toggleTheme: jest.fn(),
};

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => mockTheme,
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('DiagnosticControls', () => {
  const defaultProps = {
    isRunning: false,
    onRunAllTests: jest.fn(),
    testCount: 5,
    completedTests: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    const { getByText } = render(
      <ThemeProvider>
        <DiagnosticControls {...defaultProps} />
      </ThemeProvider>
    );

    expect(getByText('2/5 test completati')).toBeTruthy();
    expect(getByText('Esegui Tutti i Test')).toBeTruthy();
  });

  it('shows running state when isRunning is true', () => {
    const { getByText } = render(
      <ThemeProvider>
        <DiagnosticControls {...defaultProps} isRunning={true} />
      </ThemeProvider>
    );

    expect(getByText('Esecuzione Test...')).toBeTruthy();
  });

  it('calls onRunAllTests when button is pressed', () => {
    const onRunAllTests = jest.fn();
    const { getByText } = render(
      <ThemeProvider>
        <DiagnosticControls {...defaultProps} onRunAllTests={onRunAllTests} />
      </ThemeProvider>
    );

    fireEvent.press(getByText('Esegui Tutti i Test'));
    expect(onRunAllTests).toHaveBeenCalledTimes(1);
  });

  it('shows correct progress percentage', () => {
    const { getByText } = render(
      <ThemeProvider>
        <DiagnosticControls {...defaultProps} completedTests={3} testCount={5} />
      </ThemeProvider>
    );

    expect(getByText('3/5 test completati')).toBeTruthy();
  });

  it('handles zero test count gracefully', () => {
    const { getByText } = render(
      <ThemeProvider>
        <DiagnosticControls {...defaultProps} testCount={0} completedTests={0} />
      </ThemeProvider>
    );

    expect(getByText('0/0 test completati')).toBeTruthy();
  });
});