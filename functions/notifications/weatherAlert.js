/**
 * AstroNuit — Cloud Function: weatherAlert (CRON)
 * Exécuté chaque jour à 18h00 (Europe/Paris).
 * Vérifie les conditions météo sur les spots favoris des membres
 * et envoie une notification FCM si ciel dégagé.
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

const db = admin.firestore();
const messaging = admin.messaging();

exports.weatherAlert = functions
  .region('europe-west1')
  .pubsub.schedule('0 18 * * *')
  .timeZone('Europe/Paris')
  .onRun(async () => {
    functions.logger.info('[weatherAlert] Démarrage du job quotidien 18h00');

    try {
      // Récupérer les utilisateurs avec clearSkyOnFavorite activé ET un token FCM
      const usersSnap = await db.collection('users')
        .where('notifications.clearSkyOnFavorite', '==', true)
        .where('fcmToken', '!=', null)
        .limit(500) // Traiter par lots de 500
        .get();

      functions.logger.info(`[weatherAlert] ${usersSnap.size} utilisateurs à notifier potentiellement`);

      const apiKey = functions.config().openweathermap?.key || process.env.OPENWEATHERMAP_KEY;
      if (!apiKey) {
        functions.logger.error('[weatherAlert] Clé API manquante, job annulé');
        return;
      }

      let notified = 0;
      const weatherCache = new Map(); // cache session pour éviter appels dupliqués

      for (const userDoc of usersSnap.docs) {
        const user = userDoc.data();
        if (!user.favoris_lieux?.length || !user.fcmToken) continue;

        // Prendre jusqu'à 3 spots favoris
        const favIds = user.favoris_lieux.slice(0, 3);
        let bestCondition = null;
        let bestSpotName = null;

        for (const lieuId of favIds) {
          const lieuDoc = await db.collection('lieux').doc(lieuId).get();
          if (!lieuDoc.exists) continue;

          const lieu = lieuDoc.data();
          if (!lieu.lat || !lieu.lng) continue;

          // Clé de cache météo (arrondi 0.1°)
          const cacheKey = `${Math.round(lieu.lat * 10) / 10}_${Math.round(lieu.lng * 10) / 10}`;

          let weather = weatherCache.get(cacheKey);
          if (!weather) {
            try {
              const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lieu.lat}&lon=${lieu.lng}&units=metric&appid=${apiKey}`;
              const response = await fetch(url, { timeout: 6000 });
              if (response.ok) {
                const data = await response.json();
                weather = {
                  clouds: data.clouds?.all ?? 100,
                  cityName: data.name || lieu.name
                };
                weatherCache.set(cacheKey, weather);
              }
            } catch (fetchError) {
              functions.logger.warn(`[weatherAlert] Erreur météo pour ${lieuId}:`, fetchError.message);
              continue;
            }
          }

          // Ciel dégagé si < 20% de nuages
          if (weather && weather.clouds < 20) {
            if (!bestCondition || weather.clouds < bestCondition) {
              bestCondition = weather.clouds;
              bestSpotName = lieu.name;
            }
          }
        }

        // Envoyer notification si un spot favorable trouvé
        if (bestSpotName && user.fcmToken) {
          try {
            await messaging.send({
              token: user.fcmToken,
              notification: {
                title: '🌟 Ciel dégagé ce soir !',
                body: `${bestCondition}% de nuages sur "${bestSpotName}". Préparez votre matériel !`
              },
              data: {
                type: 'clear_sky',
                spotName: bestSpotName,
                clouds: String(bestCondition)
              },
              android: { priority: 'normal' },
              apns: { payload: { aps: { badge: 1 } } }
            });
            notified++;
          } catch (fcmError) {
            // Token invalide/expiré → nettoyer
            if (fcmError.code === 'messaging/registration-token-not-registered') {
              await db.collection('users').doc(userDoc.id).update({ fcmToken: null });
            }
          }
        }
      }

      functions.logger.info(`[weatherAlert] ${notified} notifications envoyées`);

    } catch (error) {
      functions.logger.error('[weatherAlert] Erreur job:', error);
    }
  });
