import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { LoggingService } from "../../services/LoggingService";

interface FeedbackEmailData {
  userId: string;
  feedbackText: string;
  screenshotUrl?: string;
  timestamp: string;
  appVersion: string;
}

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
    LoggingService.error('Functions', `Error saving FCM token: ${error}`);
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
    LoggingService.error('Functions', `Error sending message: ${error}`);
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
    LoggingService.error('Functions', `Error fetching FCM tokens: ${error}`);
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
      LoggingService.error('Functions', `Errore con token ${token}: ${err}`);
    })
  );

  await Promise.all(sendPromises);
  LoggingService.info('Functions', "Notifiche programmate inviate.");
  return null;
});

// Funzione per gestire il feedback con screenshot
export const sendFeedback = functions.https.onCall(async (data, _context) => {
  const { feedbackText, screenshotUrl } = data;

  if (!_context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  if (!feedbackText || feedbackText.trim().length < 10) {
    throw new functions.https.HttpsError("invalid-argument", "Feedback text is required and must be at least 10 characters long.");
  }

  const userId = _context.auth.uid;
  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const emailTimestamp = new Date(); // Use JavaScript Date for email

  try {
    // Prepara i dati per l'email
    const emailData = {
      userId,
      feedbackText: feedbackText.trim(),
      screenshotUrl: screenshotUrl || null,
      timestamp: emailTimestamp.toISOString(),
      appVersion: "1.0.0", // Puoi ottenere questa informazione dall'app
    };

    // Salva il feedback nel database
    await admin.firestore().collection('feedback').add({
      userId,
      feedbackText: feedbackText.trim(),
      screenshotUrl: screenshotUrl || null,
      timestamp,
      status: 'pending',
      appVersion: "1.0.0",
    });

    // Invia email con feedback e screenshot (se presente) tramite Resend
    await sendFeedbackEmail(emailData);

    LoggingService.info('Functions', 'Feedback inviato con successo', { userId, hasScreenshot: !!screenshotUrl });
    
    return {
      success: true,
      message: 'Feedback inviato con successo',
      hasScreenshot: !!screenshotUrl
    };

  } catch (error) {
    LoggingService.error('Functions', 'Errore durante l\'invio del feedback', error);
    throw new functions.https.HttpsError("internal", "Failed to send feedback.");
  }
});

// Funzione helper per inviare email di feedback tramite Resend
async function sendFeedbackEmail(data: FeedbackEmailData) {
  const { userId, feedbackText, screenshotUrl, timestamp, appVersion } = data;
  
  const formattedDate = timestamp ? new Date(timestamp).toLocaleString('it-IT') : 'Data non disponibile';
  
  const emailSubject = `Nuovo Feedback da MyFrigo - ${formattedDate}`;
  
  // Costruisci il corpo dell'email
  let emailBody = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #2563eb;">Nuovo Feedback Ricevuto</h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">Dettagli Utente</h3>
          <p><strong>ID Utente:</strong> ${userId}</p>
          <p><strong>Data:</strong> ${formattedDate}</p>
          <p><strong>Versione App:</strong> ${appVersion}</p>
        </div>
        
        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">Testo del Feedback</h3>
          <p style="background-color: white; padding: 15px; border-radius: 4px; border-left: 4px solid #2563eb;">
            ${feedbackText.replace(/\n/g, '<br>')}
          </p>
        </div>
  `;
  
  // Aggiungi la sezione screenshot se presente
  if (screenshotUrl) {
    emailBody += `
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">Screenshot</h3>
          <p>È stato allegato uno screenshot al feedback. Clicca sul link sottostante per visualizzarlo:</p>
          <p><a href="${screenshotUrl}" target="_blank" style="color: #2563eb; text-decoration: underline;">Visualizza Screenshot</a></p>
          <p><strong>URL diretto:</strong> <a href="${screenshotUrl}" target="_blank">${screenshotUrl}</a></p>
        </div>
    `;
  }
  
  emailBody += `
        <div style="margin-top: 30px; padding: 15px; background-color: #e0f2fe; border-radius: 8px;">
          <p style="margin: 0; color: #0369a1; font-size: 14px;">
            Questo è un email automatica generata da MyFrigo. Per favore, non rispondere a questa email.
          </p>
        </div>
      </body>
    </html>
  `;

  try {
    // Configura l'invio email tramite Resend
    const resendApiKey = functions.config().resend.api_key;
    if (!resendApiKey) {
      throw new Error('Resend API key non configurata');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MyFrigo <noreply@myfrigo.app>',
        to: ['tuo-email@dominio.com'], // Sostituisci con la tua email
        subject: emailSubject,
        html: emailBody,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Resend API error: ${errorData.message || response.statusText}`);
    }

    const result = await response.json();
    LoggingService.info('Functions', 'Email di feedback inviata con successo tramite Resend', { emailId: result.id });

  } catch (emailError) {
    LoggingService.error('Functions', 'Errore durante l\'invio dell\'email di feedback tramite Resend', emailError);
    // Non bloccare il processo se l'email fallisce, il feedback è già salvato nel database
  }
}
