import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// ─── Tipi ────────────────────────────────────────────────────────────────────

interface PushNotificationData {
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

// ─── Logging ─────────────────────────────────────────────────────────────────

type LogLevel = 'info' | 'warning' | 'error';

function log(level: LogLevel, message: string, data: Record<string, unknown> = {}): void {
  const entry = JSON.stringify({
    level,
    message,
    ...data,
    timestamp: new Date().toISOString(),
  });
  if (level === 'error') {
    console.error(entry);
  } else {
    console.log(entry);
  }
}

// ─── Env vars ─────────────────────────────────────────────────────────────────

const SUPABASE_URL            = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ONESIGNAL_APP_ID        = Deno.env.get('ONESIGNAL_APP_ID');
const ONESIGNAL_REST_API_KEY  = Deno.env.get('ONESIGNAL_REST_API_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
  log('error', 'Missing required environment variables', {
    SUPABASE_URL:             !!SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY,
    ONESIGNAL_APP_ID:         !!ONESIGNAL_APP_ID,
    ONESIGNAL_REST_API_KEY:   !!ONESIGNAL_REST_API_KEY,
  });
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ─── OneSignal ────────────────────────────────────────────────────────────────

async function sendPushNotification(
  playerIds: string[],
  title: string,
  body: string,
  data: PushNotificationData = {}
): Promise<void> {
  if (!playerIds || playerIds.length === 0) return;

  const message = {
    app_id:             ONESIGNAL_APP_ID,
    include_player_ids: playerIds,
    headings:           { en: title },
    contents:           { en: body },
    data,
  };

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json; charset=utf-8',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(message),
    });

    const responseData: OneSignalResponse = await response.json();

    if (responseData.errors) {
      log('error', 'OneSignal API returned errors', { errors: responseData.errors });
    } else {
      log('info', `OneSignal notification sent`, {
        recipients: responseData.recipients ?? playerIds.length,
        notificationId: responseData.id,
      });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log('error', 'Error sending push notification', { error: errorMessage });
  }
}

// ─── Handler principale ───────────────────────────────────────────────────────

serve(async () => {
  try {
    log('info', 'send-expiration-notifications started');

    // 1. Recupera i prodotti in scadenza tramite la RPC corretta
    const { data: expiringProducts, error: rpcError } = await supabase
      .rpc('get_expiring_products');

    if (rpcError) {
      throw new Error(`RPC Error: ${rpcError.message}`);
    }

    if (!expiringProducts || expiringProducts.length === 0) {
      log('info', 'No products require notifications today');
      return new Response(
        JSON.stringify({ message: 'No products to process.', productsProcessed: 0, usersNotified: 0 } as SuccessResponse),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    log('info', `Found ${expiringProducts.length} products requiring notifications`);

    // 2. Raggruppa per utente
    const notificationsByUser = new Map<string, UserNotifications>();

    for (const product of expiringProducts as ExpiringProduct[]) {
      if (!notificationsByUser.has(product.user_id)) {
        notificationsByUser.set(product.user_id, { expired: [], preWarning: [] });
      }
      const userNotifs = notificationsByUser.get(product.user_id)!;
      if (product.notification_type === 'expired') {
        userNotifs.expired.push(product);
      } else {
        userNotifs.preWarning.push(product);
      }
    }

    // 3. Per ogni utente: recupera device e invia notifiche
    for (const [userId, { expired, preWarning }] of notificationsByUser) {
      const { data: devices, error: devicesError } = await supabase
        .from('user_devices')
        .select('device_id')
        .eq('user_id', userId);

      if (devicesError) {
        log('error', `Failed to fetch devices for user`, { userId, error: devicesError.message });
        continue;
      }

      const playerIds = (devices as UserDevice[]).map(d => d.device_id);

      if (playerIds.length === 0) {
        log('warning', `No registered devices for user, skipping`, { userId });
        continue;
      }

      // Notifica prodotti scaduti oggi
      if (expired.length > 0) {
        const productNames = expired.map(p => `"${p.product_name}"`).join(', ');
        await sendPushNotification(
          playerIds,
          'Prodotti Scaduti!',
          expired.length === 1
            ? `Il prodotto ${productNames} è scaduto oggi.`
            : `${expired.length} prodotti scaduti oggi: ${productNames}`,
          { productIds: expired.map(p => p.product_id) }
        );
      }

      // Notifica prodotti in scadenza imminente
      if (preWarning.length > 0) {
        const productNames = preWarning.map(p => `"${p.product_name}"`).join(', ');
        const days = preWarning[0].notification_days;
        await sendPushNotification(
          playerIds,
          'Prodotti in Scadenza!',
          preWarning.length === 1
            ? `Il prodotto ${productNames} scadrà tra ${days} giorni.`
            : `${preWarning.length} prodotti scadranno tra ${days} giorni: ${productNames}`,
          { productIds: preWarning.map(p => p.product_id) }
        );
      }

      log('info', `Notifications sent for user`, {
        userId,
        expiredCount:    expired.length,
        preWarningCount: preWarning.length,
        devicesCount:    playerIds.length,
      });
    }

    return new Response(
      JSON.stringify({
        message:          'Notification checks completed.',
        productsProcessed: expiringProducts.length,
        usersNotified:    notificationsByUser.size,
      } as SuccessResponse),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log('error', 'Unhandled error in function', { error: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage } as ErrorResponse),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
