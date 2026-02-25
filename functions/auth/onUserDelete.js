/**
 * AstroNuit — Cloud Function: onUserDelete
 * Déclenché à la suppression d'un compte Firebase Auth.
 * Supprime le document Firestore et anonymise les contenus publics.
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();
const storage = admin.storage();

exports.onUserDelete = functions
  .region('europe-west1')
  .auth.user()
  .onDelete(async (user) => {
    const { uid } = user;
    const batch = db.batch();

    try {
      functions.logger.info(`[onUserDelete] Début suppression données pour ${uid}`);

      // 1. Supprimer le document utilisateur
      batch.delete(db.collection('users').doc(uid));

      // 2. Supprimer les scores associés
      const scoresSnap = await db.collection('scores')
        .where('userId', '==', uid)
        .get();
      scoresSnap.forEach(doc => batch.delete(doc.ref));

      // 3. Anonymiser les spots créés (ne pas supprimer — valeur communautaire)
      const lieuxSnap = await db.collection('lieux')
        .where('createdBy', '==', uid)
        .get();
      lieuxSnap.forEach(doc => {
        batch.update(doc.ref, {
          createdBy: '[supprimé]',
          createdByPseudo: '[utilisateur supprimé]'
        });
      });

      // 4. Anonymiser les événements organisés
      const eventsSnap = await db.collection('events')
        .where('organizerId', '==', uid)
        .get();
      eventsSnap.forEach(doc => {
        batch.update(doc.ref, {
          organizerId: '[supprimé]',
          organizerPseudo: '[utilisateur supprimé]'
        });
      });

      // 5. Supprimer les médias (photos personnelles)
      const mediaSnap = await db.collection('media')
        .where('userId', '==', uid)
        .get();
      mediaSnap.forEach(doc => batch.delete(doc.ref));

      // 6. Retirer de toutes les constellations
      const constSnap = await db.collection('constellations')
        .where('members', 'array-contains', uid)
        .get();
      constSnap.forEach(doc => {
        batch.update(doc.ref, {
          members: admin.firestore.FieldValue.arrayRemove(uid),
          memberCount: admin.firestore.FieldValue.increment(-1)
        });
      });

      await batch.commit();

      // 7. Supprimer les fichiers Storage du compte
      try {
        await storage.bucket().deleteFiles({ prefix: `media/${uid}/` });
        functions.logger.info(`[onUserDelete] Fichiers Storage supprimés pour ${uid}`);
      } catch (storageError) {
        // Non bloquant si le dossier n'existe pas
        functions.logger.warn(`[onUserDelete] Storage suppression partielle pour ${uid}:`, storageError.message);
      }

      functions.logger.info(`[onUserDelete] Données supprimées/anonymisées pour ${uid}`);

    } catch (error) {
      functions.logger.error(`[onUserDelete] Erreur suppression données ${uid}:`, error);
      // Ne pas throw pour ne pas bloquer la suppression Auth
    }
  });
