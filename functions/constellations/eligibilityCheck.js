/**
 * AstroNuit — Cloud Function: eligibilityCheck (callable)
 * Vérifie si l'utilisateur authentifié est éligible pour créer une Constellation.
 * Appelée depuis le client avant d'afficher le formulaire de création.
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

const ELIGIBILITY_RULES = {
  MIN_ACCOUNT_AGE_DAYS: 7,
  MIN_CONTRIBUTIONS: 5, // spots + events + photos combinés
  MAX_STRIKES: 0
};

exports.eligibilityCheck = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Vous devez être connecté');
    }

    const uid = context.auth.uid;

    try {
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Profil utilisateur introuvable');
      }

      const user = userDoc.data();
      const reasons = [];

      // Règle 1 : email vérifié
      if (!user.emailVerified) {
        reasons.push('Votre email n\'est pas encore vérifié');
      }

      // Règle 2 : âge du compte
      const createdAt = user.createdAt?.toDate();
      if (createdAt) {
        const ageMs = Date.now() - createdAt.getTime();
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        if (ageDays < ELIGIBILITY_RULES.MIN_ACCOUNT_AGE_DAYS) {
          const remainingDays = Math.ceil(ELIGIBILITY_RULES.MIN_ACCOUNT_AGE_DAYS - ageDays);
          reasons.push(`Compte trop récent (encore ${remainingDays} jour(s) à attendre)`);
        }
      }

      // Règle 3 : contributions minimales
      const stats = user.stats || {};
      const contributions = (stats.spotsAdded || 0) + (stats.eventsOrganized || 0) + (stats.photosPosted || 0);
      if (contributions < ELIGIBILITY_RULES.MIN_CONTRIBUTIONS) {
        const missing = ELIGIBILITY_RULES.MIN_CONTRIBUTIONS - contributions;
        reasons.push(`Pas assez de contributions (encore ${missing} contribution(s) requise(s))`);
      }

      // Règle 4 : pas de strikes actifs
      const strikes = user.moderation?.strikes || 0;
      if (strikes > ELIGIBILITY_RULES.MAX_STRIKES) {
        reasons.push(`Votre compte a ${strikes} strike(s) actif(s)`);
      }

      // Règle 5 : pas déjà leader d'une constellation
      if (user.constellationId) {
        const constDoc = await db.collection('constellations').doc(user.constellationId).get();
        if (constDoc.exists && constDoc.data().leaderId === uid) {
          reasons.push('Vous êtes déjà leader d\'une Constellation');
        }
      }

      // Règle 6 : pas banni / suspendu
      if (user.moderation?.banned) {
        reasons.push('Votre compte est banni');
      }
      if (user.moderation?.suspended) {
        const suspendedUntil = user.moderation.suspendedUntil?.toDate();
        if (suspendedUntil && suspendedUntil > new Date()) {
          reasons.push(`Votre compte est suspendu jusqu'au ${suspendedUntil.toLocaleDateString('fr-FR')}`);
        }
      }

      const eligible = reasons.length === 0;

      functions.logger.info(`[eligibilityCheck] ${uid} — éligible: ${eligible}${reasons.length ? ' — ' + reasons.join(', ') : ''}`);

      return {
        eligible,
        reasons,
        stats: {
          contributions,
          strikes,
          accountAgeDays: createdAt ? Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 0
        }
      };

    } catch (error) {
      if (error instanceof functions.https.HttpsError) throw error;
      functions.logger.error('[eligibilityCheck] Erreur:', error);
      throw new functions.https.HttpsError('internal', 'Erreur vérification éligibilité');
    }
  });
