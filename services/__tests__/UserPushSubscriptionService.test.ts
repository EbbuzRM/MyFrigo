const mockUpsert = jest.fn();
const mockDeleteRows = jest.fn();
const mockEqSubscription = jest.fn();
const mockEqUser = jest.fn(() => ({ eq: mockEqSubscription }));
jest.mock('../supabaseClient', () => ({ supabase: { from: jest.fn() } }));

import { UserPushSubscriptionService } from '../UserPushSubscriptionService';
import { supabase } from '../supabaseClient';

const mockFrom = supabase.from as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockUpsert.mockResolvedValue({ error: null });
  mockEqSubscription.mockResolvedValue({ error: null });
  mockDeleteRows.mockReturnValue({ eq: mockEqUser });
  mockFrom.mockReturnValue({ upsert: mockUpsert, delete: mockDeleteRows });
});

it('saves the real subscription ID and language for its user', async () => {
  await UserPushSubscriptionService.sync('user-1', 'subscription-1', 'en');

  expect(mockFrom).toHaveBeenCalledWith('user_push_subscriptions');
  expect(mockUpsert).toHaveBeenCalledWith(
    expect.objectContaining({ user_id: 'user-1', subscription_id: 'subscription-1', language: 'en' }),
    { onConflict: 'user_id,subscription_id' },
  );
});

it('removes only the current user and subscription on logout', async () => {
  await UserPushSubscriptionService.remove('user-1', 'subscription-1');

  expect(mockEqUser).toHaveBeenCalledWith('user_id', 'user-1');
  expect(mockEqSubscription).toHaveBeenCalledWith('subscription_id', 'subscription-1');
});

it('propagates storage errors so callers can report failed synchronisation', async () => {
  mockUpsert.mockResolvedValueOnce({ error: new Error('write failed') });
  await expect(UserPushSubscriptionService.sync('user-1', 'subscription-1', 'it')).rejects.toThrow('write failed');
});
