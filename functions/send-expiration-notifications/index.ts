// index.ts — index module.
//
// exports: none
// used_by: none
// rules:   none

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

interface OneSignalResponse {
  errors?: string[];
  id?: string;
  recipients?: number;
}

interface SendResult {
  success: boolean;
  recipients: number;
  errors?: string[];
  notificationId?: string;
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
// Supabase fornisce automaticamente SUPABASE_SECRET_KEYS come JSON dictionary
const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
const secretKey = secretKeys['default'];
const ONESIGNAL_APP_ID        = Deno.env.get('ONESIGNAL_APP_ID');
const ONESIGNAL_REST_API_KEY  = Deno.env.get('ONESIGNAL_REST_API_KEY');

if (!SUPABASE_URL || !secretKey || !ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
  log('error', 'Missing required environment variables', {
    SUPABASE_URL:       !!SUPABASE_URL,
    secretKey: !!secretKey,
    ONESIGNAL_APP_ID:         !!ONESIGNAL_APP_ID,
    ONESIGNAL_REST_API_KEY:   !!ONESIGNAL_REST_API_KEY,
  });
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, secretKey);

// ─── OneSignal ────────────────────────────────────────────────────────────────

/**
 * Invia notifica push tramite external_id alias.
 *
 * OneSignal docs (https://documentation.onesignal.com/reference/create-notification):
 * - include_aliases è il metodo corretto per targetare utenti specifici
 * - include_player_ids NON è più un metodo valido
 * - target_channel è richiesto quando si usa include_aliases
 */
async function sendPushNotification(
  externalUserId: string,
  title: string,
  body: string,
  data: PushNotificationData = {}
): Promise<SendResult> {
  if (!externalUserId) {
    return { success: false, recipients: 0, errors: ['No external user ID provided'] };
  }

  const message = {
    app_id:          ONESIGNAL_APP_ID,
    target_channel:  'push',
    include_aliases: { external_id: [externalUserId] },
    headings:        { en: title },
    contents:        { en: body },
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

    if (!response.ok) {
      log('error', 'OneSignal API HTTP error', { status: response.status, body: responseData });
      return { success: false, recipients: 0, errors: [`HTTP ${response.status}`] };
    }

    if (responseData.errors && responseData.errors.length > 0) {
      log('error', 'OneSignal API returned errors', { errors: responseData.errors });
      return { success: false, recipients: 0, errors: responseData.errors };
    }

    // When using include_aliases, OneSignal may not return recipients.
    // A successful response with an id means the notification was created.
    const recipients = responseData.recipients ?? (responseData.id ? 1 : 0);
    log('info', 'OneSignal notification sent', { recipients, notificationId: responseData.id, externalUserId });

    if (recipients === 0) {
      log('warning', 'OneSignal accepted notification but delivered to 0 devices', { externalUserId });
    }

    return { success: true, recipients, notificationId: responseData.id };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log('error', 'Error sending push notification', { error: errorMessage });
    return { success: false, recipients: 0, errors: [errorMessage] };
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

function isAuthenticated(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (bearerToken) {
      const expectedToken = Deno.env.get('FUNCTION_SECRET_KEY');
      if (expectedToken && bearerToken === expectedToken) {
        return true;
      }
    }
  }

  const cronSecret = request.headers.get('x-cron-secret');
  if (cronSecret) {
    const expectedCronSecret = Deno.env.get('CRON_SECRET');
    if (expectedCronSecret && cronSecret === expectedCronSecret) {
      return true;
    }
  }

  return false;
}

// ─── Handler principale ───────────────────────────────────────────────────────

serve(async (request: Request) => {
  if (!isAuthenticated(request)) {
    log('warning', 'Unauthorized access attempt', {
      ip: request.headers.get('x-forwarded-for') ?? 'unknown',
    });
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { headers: { 'Content-Type': 'application/json' }, status: 401 }
    );
  }

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

    // 3. Per ogni utente: invia notifiche usando external_id alias
    //    (non serve più query user_devices — l'external_id è già il userId Supabase)
    let actualUsersNotified = 0;

    for (const [userId, { expired, preWarning }] of notificationsByUser) {
      let userNotified = false;

      // Notifica prodotti scaduti oggi
      if (expired.length > 0) {
        const productNames = expired.map(p => `"${p.product_name}"`).join(', ');
        const result = await sendPushNotification(
          userId,
          'Prodotti Scaduti!',
          expired.length === 1
            ? `Il prodotto ${productNames} è scaduto oggi.`
            : `${expired.length} prodotti scaduti oggi: ${productNames}`,
          { productIds: expired.map(p => p.product_id) }
        );
        if (result.success && result.recipients > 0) userNotified = true;
      }

      // Notifica prodotti in scadenza imminente
      if (preWarning.length > 0) {
        const productNames = preWarning.map(p => `"${p.product_name}"`).join(', ');
        const days = preWarning[0].notification_days;
        const result = await sendPushNotification(
          userId,
          'Prodotti in Scadenza!',
          preWarning.length === 1
            ? `Il prodotto ${productNames} scadrà tra ${days} giorni.`
            : `${preWarning.length} prodotti scadranno tra ${days} giorni: ${productNames}`,
          { productIds: preWarning.map(p => p.product_id) }
        );
        if (result.success && result.recipients > 0) userNotified = true;
      }

      log('info', `Notification result for user`, {
        userId,
        expiredCount:    expired.length,
        preWarningCount: preWarning.length,
        userNotified,
      });

      if (userNotified) actualUsersNotified++;
    }

    return new Response(
      JSON.stringify({
        message:          'Notification checks completed.',
        productsProcessed: expiringProducts.length,
        usersNotified:    actualUsersNotified,
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
