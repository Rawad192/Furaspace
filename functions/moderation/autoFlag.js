/**
 * AstroNuit — Cloud Function: autoFlag
 * Déclenché à la création d'un signalement (collection reports/).
 * Vérifie le seuil (3 signalements) et masque automatiquement le contenu.
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();
const AUTO_FLAG_THRESHOLD = 3;

exports.autoFlag = functions
  .region('europe-west1')
  .firestore.document('reports/{reportId}')
  .onCreate(async (snap) => {
    const report = snap.data();
    const { targetType, targetId } = report;

    if (!targetType || !targetId) {
      functions.logger.warn('[autoFlag] Signalement sans targetType/targetId:', snap.id);
      return;
    }

    try {
      // Compter les signalements ouverts sur cette cible
      const reportsSnap = await db.collection('reports')
        .where('targetType', '==', targetType)
        .where('targetId', '==', targetId)
        .where('status', 'in', ['open', 'reviewing'])
        .get();

      const reportCount = reportsSnap.size;

      // Mettre à jour le compteur sur la cible
      const targetRef = getTargetRef(targetType, targetId);
      if (!targetRef) return;

      await targetRef.update({
        reportCount: admin.firestore.FieldValue.increment(1)
      });

      // Auto-flag si seuil atteint
      if (reportCount >= AUTO_FLAG_THRESHOLD) {
        await targetRef.update({ flagged: true });

        functions.logger.warn(
          `[autoFlag] ${targetType}/${targetId} auto-flaggé après ${reportCount} signalements`
        );

        // Notifier les admins via un doc dans une collection dédiée
        await db.collection('admin_notifications').add({
          type: 'auto_flag',
          targetType,
          targetId,
          reportCount,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'unread'
        });

        // Changer le statut des signalements en "reviewing"
        const batch = db.batch();
        reportsSnap.forEach(doc => {
          if (doc.data().status === 'open') {
            batch.update(doc.ref, { status: 'reviewing' });
          }
        });
        await batch.commit();
      }

    } catch (error) {
      functions.logger.error(`[autoFlag] Erreur pour ${targetType}/${targetId}:`, error);
    }
  });

/**
 * Retourne la référence Firestore de la cible selon son type
 */
function getTargetRef(targetType, targetId) {
  const collectionMap = {
    spot: 'lieux',
    event: 'events',
    media: 'media',
    user: 'users'
  };

  const collection = collectionMap[targetType];
  if (!collection) return null;
  return db.collection(collection).doc(targetId);
}
