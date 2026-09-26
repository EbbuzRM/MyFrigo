import { OneSignal } from 'react-native-onesignal';
import { OneSignalService } from '../OneSignalService';
import { UserDeviceService } from '../UserDeviceService';
import { UserPushSubscriptionService } from '../UserPushSubscriptionService';
import { supabase } from '../supabaseClient';
import { getSystemLanguage } from '@/i18n/language';

jest.mock('react-native-onesignal', () => ({
  OneSignal: {
    login: jest.fn().mockResolvedValue(undefined),
    logout: jest.fn().mockResolvedValue(undefined),
    User: {
      getOnesignalId: jest.fn().mockResolvedValue('onesignal-id'),
      addTags: jest.fn().mockResolvedValue(undefined),
      pushSubscription: { getIdAsync: jest.fn().mockResolvedValue('subscription-id') },
    },
  },
}));
jest.mock('../supabaseClient', () => ({ supabase: { auth: { getSession: jest.fn() } } }));
jest.mock('../UserDeviceService', () => ({
  UserDeviceService: { addDevice: jest.fn().mockResolvedValue(undefined), removeDevice: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../UserPushSubscriptionService', () => ({
  UserPushSubscriptionService: { sync: jest.fn().mockResolvedValue(undefined), remove: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../UserNotificationSettingsService', () => ({
  UserNotificationSettingsService: { ensureSettings: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../LoggingService', () => ({
  LoggingService: { info: jest.fn(), warning: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));
jest.mock('@/i18n/language', () => ({ getSystemLanguage: jest.fn(() => 'it') }));

const sdk = OneSignal as jest.Mocked<typeof OneSignal>;
const removeDevice = UserDeviceService.removeDevice as jest.Mock;
const removeSubscription = UserPushSubscriptionService.remove as jest.Mock;
const syncSubscription = UserPushSubscriptionService.sync as jest.Mock;
const systemLanguage = getSystemLanguage as jest.Mock;
const getSession = supabase.auth.getSession as jest.Mock;

describe('OneSignalService account cleanup', () => {
  let activeUserId: string | null;

  beforeEach(async () => {
    jest.clearAllMocks();
    activeUserId = 'account-a';
    getSession.mockImplementation(async () => ({
      data: { session: activeUserId ? { user: { id: activeUserId } } : null },
    }));
    (sdk.login as jest.Mock).mockResolvedValue(undefined);
    (sdk.logout as jest.Mock).mockResolvedValue(undefined);
    (sdk.User.getOnesignalId as jest.Mock).mockResolvedValue('onesignal-id');
    (sdk.User.pushSubscription.getIdAsync as jest.Mock).mockResolvedValue('subscription-id');
    removeDevice.mockResolvedValue(undefined);
    removeSubscription.mockResolvedValue(undefined);
    syncSubscription.mockResolvedValue(undefined);
    systemLanguage.mockReturnValue('it');
    Object.assign(OneSignalService, {
      currentUserId: null,
      desiredUserId: null,
      lastLoggedOutUserId: null,
      lastSyncedSubscription: null,
      accountOperation: Promise.resolve(),
      initializationPromise: null,
    });
    jest.spyOn(OneSignalService, 'initialize').mockResolvedValue(undefined);
    await OneSignalService.configureForUser({ userId: 'account-a' });
    jest.clearAllMocks();
  });

  afterEach(() => jest.restoreAllMocks());

  it('does not repeat a successful subscription write on foreground with unchanged language', async () => {
    await OneSignalService.syncPushSubscription();
    await OneSignalService.syncPushSubscription();

    expect(syncSubscription).not.toHaveBeenCalled();
  });

  it('syncs again when the language or subscription ID changes', async () => {
    systemLanguage.mockReturnValue('en');
    await OneSignalService.syncPushSubscription();
    expect(syncSubscription).toHaveBeenCalledWith('account-a', 'subscription-id', 'en');

    syncSubscription.mockClear();
    await OneSignalService.syncPushSubscription();
    expect(syncSubscription).not.toHaveBeenCalled();

    (sdk.User.pushSubscription.getIdAsync as jest.Mock).mockResolvedValue('renewed-id');
    await OneSignalService.syncPushSubscription();
    expect(syncSubscription).toHaveBeenCalledWith('account-a', 'renewed-id', 'en');
  });

  it('retries a failed subscription write on the next foreground sync', async () => {
    systemLanguage.mockReturnValue('en');
    syncSubscription.mockRejectedValueOnce(new Error('temporary write failure'));

    await expect(OneSignalService.syncPushSubscription()).rejects.toThrow('temporary write failure');
    await OneSignalService.syncPushSubscription();

    expect(syncSubscription).toHaveBeenCalledTimes(2);
  });

  it('disconnects the SDK if device removal fails', async () => {
    removeDevice.mockRejectedValueOnce(new Error('device delete failed'));
    await expect(OneSignalService.logout('account-a')).rejects.toThrow('device delete failed');
    expect(removeSubscription).toHaveBeenCalledWith('account-a', 'subscription-id');
    expect(sdk.logout).toHaveBeenCalledTimes(1);
  });

  it('disconnects the SDK if subscription removal fails', async () => {
    removeSubscription.mockRejectedValueOnce(new Error('subscription delete failed'));
    await expect(OneSignalService.logout('account-a')).rejects.toThrow('subscription delete failed');
    expect(removeDevice).toHaveBeenCalledWith('account-a', 'onesignal-id');
    expect(sdk.logout).toHaveBeenCalledTimes(1);
  });

  it('serializes an immediate login for another account and ignores a late old-account logout', async () => {
    const logout = OneSignalService.logout('account-a');
    activeUserId = 'account-b';
    const login = OneSignalService.configureForUser({ userId: 'account-b' });
    await Promise.all([logout, login]);
    await OneSignalService.logout('account-a');

    expect(sdk.logout).toHaveBeenCalledTimes(1);
    expect(sdk.login).toHaveBeenCalledWith('account-b');
    expect(removeSubscription).toHaveBeenCalledWith('account-a', 'subscription-id');
    expect(removeSubscription).not.toHaveBeenCalledWith('account-b', 'subscription-id');
  });

  it('makes repeated cleanup of the same account harmless', async () => {
    await OneSignalService.logout('account-a');
    await OneSignalService.logout('account-a');
    expect(removeDevice).toHaveBeenCalledTimes(1);
    expect(removeSubscription).toHaveBeenCalledTimes(1);
    expect(sdk.logout).toHaveBeenCalledTimes(1);
  });
});
