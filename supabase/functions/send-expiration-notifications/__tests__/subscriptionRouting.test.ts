import { groupActivePushSubscriptions } from '../subscriptionRouting';

describe('push subscription routing', () => {
  it('separates two devices by language and defaults old clients to Italian', () => {
    expect(groupActivePushSubscriptions([
      { id: 'it-device', type: 'AndroidPush', enabled: true },
      { id: 'en-device', type: 'iOSPush', enabled: true },
      { id: 'legacy-device', type: 'AndroidPush', enabled: true },
    ], [
      { subscription_id: 'it-device', language: 'it' },
      { subscription_id: 'en-device', language: 'en' },
    ])).toEqual({ it: ['it-device', 'legacy-device'], en: ['en-device'] });
  });

  it('excludes unrelated, disabled, and duplicate subscriptions', () => {
    expect(groupActivePushSubscriptions([
      { id: 'other', type: 'Email', enabled: true },
      { id: 'disabled', type: 'AndroidPush', enabled: false },
      { id: 'active', type: 'AndroidPush', enabled: true },
      { id: 'active', type: 'AndroidPush', enabled: true },
    ], [{ subscription_id: 'active', language: 'en' }])).toEqual({ it: [], en: ['active'] });
  });

  it('never targets a registered ID absent from the account returned by OneSignal', () => {
    expect(groupActivePushSubscriptions(
      [{ id: 'account-a-device', type: 'AndroidPush', enabled: true }],
      [{ subscription_id: 'account-b-device', language: 'en' }],
    )).toEqual({ it: ['account-a-device'], en: [] });
  });
});
