import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { UpdateModal } from '../UpdateModal';
import { UpdateService, UpdateInfo } from '@/services/UpdateService';

const mockResetAnimations = jest.fn();
const mockAnimateProgress = jest.fn();

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

jest.mock('@/hooks/useUpdateAnimation', () => ({
  useUpdateAnimation: () => ({
    progressAnimation: {},
    animateProgress: mockAnimateProgress,
    resetAnimations: mockResetAnimations,
  }),
}));

jest.mock('@/services/UpdateService', () => ({
  UpdateService: {
    downloadUpdate: jest.fn(),
    restartApp: jest.fn(),
  },
}));

jest.mock('../UpdateModalHeader', () => ({
  UpdateModalHeader: () => null,
}));

jest.mock('../UpdateStatusMessage', () => ({
  UpdateStatusMessage: () => null,
}));

jest.mock('../UpdateProgressBar', () => ({
  UpdateProgressBar: () => null,
}));

jest.mock('../UpdateActions', () => {
  const React = require('react');
  return {
    UpdateActions: ({ onInstall }: { onInstall: () => void }) =>
      React.createElement('UpdateActions', { testID: 'install-update', onPress: onInstall }),
  };
});

describe('UpdateModal', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    (UpdateService.downloadUpdate as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('clears the pending installation timer when unmounted', async () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const updateInfo = { isAvailable: true } as UpdateInfo;
    const { getByTestId, unmount } = render(
      <UpdateModal visible onClose={jest.fn()} updateInfo={updateInfo} />
    );

    await act(async () => {
      fireEvent.press(getByTestId('install-update'));
    });
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
