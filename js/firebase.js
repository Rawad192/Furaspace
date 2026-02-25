/**
 * AstroNuit — Point d'initialisation Firebase unique (Modular SDK v10)
 *
 * Singleton garanti par le cache ES Module : quel que soit le nombre
 * d'imports, initializeApp() n'est appelé qu'une seule fois.
 *
 * Aucun autre fichier ne doit importer directement depuis les CDN Firebase.
 * Tous les modules client importent depuis ce fichier ou depuis js/services/.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';

import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

import { getStorage } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

// ── Config Firebase ─────────────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCOpGIXLCuLrdk2QIVsTrolCEp_Uur2vRM",
  authDomain: "fura-space.firebaseapp.com",
  projectId: "fura-space",
  storageBucket: "fura-space.firebasestorage.app",
  messagingSenderId: "370018371245",
  appId: "1:370018371245:web:7a688155accf6ce361a824",
  measurementId: "G-58JMSW8TYR"
};

// ── Init ────────────────────────────────────────────────────────────────────
const app = initializeApp(FIREBASE_CONFIG);

export const auth = getAuth(app);

// Firestore avec persistence offline multi-onglets (API moderne, remplace enableIndexedDbPersistence)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export const storage = getStorage(app);

// ── FCM (conditionnel — HTTPS requis + SW enregistré) ───────────────────────
let messaging = null;

export async function getMessagingInstance() {
  if (messaging) return messaging;
  if (!('serviceWorker' in navigator)) return null;
  try {
    const { getMessaging } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js');
    messaging = getMessaging(app);
    return messaging;
  } catch {
    return null;
  }
}

// ── Constantes globales ─────────────────────────────────────────────────────
export const COLLECTIONS = {
  USERS: 'users',
  LIEUX: 'lieux',
  EVENTS: 'events',
  CONSTELLATIONS: 'constellations',
  MEDIA: 'media',
  REPORTS: 'reports',
  SCORES: 'scores',
  ASTRO_EVENTS: 'astronomical_events',
  CACHE_WEATHER: 'cache_weather',
  CACHE_PLANETS: 'cache_planets',
  ADMIN_LOGS: 'admin_logs',
  ADMIN_NOTIFICATIONS: 'admin_notifications'
};

export const ROLES = {
  MEMBER: 'member',
  VERIFIED: 'verified_member',
  LEADER: 'constellation_leader',
  MODERATOR: 'regional_moderator',
  ADMIN: 'admin'
};

export const ROLE_HIERARCHY = {
  'member': 0,
  'verified_member': 1,
  'constellation_leader': 2,
  'regional_moderator': 3,
  'admin': 4
};

export const SCORE_ACTIONS = {
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

console.log('[AstroNuit] Firebase Modular SDK initialisé — projet:', FIREBASE_CONFIG.projectId);
