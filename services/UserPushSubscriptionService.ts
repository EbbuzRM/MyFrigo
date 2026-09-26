import { supabase } from './supabaseClient';
import type { SupportedLanguage } from '@/i18n/types';

export class UserPushSubscriptionService {
  static async sync(userId: string, subscriptionId: string, language: SupportedLanguage): Promise<void> {
    const { error } = await supabase.from('user_push_subscriptions').upsert({
      user_id: userId,
      subscription_id: subscriptionId,
      language,
      synced_at: new Date().toISOString(),
    }, { onConflict: 'user_id,subscription_id' });
    if (error) throw error;
  }

  static async remove(userId: string, subscriptionId: string): Promise<void> {
    const { error } = await supabase.from('user_push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('subscription_id', subscriptionId);
    if (error) throw error;
  }
}
