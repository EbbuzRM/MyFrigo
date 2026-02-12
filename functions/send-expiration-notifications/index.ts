import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

import { LoggingService } from 'https://esm.sh/@myfrigo/logging-service@1.0.0';

type LogLevel = 'error' | 'info' | 'warning';

interface PushNotificationData {
  productId?: string;
  productName?: string;
  daysUntilExpiration?: number;
  productIds?: string[];
  [key: string]: unknown;
}

interface ExpiringProduct {
  user_id: string;
  product_id: string;
  product_name: string;
  notification_type: 'expired' | 'pre_warning';
  notification_days: number;
}

interface UserNotifications {
  expired: ExpiringProduct[];
  preWarning: ExpiringProduct[];
}

interface UserDevice {
  device_id: string;
}

interface OneSignalResponse {
  errors?: string[];
  id?: string;
  recipients?: number;
}

interface SuccessResponse {
  message: string;
  productsProcessed: number;
  usersNotified: number;
}

interface ErrorResponse {
  error: string;
}

const log = (level: LogLevel, message: string, data: Record<string, unknown> = {}): void => {
  const logMessage = JSON.stringify({ level, message, ...data, timestamp: new Date().toISOString() });
  if (level === 'error') {
    LoggingService.error('SendExpirationNotifications', logMessage);
  } else {
    LoggingService.info('SendExpirationNotifications', logMessage);
  }
};

// Carica le variabili d'ambiente
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
  log('error', 'Supabase and OneSignal credentials are required');
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sendPushNotification(playerIds: string[], title: string, body: string, data: PushNotificationData = {}): Promise<void> {
  if (!playerIds || playerIds.length === 0) return;
  
  const message = {
    app_id: ONESIGNAL_APP_ID,
    include_player_ids: playerIds,
    headings: { en: title },
    contents: { en: body },
    data: data,
  };

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(message),
    });

    const responseData: OneSignalResponse = await response.json();
    if (responseData.errors) {
        log('error', 'OneSignal API Error', { errors: responseData.errors });
    } else {
        log('info', `OneSignal notification sent to ${playerIds.length} devices.`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log('error', 'Error sending push notification', { error: errorMessage });
  }
}

serve(async () => {
  try {
    log('info', 'Function execution started.');

    const { data: expiringProducts, error: rpcError } = await supabase
      .rpc('get_expiring_products');

    if (rpcError) {
      throw new Error(`RPC Error: ${rpcError.message}`);
    }

    if (!expiringProducts || expiringProducts.length === 0) {
      log('info', 'No products requiring notifications.');
    return new Response(JSON.stringify({
      message: 'No products to process.'
    } as SuccessResponse), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    log('info', `Found ${expiringProducts.length} products requiring notifications.`);

    const notificationsByUser = new Map<string, UserNotifications>();
    
    for (const product of expiringProducts) {
      const key = product.user_id;
      if (!notificationsByUser.has(key)) {
        notificationsByUser.set(key, {
          expired: [],
          preWarning: [],
        });
      }
      
      const userNotifications = notificationsByUser.get(key)!;
      if (product.notification_type === 'expired') {
        userNotifications.expired.push(product);
      } else {
        userNotifications.preWarning.push(product);
      }
    }

    for (const [userId, notifications] of notificationsByUser) {
      const { expired, preWarning } = notifications;

      // Recupera tutti i device_id per questo utente dalla nuova tabella
      const { data: devices, error: devicesError } = await supabase
        .from('user_devices')
        .select('device_id')
        .eq('user_id', userId);

      if (devicesError) {
        log('error', `Failed to fetch devices for user ${userId}`, { error: devicesError.message });
        continue; // Salta questo utente se non riusciamo a recuperare i dispositivi
      }

      const playerIds = devices.map((d: UserDevice) => d.device_id);

      if (playerIds.length === 0) {
        log('warning', `No devices found for user ${userId}, skipping notifications.`);
        continue;
      }

      if (expired.length > 0) {
        const productNames = expired.map(p => `"${p.product_name}"`).join(', ');
        await sendPushNotification(
          playerIds,
          'Prodotti Scaduti!',
          `${expired.length} prodotto(i) scaduto(i): ${productNames}`,
          { productIds: expired.map(p => p.product_id) }
        );
      }

      if (preWarning.length > 0) {
        const productNames = preWarning.map(p => `"${p.product_name}"`).join(', ');
        const days = preWarning[0].notification_days;
        await sendPushNotification(
          playerIds,
          'Prodotti in Scadenza!',
          `${preWarning.length} prodotto(i) scadrà(nno) tra ${days} giorni: ${productNames}`,
          { productIds: preWarning.map(p => p.product_id) }
        );
      }
    }

    return new Response(JSON.stringify({
      message: 'Notification checks completed.',
      productsProcessed: expiringProducts.length,
      usersNotified: notificationsByUser.size
    } as SuccessResponse), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log('error', 'Function caught an error', { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage } as ErrorResponse), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
