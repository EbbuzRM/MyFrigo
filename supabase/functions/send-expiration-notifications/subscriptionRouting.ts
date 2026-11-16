import type { NotificationLanguage } from './messages.ts';

export interface ProviderSubscription {
  id: string;
  type?: string;
  enabled?: boolean;
}

export interface RegisteredSubscription {
  subscription_id: string;
  language: NotificationLanguage;
}

function isActivePush(subscription: ProviderSubscription): boolean {
  return !!subscription.id && subscription.enabled !== false && !!subscription.type?.endsWith('Push');
}

/** Registered IDs that OneSignal no longer lists as an active push subscription for the user. */
export function findOrphanSubscriptionIds(
  providerSubscriptions: readonly ProviderSubscription[],
  registeredSubscriptions: readonly RegisteredSubscription[],
): string[] {
  const activeIds = new Set(providerSubscriptions.filter(isActivePush).map(subscription => subscription.id));
  return registeredSubscriptions.map(row => row.subscription_id).filter(id => !activeIds.has(id));
}

export function groupActivePushSubscriptions(
  providerSubscriptions: readonly ProviderSubscription[],
  registeredSubscriptions: readonly RegisteredSubscription[],
): Record<NotificationLanguage, string[]> {
  const languageById = new Map(registeredSubscriptions.map(row => [row.subscription_id, row.language]));
  const groups: Record<NotificationLanguage, Set<string>> = { it: new Set(), en: new Set() };
  for (const subscription of providerSubscriptions) {
    if (!isActivePush(subscription)) continue;
    const language = languageById.get(subscription.id) === 'en' ? 'en' : 'it';
    groups[language].add(subscription.id);
  }
  return { it: [...groups.it], en: [...groups.en] };
}
