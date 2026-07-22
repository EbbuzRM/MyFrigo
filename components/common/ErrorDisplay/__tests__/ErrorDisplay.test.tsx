import React from 'react';
import { render } from '@testing-library/react-native';
import { ErrorDisplay } from '../ErrorDisplay';

// Mock dependencies
jest.mock('@/utils/scaleFont', () => ({
  scaleFont: (size: number) => size,
}));

describe('ErrorDisplay', () => {
  const defaultProps = {
    isDarkMode: false,
  };

  it('should return null when error is undefined', () => {
    const { queryByRole } = render(<ErrorDisplay {...defaultProps} error={undefined} />);
    
    expect(queryByRole('alert')).toBeNull();
  });

  it('should return null when error is null', () => {
    const { queryByRole } = render(<ErrorDisplay {...defaultProps} error={null} />);
    
    expect(queryByRole('alert')).toBeNull();
  });

  it('should return null when error is empty string', () => {
    const { queryByRole } = render(<ErrorDisplay {...defaultProps} error="" />);
    
    expect(queryByRole('alert')).toBeNull();
  });

  it('should render error message when error is provided', () => {
    const { getByText } = render(
      <ErrorDisplay {...defaultProps} error="Errore di autenticazione" />
    );
    
    expect(getByText('Errore di autenticazione')).toBeTruthy();
  });

  it('should render exclamation circle icon', () => {
    const { UNSAFE_getByType } = render(
      <ErrorDisplay {...defaultProps} error="Errore" />
    );
    
    const FontAwesome = require('@expo/vector-icons').FontAwesome;
    const icon = UNSAFE_getByType(FontAwesome);
    expect(icon).toBeTruthy();
    expect(icon.props.name).toBe('exclamation-circle');
    expect(icon.props.color).toBe('#dc2626');
  });

  it('should have accessibility role alert', async () => {
    const { getByText, UNSAFE_root } = render(
      <ErrorDisplay {...defaultProps} error="Errore" />
    );
    
    // Verify error is displayed
    expect(getByText('Errore')).toBeTruthy();
    
    // Verify the container has accessibilityRole="alert"
    const alertElement = await UNSAFE_root.findByProps({ accessibilityRole: 'alert' });
    expect(alertElement).toBeTruthy();
  });

  it('should render with dark mode styles', () => {
    const { getByText } = render(
      <ErrorDisplay isDarkMode={true} error="Test error" />
    );
    
    const errorText = getByText('Test error');
    expect(errorText.props.style).toMatchObject({
      color: '#dc2626',
    });
  });

  it('should render with light mode styles', () => {
    const { getByText } = render(
      <ErrorDisplay isDarkMode={false} error="Test error" />
    );
    
    const errorText = getByText('Test error');
    expect(errorText.props.style).toMatchObject({
      color: '#dc2626',
    });
  });

  it('should display long error messages', () => {
    const longError = 'Questo è un messaggio di errore molto lungo che potrebbe essere visualizzato su più righe nel componente';
    const { getByText } = render(
      <ErrorDisplay {...defaultProps} error={longError} />
    );
    
    expect(getByText(longError)).toBeTruthy();
  });

  it('should display error messages with special characters', () => {
    const errorWithSpecialChars = "Errore: impossibile connettersi all'API (404)";
    const { getByText } = render(
      <ErrorDisplay {...defaultProps} error={errorWithSpecialChars} />
    );
    
    expect(getByText(errorWithSpecialChars)).toBeTruthy();
  });

  it('should render icon with correct size', () => {
    const { UNSAFE_getByType } = render(
      <ErrorDisplay {...defaultProps} error="Errore" />
    );
    
    const FontAwesome = require('@expo/vector-icons').FontAwesome;
    const icon = UNSAFE_getByType(FontAwesome);
    expect(icon.props.size).toBe(16);
  });

  it('should render error text with correct font size', () => {
    const { getByText } = render(
      <ErrorDisplay {...defaultProps} error="Test error" />
    );
    
    const errorText = getByText('Test error');
    expect(errorText.props.style).toMatchObject({
      fontSize: 14,
    });
  });

  it('should render error text with correct font family', () => {
    const { getByText } = render(
      <ErrorDisplay {...defaultProps} error="Test error" />
    );
    
    const errorText = getByText('Test error');
    expect(errorText.props.style).toMatchObject({
      fontFamily: 'Inter-Regular',
    });
  });

  it('should handle multiple error messages sequentially', () => {
    const { getByText, rerender } = render(
      <ErrorDisplay {...defaultProps} error="Errore 1" />
    );
    
    expect(getByText('Errore 1')).toBeTruthy();
    
    rerender(<ErrorDisplay {...defaultProps} error="Errore 2" />);
    expect(getByText('Errore 2')).toBeTruthy();
  });

  it('should handle error clearing', () => {
    const { getByText, rerender, queryByRole } = render(
      <ErrorDisplay {...defaultProps} error="Errore visibile" />
    );
    
    expect(getByText('Errore visibile')).toBeTruthy();
    
    rerender(<ErrorDisplay {...defaultProps} error={null} />);
    expect(queryByRole('alert')).toBeNull();
  });
});
