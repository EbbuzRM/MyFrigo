import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SUPABASE_URL, SUPABASE_ANON_KEY, ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY } from '../../services/secrets.ts';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
  console.error('Supabase and OneSignal credentials are required');
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function sendPushNotification(oneSignalPlayerId, title, body) {
  const message = {
    app_id: ONESIGNAL_APP_ID,
    include_player_ids: [oneSignalPlayerId],
    headings: { en: title },
    contents: { en: body },
    data: { withSome: 'data' },
  };

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
      console.log('OneSignal notification sent successfully:', responseData);
  }
}

serve(async (req) => {
  try {
    console.log('Function execution started.');

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    console.log(`Querying products expiring between ${today.toISOString()} and ${tomorrow.toISOString()}`);

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .gte('expirationDate', today.toISOString())
      .lt('expirationDate', tomorrow.toISOString());

    if (productsError) {
      throw productsError;
    }

    console.log(`Found ${products.length} products expiring today.`);

    if (products.length === 0) {
      return new Response(JSON.stringify({ message: 'No products expiring today.' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    for (const product of products) {
      const userId = product.userId;
      console.log(`Processing product: ${product.name}, userId: ${userId}`);

      if (userId) {
        // Assuming you store the oneSignalPlayerId in the users table
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('oneSignalPlayerId') // Changed from pushToken
          .eq('id', userId)
          .single();

        if (userError) {
          console.warn(`Error fetching user ${userId}:`, userError.message);
          continue; 
        }

        if (user && user.oneSignalPlayerId) {
          console.log(`Sending notification to user ${userId} with OneSignal Player ID ${user.oneSignalPlayerId}`);
          await sendPushNotification(user.oneSignalPlayerId, 'Prodotto in scadenza!', `${product.name} scade oggi.`);
          console.log('Notification sent.');
        } else {
          console.warn(`User ${userId} has no oneSignalPlayerId.`);
        }
      } else {
        console.warn(`Product ${product.name} has no userId.`);
      }
    }

    return new Response(JSON.stringify({ message: 'Expiration notifications sent successfully.' }), {
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