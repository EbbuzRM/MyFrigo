import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ModalHeader } from '../ModalHeader';

// Mock dependencies
jest.mock('@/utils/scaleFont', () => ({
  scaleFont: (size: number) => size,
}));

describe('ModalHeader', () => {
  const defaultProps = {
    title: 'Test Modal',
    onClose: jest.fn(),
    isDarkMode: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with required props', () => {
    const { getByText } = render(<ModalHeader {...defaultProps} />);
    
    expect(getByText('Test Modal')).toBeTruthy();
  });

  it('should display the provided title', () => {
    const { getByText } = render(
      <ModalHeader {...defaultProps} title="Cambia Password" />
    );
    
    expect(getByText('Cambia Password')).toBeTruthy();
  });

  it('should call onClose when close button is pressed', () => {
    const onCloseMock = jest.fn();
    const { getByLabelText } = render(
      <ModalHeader {...defaultProps} onClose={onCloseMock} />
    );
    
    const closeButton = getByLabelText('Chiudi modal');
    fireEvent.press(closeButton);
    
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('should have accessibility label for close button', () => {
    const { getByLabelText } = render(<ModalHeader {...defaultProps} />);
    
    expect(getByLabelText('Chiudi modal')).toBeTruthy();
  });

  it('should have accessibility hint for close button', () => {
    const { getByAccessibilityHint } = render(<ModalHeader {...defaultProps} />);
    
    expect(getByAccessibilityHint('Tocca per chiudere')).toBeTruthy();
  });

  it('should have accessibility role for close button', () => {
    const { getByLabelText } = render(<ModalHeader {...defaultProps} />);
    
    const closeButton = getByLabelText('Chiudi modal');
    expect(closeButton).toBeTruthy();
    expect(closeButton.props.accessibilityRole).toBe('button');
  });

  it('should have accessibility role header for title', () => {
    const { getByRole } = render(<ModalHeader {...defaultProps} />);
    
    const header = getByRole('header');
    expect(header).toBeTruthy();
    expect(header.props.children).toBe('Test Modal');
  });

  it('should render with dark mode styles', () => {
    const { getByText } = render(
      <ModalHeader {...defaultProps} isDarkMode={true} />
    );
    
    const title = getByText('Test Modal');
    expect(title.props.style).toMatchObject({
      color: '#c9d1d9',
    });
  });

  it('should render with light mode styles', () => {
    const { getByText } = render(
      <ModalHeader {...defaultProps} isDarkMode={false} />
    );
    
    const title = getByText('Test Modal');
    expect(title.props.style).toMatchObject({
      color: '#1e293b',
    });
  });

  it('should render FontAwesome times icon', () => {
    const { UNSAFE_getByType } = render(<ModalHeader {...defaultProps} />);
    
    const FontAwesome = require('@expo/vector-icons').FontAwesome;
    const icon = UNSAFE_getByType(FontAwesome);
    expect(icon).toBeTruthy();
    expect(icon.props.name).toBe('times');
  });

  it('should handle multiple close button presses', () => {
    const onCloseMock = jest.fn();
    const { getByLabelText } = render(
      <ModalHeader {...defaultProps} onClose={onCloseMock} />
    );
    
    const closeButton = getByLabelText('Chiudi modal');
    fireEvent.press(closeButton);
    fireEvent.press(closeButton);
    fireEvent.press(closeButton);
    
    expect(onCloseMock).toHaveBeenCalledTimes(3);
  });

  it('should render title with correct font size', () => {
    const { getByText } = render(<ModalHeader {...defaultProps} />);
    
    const title = getByText('Test Modal');
    expect(title.props.style).toMatchObject({
      fontSize: 18,
    });
  });

  it('should render title with correct font family', () => {
    const { getByText } = render(<ModalHeader {...defaultProps} />);
    
    const title = getByText('Test Modal');
    expect(title.props.style).toMatchObject({
      fontFamily: 'Inter-Bold',
    });
  });

  it('should handle empty title', () => {
    const { getByText } = render(
      <ModalHeader {...defaultProps} title="" />
    );
    
    expect(getByText('')).toBeTruthy();
  });

  it('should handle very long title', () => {
    const longTitle = 'This is a very long title that might wrap to multiple lines';
    const { getByText } = render(
      <ModalHeader {...defaultProps} title={longTitle} />
    );
    
    expect(getByText(longTitle)).toBeTruthy();
  });
});
