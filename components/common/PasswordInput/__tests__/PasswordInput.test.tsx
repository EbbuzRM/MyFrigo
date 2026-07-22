import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PasswordInput } from '../PasswordInput';

// Mock dependencies
jest.mock('@/utils/scaleFont', () => ({
  scaleFont: (size: number) => size,
}));

describe('PasswordInput', () => {
  const defaultProps = {
    label: 'Password',
    value: '',
    onChangeText: jest.fn(),
    showPassword: false,
    onToggleVisibility: jest.fn(),
    isDarkMode: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with required props', () => {
    const { getByText, getByPlaceholderText } = render(
      <PasswordInput {...defaultProps} />
    );
    
    expect(getByText('Password')).toBeTruthy();
    expect(getByPlaceholderText('Inserisci password')).toBeTruthy();
  });

  it('should render with custom placeholder', () => {
    const { getByPlaceholderText } = render(
      <PasswordInput {...defaultProps} placeholder="Inserisci la tua password" />
    );
    
    expect(getByPlaceholderText('Inserisci la tua password')).toBeTruthy();
  });

  it('should display the provided value', () => {
    const { getByDisplayValue } = render(
      <PasswordInput {...defaultProps} value="TestPassword123" />
    );
    
    expect(getByDisplayValue('TestPassword123')).toBeTruthy();
  });

  it('should call onChangeText when text is entered', () => {
    const onChangeTextMock = jest.fn();
    const { getByPlaceholderText } = render(
      <PasswordInput {...defaultProps} onChangeText={onChangeTextMock} />
    );
    
    const input = getByPlaceholderText('Inserisci password');
    fireEvent.changeText(input, 'NewPassword');
    
    expect(onChangeTextMock).toHaveBeenCalledWith('NewPassword');
    expect(onChangeTextMock).toHaveBeenCalledTimes(1);
  });

  it('should call onToggleVisibility when eye icon is pressed', () => {
    const onToggleVisibilityMock = jest.fn();
    const { getByLabelText } = render(
      <PasswordInput {...defaultProps} onToggleVisibility={onToggleVisibilityMock} />
    );
    
    const toggleButton = getByLabelText('Mostra password');
    fireEvent.press(toggleButton);
    
    expect(onToggleVisibilityMock).toHaveBeenCalledTimes(1);
  });

  it('should show "Mostra password" accessibility label when password is hidden', () => {
    const { getByLabelText } = render(
      <PasswordInput {...defaultProps} showPassword={false} />
    );
    
    expect(getByLabelText('Mostra password')).toBeTruthy();
  });

  it('should show "Nascondi password" accessibility label when password is visible', () => {
    const { getByLabelText } = render(
      <PasswordInput {...defaultProps} showPassword={true} />
    );
    
    expect(getByLabelText('Nascondi password')).toBeTruthy();
  });

  it('should render secureTextEntry when password is hidden', () => {
    const { getByPlaceholderText } = render(
      <PasswordInput {...defaultProps} showPassword={false} />
    );
    
    const input = getByPlaceholderText('Inserisci password');
    expect(input.props.secureTextEntry).toBe(true);
  });

  it('should not render secureTextEntry when password is visible', () => {
    const { getByPlaceholderText } = render(
      <PasswordInput {...defaultProps} showPassword={true} />
    );
    
    const input = getByPlaceholderText('Inserisci password');
    expect(input.props.secureTextEntry).toBe(false);
  });

  it('should display error message when error prop is provided', () => {
    const { getByText } = render(
      <PasswordInput {...defaultProps} error="Password non valida" />
    );
    
    expect(getByText('Password non valida')).toBeTruthy();
  });

  it('should not display error message when error prop is undefined', () => {
    const { queryByText } = render(
      <PasswordInput {...defaultProps} error={undefined} />
    );
    
    expect(queryByText('Password non valida')).toBeNull();
  });

  it('should apply error styles when error prop is provided', () => {
    const { getByPlaceholderText } = render(
      <PasswordInput {...defaultProps} error="Errore" />
    );
    
    const input = getByPlaceholderText('Inserisci password');
    expect(input.parent?.parent?.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          borderColor: expect.anything(),
        }),
        expect.objectContaining({
          borderColor: '#dc2626',
        }),
      ])
    );
  });

  it('should render with testID when provided', () => {
    const { getByTestId } = render(
      <PasswordInput {...defaultProps} testID="password-input" />
    );
    
    expect(getByTestId('password-input')).toBeTruthy();
  });

  it('should render with dark mode styles', () => {
    const { getByText } = render(
      <PasswordInput {...defaultProps} isDarkMode={true} />
    );
    
    const label = getByText('Password');
    expect(label.props.style).toMatchObject({
      color: '#c9d1d9',
    });
  });

  it('should render with light mode styles', () => {
    const { getByText } = render(
      <PasswordInput {...defaultProps} isDarkMode={false} />
    );
    
    const label = getByText('Password');
    expect(label.props.style).toMatchObject({
      color: '#374151',
    });
  });

  it('should have accessibility role for toggle button', () => {
    const { getByLabelText } = render(
      <PasswordInput {...defaultProps} />
    );
    
    const toggleButton = getByLabelText('Mostra password');
    expect(toggleButton).toBeTruthy();
    expect(toggleButton.props.accessibilityRole).toBe('button');
  });

  it('should disable autoCorrect on input', () => {
    const { getByPlaceholderText } = render(
      <PasswordInput {...defaultProps} />
    );
    
    const input = getByPlaceholderText('Inserisci password');
    expect(input.props.autoCorrect).toBe(false);
  });

  it('should handle multiple text changes', () => {
    const onChangeTextMock = jest.fn();
    const { getByPlaceholderText } = render(
      <PasswordInput {...defaultProps} onChangeText={onChangeTextMock} />
    );
    
    const input = getByPlaceholderText('Inserisci password');
    fireEvent.changeText(input, 'Pass1');
    fireEvent.changeText(input, 'Pass12');
    fireEvent.changeText(input, 'Pass123');
    
    expect(onChangeTextMock).toHaveBeenCalledTimes(3);
    expect(onChangeTextMock).toHaveBeenNthCalledWith(1, 'Pass1');
    expect(onChangeTextMock).toHaveBeenNthCalledWith(2, 'Pass12');
    expect(onChangeTextMock).toHaveBeenNthCalledWith(3, 'Pass123');
  });

  it('should render lock icon', () => {
    const { UNSAFE_getAllByType } = render(
      <PasswordInput {...defaultProps} />
    );
    
    const FontAwesome = require('@expo/vector-icons').FontAwesome;
    const icons = UNSAFE_getAllByType(FontAwesome);
    expect(icons.length).toBeGreaterThan(0);
  });
});
