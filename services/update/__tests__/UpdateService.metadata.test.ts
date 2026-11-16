// UpdateService.metadata.test.ts — UpdateService.metadata.test module.
//
// exports: none
// used_by: none
// rules:   none
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

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

import { UpdateMetadataService } from '../UpdateService.metadata';

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
});
