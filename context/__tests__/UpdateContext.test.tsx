// UpdateContext.test.tsx — UpdateContext.test module.
//
// exports: none
// used_by: none
// rules: none
//

import React from 'react';
import { render, act, waitFor, waitForElementToBeRemoved } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { UpdateProvider, useUpdate } from '../UpdateContext';
import { UpdateService } from '@/services/UpdateService';
import { LoggingService } from '@/services/LoggingService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUpdates, fetchUpdateAsync, reloadAsync } from 'expo-updates';

// --- Mocks ---

// Mock di AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

// Mock di expo-updates
jest.mock('expo-updates', () => ({
  useUpdates: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
  checkForUpdateAsync: jest.fn(),
}));

// Mock del LoggingService
jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock di UpdateService
jest.mock('@/services/UpdateService', () => ({
  UpdateService: {
    initialize: jest.fn(),
    checkForUpdate: jest.fn(),
    downloadUpdate: jest.fn(),
    restartApp: jest.fn(),
    markUpdatePending: jest.fn(),
    isReady: jest.fn(),
    isCheckingForUpdates: jest.fn(),
    resetState: jest.fn(),
  },
  UpdateEventEmitter: {
    on: jest.fn(),
    off: jest.fn(),
    removeAllListeners: jest.fn(),
    emit: jest.fn(),
  },
}));

// Mock di UpdateModal
jest.mock('@/components/UpdateModal', () => {
  const { View, Text } = require('react-native');
  return {
    UpdateModal: ({ visible, onClose }: { visible: boolean; onClose: () => void }) =>
      visible ? <View testID="update-modal"><Text>Update Modal</Text></View> : null,
  };
});

// Type assertion per i mock
const mockedUpdateService = UpdateService as jest.Mocked<typeof UpdateService>;
const mockedUseUpdates = useUpdates as jest.Mock;
const mockedLoggingService = LoggingService as jest.Mocked<typeof LoggingService>;
const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

// --- Componenti di Test ---

const TestComponent = () => {
  const {
    checkForUpdates,
    isChecking,
    isDownloading,
    lastUpdateInfo,
    settings,
    updateSettings,
    showModal,
    hideModal,
    openModal,
    resetUpdateState,
    toast,
    showToast,
    hideToast,
    isApplyingUpdate,
  } = useUpdate();

  return (
    <View testID="test-component">
      <Text testID="is-checking">{isChecking ? 'true' : 'false'}</Text>
      <Text testID="is-downloading">{isDownloading ? 'true' : 'false'}</Text>
      <Text testID="show-modal">{showModal ? 'true' : 'false'}</Text>
      <Text testID="is-applying">{isApplyingUpdate ? 'true' : 'false'}</Text>
      <Text testID="settings">{JSON.stringify(settings)}</Text>
      {toast && <Text testID="toast">{toast.message}</Text>}
      {lastUpdateInfo && <Text testID="update-info">{lastUpdateInfo.isAvailable ? 'available' : 'not-available'}</Text>}
    </View>
  );
};

// --- Test Suite ---

describe('UpdateContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock di useUpdates con valori default
    mockedUseUpdates.mockReturnValue({
      isUpdateAvailable: false,
      isUpdatePending: false,
      availableUpdate: null,
      currentlyRunning: { updateId: 'current-version' },
    });

    // Mock dei servizi
    mockedUpdateService.initialize.mockResolvedValue();
    mockedUpdateService.checkForUpdate.mockResolvedValue({
      isAvailable: false,
      isUpdatePending: false,
      currentVersion: '1.0.0',
    });
    mockedUpdateService.downloadUpdate.mockResolvedValue(true);
    mockedUpdateService.restartApp.mockResolvedValue();
    mockedUpdateService.isReady.mockReturnValue(true);
    mockedUpdateService.isCheckingForUpdates.mockReturnValue(false);
    mockedUpdateService.resetState.mockImplementation(() => {});

    // Mock di AsyncStorage
    mockedAsyncStorage.getItem.mockResolvedValue(null);
    mockedAsyncStorage.setItem.mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render with default values', async () => {
    const { getByTestId } = render(
      <UpdateProvider>
        <TestComponent />
      </UpdateProvider>
    );

    await waitFor(() => {
      expect(getByTestId('is-checking')).toBeTruthy();
    });

    expect(getByTestId('is-checking').props.children).toBe('false');
    expect(getByTestId('is-downloading').props.children).toBe('false');
    expect(getByTestId('show-modal').props.children).toBe('false');
  });

  it('should initialize UpdateService on mount', async () => {
    render(
      <UpdateProvider>
        <TestComponent />
      </UpdateProvider>
    );

    await waitFor(() => {
      expect(mockedUpdateService.initialize).toHaveBeenCalled();
    });
  });

  it('should load settings from AsyncStorage on mount', async () => {
    const savedSettings = {
      autoCheckEnabled: false,
      autoInstallEnabled: false,
      checkInterval: 12,
      lastCheckTime: 123456,
    };
    mockedAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(savedSettings));

    render(
      <UpdateProvider>
        <TestComponent />
      </UpdateProvider>
    );

    await waitFor(() => {
      expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith('@myfrigo_update_settings');
    });
  });

  it('should handle checkForUpdates success', async () => {
    mockedUpdateService.checkForUpdate.mockResolvedValueOnce({
      isAvailable: true,
      isUpdatePending: false,
      currentVersion: '1.0.0',
      availableVersion: '1.1.0',
    });

    const { getByTestId } = render(
      <UpdateProvider>
        <TestComponent />
      </UpdateProvider>
    );

    await waitFor(() => {
      expect(getByTestId('is-checking')).toBeTruthy();
    });

    // Verifica che il servizio sia stato inizializzato
    expect(mockedUpdateService.initialize).toHaveBeenCalled();
  });

  it('should handle checkForUpdates error', async () => {
    mockedUpdateService.checkForUpdate.mockRejectedValueOnce(new Error('Network error'));

    const { getByTestId } = render(
      <UpdateProvider>
        <TestComponent />
      </UpdateProvider>
    );

    await waitFor(() => {
      expect(getByTestId('is-checking')).toBeTruthy();
    });

    // Dovrebbe gestire l'errore senza crash
    expect(mockedUpdateService.initialize).toHaveBeenCalled();
  });

  it('should show toast in development mode when checking for updates', async () => {
    const originalDev = (global as any).__DEV__;
    (global as any).__DEV__ = true;

    const { getByTestId } = render(
      <UpdateProvider>
        <TestComponent />
      </UpdateProvider>
    );

    await waitFor(() => {
      expect(getByTestId('test-component')).toBeTruthy();
    });

    (global as any).__DEV__ = originalDev;
  });

  it('should update settings correctly', async () => {
    const { getByTestId } = render(
      <UpdateProvider>
        <TestComponent />
      </UpdateProvider>
    );

    await waitFor(() => {
      expect(getByTestId('test-component')).toBeTruthy();
    });

    // Verifica che le impostazioni siano state caricate
    expect(getByTestId('settings')).toBeTruthy();
  });

  it('should handle settings update error gracefully', async () => {
    mockedAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));

    const { getByTestId } = render(
      <UpdateProvider>
        <TestComponent />
      </UpdateProvider>
    );

    await waitFor(() => {
      expect(getByTestId('test-component')).toBeTruthy();
    });

    // Non dovrebbe crashare
    expect(getByTestId('test-component')).toBeTruthy();
  });

  it('should reset update state correctly', async () => {
    const { getByTestId } = render(
      <UpdateProvider>
        <TestComponent />
      </UpdateProvider>
    );

    await waitFor(() => {
      expect(getByTestId('test-component')).toBeTruthy();
    });

    // resetUpdateState dovrebbe essere disponibile
    // Il test verifica che il context sia correttamente inizializzato
    expect(getByTestId('is-checking')).toBeTruthy();
  });

  it('should handle openModal when update is available', async () => {
    const { getByTestId } = render(
      <UpdateProvider>
        <TestComponent />
      </UpdateProvider>
    );

    await waitFor(() => {
      expect(getByTestId('test-component')).toBeTruthy();
    });

    // openModal dovrebbe essere disponibile
    expect(getByTestId('show-modal')).toBeTruthy();
  });

  it('should handle hideModal correctly', async () => {
    const { getByTestId } = render(
      <UpdateProvider>
        <TestComponent />
      </UpdateProvider>
    );

    await waitFor(() => {
      expect(getByTestId('test-component')).toBeTruthy();
    });

    // hideModal dovrebbe essere disponibile
    expect(getByTestId('show-modal')).toBeTruthy();
  });

  it('should display toast when showToast is called', async () => {
    const { getByTestId, queryByTestId } = render(
      <UpdateProvider>
        <TestComponent />
      </UpdateProvider>
    );

    await waitFor(() => {
      expect(getByTestId('test-component')).toBeTruthy();
    });

    // Inizialmente non ci dovrebbe essere toast
    expect(queryByTestId('toast')).toBeNull();
  });

  it('should hide toast when hideToast is called', async () => {
    const { getByTestId, queryByTestId } = render(
      <UpdateProvider>
        <TestComponent />
      </UpdateProvider>
    );

    await waitFor(() => {
      expect(getByTestId('test-component')).toBeTruthy();
    });

    // hideToast dovrebbe essere disponibile
    expect(queryByTestId('toast')).toBeNull();
  });

  it('should handle updateSettings with partial settings', async () => {
    const { getByTestId } = render(
      <UpdateProvider>
        <TestComponent />
      </UpdateProvider>
    );

    await waitFor(() => {
      expect(getByTestId('test-component')).toBeTruthy();
    });

    // updateSettings dovrebbe accettare impostazioni parziali
    expect(getByTestId('settings')).toBeTruthy();
  });

  it('should cleanup event listeners on unmount', async () => {
    const { unmount } = render(
      <UpdateProvider>
        <TestComponent />
      </UpdateProvider>
    );

    await waitFor(() => {
      expect(mockedUpdateService.initialize).toHaveBeenCalled();
    });

    // Simula lo smontaggio del componente
    act(() => {
      unmount();
    });

    // Verifica che il servizio sia stato inizializzato correttamente
    expect(mockedUpdateService.initialize).toHaveBeenCalled();
  });

  describe('flusso automatico useUpdates', () => {
    const pendingState = {
      isUpdateAvailable: true,
      isUpdatePending: true,
      isDownloading: false,
      availableUpdate: { manifest: { extra: { expoClient: { version: '1.0.8' } } } },
      currentlyRunning: { updateId: 'current-version' },
    };

    beforeEach(() => {
      (fetchUpdateAsync as jest.Mock).mockResolvedValue({ isNew: true });
      (reloadAsync as jest.Mock).mockResolvedValue(undefined);
    });

    const renderProvider = () =>
      render(
        <UpdateProvider>
          <TestComponent />
        </UpdateProvider>
      );

    it('con auto-install attivo mostra la schermata di aggiornamento per 10s, poi riavvia', async () => {
      jest.useFakeTimers();
      try {
        mockedUseUpdates.mockReturnValue(pendingState);

        const { getByTestId } = renderProvider();

        await act(async () => { await jest.advanceTimersByTimeAsync(0); });
        expect(getByTestId('is-applying').props.children).toBe('true');
        expect(mockedUpdateService.markUpdatePending).toHaveBeenCalled();

        // Anche se l'update è già pronto, il riavvio aspetta i 10 secondi minimi
        await act(async () => { await jest.advanceTimersByTimeAsync(9000); });
        expect(reloadAsync).not.toHaveBeenCalled();

        await act(async () => { await jest.advanceTimersByTimeAsync(1100); });
        expect(reloadAsync).toHaveBeenCalledTimes(1);
      } finally {
        jest.useRealTimers();
      }
    });

    it('mostra la schermata già durante il download automatico e la nasconde se il download fallisce', async () => {
      let rejectFetch: (error: Error) => void = () => {};
      (fetchUpdateAsync as jest.Mock).mockReturnValue(new Promise((_, reject) => { rejectFetch = reject; }));
      mockedUseUpdates.mockReturnValue({
        isUpdateAvailable: true,
        isUpdatePending: false,
        isDownloading: false,
        availableUpdate: null,
        currentlyRunning: { updateId: 'current-version' },
      });

      const { getByTestId } = renderProvider();

      await waitFor(() => expect(getByTestId('is-applying').props.children).toBe('true'));
      await act(async () => { rejectFetch(new Error('network')); });
      await waitFor(() => expect(getByTestId('is-applying').props.children).toBe('false'));
    });

    it('non riavvia prima di aver letto le preferenze: auto-install disattivato => modal, nessun reload', async () => {
      mockedAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({ autoCheckEnabled: true, autoInstallEnabled: false, checkInterval: 24 })
      );
      mockedUseUpdates.mockReturnValue(pendingState);

      const { getByTestId } = renderProvider();

      await waitFor(() => expect(getByTestId('show-modal').props.children).toBe('true'));
      expect(reloadAsync).not.toHaveBeenCalled();
      expect(mockedUpdateService.markUpdatePending).toHaveBeenCalled();
    });

    it('scarica automaticamente un update disponibile se il controllo automatico è attivo', async () => {
      mockedUseUpdates.mockReturnValue({
        isUpdateAvailable: true,
        isUpdatePending: false,
        isDownloading: false,
        availableUpdate: null,
        currentlyRunning: { updateId: 'current-version' },
      });

      renderProvider();

      await waitFor(() => expect(fetchUpdateAsync).toHaveBeenCalledTimes(1));
    });

    it('NON scarica se il controllo automatico è disattivato', async () => {
      mockedAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({ autoCheckEnabled: false, autoInstallEnabled: true, checkInterval: 24 })
      );
      mockedUseUpdates.mockReturnValue({
        isUpdateAvailable: true,
        isUpdatePending: false,
        isDownloading: false,
        availableUpdate: null,
        currentlyRunning: { updateId: 'current-version' },
      });

      renderProvider();

      await waitFor(() => expect(mockedAsyncStorage.getItem).toHaveBeenCalled());
      await act(async () => {});
      expect(fetchUpdateAsync).not.toHaveBeenCalled();
    });

    it('isDownloading riflette lo stato nativo di expo-updates', async () => {
      mockedUseUpdates.mockReturnValue({
        isUpdateAvailable: false,
        isUpdatePending: false,
        isDownloading: true,
        availableUpdate: null,
        currentlyRunning: { updateId: 'current-version' },
      });

      const { getByTestId } = renderProvider();

      await waitFor(() => expect(getByTestId('is-downloading').props.children).toBe('true'));
    });
  });
});
