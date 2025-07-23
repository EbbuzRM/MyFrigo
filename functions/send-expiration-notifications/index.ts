import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Carica le variabili d'ambiente
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
  console.error('Supabase and OneSignal credentials are required');
  Deno.exit(1);
}

// Inizializza il client Supabase con la SERVICE_ROLE_KEY per bypassare le policy RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sendPushNotification(oneSignalPlayerId, title, body, data = {}) {
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
        console.error('OneSignal API Error:', responseData.errors);
    } else {
        console.log(`OneSignal notification sent to ${oneSignalPlayerId}`);
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

serve(async () => {
  try {
    console.log('Function execution started.');

    // 1. Recupera tutti gli utenti con le loro impostazioni di notifica
    const { data: users, error: usersError } = await supabase
      .from('app_settings')
      .select(`
        user_id,
        notifications_enabled,
        notification_days,
        users ( oneSignalPlayerId )
      `);

    if (usersError) throw usersError;

    console.log(`Found ${users.length} users with settings.`);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayISO = today.toISOString().split('T')[0];

    // 2. Itera su ogni utente
    for (const settings of users) {
      const { user_id, notifications_enabled, notification_days, users: user } = settings;
      const oneSignalPlayerId = user?.oneSignalPlayerId;

      if (!notifications_enabled || !oneSignalPlayerId) {
        console.log(`Skipping user ${user_id}: notifications disabled or no player ID.`);
        continue;
      }

      console.log(`Processing user ${user_id} with pre-warning days: ${notification_days}`);

      // --- LOGICA PER PRODOTTI SCADUTI OGGI ---
      const { data: expiredProducts, error: expiredError } = await supabase
        .from('products')
        .select('id, name')
        .eq('user_id', user_id)
        .eq('expiration_date', todayISO);

      if (expiredError) {
        console.error(`Error fetching expired products for user ${user_id}:`, expiredError);
      } else if (expiredProducts && expiredProducts.length > 0) {
        console.log(`Found ${expiredProducts.length} expired products for user ${user_id}.`);
        for (const product of expiredProducts) {
          await sendPushNotification(
            oneSignalPlayerId,
            'Prodotto Scaduto!',
            `Il prodotto "${product.name}" è scaduto oggi. Controlla il tuo frigo!`,
            { productId: product.id }
          );
        }
      }

      // --- LOGICA PER NOTIFICHE DI PREAVVISO ---
      if (notification_days > 0) {
        const preWarningDate = new Date(today);
        preWarningDate.setUTCDate(today.getUTCDate() + notification_days);
        const preWarningDateISO = preWarningDate.toISOString().split('T')[0];

        const { data: preWarningProducts, error: preWarningError } = await supabase
          .from('products')
          .select('id, name')
          .eq('user_id', user_id)
          .eq('expiration_date', preWarningDateISO);

        if (preWarningError) {
          console.error(`Error fetching pre-warning products for user ${user_id}:`, preWarningError);
        } else if (preWarningProducts && preWarningProducts.length > 0) {
          console.log(`Found ${preWarningProducts.length} pre-warning products for user ${user_id}.`);
          for (const product of preWarningProducts) {
            await sendPushNotification(
              oneSignalPlayerId,
              'Prodotto in Scadenza!',
              `Il prodotto "${product.name}" scadrà tra ${notification_days} giorni.`,
              { productId: product.id }
            );
          }
        }
      }
    }

    return new Response(JSON.stringify({ message: 'Notification checks completed.' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Function caught an error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
