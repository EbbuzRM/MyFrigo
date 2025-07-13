import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

// Funzione per salvare il token FCM in Firestore
export const saveFCMToken = functions.https.onCall(async (data, _context) => {
  const { token } = data;

  if (!_context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  if (!token) {
    throw new functions.https.HttpsError("invalid-argument", "FCM token is required.");
  }

  const userId = _context.auth.uid;

  try {
    await admin.firestore().collection("fcmTokens").doc(userId).set({
      token: token,
      userId: userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true }); // Usa merge per aggiornare se il documento esiste

    return { success: true };
  } catch (error) {
    console.error("Error saving FCM token:", error);
    throw new functions.https.HttpsError("internal", "Failed to save FCM token.");
  }
});

// Funzione per inviare notifiche push (già presente, ma la includo per completezza)
export const sendPushNotification = functions.https.onCall(async (data, _context) => {
  const { token, title, body } = data;

  if (!token || !title || !body) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields.");
  }

  const message = {
    token,
    notification: {
      title,
      body,
    },
    android: {
      priority: "high" as const,
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
        },
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    return { success: true, response };
  } catch (error) {
    console.error("Error sending message:", error);
    throw new functions.https.HttpsError("internal", "Failed to send message");
  }
});

// Funzione per programmare notifiche giornaliere (già presente, ma la includo per completezza)
export const scheduleDailyNotifications = functions.pubsub.schedule('every day 08:00').onRun(async (_context) => {
  // Qui dovrai recuperare i token FCM da Firestore
  const tokens: string[] = []; // Placeholder

  // Esempio di recupero token da Firestore (da implementare)
  try {
    const snapshot = await admin.firestore().collection("fcmTokens").get();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.token) {
        tokens.push(data.token);
      }
    });
  } catch (error) {
    console.error("Error fetching FCM tokens:", error);
  }

  const message = {
    notification: {
      title: "Controlla la dispensa",
      body: "Hai prodotti in scadenza nei prossimi giorni.",
    },
    android: {
      priority: "high" as const,
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
        },
      },
    },
  };

  const sendPromises = tokens.map(token =>
    admin.messaging().send({ ...message, token }).catch(err => {
      console.error(`Errore con token ${token}:`, err);
    })
  );

  await Promise.all(sendPromises);
  console.log("Notifiche programmate inviate.");
  return null;
});