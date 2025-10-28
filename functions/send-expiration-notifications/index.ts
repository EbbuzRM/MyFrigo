// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { LoggingService } from '../../services/LoggingService.ts';

// Carica le variabili d'ambiente
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
  LoggingService.error('Functions', 'Supabase and OneSignal credentials are required');
  Deno.exit(1);
}

// Inizializza il client Supabase con la SERVICE_ROLE_KEY per bypassare le policy RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sendPushNotification(oneSignalPlayerId: string, title: string, body: string, data: any = {}) {
  if (!oneSignalPlayerId) return;
  
  const message = {
    app_id: ONESIGNAL_APP_ID,
    include_player_ids: [oneSignalPlayerId],
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

    const responseData = await response.json();
    if (responseData.errors) {
        LoggingService.error('Functions', `OneSignal API Error: ${responseData.errors}`);
    } else {
        LoggingService.info('Functions', `OneSignal notification sent to ${oneSignalPlayerId}`);
    }
  } catch (error) {
    LoggingService.error('Functions', `Error sending push notification: ${error}`);
  }
}

serve(async () => {
  try {
    LoggingService.info('Functions', 'Function execution started.');

    // ✅ SINGOLA QUERY: Recupera tutti i prodotti in scadenza tramite RPC
    // Questo risolve il problema N+1: da 2N+1 query a 1 query sola
    const { data: expiringProducts, error: rpcError } = await supabase
      .rpc('get_expiring_products');

    if (rpcError) {
      throw new Error(`RPC Error: ${rpcError.message}`);
    }

    LoggingService.info('Functions', `Found ${expiringProducts?.length || 0} products requiring notifications.`);

    // Raggruppa per utente per evitare notifiche duplicate
    const notificationsByUser = new Map();
    
    for (const product of expiringProducts || []) {
      const key = product.user_id;
      if (!notificationsByUser.has(key)) {
        notificationsByUser.set(key, {
          oneSignalPlayerId: product.onesignal_player_id,
          expired: [],
          preWarning: [],
        });
      }
      
      const userNotifications = notificationsByUser.get(key);
      if (product.notification_type === 'expired') {
        userNotifications.expired.push(product);
      } else {
        userNotifications.preWarning.push(product);
      }
    }

    // Invia notifiche raggruppate
    for (const [userId, notifications] of notificationsByUser) {
      const { oneSignalPlayerId, expired, preWarning } = notifications;

      // Notifiche per prodotti scaduti
      if (expired.length > 0) {
        const productNames = expired.map(p => `"${p.product_name}"`).join(', ');
        await sendPushNotification(
          oneSignalPlayerId,
          'Prodotti Scaduti!',
          `${expired.length} prodotto(i) scaduto(i): ${productNames}`,
          { productIds: expired.map(p => p.product_id) }
        );
      }

      // Notifiche di preavviso
      if (preWarning.length > 0) {
        const productNames = preWarning.map(p => `"${p.product_name}"`).join(', ');
        const days = preWarning[0].notification_days;
        await sendPushNotification(
          oneSignalPlayerId,
          'Prodotti in Scadenza!',
          `${preWarning.length} prodotto(i) scadrà(nno) tra ${days} giorni: ${productNames}`,
          { productIds: preWarning.map(p => p.product_id) }
        );
      }
    }

    return new Response(JSON.stringify({
      message: 'Notification checks completed.',
      productsProcessed: expiringProducts?.length || 0,
      usersNotified: notificationsByUser.size
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    LoggingService.error('Functions', `Function caught an error: ${error}`);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
