// UpdateService.flow.test.ts — flusso reale check -> download -> riavvio.
//
// exports: none
// used_by: none
// rules:   Mocka SOLO expo-updates/expo-constants/LoggingService: i sottomoduli di UpdateService
//          (metadata/download/notifications) restano reali, così i bug di integrazione emergono.

(global as any).__DEV__ = false;

jest.mock('expo-updates', () => ({
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
  updateId: 'test-update-id',
  isEmbeddedLaunch: false,
  runtimeVersion: '1.0.7',
}));

jest.mock('expo-constants', () => ({
  expoConfig: { version: '1.0.7' },
  default: { expoConfig: { version: '1.0.7' } },
}));

jest.mock('../LoggingService', () => ({
  LoggingService: { info: jest.fn(), error: jest.fn(), warning: jest.fn(), debug: jest.fn() },
}));

import * as Updates from 'expo-updates';
import { UpdateService, UpdateEventEmitter } from '../UpdateService';

const mockCheck = Updates.checkForUpdateAsync as jest.Mock;
const mockFetch = Updates.fetchUpdateAsync as jest.Mock;
const mockReload = Updates.reloadAsync as jest.Mock;

const availableResult = {
  isAvailable: true,
  manifest: {
    id: 'u1',
    runtimeVersion: '1.0.7',
    extra: { expoClient: { version: '1.0.8' } },
  },
};

describe('UpdateService flusso reale', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).__DEV__ = false;
    UpdateService.resetState();
    mockReload.mockResolvedValue(undefined);
  });

  it('checkForUpdate() raggiunge expo-updates e rileva un update (regressione isChecking)', async () => {
    mockCheck.mockResolvedValue(availableResult);

    const info = await UpdateService.checkForUpdate();

    expect(mockCheck).toHaveBeenCalledTimes(1);
    expect(info.isAvailable).toBe(true);
    expect(info.availableVersion).toBe('1.0.8');
    expect(UpdateService.isCheckingForUpdates()).toBe(false);
  });

  it('non usa runtimeVersion come "nuova versione" se il manifest non porta la versione', async () => {
    mockCheck.mockResolvedValue({ isAvailable: true, manifest: { id: 'u1', runtimeVersion: '1.0.7' } });

    const info = await UpdateService.checkForUpdate();

    expect(info.availableVersion).toBeUndefined();
  });

  it('emette updateChecked con le info', async () => {
    mockCheck.mockResolvedValue(availableResult);
    const listener = jest.fn();
    const off = UpdateEventEmitter.on('updateChecked', listener);

    await UpdateService.checkForUpdate();
    off();

    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ isAvailable: true }));
  });

  it('check -> download -> restart: chiama fetch e reload', async () => {
    mockCheck.mockResolvedValue(availableResult);
    mockFetch.mockResolvedValue({ isNew: true });

    expect(await UpdateService.downloadUpdate()).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    await UpdateService.restartApp();
    expect(mockReload).toHaveBeenCalledTimes(1);
  });

  it('download con isNew=false (già scaricato) lascia comunque l\'update pronto per il riavvio', async () => {
    mockCheck.mockResolvedValue(availableResult);
    mockFetch.mockResolvedValue({ isNew: false });

    expect(await UpdateService.downloadUpdate()).toBe(true);
    await UpdateService.restartApp();

    expect(mockReload).toHaveBeenCalledTimes(1);
  });

  it('markUpdatePending (update scaricato da useUpdates) permette restartApp senza nuovo check', async () => {
    UpdateService.markUpdatePending();

    await UpdateService.restartApp();

    expect(mockReload).toHaveBeenCalledTimes(1);
    expect(mockCheck).not.toHaveBeenCalled();
  });

  it('restartApp senza update in attesa non ricarica', async () => {
    mockCheck.mockResolvedValue({ isAvailable: false });

    await UpdateService.restartApp();

    expect(mockReload).not.toHaveBeenCalled();
  });

  it('downloadUpdate non invia mai un progresso 0/0 (NaN%)', async () => {
    mockCheck.mockResolvedValue(availableResult);
    mockFetch.mockResolvedValue({ isNew: true });
    const onProgress = jest.fn();

    await UpdateService.downloadUpdate(onProgress);

    expect(onProgress).not.toHaveBeenCalled();
  });

  it('un check concorrente non azzera il flag del check in corso', async () => {
    let resolveFirst: (v: unknown) => void = () => {};
    mockCheck.mockImplementationOnce(() => new Promise((r) => { resolveFirst = r; }));

    const first = UpdateService.checkForUpdate();
    await Promise.resolve();
    const second = await UpdateService.checkForUpdate();

    expect(second.isAvailable).toBe(false);
    expect(UpdateService.isCheckingForUpdates()).toBe(true);

    resolveFirst({ isAvailable: false });
    await first;
    expect(UpdateService.isCheckingForUpdates()).toBe(false);
  });
});
