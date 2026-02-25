/**
 * AstroNuit — Cloud Function: onUserCreate
 * Déclenché à chaque création de compte Firebase Auth.
 * Crée le document Firestore users/{uid} avec les valeurs par défaut.
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

exports.onUserCreate = functions
  .region('europe-west1')
  .auth.user()
  .onCreate(async (user) => {
    const { uid, email, displayName, photoURL } = user;

    const now = admin.firestore.FieldValue.serverTimestamp();

    const userDoc = {
      uid,
      email,
      pseudo: displayName || generateDefaultPseudo(uid),
      emailVerified: user.emailVerified || false,
      role: 'member',
      region: '',
      level: 'beginner',
      equipment: '',
      photoURL: photoURL || '',
      bio: '',

      score: {
        total: 0,
        monthly: 0,
        constellationId: null
      },

      stats: {
        spotsAdded: 0,
        eventsOrganized: 0,
        eventsAttended: 0,
        photosPosted: 0,
        checkins: 0,
        reportsValidated: 0
      },

      badges: [],
      departements_visites: [],
      constellationId: null,
      following: [],
      followers: [],
      lieux_ajoutes: [],
      favoris_lieux: [],
      collections: [],

      moderation: {
        warnings: 0,
        strikes: 0,
        suspended: false,
        suspendedUntil: null,
        banned: false
      },

      notifications: {
        newSpotInRegion: true,
        clearSkyOnFavorite: true,
        reviewOnMySpot: true,
        socialActivity: false
      },

      fcmToken: null,
      createdAt: now,
      lastActiveAt: now,
      gdprConsentAt: now // consentement enregistré à l'inscription
    };

    try {
      await db.collection('users').doc(uid).set(userDoc);
      functions.logger.info(`[onUserCreate] Profil créé pour ${uid} (${email})`);

      // Envoyer l'email de vérification si pas encore vérifié
      // Note : sendEmailVerification() est côté client (Firebase Auth SDK)
      // Ici on peut envoyer un email de bienvenue via nodemailer si configuré

    } catch (error) {
      functions.logger.error(`[onUserCreate] Erreur création profil ${uid}:`, error);
      throw new functions.https.HttpsError('internal', 'Erreur création profil utilisateur');
    }
  });

/**
 * Génère un pseudo par défaut depuis l'UID
 * @param {string} uid
 * @returns {string}
 */
function generateDefaultPseudo(uid) {
  return `astro_${uid.substring(0, 6).toLowerCase()}`;
}
