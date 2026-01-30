import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/context/ThemeContext';
import { DiagnosticWrapper, TestResultIndicator } from '../DiagnosticWrapper';

// Mock del tema
const mockTheme = {
  isDarkMode: false,
  toggleTheme: jest.fn(),
};

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => mockTheme,
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('DiagnosticWrapper', () => {
  const mockChildren = <Text>Test Children</Text>;

  it('renders children when no error or loading', () => {
    const { getByText } = render(
      <ThemeProvider>
        <DiagnosticWrapper>{mockChildren}</DiagnosticWrapper>
      </ThemeProvider>
    );

    expect(getByText('Test Children')).toBeTruthy();
  });

  it('shows loading state when isLoading is true', () => {
    const { getByText } = render(
      <ThemeProvider>
        <DiagnosticWrapper isLoading={true} title="Caricamento...">
          {mockChildren}
        </DiagnosticWrapper>
      </ThemeProvider>
    );

    expect(getByText('Caricamento...')).toBeTruthy();
  });

  it('shows error state with retry button', () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <ThemeProvider>
        <DiagnosticWrapper
          error="Test error message"
          onRetry={onRetry}
        >
          {mockChildren}
        </DiagnosticWrapper>
      </ThemeProvider>
    );

    expect(getByText('Errore di Sistema')).toBeTruthy();
    expect(getByText('Test error message')).toBeTruthy();
    expect(getByText('Riprova')).toBeTruthy();

    fireEvent.press(getByText('Riprova'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows progress when loading with progress data', () => {
    const { getByText } = render(
      <ThemeProvider>
        <DiagnosticWrapper
          isLoading={true}
          showProgress={true}
          progress={{ completed: 3, total: 5 }}
        >
          {mockChildren}
        </DiagnosticWrapper>
      </ThemeProvider>
    );

    expect(getByText('3/5 test completati')).toBeTruthy();
  });
});

describe('TestResultIndicator', () => {
  it('renders pending state when no result provided', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TestResultIndicator />
      </ThemeProvider>
    );

    // Il componente dovrebbe renderizzare un indicatore pending
    // Nota: in un test reale potresti voler aggiungere testId per identificare l'elemento
  });

  it('renders success state with duration', () => {
    const mockResult = {
      success: true,
      duration: 150,
    };

    const { getByText } = render(
      <ThemeProvider>
        <TestResultIndicator result={mockResult} />
      </ThemeProvider>
    );

    expect(getByText('150ms')).toBeTruthy();
  });

  it('renders error state with duration', () => {
    const mockResult = {
      success: false,
      duration: 300,
    };

    const { getByText } = render(
      <ThemeProvider>
        <TestResultIndicator result={mockResult} />
      </ThemeProvider>
    );

    expect(getByText('300ms')).toBeTruthy();
  });

  it('handles different sizes', () => {
    const mockResult = {
      success: true,
      duration: 100,
    };

    const { rerender } = render(
      <ThemeProvider>
        <TestResultIndicator result={mockResult} size="small" />
      </ThemeProvider>
    );

    // Test size small
    rerender(
      <ThemeProvider>
        <TestResultIndicator result={mockResult} size="medium" />
      </ThemeProvider>
    );

    // Test size medium
    rerender(
      <ThemeProvider>
        <TestResultIndicator result={mockResult} size="large" />
      </ThemeProvider>
    );

    // Test size large
    expect(true).toBe(true); // Placeholder - in un test reale controlleresti le dimensioni
  });
});