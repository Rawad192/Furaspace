/**
 * AstroNuit — FCM (Firebase Cloud Messaging) Service
 * Gestion des notifications push. Aucun DOM ici.
 */

import { getMessagingInstance } from '../firebase.js';
import { updateDocument } from './firestore.service.js';
import { getCurrentUser } from './auth.service.js';

// VAPID Key — générée dans Firebase Console > Project Settings > Cloud Messaging
const VAPID_KEY = 'REPLACE_WITH_YOUR_VAPID_KEY';

/**
 * Demande la permission de notification et récupère le FCM token
 * Sauvegarde automatiquement le token dans Firestore users/{uid}
 * @returns {Promise<string|null>} token FCM ou null si refusé
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('[FCM] Notifications non supportées par ce navigateur.');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.info('[FCM] Permission refusée par l\'utilisateur.');
    return null;
  }

  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  try {
    const { getToken } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js');
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });

    // Sauvegarder dans Firestore
    const user = getCurrentUser();
    if (user && token) {
      await updateDocument('users', user.uid, { fcmToken: token });
      console.info('[FCM] Token enregistré.');
    }

    return token;
  } catch (err) {
    console.error('[FCM] Erreur récupération token:', err);
    return null;
  }
}

/**
 * Écoute les messages reçus pendant que l'app est au premier plan
 * @param {function} callback - (payload) => void
 * @returns {Promise<function|null>} unsubscribe ou null
 */
export async function onForegroundMessage(callback) {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  const { onMessage } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js');
  return onMessage(messaging, callback);
}

/**
 * Supprime le FCM token (quand l'utilisateur désactive les notifications)
 * @returns {Promise<void>}
 */
export async function revokeNotificationPermission() {
  const user = getCurrentUser();
  if (user) {
    await updateDocument('users', user.uid, { fcmToken: null });
    console.info('[FCM] Token révoqué.');
  }
}
