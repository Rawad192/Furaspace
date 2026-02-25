/**
 * AstroNuit — Cloud Function: applyPenalty (callable)
 * Appelée par l'admin dashboard pour appliquer des sanctions.
 * Réservée aux rôles admin / regional_moderator.
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

const SUSPENSION_DURATIONS = {
  warning: 0,       // Avertissement seul
  suspend_1d: 1,
  suspend_7d: 7,
  suspend_30d: 30,
  ban: -1           // -1 = ban permanent
};

exports.applyPenalty = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    // Vérification auth
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentification requise');
    }

    // Vérification rôle admin/moderator
    const callerDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!callerDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Profil appelant introuvable');
    }
    const callerRole = callerDoc.data().role;
    if (!['admin', 'regional_moderator'].includes(callerRole)) {
      throw new functions.https.HttpsError('permission-denied', 'Rôle insuffisant');
    }

    const { targetUserId, action, reason, reportId } = data;

    if (!targetUserId || !action) {
      throw new functions.https.HttpsError('invalid-argument', 'targetUserId et action requis');
    }

    const targetRef = db.collection('users').doc(targetUserId);
    const targetDoc = await targetRef.get();
    if (!targetDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Utilisateur cible introuvable');
    }

    const targetData = targetDoc.data();
    const now = admin.firestore.FieldValue.serverTimestamp();
    const updates = {};
    let logMessage = '';

    switch (action) {
      case 'warning':
        updates['moderation.warnings'] = admin.firestore.FieldValue.increment(1);
        logMessage = `Avertissement envoyé à ${targetUserId}`;
        break;

      case 'strike':
        updates['moderation.strikes'] = admin.firestore.FieldValue.increment(1);
        updates['score.total'] = admin.firestore.FieldValue.increment(-10);
        updates['score.monthly'] = admin.firestore.FieldValue.increment(-10);
        logMessage = `Strike appliqué à ${targetUserId} (−10 pts)`;

        // Auto-suspend après 3 strikes
        const newStrikes = (targetData.moderation?.strikes || 0) + 1;
        if (newStrikes >= 5) {
          updates['moderation.banned'] = true;
          updates['role'] = 'banned';
          logMessage += ' — BAN PERMANENT (5 strikes)';
        } else if (newStrikes >= 3) {
          const suspendUntil = new Date();
          suspendUntil.setDate(suspendUntil.getDate() + 7);
          updates['moderation.suspended'] = true;
          updates['moderation.suspendedUntil'] = admin.firestore.Timestamp.fromDate(suspendUntil);
          logMessage += ' — Suspension 7 jours (3 strikes)';
        }
        break;

      case 'suspend_1d':
      case 'suspend_7d':
      case 'suspend_30d': {
        const days = SUSPENSION_DURATIONS[action];
        const suspendUntil = new Date();
        suspendUntil.setDate(suspendUntil.getDate() + days);
        updates['moderation.suspended'] = true;
        updates['moderation.suspendedUntil'] = admin.firestore.Timestamp.fromDate(suspendUntil);
        logMessage = `Suspension ${days} jours pour ${targetUserId}`;
        break;
      }

      case 'ban':
        updates['moderation.banned'] = true;
        updates['moderation.suspended'] = false;
        updates['role'] = 'banned';
        logMessage = `BAN PERMANENT pour ${targetUserId}`;
        break;

      case 'unban':
        if (callerRole !== 'admin') {
          throw new functions.https.HttpsError('permission-denied', 'Seul un admin peut débannir');
        }
        updates['moderation.banned'] = false;
        updates['moderation.suspended'] = false;
        updates['moderation.suspendedUntil'] = null;
        updates['role'] = 'member';
        logMessage = `Débannissement de ${targetUserId}`;
        break;

      case 'delete_content':
        // La suppression de contenu est gérée séparément via le doc ID
        // Ici on logue juste l'action
        logMessage = `Contenu supprimé pour ${targetUserId}`;
        break;

      default:
        throw new functions.https.HttpsError('invalid-argument', `Action inconnue: ${action}`);
    }

    // Appliquer les mises à jour
    if (Object.keys(updates).length > 0) {
      await targetRef.update(updates);
    }

    // Résoudre le signalement si fourni
    if (reportId) {
      await db.collection('reports').doc(reportId).update({
        status: 'resolved',
        reviewedBy: context.auth.uid,
        action,
        resolvedAt: now
      });
    }

    // Log de l'action admin
    await db.collection('admin_logs').add({
      action,
      targetUserId,
      callerUid: context.auth.uid,
      callerRole,
      reason: reason || '',
      reportId: reportId || null,
      createdAt: now
    });

    functions.logger.info(`[applyPenalty] ${logMessage} par ${context.auth.uid}`);
    return { success: true, message: logMessage };
  });
