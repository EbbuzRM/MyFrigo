// ErrorBoundary.test.tsx — ErrorBoundary test module.
//
// exports: none
// used_by: none
// rules:   none

import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '../ErrorBoundary';
import { LoggingService } from '@/services/LoggingService';

// Helper component that throws an error
class BuggyComponent extends React.Component<{ shouldThrow?: boolean; children: React.ReactNode }> {
  render(): React.ReactNode {
    if (this.props.shouldThrow) {
      throw new Error('Test error');
    }
    return <>{this.props.children}</>;
  }
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when no error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <BuggyComponent shouldThrow={false}>
          <Text>Child content</Text>
        </BuggyComponent>
      </ErrorBoundary>
    );

    expect(getByText('Child content')).toBeTruthy();
  });

  it('should render fallback UI when a child throws', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { getByText } = render(
      <ErrorBoundary>
        <BuggyComponent shouldThrow={true}>
          <Text>Child content</Text>
        </BuggyComponent>
      </ErrorBoundary>
    );

    expect(getByText('Qualcosa è andato storto')).toBeTruthy();
    expect(getByText("Riprova ad aprire l'app")).toBeTruthy();
    expect(getByText('Riprova')).toBeTruthy();

    consoleSpy.mockRestore();
  });

  it('should render custom fallback when provided', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { getByText, queryByText } = render(
      <ErrorBoundary fallback={<Text>Custom error UI</Text>}>
        <BuggyComponent shouldThrow={true}>
          <Text>Child content</Text>
        </BuggyComponent>
      </ErrorBoundary>
    );

    expect(getByText('Custom error UI')).toBeTruthy();
    expect(queryByText('Qualcosa è andato storto')).toBeNull();

    consoleSpy.mockRestore();
  });

  it('should log error details via LoggingService when error is caught', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <BuggyComponent shouldThrow={true}>
          <Text>Child content</Text>
        </BuggyComponent>
      </ErrorBoundary>
    );

    expect(LoggingService.error).toHaveBeenCalledWith(
      'ErrorBoundary',
      'UI Error',
      expect.objectContaining({ error: 'Test error' })
    );

    consoleSpy.mockRestore();
  });

  it('should reset error state on retry press and not crash', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { getByText } = render(
      <ErrorBoundary>
        <BuggyComponent shouldThrow={true}>
          <Text>Child content</Text>
        </BuggyComponent>
      </ErrorBoundary>
    );

    // Error boundary shows fallback
    expect(getByText('Qualcosa è andato storto')).toBeTruthy();

    // Press retry — this should reset the boundary state without crashing.
    // The children still throw on re-render, so the fallback re-appears.
    expect(() => fireEvent.press(getByText('Riprova'))).not.toThrow();

    // Still showing fallback because children still throw
    expect(getByText('Qualcosa è andato storto')).toBeTruthy();

    consoleSpy.mockRestore();
  });

  it('should have accessibility label on retry button', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { getByLabelText } = render(
      <ErrorBoundary>
        <BuggyComponent shouldThrow={true}>
          <Text>Child content</Text>
        </BuggyComponent>
      </ErrorBoundary>
    );

    expect(getByLabelText('Riprova')).toBeTruthy();

    consoleSpy.mockRestore();
  });

  it('should handle nested error boundaries independently', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { getByText } = render(
      <ErrorBoundary>
        <ErrorBoundary>
          <BuggyComponent shouldThrow={true}>
            <Text>Inner child</Text>
          </BuggyComponent>
        </ErrorBoundary>
      </ErrorBoundary>
    );

    // Inner boundary should catch the error
    expect(getByText('Qualcosa è andato storto')).toBeTruthy();

    consoleSpy.mockRestore();
  });
});
