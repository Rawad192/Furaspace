/**
 * AstroNuit — Cloud Function: updateScore
 * Déclencheurs Firestore qui mettent à jour atomiquement le score utilisateur
 * sur chaque action (like reçu, spot ajouté, événement organisé, etc.)
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

// ── Table de points (synchronisée avec SCORE_ACTIONS dans firebase-config.js) ──
const POINTS = {
  LIKE_RECEIVED: 1,
  COMMENT_POSTED: 2,
  SPOT_ADDED: 5,
  EVENT_ORGANIZED: 8,
  MEDIA_POSTED: 3,
  EVENT_ATTENDED: 2,
  REPORT_VALIDATED: 3,
  WEEKLY_BONUS: 5,
  DISLIKE_RECEIVED: -1,
  STRIKE: -10
};

/**
 * Incrémente le score d'un utilisateur de façon atomique
 * @param {string} userId
 * @param {number} delta - positif ou négatif
 * @param {string} reason - pour les logs
 */
async function incrementUserScore(userId, delta, reason = '') {
  if (!userId || delta === 0) return;

  const userRef = db.collection('users').doc(userId);
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const batch = db.batch();

  // Incrément atomique sur le doc utilisateur
  batch.update(userRef, {
    'score.total': admin.firestore.FieldValue.increment(delta),
    'score.monthly': admin.firestore.FieldValue.increment(delta)
  });

  // Upsert sur la collection scores (agrégation mensuelle pour leaderboard)
  const scoreRef = db.collection('scores').doc(`${userId}_${period}`);
  batch.set(scoreRef, {
    userId,
    period,
    score: admin.firestore.FieldValue.increment(delta),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  await batch.commit();
  functions.logger.info(`[updateScore] ${userId} ${delta > 0 ? '+' : ''}${delta} (${reason})`);
}

// ── Trigger : spot ajouté ─────────────────────────────────────────────────────
exports.updateScore = {

  onSpotCreated: functions
    .region('europe-west1')
    .firestore.document('lieux/{lieuId}')
    .onCreate(async (snap) => {
      const data = snap.data();
      if (!data.createdBy || data.createdBy === '[supprimé]') return;

      await incrementUserScore(data.createdBy, POINTS.SPOT_ADDED, 'spot_added');

      // Incrémenter le compteur stats
      await db.collection('users').doc(data.createdBy).update({
        'stats.spotsAdded': admin.firestore.FieldValue.increment(1),
        'lieux_ajoutes': admin.firestore.FieldValue.arrayUnion(snap.id)
      });

      // Vérifier badges après la mise à jour
      await checkBadges(data.createdBy, 'spots');
    }),

  // ── Trigger : réaction sur media ──────────────────────────────────────────
  onMediaReaction: functions
    .region('europe-west1')
    .firestore.document('media/{mediaId}/reactions/{reactionId}')
    .onCreate(async (snap) => {
      const reaction = snap.data();
      const mediaId = snap.ref.parent.parent.id;

      // Récupérer l'auteur du media
      const mediaDoc = await db.collection('media').doc(mediaId).get();
      if (!mediaDoc.exists) return;
      const mediaData = mediaDoc.data();
      const authorId = mediaData.userId;
      if (!authorId || authorId === reaction.userId) return; // pas d'auto-like

      if (reaction.type === 'like') {
        await incrementUserScore(authorId, POINTS.LIKE_RECEIVED, 'like_received');
        await db.collection('media').doc(mediaId).update({
          likes: admin.firestore.FieldValue.increment(1)
        });
      } else if (reaction.type === 'dislike') {
        await incrementUserScore(authorId, POINTS.DISLIKE_RECEIVED, 'dislike_received');
        await db.collection('media').doc(mediaId).update({
          dislikes: admin.firestore.FieldValue.increment(1)
        });
      }
    }),

  onMediaReactionDeleted: functions
    .region('europe-west1')
    .firestore.document('media/{mediaId}/reactions/{reactionId}')
    .onDelete(async (snap) => {
      const reaction = snap.data();
      const mediaId = snap.ref.parent.parent.id;

      const mediaDoc = await db.collection('media').doc(mediaId).get();
      if (!mediaDoc.exists) return;
      const authorId = mediaDoc.data().userId;
      if (!authorId || authorId === reaction.userId) return;

      // Inverser le score
      if (reaction.type === 'like') {
        await incrementUserScore(authorId, -POINTS.LIKE_RECEIVED, 'like_removed');
        await db.collection('media').doc(mediaId).update({
          likes: admin.firestore.FieldValue.increment(-1)
        });
      } else if (reaction.type === 'dislike') {
        await incrementUserScore(authorId, -POINTS.DISLIKE_RECEIVED, 'dislike_removed');
        await db.collection('media').doc(mediaId).update({
          dislikes: admin.firestore.FieldValue.increment(-1)
        });
      }
    }),

  // ── Trigger : commentaire ajouté ──────────────────────────────────────────
  onCommentCreated: functions
    .region('europe-west1')
    .firestore.document('{collection}/{docId}/comments/{commentId}')
    .onCreate(async (snap) => {
      const comment = snap.data();
      if (!comment.userId) return;
      await incrementUserScore(comment.userId, POINTS.COMMENT_POSTED, 'comment_posted');
    }),

  // ── Trigger : événement créé ──────────────────────────────────────────────
  onEventCreated: functions
    .region('europe-west1')
    .firestore.document('events/{eventId}')
    .onCreate(async (snap) => {
      const event = snap.data();
      if (!event.organizerId || event.organizerId === '[supprimé]') return;
      await incrementUserScore(event.organizerId, POINTS.EVENT_ORGANIZED, 'event_organized');
      await db.collection('users').doc(event.organizerId).update({
        'stats.eventsOrganized': admin.firestore.FieldValue.increment(1)
      });
    }),

  // ── Trigger : participation à un événement (ajout dans le tableau participants) ──
  onEventParticipantAdded: functions
    .region('europe-west1')
    .firestore.document('events/{eventId}')
    .onUpdate(async (change) => {
      const before = change.before.data();
      const after  = change.after.data();

      if (!before.participants || !after.participants) return;

      // Détecter les nouveaux participants
      const newParticipants = after.participants.filter(uid => !before.participants.includes(uid));
      for (const uid of newParticipants) {
        await incrementUserScore(uid, POINTS.EVENT_ATTENDED, 'event_attended');
        await db.collection('users').doc(uid).update({
          'stats.eventsAttended': admin.firestore.FieldValue.increment(1)
        });
      }
    }),

  // ── Trigger : media posté ─────────────────────────────────────────────────
  onMediaCreated: functions
    .region('europe-west1')
    .firestore.document('media/{mediaId}')
    .onCreate(async (snap) => {
      const media = snap.data();
      if (!media.userId) return;
      await incrementUserScore(media.userId, POINTS.MEDIA_POSTED, 'media_posted');
      await db.collection('users').doc(media.userId).update({
        'stats.photosPosted': admin.firestore.FieldValue.increment(1)
      });
    })
};

// ── Vérification badges ───────────────────────────────────────────────────────
async function checkBadges(userId, triggerType) {
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) return;

  const userData = userDoc.data();
  const stats = userData.stats || {};
  const currentBadges = userData.badges || [];
  const newBadges = [];

  const BADGE_RULES = [
    { id: 'primo',       condition: () => stats.spotsAdded >= 1 },
    { id: 'cartographe', condition: () => stats.spotsAdded >= 5 },
    { id: 'passionne',   condition: () => stats.spotsAdded >= 10 },
    { id: 'legende',     condition: () => stats.spotsAdded >= 25 },
    { id: 'aventurier',  condition: () => stats.checkins >= 10 },
    { id: 'photographe', condition: () => stats.photosPosted >= 10 }
  ];

  for (const rule of BADGE_RULES) {
    if (!currentBadges.includes(rule.id) && rule.condition()) {
      newBadges.push(rule.id);
    }
  }

  if (newBadges.length > 0) {
    await db.collection('users').doc(userId).update({
      badges: admin.firestore.FieldValue.arrayUnion(...newBadges)
    });
    functions.logger.info(`[checkBadges] Nouveaux badges pour ${userId}: ${newBadges.join(', ')}`);
  }
}
