import { UpdateService, UpdateEventEmitter } from '../services/UpdateService';

// Mock per testing
const mockUpdates = {
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
  updateId: 'test-update-id',
  isEmbeddedLaunch: false,
  runtimeVersion: '1.0.1',
};

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
  },
}));

// Mock Constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    version: '1.0.1',
  },
}));

// Mock expo-updates
jest.mock('expo-updates', () => mockUpdates);

// Set __DEV__ to false
(global as any).__DEV__ = false;

describe('UpdateService Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect and handle updates correctly', async () => {
    // Setup
    mockUpdates.checkForUpdateAsync.mockResolvedValue({
      isAvailable: true,
      manifest: {
        extra: {
          version: '1.0.2',
        },
      },
    });

    mockUpdates.fetchUpdateAsync.mockResolvedValue({ isNew: true });

    // Test
    await UpdateService.initialize();
    expect(UpdateService.isReady()).toBe(true);

    const updateInfo = await UpdateService.checkForUpdate();
    expect(updateInfo.isAvailable).toBe(true);
    expect(updateInfo.availableVersion).toBe('1.0.2');

    const downloadSuccess = await UpdateService.downloadUpdate();
    expect(downloadSuccess).toBe(true);
    expect(mockUpdates.fetchUpdateAsync).toHaveBeenCalled();
  });

  it('should emit events correctly', (done) => {
    // Setup event listener
    const unsubscribe = UpdateEventEmitter.on('updateChecked', (updateInfo) => {
      expect(updateInfo).toBeTruthy();
      if (updateInfo) {
        expect(updateInfo.isAvailable).toBe(true);
      }
      unsubscribe();
      done();
    });

    // Mock update response
    mockUpdates.checkForUpdateAsync.mockResolvedValue({
      isAvailable: true,
      manifest: {
        extra: {
          version: '1.0.2',
        },
      },
    });

    // Trigger check
    UpdateService.checkForUpdate();
  });
});

console.log('✅ UpdateService integration test ready!');
console.log('🚀 Run with: npm test -- UpdateService.test.ts');