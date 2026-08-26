// SettingsService.test.ts — SettingsService test module.
//
// exports: none
// used_by: none
// rules:   none

jest.mock('../supabaseClient', () => {
  const mockFrom = jest.fn();
  const mockChannel = jest.fn();
  const mockRemoveChannel = jest.fn();
  return {
    supabase: {
      from: mockFrom,
      channel: mockChannel,
      removeChannel: mockRemoveChannel,
      auth: {
        getUser: jest.fn(),
        refreshSession: jest.fn().mockResolvedValue({ data: { session: {} }, error: null }),
      },
    },
  };
});

jest.mock('../../utils/caseConverter', () => ({
  convertSettingsToCamelCase: jest.fn((data: any) => ({
    notificationDays: data.notification_days ?? 3,
    theme: data.theme ?? 'auto',
  })),
  convertSettingsToSnakeCase: jest.fn((data: any) => {
    const result: Record<string, any> = {};
    if (data.notificationDays !== undefined) result.notification_days = data.notificationDays;
    if (data.theme !== undefined) result.theme = data.theme;
    return result;
  }),
}));

jest.mock('../LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    warning: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../UserNotificationSettingsService', () => ({
  UserNotificationSettingsService: {
    updateSettings: jest.fn(),
  },
}));

import { SettingsService, AppSettings } from '../SettingsService';
import { supabase } from '../supabaseClient';
import { convertSettingsToCamelCase, convertSettingsToSnakeCase } from '../../utils/caseConverter';
import { UserNotificationSettingsService } from '../UserNotificationSettingsService';
import { LoggingService } from '../LoggingService';

describe('SettingsService', () => {
  const defaultSettings: AppSettings = {
    notificationDays: 3,
    theme: 'auto',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getSettings ────────────────────────────────────────────────────
  describe('getSettings', () => {
    it('should fetch and return existing settings', async () => {
      const mockDbData = { id: 1, notification_days: 5, theme: 'dark' };
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockDbData, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await SettingsService.getSettings();

      expect(supabase.from).toHaveBeenCalledWith('app_settings');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 1);
      expect(result).toEqual({ notificationDays: 5, theme: 'dark' });
    });

    it('should create default settings when no row exists (PGRST116)', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'No rows found' } }),
      };

      const mockInsertBuilder = {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockQueryBuilder)   // first call: select
        .mockReturnValueOnce(mockInsertBuilder); // second call: insert default

      const result = await SettingsService.getSettings();

      expect(result).toEqual(defaultSettings);
      expect(mockInsertBuilder.insert).toHaveBeenCalledWith({
        id: 1,
        notification_days: 3,
        theme: 'auto',
      });
      expect(LoggingService.info).toHaveBeenCalledWith(
        'SettingsService',
        expect.stringContaining('No settings found')
      );
    });

    it('should handle insert error gracefully and return defaults', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };

      const mockInsertBuilder = {
        insert: jest.fn().mockResolvedValue({ error: new Error('Insert failed') }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockQueryBuilder)
        .mockReturnValueOnce(mockInsertBuilder);

      const result = await SettingsService.getSettings();

      expect(result).toEqual(defaultSettings);
      expect(LoggingService.error).toHaveBeenCalledWith(
        'SettingsService',
        expect.any(String),
        expect.any(Error)
      );
    });

    it('should return default settings on unexpected error', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(new Error('Network error')),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await SettingsService.getSettings();

      expect(result).toEqual(defaultSettings);
      expect(LoggingService.error).toHaveBeenCalled();
    });

    it('should handle non-PGRST116 error during select', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: '42P01', message: 'relation does not exist' } }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await SettingsService.getSettings();

      expect(result).toEqual(defaultSettings);
      expect(LoggingService.error).toHaveBeenCalled();
    });
  });

  // ── updateSettings ─────────────────────────────────────────────────
  describe('updateSettings', () => {
    const mockUpdatedDbData = { id: 1, notification_days: 7, theme: 'light' };

    function mockUpdateQueryBuilder(resolvedValue?: any) {
      return {
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(
          resolvedValue ?? { data: mockUpdatedDbData, error: null }
        ),
      };
    }

    it('should update and return settings', async () => {
      const queryBuilder = mockUpdateQueryBuilder();
      (supabase.from as jest.Mock).mockReturnValue(queryBuilder);
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null } });

      const result = await SettingsService.updateSettings({ notificationDays: 7, theme: 'light' });

      expect(supabase.from).toHaveBeenCalledWith('app_settings');
      expect(queryBuilder.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, notification_days: 7, theme: 'light' })
      );
      expect(result).toEqual({ notificationDays: 7, theme: 'light' });
    });

    it('should sync notificationDays to user notification settings when user is authenticated', async () => {
      const queryBuilder = mockUpdateQueryBuilder();
      (supabase.from as jest.Mock).mockReturnValue(queryBuilder);
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      await SettingsService.updateSettings({ notificationDays: 7 });

      expect(UserNotificationSettingsService.updateSettings).toHaveBeenCalledWith('user-123', {
        notificationDays: 7,
      });
      expect(LoggingService.info).toHaveBeenCalledWith(
        'SettingsService',
        expect.stringContaining('synced'),
        { userId: 'user-123' }
      );
    });

    it('should skip user notification sync when no authenticated user', async () => {
      const queryBuilder = mockUpdateQueryBuilder();
      (supabase.from as jest.Mock).mockReturnValue(queryBuilder);
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null } });

      await SettingsService.updateSettings({ notificationDays: 7 });

      expect(UserNotificationSettingsService.updateSettings).not.toHaveBeenCalled();
      expect(LoggingService.warning).toHaveBeenCalledWith(
        'SettingsService',
        expect.stringContaining('No authenticated user')
      );
    });

    it('should skip user notification sync when notificationDays not changed', async () => {
      const queryBuilder = mockUpdateQueryBuilder();
      (supabase.from as jest.Mock).mockReturnValue(queryBuilder);

      await SettingsService.updateSettings({ theme: 'dark' });

      expect(UserNotificationSettingsService.updateSettings).not.toHaveBeenCalled();
    });

    it('should throw error on database failure', async () => {
      const dbError = new Error('Update failed');
      const queryBuilder = {
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: dbError }),
      };

      (supabase.from as jest.Mock).mockReturnValue(queryBuilder);

      await expect(SettingsService.updateSettings({ theme: 'dark' })).rejects.toThrow('Update failed');
      expect(LoggingService.error).toHaveBeenCalled();
    });

    it('should throw on unexpected rejection', async () => {
      const queryBuilder = {
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(new Error('Network timeout')),
      };

      (supabase.from as jest.Mock).mockReturnValue(queryBuilder);

      await expect(SettingsService.updateSettings({ theme: 'dark' })).rejects.toThrow('Network timeout');
      expect(LoggingService.error).toHaveBeenCalled();
    });
  });

  // ── listenToSettings ───────────────────────────────────────────────
  describe('listenToSettings', () => {
    it('should set up postgres_changes subscription and call callback with initial settings', async () => {
      const unsubscribe = jest.fn();
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis(),
      };

      const getSettingsSpy = jest.spyOn(SettingsService, 'getSettings')
        .mockResolvedValue(defaultSettings);

      (supabase.channel as jest.Mock).mockReturnValue(mockChannel);

      const callback = jest.fn();
      const result = SettingsService.listenToSettings(callback);

      expect(supabase.channel).toHaveBeenCalledWith('public:app_settings');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings' },
        expect.any(Function)
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
      expect(getSettingsSpy).toHaveBeenCalled();
      // callback called asynchronously via getSettings().then(callback)
      await new Promise(process.nextTick);
      expect(callback).toHaveBeenCalledWith(defaultSettings);

      getSettingsSpy.mockRestore();
    });

    it('should return unsubscribe function that removes channel', () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis(),
      };

      const spy = jest.spyOn(SettingsService, 'getSettings').mockResolvedValue(defaultSettings);
      (supabase.channel as jest.Mock).mockReturnValue(mockChannel);
      try {
        const unsubscribe = SettingsService.listenToSettings(jest.fn());
        unsubscribe();
        expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
      } finally {
        spy.mockRestore();
      }
    });
  });

  // ── PGRST303 retry logic ──────────────────────────────────────────
  describe('PGRST303 retry', () => {
    let timeoutSpy: jest.SpyInstance;

    beforeEach(() => {
      timeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation(((cb: any) => {
        if (typeof cb === 'function') cb();
        return 0 as unknown as NodeJS.Timeout;
      }) as unknown as typeof setTimeout);
    });

    afterEach(() => {
      timeoutSpy.mockRestore();
    });

    it('getSettings should retry on PGRST303 and succeed after session refresh', async () => {
      const pgrst303Error = { code: 'PGRST303', message: 'JWT issued at ... is in the future' };
      const mockDbData = { id: 1, notification_days: 5, theme: 'dark' };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn()
          .mockRejectedValueOnce(pgrst303Error)
          .mockResolvedValueOnce({ data: mockDbData, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
      (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
        data: { session: {} },
        error: null,
      });

      const result = await SettingsService.getSettings();

      expect(result).toEqual({ notificationDays: 5, theme: 'dark' });
      expect(supabase.auth.refreshSession).toHaveBeenCalledTimes(1);
      expect(LoggingService.warning).toHaveBeenCalledWith(
        'SettingsService',
        expect.stringContaining('PGRST303 detected'),
      );
      expect(mockQueryBuilder.single).toHaveBeenCalledTimes(2);
    });

    it('updateSettings should retry on PGRST303 and succeed after session refresh', async () => {
      const pgrst303Error = { code: 'PGRST303', message: 'JWT issued at ... is in the future' };
      const mockUpdatedDbData = { id: 1, notification_days: 7, theme: 'light' };

      const mockQueryBuilder = {
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn()
          .mockRejectedValueOnce(pgrst303Error)
          .mockResolvedValueOnce({ data: mockUpdatedDbData, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null } });
      (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
        data: { session: {} },
        error: null,
      });

      const result = await SettingsService.updateSettings({ notificationDays: 7, theme: 'light' });

      expect(result).toEqual({ notificationDays: 7, theme: 'light' });
      expect(supabase.auth.refreshSession).toHaveBeenCalledTimes(1);
      expect(mockQueryBuilder.single).toHaveBeenCalledTimes(2);
    });

    it('getSettings should NOT retry on non-PGRST303 errors', async () => {
      const otherError = { code: '42P01', message: 'relation does not exist' };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(otherError),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await SettingsService.getSettings();

      // Should return defaults (caught by outer catch), no retry
      expect(result).toEqual(defaultSettings);
      expect(supabase.auth.refreshSession).not.toHaveBeenCalled();
      expect(mockQueryBuilder.single).toHaveBeenCalledTimes(1);
    });

    it('getSettings should give up after MAX_JWT_RETRIES and return defaults', async () => {
      const pgrst303Error = { code: 'PGRST303', message: 'JWT issued at ... is in the future' };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(pgrst303Error),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
      (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
        data: { session: {} },
        error: null,
      });

      const result = await SettingsService.getSettings();

      // Should return defaults after exhausting retries
      expect(result).toEqual(defaultSettings);
      // 1 initial + 2 retries = 3 attempts
      expect(mockQueryBuilder.single).toHaveBeenCalledTimes(3);
      expect(supabase.auth.refreshSession).toHaveBeenCalledTimes(2);
    });
  });
});
