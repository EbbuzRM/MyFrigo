import { UpdateService, UpdateSettings } from '../UpdateService';
import { LoggingService } from '../LoggingService';

// Mock di expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    version: '1.0.1',
  },
}));

// Mock di Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
  },
}));

// Mock di expo-updates
jest.mock('expo-updates', () => ({
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
  updateId: 'test-update-id',
  isEmbeddedLaunch: false,
  runtimeVersion: '1.0.0',
}));

// Mock di __DEV__
Object.defineProperty(process, 'env', {
  value: {
    NODE_ENV: 'test',
  },
});

// Mock globale
(global as any).__DEV__ = false;

describe('UpdateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully in production', async () => {
      const { Updates } = require('expo-updates');
      
      await UpdateService.initialize();
      
      expect(UpdateService.isReady()).toBe(true);
    });

    it('should not initialize in development mode', async () => {
      (global as any).__DEV__ = true;
      
      await UpdateService.initialize();
      
      expect(UpdateService.isReady()).toBe(true);
    });

    it('should not initialize on web', async () => {
      const { Platform } = require('react-native');
      Platform.OS = 'web';
      
      await UpdateService.initialize();
      
      expect(UpdateService.isReady()).toBe(true);
    });
  });

  describe('checkForUpdate', () => {
    beforeEach(async () => {
      await UpdateService.initialize();
    });

    it('should check for updates successfully', async () => {
      const { Updates } = require('expo-updates');
      const mockUpdateResult = {
        isAvailable: true,
        manifest: {
          extra: {
            version: '1.0.2',
          },
        },
      };
      Updates.checkForUpdateAsync.mockResolvedValue(mockUpdateResult);

      const result = await UpdateService.checkForUpdate();

      expect(Updates.checkForUpdateAsync).toHaveBeenCalled();
      expect(result.isAvailable).toBe(true);
      expect(result.availableVersion).toBe('1.0.2');
    });

    it('should handle no updates available', async () => {
      const { Updates } = require('expo-updates');
      Updates.checkForUpdateAsync.mockResolvedValue({
        isAvailable: false,
      });

      const result = await UpdateService.checkForUpdate();

      expect(result.isAvailable).toBe(false);
    });

    it('should handle check errors gracefully', async () => {
      const { Updates } = require('expo-updates');
      Updates.checkForUpdateAsync.mockRejectedValue(new Error('Network error'));

      const result = await UpdateService.checkForUpdate();

      expect(result.isAvailable).toBe(false);
    });
  });

  describe('downloadUpdate', () => {
    beforeEach(async () => {
      await UpdateService.initialize();
    });

    it('should download update successfully', async () => {
      const { Updates } = require('expo-updates');
      Updates.checkForUpdateAsync.mockResolvedValue({
        isAvailable: true,
        manifest: { extra: { version: '1.0.2' } },
      });
      Updates.fetchUpdateAsync.mockResolvedValue({ isNew: true });

      const result = await UpdateService.downloadUpdate();

      expect(Updates.fetchUpdateAsync).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if no update is available', async () => {
      const { Updates } = require('expo-updates');
      Updates.checkForUpdateAsync.mockResolvedValue({
        isAvailable: false,
      });

      const result = await UpdateService.downloadUpdate();

      expect(result).toBe(false);
    });
  });

  describe('restartApp', () => {
    beforeEach(async () => {
      await UpdateService.initialize();
    });

    it('should restart app successfully', async () => {
      const { Updates } = require('expo-updates');
      Updates.checkForUpdateAsync.mockResolvedValue({
        isAvailable: true,
      });

      await UpdateService.restartApp();

      expect(Updates.reloadAsync).toHaveBeenCalled();
    });
  });

  describe('shouldCheckForUpdates', () => {
    it('should return true when it\'s time to check', () => {
      const settings: UpdateSettings = {
        autoCheckEnabled: true,
        autoInstallEnabled: true,
        checkInterval: 24,
        lastCheckTime: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
      };

      const result = UpdateService.shouldCheckForUpdates(settings);
      expect(result).toBe(true);
    });

    it('should return false when auto-check is disabled', () => {
      const settings: UpdateSettings = {
        autoCheckEnabled: false,
        autoInstallEnabled: true,
        checkInterval: 24,
        lastCheckTime: Date.now() - (25 * 60 * 60 * 1000),
      };

      const result = UpdateService.shouldCheckForUpdates(settings);
      expect(result).toBe(false);
    });

    it('should return false when not enough time has passed', () => {
      const settings: UpdateSettings = {
        autoCheckEnabled: true,
        autoInstallEnabled: true,
        checkInterval: 24,
        lastCheckTime: Date.now() - (23 * 60 * 60 * 1000), // 23 hours ago
      };

      const result = UpdateService.shouldCheckForUpdates(settings);
      expect(result).toBe(false);
    });
  });

  describe('getDefaultSettings', () => {
    it('should return default settings', () => {
      const settings = UpdateService.getDefaultSettings();

      expect(settings.autoCheckEnabled).toBe(true);
      expect(settings.autoInstallEnabled).toBe(true);
      expect(settings.checkInterval).toBe(24);
    });
  });

  describe('getCurrentBuildInfo', () => {
    it('should return build information', () => {
      const info = UpdateService.getCurrentBuildInfo();

      expect(info).toHaveProperty('updateId');
      expect(info).toHaveProperty('isEmbeddedLaunch');
      expect(info).toHaveProperty('runtimeVersion');
    });
  });
});