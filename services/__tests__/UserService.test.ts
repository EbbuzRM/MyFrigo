// UserService.test.ts — UserService test module.
//
// exports: none
// used_by: none
// rules:   none

jest.mock('../LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
  },
}));

import { UserService, UserProfile } from '../UserService';
import { LoggingService } from '../LoggingService';

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getCurrentUserProfile ───────────────────────────────────────────
  describe('getCurrentUserProfile', () => {
    it('should return null as placeholder (not implemented)', async () => {
      const result = await UserService.getCurrentUserProfile();

      expect(result).toBeNull();
      expect(LoggingService.info).toHaveBeenCalledWith(
        'UserService',
        'getCurrentUserProfile not implemented yet'
      );
    });

    it('should return null and log error on exception', async () => {
      // Force LoggingService.info to throw
      (LoggingService.info as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Simulated error');
      });

      const result = await UserService.getCurrentUserProfile();

      expect(result).toBeNull();
      expect(LoggingService.error).toHaveBeenCalledWith(
        'UserService',
        'Error getting current user profile',
        expect.any(Error)
      );
    });
  });

  // ── updateUserProfile ───────────────────────────────────────────────
  describe('updateUserProfile', () => {
    it('should log info and complete without throwing (placeholder)', async () => {
      const profile: Partial<UserProfile> = { first_name: 'Mario' };

      await expect(UserService.updateUserProfile(profile)).resolves.toBeUndefined();

      expect(LoggingService.info).toHaveBeenCalledWith(
        'UserService',
        'updateUserProfile not implemented yet',
        profile
      );
    });

    it('should re-throw errors from LoggingService', async () => {
      const testError = new Error('Logging failed');
      (LoggingService.info as jest.Mock).mockImplementationOnce(() => {
        throw testError;
      });

      await expect(
        UserService.updateUserProfile({ first_name: 'Luigi' })
      ).rejects.toThrow('Logging failed');

      expect(LoggingService.error).toHaveBeenCalledWith(
        'UserService',
        'Error updating user profile',
        testError
      );
    });

    it('should accept empty partial profile', async () => {
      await expect(UserService.updateUserProfile({})).resolves.toBeUndefined();
      expect(LoggingService.info).toHaveBeenCalledWith(
        'UserService',
        'updateUserProfile not implemented yet',
        {}
      );
    });
  });

  // ── UserProfile interface ───────────────────────────────────────────
  describe('UserProfile type', () => {
    it('should accept a complete UserProfile object', () => {
      const profile: UserProfile = {
        id: 'user-1',
        first_name: 'Mario',
        last_name: 'Rossi',
        email: 'mario@example.com',
        one_signal_player_id: 'os-player-1',
        push_token: 'push-token-1',
        updated_at: '2026-01-01T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
      };

      expect(profile.id).toBe('user-1');
      expect(profile.email).toBe('mario@example.com');
    });

    it('should accept UserProfile with nullable fields', () => {
      const profile: UserProfile = {
        id: 'user-2',
        first_name: null,
        last_name: null,
        email: null,
        updated_at: null,
        created_at: null,
      };

      expect(profile.first_name).toBeNull();
      expect(profile.email).toBeNull();
    });

    it('should accept UserProfile with optional fields omitted', () => {
      const profile: UserProfile = {
        id: 'user-3',
        first_name: 'Anna',
        last_name: 'Bianchi',
        email: 'anna@example.com',
        updated_at: '2026-05-10T00:00:00Z',
        created_at: '2026-01-01T00:00:00Z',
      };

      expect(profile.one_signal_player_id).toBeUndefined();
      expect(profile.push_token).toBeUndefined();
    });
  });
});
