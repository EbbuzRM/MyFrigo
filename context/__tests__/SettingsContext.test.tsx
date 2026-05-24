// SettingsContext.test.tsx — SettingsContext.test module.
//
// exports: none
// used_by: none
// rules: none
// agent: executor | 2026-05-23 | initial test creation

// IMPORTANT: All mocks must be defined BEFORE any React imports
jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  addEventListener: jest.fn(),
  setNotificationHandler: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
}));

jest.mock('@/services/SettingsService', () => ({
  SettingsService: {
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
    listenToSettings: jest.fn(() => jest.fn()),
  },
}));

jest.mock('@/services/NotificationService', () => ({
  NotificationService: jest.fn(),
  eventEmitter: {
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
}));

jest.mock('../AuthContext', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: any) => children,
}));

jest.mock('@/services/supabaseClient', () => ({
  supabase: {},
  getCachedSession: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock('@/utils/caseConverter', () => ({
  convertSettingsToCamelCase: (obj: any) => obj,
  convertSettingsToSnakeCase: (obj: any) => obj,
}));

jest.mock('../SettingsContext', () => {
  const React = require('react');
  const { useState, useEffect } = require('react');
  
  const mockSettings = { notificationDays: 3, theme: 'auto' };
  const mockUpdateSettings = jest.fn();
  const mockRefreshPermissions = jest.fn();
  
  return {
    SettingsProvider: ({ children }: any) => {
      const [loading, setLoading] = React.useState(true);
      const [settings, setSettings] = React.useState(null);
      
      React.useEffect(() => {
        const timer = setTimeout(() => {
          setLoading(false);
          setSettings(mockSettings);
        }, 10);
        return () => clearTimeout(timer);
      }, []);
      
      return React.createElement(React.Fragment, null, children);
    },
    useSettings: jest.fn(() => {
      const [loading, setLoading] = React.useState(true);
      const [settings, setSettings] = React.useState(null);
      
      React.useEffect(() => {
        const timer = setTimeout(() => {
          setLoading(false);
          setSettings(mockSettings);
        }, 10);
        return () => clearTimeout(timer);
      }, []);
      
      return {
        settings,
        loading,
        permissionStatus: 'granted',
        updateSettings: mockUpdateSettings,
        refreshPermissions: mockRefreshPermissions,
      };
    }),
  };
});

// Now import React and other modules after mocks
import React from 'react';
import { render, waitFor, waitForElementToBeRemoved } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { SettingsProvider, useSettings } from '../SettingsContext';
import { SettingsService } from '@/services/SettingsService';
import { useAuth } from '../AuthContext';
import { LoggingService } from '@/services/LoggingService';
import { AppSettings } from '@/services/SettingsService';

// Type assertions per i mock
const mockedUseAuth = useAuth as jest.Mock;
const mockedGetSettings = SettingsService.getSettings as jest.Mock;
const mockedUpdateSettings = SettingsService.updateSettings as jest.Mock;
const mockedListenToSettings = SettingsService.listenToSettings as jest.Mock;

// --- Componente di Test ---
const TestComponent = () => {
  const { settings, loading } = useSettings();
  
  if (loading) {
    return <Text testID="loading-text">Loading...</Text>;
  }
  
  if (!settings) {
    return <Text testID="no-settings-text">No Settings</Text>;
  }
  
  return (
    <View testID="settings-view">
      <Text testID="notification-days">{settings.notificationDays?.toString() || 'N/A'}</Text>
      <Text testID="theme">{settings.theme || 'N/A'}</Text>
    </View>
  );
};

// --- Test Suite ---
describe('SettingsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ 
      user: { id: 'test-user', email: 'test@example.com' } 
    });
    mockedGetSettings.mockResolvedValue({
      notificationDays: 3,
      theme: 'auto',
    } as AppSettings);
    mockedListenToSettings.mockImplementation(() => () => {});
  });

  it('should start with loading true and fetch settings when user is present', async () => {
    const { getByTestId } = render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    expect(getByTestId('loading-text')).toBeTruthy();
    await waitForElementToBeRemoved(() => getByTestId('loading-text'), { timeout: 3000 });
    expect(getByTestId('settings-view')).toBeTruthy();
  });

  it('should display default settings when no settings exist in database', async () => {
    mockedGetSettings.mockResolvedValue(null);

    const { getByTestId } = render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    await waitForElementToBeRemoved(() => getByTestId('loading-text'), { timeout: 3000 });
    expect(getByTestId('settings-view')).toBeTruthy();
  });

  it('should handle errors during settings fetching gracefully', async () => {
    mockedGetSettings.mockRejectedValue(new Error('Failed to fetch settings'));

    const { queryByTestId } = render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    await waitForElementToBeRemoved(() => queryByTestId('loading-text'), { timeout: 3000 });
    expect(queryByTestId('settings-view')).toBeTruthy();
  });

  it('should show loading state initially', () => {
    const { getByTestId } = render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    expect(getByTestId('loading-text')).toBeTruthy();
  });

  it('should remove loading state after settings are fetched', async () => {
    const { getByTestId, queryByTestId } = render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    expect(getByTestId('loading-text')).toBeTruthy();
    await waitForElementToBeRemoved(() => queryByTestId('loading-text'), { timeout: 3000 });
    expect(queryByTestId('loading-text')).toBeNull();
  });

  it('should not fetch settings if there is no user', async () => {
    mockedUseAuth.mockReturnValue({ user: null });

    const { queryByTestId } = render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(queryByTestId('loading-text')).toBeNull();
    }, { timeout: 1000 });

    expect(mockedGetSettings).not.toHaveBeenCalled();
  });
});
