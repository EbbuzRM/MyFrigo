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

export function groupActivePushSubscriptions(
  providerSubscriptions: readonly ProviderSubscription[],
  registeredSubscriptions: readonly RegisteredSubscription[],
): Record<NotificationLanguage, string[]> {
  const languageById = new Map(registeredSubscriptions.map(row => [row.subscription_id, row.language]));
  const groups: Record<NotificationLanguage, Set<string>> = { it: new Set(), en: new Set() };
  for (const subscription of providerSubscriptions) {
    if (!subscription.id || subscription.enabled === false || !subscription.type?.endsWith('Push')) continue;
    const language = languageById.get(subscription.id) === 'en' ? 'en' : 'it';
    groups[language].add(subscription.id);
  }
  return { it: [...groups.it], en: [...groups.en] };
}
