/**
 * Test per UpdateMetadataService - Logica di check aggiornamenti
 */

// Set __DEV__ to false BEFORE any imports
(global as any).__DEV__ = false;

// Mock di expo-constants
jest.mock('expo-constants', () => ({
    expoConfig: {
        version: '1.0.1',
    },
    default: {
        expoConfig: {
            version: '1.0.1',
        },
    },
}));

// Mock di expo-updates
jest.mock('expo-updates', () => ({
    checkForUpdateAsync: jest.fn(),
    updateId: 'test-update-id',
    isEmbeddedLaunch: false,
    runtimeVersion: '1.0.0',
}));

// Mock di react-native Platform
jest.mock('react-native', () => ({
    Platform: {
        OS: 'ios',
    },
}));

// Mock di LoggingService
jest.mock('@/services/LoggingService', () => ({
    LoggingService: {
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
    },
}));

import { UpdateMetadataService, UpdateSettings } from '../UpdateService.metadata';

describe('UpdateMetadataService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (global as any).__DEV__ = false;
    });

    describe('checkAvailability', () => {
        it('should return no update available when on web platform', async () => {
            const Platform = require('react-native').Platform;
            Platform.OS = 'web';

            const result = await UpdateMetadataService.checkAvailability(false, false, false);

            expect(result.isAvailable).toBe(false);
            expect(result.isUpdatePending).toBe(false);
            expect(result.currentVersion).toBe('1.0.1');

            Platform.OS = 'ios'; // Reset for other tests
        });

        it('should return no update available in development mode', async () => {
            (global as any).__DEV__ = true;

            const result = await UpdateMetadataService.checkAvailability(false, false, false);

            expect(result.isAvailable).toBe(false);
            expect(result.isUpdatePending).toBe(false);

            (global as any).__DEV__ = false; // Reset
        });

        it('should return available when update is pending', async () => {
            const result = await UpdateMetadataService.checkAvailability(true, false, false);

            expect(result.isAvailable).toBe(true);
            expect(result.isUpdatePending).toBe(true);
            expect(result.currentVersion).toBe('1.0.1');
        });

        it('should skip check when already checking (without force)', async () => {
            const result = await UpdateMetadataService.checkAvailability(false, true, false);

            expect(result.isAvailable).toBe(false);
            expect(result.isUpdatePending).toBe(false);
        });

        it('should check for updates when forceCheck is true', async () => {
            const Updates = require('expo-updates');
            Updates.checkForUpdateAsync.mockResolvedValueOnce({
                isAvailable: true,
                manifest: {
                    extra: { version: '1.0.2' },
                },
            });

            const result = await UpdateMetadataService.checkAvailability(false, true, true);

            expect(Updates.checkForUpdateAsync).toHaveBeenCalled();
            expect(result.isAvailable).toBe(true);
            expect(result.availableVersion).toBe('1.0.2');
        });

        it('should handle check errors gracefully', async () => {
            const Updates = require('expo-updates');
            Updates.checkForUpdateAsync.mockRejectedValueOnce(new Error('Network error'));

            const result = await UpdateMetadataService.checkAvailability(false, false, false);

            expect(result.isAvailable).toBe(false);
            expect(result.isUpdatePending).toBe(false);
        });

        it('should check for updates successfully', async () => {
            const Updates = require('expo-updates');
            Updates.checkForUpdateAsync.mockResolvedValueOnce({
                isAvailable: true,
                manifest: {
                    extra: { version: '1.0.2' },
                },
            });

            const result = await UpdateMetadataService.checkAvailability(false, false, false);

            expect(Updates.checkForUpdateAsync).toHaveBeenCalled();
            expect(result.isAvailable).toBe(true);
            expect(result.availableVersion).toBe('1.0.2');
        });
    });

    describe('shouldCheckForUpdates', () => {
        it('should return true when its time to check', () => {
            const settings: UpdateSettings = {
                autoCheckEnabled: true,
                autoInstallEnabled: true,
                checkInterval: 24, // ore
                lastCheckTime: Date.now() - (25 * 60 * 60 * 1000), // 25 ore fa
            };

            const result = UpdateMetadataService.shouldCheckForUpdates(settings);
            expect(result).toBe(true);
        });

        it('should return false when auto-check is disabled', () => {
            const settings: UpdateSettings = {
                autoCheckEnabled: false,
                autoInstallEnabled: true,
                checkInterval: 24,
                lastCheckTime: Date.now() - (25 * 60 * 60 * 1000),
            };

            const result = UpdateMetadataService.shouldCheckForUpdates(settings);
            expect(result).toBe(false);
        });

        it('should return false when not enough time has passed', () => {
            const settings: UpdateSettings = {
                autoCheckEnabled: true,
                autoInstallEnabled: true,
                checkInterval: 24,
                lastCheckTime: Date.now() - (23 * 60 * 60 * 1000), // 23 ore fa
            };

            const result = UpdateMetadataService.shouldCheckForUpdates(settings);
            expect(result).toBe(false);
        });

        it('should return false on web platform', () => {
            const Platform = require('react-native').Platform;
            Platform.OS = 'web';

            const settings: UpdateSettings = {
                autoCheckEnabled: true,
                autoInstallEnabled: true,
                checkInterval: 24,
                lastCheckTime: Date.now() - (25 * 60 * 60 * 1000),
            };

            const result = UpdateMetadataService.shouldCheckForUpdates(settings);
            expect(result).toBe(false);

            Platform.OS = 'ios'; // Reset
        });

        it('should return false in development mode', () => {
            (global as any).__DEV__ = true;

            const settings: UpdateSettings = {
                autoCheckEnabled: true,
                autoInstallEnabled: true,
                checkInterval: 24,
                lastCheckTime: Date.now() - (25 * 60 * 60 * 1000),
            };

            const result = UpdateMetadataService.shouldCheckForUpdates(settings);
            expect(result).toBe(false);

            (global as any).__DEV__ = false;
        });

        it('should return true when lastCheckTime is undefined', () => {
            const settings: UpdateSettings = {
                autoCheckEnabled: true,
                autoInstallEnabled: true,
                checkInterval: 24,
                // lastCheckTime undefined
            };

            const result = UpdateMetadataService.shouldCheckForUpdates(settings);
            expect(result).toBe(true);
        });

        it('should respect check interval', () => {
            // Test con intervallo di 1 ora
            const settings1: UpdateSettings = {
                autoCheckEnabled: true,
                autoInstallEnabled: true,
                checkInterval: 1,
                lastCheckTime: Date.now() - (2 * 60 * 60 * 1000), // 2 ore fa
            };
            expect(UpdateMetadataService.shouldCheckForUpdates(settings1)).toBe(true);

            // Test con intervallo di 12 ore
            const settings12: UpdateSettings = {
                autoCheckEnabled: true,
                autoInstallEnabled: true,
                checkInterval: 12,
                lastCheckTime: Date.now() - (13 * 60 * 60 * 1000), // 13 ore fa
            };
            expect(UpdateMetadataService.shouldCheckForUpdates(settings12)).toBe(true);
        });
    });

    describe('getBuildInfo', () => {
        it('should return build information', () => {
            const info = UpdateMetadataService.getBuildInfo();

            expect(info).toHaveProperty('updateId');
            expect(info).toHaveProperty('isEmbeddedLaunch');
            expect(info).toHaveProperty('runtimeVersion');
        });
    });
});