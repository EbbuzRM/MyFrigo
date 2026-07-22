import React from 'react';
import { render } from '@testing-library/react-native';
import { PasswordMatchIndicator } from '../PasswordMatchIndicator';

// Mock dependencies
jest.mock('@/utils/scaleFont', () => ({
  scaleFont: (size: number) => size,
}));

jest.mock('@/utils/validation/passwordValidationRules', () => ({
  validatePassword: (password: string) => ({
    isValid: password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password),
    validation: {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[^A-Za-z0-9]/.test(password),
    },
  }),
  validatePasswordMatch: (password: string, confirmPassword: string) => 
    password === confirmPassword && password.length > 0,
}));

describe('PasswordMatchIndicator', () => {
  const defaultProps = {
    newPassword: '',
    confirmPassword: '',
    isDarkMode: false,
  };

  it('should return null when newPassword is empty', () => {
    const { queryByText } = render(
      <PasswordMatchIndicator {...defaultProps} />
    );
    
    expect(queryByText('Minimo 8 caratteri')).toBeNull();
  });

  it('should render when newPassword has value', () => {
    const { getByText } = render(
      <PasswordMatchIndicator {...defaultProps} newPassword="Test" />
    );
    
    expect(getByText('Minimo 8 caratteri')).toBeTruthy();
  });

  it('should show all validation criteria', () => {
    const { getByText } = render(
      <PasswordMatchIndicator {...defaultProps} newPassword="Test" />
    );
    
    expect(getByText('Minimo 8 caratteri')).toBeTruthy();
    expect(getByText('Una maiuscola')).toBeTruthy();
    expect(getByText('Una minuscola')).toBeTruthy();
    expect(getByText('Un numero')).toBeTruthy();
    expect(getByText('Un carattere speciale')).toBeTruthy();
    expect(getByText('Password coincidono')).toBeTruthy();
  });

  it('should mark minLength as valid when password is 8+ characters', () => {
    const { UNSAFE_getAllByType } = render(
      <PasswordMatchIndicator 
        {...defaultProps} 
        newPassword="12345678" 
      />
    );
    
    const FontAwesome = require('@expo/vector-icons').FontAwesome;
    const icons = UNSAFE_getAllByType(FontAwesome);
    expect(icons[0].props.name).toBe('check-circle');
    expect(icons[0].props.color).toBe('#22c55e');
  });

  it('should mark minLength as invalid when password is less than 8 characters', () => {
    const { UNSAFE_getAllByType } = render(
      <PasswordMatchIndicator 
        {...defaultProps} 
        newPassword="1234" 
      />
    );
    
    const FontAwesome = require('@expo/vector-icons').FontAwesome;
    const icons = UNSAFE_getAllByType(FontAwesome);
    expect(icons[0].props.name).toBe('circle-o');
    expect(icons[0].props.color).toBe('#94a3b8');
  });

  it('should mark hasUpperCase as valid when password has uppercase letter', () => {
    const { UNSAFE_getAllByType } = render(
      <PasswordMatchIndicator 
        {...defaultProps} 
        newPassword="TestPassword" 
      />
    );
    
    const FontAwesome = require('@expo/vector-icons').FontAwesome;
    const icons = UNSAFE_getAllByType(FontAwesome);
    // Second icon is hasUpperCase
    expect(icons[1].props.name).toBe('check-circle');
  });

  it('should mark hasLowerCase as valid when password has lowercase letter', () => {
    const { UNSAFE_getAllByType } = render(
      <PasswordMatchIndicator 
        {...defaultProps} 
        newPassword="test" 
      />
    );
    
    const FontAwesome = require('@expo/vector-icons').FontAwesome;
    const icons = UNSAFE_getAllByType(FontAwesome);
    // Third icon is hasLowerCase
    expect(icons[2].props.name).toBe('check-circle');
  });

  it('should mark hasNumber as valid when password has number', () => {
    const { UNSAFE_getAllByType } = render(
      <PasswordMatchIndicator 
        {...defaultProps} 
        newPassword="test123" 
      />
    );
    
    const FontAwesome = require('@expo/vector-icons').FontAwesome;
    const icons = UNSAFE_getAllByType(FontAwesome);
    // Fourth icon is hasNumber
    expect(icons[3].props.name).toBe('check-circle');
  });

  it('should mark hasSpecialChar as valid when password has special character', () => {
    const { UNSAFE_getAllByType } = render(
      <PasswordMatchIndicator 
        {...defaultProps} 
        newPassword="test!" 
      />
    );
    
    const FontAwesome = require('@expo/vector-icons').FontAwesome;
    const icons = UNSAFE_getAllByType(FontAwesome);
    // Fifth icon is hasSpecialChar
    expect(icons[4].props.name).toBe('check-circle');
  });

  it('should mark passwordsMatch as valid when passwords match', () => {
    const { UNSAFE_getAllByType } = render(
      <PasswordMatchIndicator 
        {...defaultProps} 
        newPassword="TestPass123!" 
        confirmPassword="TestPass123!" 
      />
    );
    
    const FontAwesome = require('@expo/vector-icons').FontAwesome;
    const icons = UNSAFE_getAllByType(FontAwesome);
    // Sixth icon is passwordsMatch
    expect(icons[5].props.name).toBe('check-circle');
  });

  it('should mark passwordsMatch as invalid when passwords do not match', () => {
    const { UNSAFE_getAllByType } = render(
      <PasswordMatchIndicator 
        {...defaultProps} 
        newPassword="TestPass123!" 
        confirmPassword="Different123!" 
      />
    );
    
    const FontAwesome = require('@expo/vector-icons').FontAwesome;
    const icons = UNSAFE_getAllByType(FontAwesome);
    expect(icons[5].props.name).toBe('circle-o');
  });

  it('should show all criteria as valid for a fully valid password', () => {
    const { UNSAFE_getAllByType } = render(
      <PasswordMatchIndicator 
        {...defaultProps} 
        newPassword="ValidPass123!" 
        confirmPassword="ValidPass123!" 
      />
    );
    
    const FontAwesome = require('@expo/vector-icons').FontAwesome;
    const icons = UNSAFE_getAllByType(FontAwesome);
    
    icons.forEach((icon) => {
      expect(icon.props.name).toBe('check-circle');
      expect(icon.props.color).toBe('#22c55e');
    });
  });

  it('should render with dark mode styles', () => {
    const { getByText } = render(
      <PasswordMatchIndicator 
        {...defaultProps} 
        newPassword="test" 
        isDarkMode={true}
      />
    );
    
    const criterionText = getByText('Minimo 8 caratteri');
    expect(criterionText.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          color: '#8b949e',
        }),
      ])
    );
  });

  it('should render with light mode styles', () => {
    const { getByText } = render(
      <PasswordMatchIndicator 
        {...defaultProps} 
        newPassword="test" 
        isDarkMode={false}
      />
    );
    
    const criterionText = getByText('Minimo 8 caratteri');
    expect(criterionText.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          color: '#64748B',
        }),
      ])
    );
  });

  it('should apply valid styles to criterion text when criterion is met', () => {
    const { getByText } = render(
      <PasswordMatchIndicator 
        {...defaultProps} 
        newPassword="TestPassword123!" 
        confirmPassword="TestPassword123!" 
      />
    );
    
    const criterionText = getByText('Minimo 8 caratteri');
    expect(criterionText.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          color: '#22c55e',
        }),
        expect.objectContaining({
          fontFamily: 'Inter-SemiBold',
        }),
      ])
    );
  });

  it('should render 6 criterion rows', () => {
    const { UNSAFE_getAllByType } = render(
      <PasswordMatchIndicator 
        {...defaultProps} 
        newPassword="test" 
      />
    );
    
    const FontAwesome = require('@expo/vector-icons').FontAwesome;
    const icons = UNSAFE_getAllByType(FontAwesome);
    expect(icons).toHaveLength(6);
  });
});
