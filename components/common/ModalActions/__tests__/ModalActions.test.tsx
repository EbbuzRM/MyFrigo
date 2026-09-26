import React from 'react';
import { act, render, fireEvent, waitFor } from '@testing-library/react-native';
import i18next from 'i18next';
import { initI18n } from '@/i18n';
import { enCatalogs } from '@/i18n/catalogs/en';
import { itCatalogs } from '@/i18n/catalogs/it';
import { ModalActions } from '../ModalActions';

// Mock dependencies
jest.mock('@/utils/scaleFont', () => ({
  scaleFont: (size: number) => size,
}));

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageTag: 'it-IT' }]),
}));

describe('ModalActions', () => {
  const defaultProps = {
    onCancel: jest.fn(),
    onConfirm: jest.fn(),
    isDarkMode: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    initI18n();
  });

  afterEach(async () => {
    await i18next.changeLanguage('it');
  });

  it('should render with required props', () => {
    const { getByText } = render(<ModalActions {...defaultProps} />);
    
    expect(getByText(itCatalogs.common.cancel)).toBeTruthy();
    expect(getByText(itCatalogs.common.confirm)).toBeTruthy();
  });

  it('should call onCancel when cancel button is pressed', () => {
    const onCancelMock = jest.fn();
    const { getByText } = render(
      <ModalActions {...defaultProps} onCancel={onCancelMock} />
    );
    
    const cancelButton = getByText(itCatalogs.common.cancel);
    fireEvent.press(cancelButton);
    
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });

  it('should call onConfirm when confirm button is pressed', () => {
    const onConfirmMock = jest.fn();
    const { getByText } = render(
      <ModalActions {...defaultProps} onConfirm={onConfirmMock} />
    );
    
    const confirmButton = getByText(itCatalogs.common.confirm);
    fireEvent.press(confirmButton);
    
    expect(onConfirmMock).toHaveBeenCalledTimes(1);
  });

  it('should disable confirm button when confirmDisabled is true', () => {
    const { getByLabelText } = render(
      <ModalActions {...defaultProps} confirmDisabled={true} />
    );
    
    const confirmButton = getByLabelText(itCatalogs.common.confirm);
    expect(confirmButton.props.accessibilityState.disabled).toBe(true);
  });

  it('should disable cancel button when isSubmitting is true', () => {
    const { getByLabelText } = render(
      <ModalActions {...defaultProps} isSubmitting={true} />
    );
    
    const cancelButton = getByLabelText(itCatalogs.common.cancel);
    expect(cancelButton.props.accessibilityState.disabled).toBe(true);
  });

  it('should disable confirm button when isSubmitting is true', () => {
    const { getByLabelText } = render(
      <ModalActions {...defaultProps} isSubmitting={true} />
    );
    
    const confirmButton = getByLabelText(itCatalogs.common.confirm);
    expect(confirmButton.props.accessibilityState.disabled).toBe(true);
  });

  it('should show loading indicator when isSubmitting is true', () => {
    const { getByText, UNSAFE_getByType } = render(
      <ModalActions {...defaultProps} isSubmitting={true} />
    );
    
    const ActivityIndicator = require('react-native').ActivityIndicator;
    const loadingIndicator = UNSAFE_getByType(ActivityIndicator);
    expect(loadingIndicator).toBeTruthy();
    expect(getByText(itCatalogs.common.saving)).toBeTruthy();
  });

  it('should not show loading indicator when isSubmitting is false', () => {
    const { queryByText } = render(
      <ModalActions {...defaultProps} isSubmitting={false} />
    );
    
    expect(queryByText(itCatalogs.common.saving)).toBeNull();
  });

  it('should not call onCancel when cancel button is pressed and isSubmitting is true', () => {
    const onCancelMock = jest.fn();
    const { getByText } = render(
      <ModalActions {...defaultProps} onCancel={onCancelMock} isSubmitting={true} />
    );
    
    const cancelButton = getByText(itCatalogs.common.cancel);
    fireEvent.press(cancelButton);
    
    expect(onCancelMock).not.toHaveBeenCalled();
  });

  it('should not call onConfirm when confirm button is pressed and disabled', () => {
    const onConfirmMock = jest.fn();
    const { getByLabelText } = render(
      <ModalActions {...defaultProps} onConfirm={onConfirmMock} confirmDisabled={true} />
    );
    
    const confirmButton = getByLabelText(itCatalogs.common.confirm);
    fireEvent.press(confirmButton);
    
    expect(onConfirmMock).not.toHaveBeenCalled();
  });

  it('should have accessibility label for cancel button', () => {
    const { getByLabelText } = render(<ModalActions {...defaultProps} />);
    
    expect(getByLabelText(itCatalogs.common.cancel)).toBeTruthy();
  });

  it('should have accessibility label for confirm button', () => {
    const { getByLabelText } = render(<ModalActions {...defaultProps} />);
    
    expect(getByLabelText(itCatalogs.common.confirm)).toBeTruthy();
  });

  it('should have accessibility role button for both buttons', () => {
    const { getByLabelText } = render(<ModalActions {...defaultProps} />);
    
    const cancelButton = getByLabelText(itCatalogs.common.cancel);
    const confirmButton = getByLabelText(itCatalogs.common.confirm);
    expect(cancelButton).toBeTruthy();
    expect(confirmButton).toBeTruthy();
    expect(cancelButton.props.accessibilityRole).toBe('button');
    expect(confirmButton.props.accessibilityRole).toBe('button');
  });

  it('should render with dark mode styles for cancel button', () => {
    const { getByText } = render(
      <ModalActions {...defaultProps} isDarkMode={true} />
    );
    
    const cancelText = getByText(itCatalogs.common.cancel);
    expect(cancelText.props.style).toMatchObject({
      color: '#c9d1d9',
    });
  });

  it('should render with light mode styles for cancel button', () => {
    const { getByText } = render(
      <ModalActions {...defaultProps} isDarkMode={false} />
    );
    
    const cancelText = getByText(itCatalogs.common.cancel);
    expect(cancelText.props.style).toMatchObject({
      color: '#374151',
    });
  });

  it('should apply disabled styles to confirm button when disabled', () => {
    const { getByLabelText } = render(
      <ModalActions {...defaultProps} confirmDisabled={true} />
    );
    
    const confirmButton = getByLabelText(itCatalogs.common.confirm);
    expect(confirmButton.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: expect.anything(),
        }),
      ])
    );
  });

  it('should handle multiple button presses', () => {
    const onCancelMock = jest.fn();
    const onConfirmMock = jest.fn();
    const { getByText } = render(
      <ModalActions {...defaultProps} onCancel={onCancelMock} onConfirm={onConfirmMock} />
    );
    
    fireEvent.press(getByText(itCatalogs.common.cancel));
    fireEvent.press(getByText(itCatalogs.common.confirm));
    fireEvent.press(getByText(itCatalogs.common.cancel));
    
    expect(onCancelMock).toHaveBeenCalledTimes(2);
    expect(onConfirmMock).toHaveBeenCalledTimes(1);
  });

  it('should show white loading indicator color when submitting', () => {
    const { UNSAFE_getByType } = render(
      <ModalActions {...defaultProps} isSubmitting={true} />
    );
    
    const ActivityIndicator = require('react-native').ActivityIndicator;
    const loadingIndicator = UNSAFE_getByType(ActivityIndicator);
    expect(loadingIndicator.props.color).toBe('#ffffff');
  });

  it('should disable confirm button when both isSubmitting and confirmDisabled are true', () => {
    const { getByLabelText } = render(
      <ModalActions {...defaultProps} isSubmitting={true} confirmDisabled={true} />
    );
    
    const confirmButton = getByLabelText(itCatalogs.common.confirm);
    expect(confirmButton.props.accessibilityState.disabled).toBe(true);
  });

  it('renders texts from the i18n catalogs and updates them on language change', async () => {
    const screen = render(<ModalActions {...defaultProps} isSubmitting={true} />);

    // Italian (default): texts come from the bundled `it` catalog.
    expect(screen.getByText(itCatalogs.common.cancel)).toBeTruthy();
    expect(screen.getByText(itCatalogs.common.saving)).toBeTruthy();

    // Switch language: shared component re-renders with the `en` catalog.
    await act(async () => {
      await i18next.changeLanguage('en');
    });

    await waitFor(() => {
      expect(screen.getByText(enCatalogs.common.cancel)).toBeTruthy();
    });
    expect(screen.getByText(enCatalogs.common.saving)).toBeTruthy();
    expect(screen.getByLabelText(enCatalogs.common.confirm)).toBeTruthy();
    expect(screen.queryByText(itCatalogs.common.cancel)).toBeNull();
  });
});
