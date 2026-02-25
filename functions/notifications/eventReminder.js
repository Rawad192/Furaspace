/**
 * AstroNuit — Cloud Function: eventReminder (CRON)
 * Exécuté chaque jour à 10h00 (Europe/Paris).
 * Envoie un rappel FCM aux participants des sorties prévues le lendemain.
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();
const messaging = admin.messaging();

exports.eventReminder = functions
  .region('europe-west1')
  .pubsub.schedule('0 10 * * *')
  .timeZone('Europe/Paris')
  .onRun(async () => {
    functions.logger.info('[eventReminder] Démarrage du job quotidien 10h00');

    try {
      // Calculer la plage "demain" (00:00 → 23:59)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(23, 59, 59, 999);

      const tomorrowTs = admin.firestore.Timestamp.fromDate(tomorrow);
      const tomorrowEndTs = admin.firestore.Timestamp.fromDate(tomorrowEnd);

      // Récupérer les événements de demain avec des participants
      const eventsSnap = await db.collection('events')
        .where('date', '>=', tomorrowTs)
        .where('date', '<=', tomorrowEndTs)
        .where('status', '==', 'active')
        .get();

      functions.logger.info(`[eventReminder] ${eventsSnap.size} événements demain`);

      let totalSent = 0;

      for (const eventDoc of eventsSnap.docs) {
        const event = eventDoc.data();
        if (!event.participants?.length) continue;

        // Récupérer les tokens FCM de tous les participants
        const participantIds = event.participants.filter(uid => uid !== event.organizerId);

        const tokens = [];
        for (const uid of participantIds) {
          const userDoc = await db.collection('users').doc(uid).get();
          if (!userDoc.exists) continue;
          const userData = userDoc.data();
          if (userData.fcmToken && userData.notifications?.clearSkyOnFavorite !== false) {
            tokens.push(userData.fcmToken);
          }
        }

        if (!tokens.length) continue;

        // Formater l'heure de l'événement
        const eventDate = event.date?.toDate();
        const timeStr = eventDate
          ? eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          : '';

        const title = `📅 Rappel sortie demain !`;
        const body = `"${event.title}" · ${timeStr} · ${event.locationName || 'Lieu à confirmer'}`;

        // Envoyer en batch (FCM limite 500 tokens/envoi)
        const chunks = chunkArray(tokens, 499);
        for (const chunk of chunks) {
          try {
            const response = await messaging.sendEachForMulticast({
              tokens: chunk,
              notification: { title, body },
              data: {
                type: 'event_reminder',
                eventId: eventDoc.id,
                eventTitle: event.title
              }
            });

            // Nettoyer les tokens invalides
            response.responses.forEach((resp, idx) => {
              if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
                // Trouver l'utilisateur correspondant et vider son token
                // (simplification — en production, tracker l'index → uid)
                functions.logger.warn(`[eventReminder] Token invalide index ${idx}`);
              }
            });

            totalSent += response.successCount;
          } catch (batchError) {
            functions.logger.error('[eventReminder] Erreur batch FCM:', batchError.message);
          }
        }
      }

      functions.logger.info(`[eventReminder] ${totalSent} rappels envoyés`);

    } catch (error) {
      functions.logger.error('[eventReminder] Erreur job:', error);
    }
  });

/**
 * Divise un tableau en morceaux de taille `size`
 */
function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
