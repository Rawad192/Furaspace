/**
 * AstroNuit — Auth Service
 * Couche d'abstraction Firebase Auth. Aucun DOM ici.
 * Tous les appels Firebase Auth passent par ce fichier.
 */

import { auth } from '../firebase.js';

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword as fbUpdatePassword,
  updateProfile as fbUpdateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// ── Erreurs Firebase → Français ─────────────────────────────────────────────
const ERROR_MESSAGES = {
  'auth/user-not-found': 'Aucun compte associé à cet email.',
  'auth/wrong-password': 'Mot de passe incorrect.',
  'auth/invalid-credential': 'Identifiants invalides. Vérifiez votre email et mot de passe.',
  'auth/email-already-in-use': 'Cet email est déjà utilisé par un autre compte.',
  'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
  'auth/invalid-email': 'Format d\'email invalide.',
  'auth/too-many-requests': 'Trop de tentatives. Réessayez dans quelques minutes.',
  'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion internet.',
  'auth/popup-closed-by-user': 'Connexion Google annulée.',
  'auth/cancelled-popup-request': 'Connexion Google interrompue.',
  'auth/account-exists-with-different-credential': 'Un compte existe déjà avec une autre méthode de connexion.',
  'auth/requires-recent-login': 'Veuillez vous reconnecter pour effectuer cette action.',
  'auth/user-disabled': 'Ce compte a été désactivé par un administrateur.',
  'auth/operation-not-allowed': 'Cette méthode de connexion n\'est pas activée.',
  'auth/expired-action-code': 'Ce lien a expiré. Demandez-en un nouveau.',
  'auth/invalid-action-code': 'Ce lien est invalide ou a déjà été utilisé.'
};

/**
 * Traduit une erreur Firebase Auth en message français
 * @param {Error} error
 * @returns {string}
 */
export function translateError(error) {
  const code = error?.code || '';
  return ERROR_MESSAGES[code] || `Erreur inattendue (${code || error.message})`;
}

// ── Connexion ───────────────────────────────────────────────────────────────

/**
 * Connexion email + mot de passe
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Inscription email + mot de passe
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function signUp(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Connexion via Google OAuth (popup)
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function signInGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(auth, provider);
}

/**
 * Déconnexion
 * @returns {Promise<void>}
 */
export async function signOutUser() {
  sessionStorage.removeItem('astronuit_user_role');
  return fbSignOut(auth);
}

// ── État d'authentification ─────────────────────────────────────────────────

/**
 * Écoute les changements d'état d'authentification
 * @param {function} callback - (user|null) => void
 * @returns {function} unsubscribe
 */
export function onAuthChanged(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Retourne l'utilisateur courant (synchrone — null si pas encore résolu)
 * @returns {import('firebase/auth').User|null}
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Attend que l'état auth soit résolu (utile au chargement initial)
 * Timeout de sécurité pour éviter un blocage infini si Firebase Auth
 * ne se résout pas (problème réseau, init échouée).
 * @param {number} timeoutMs - délai max en ms (défaut: 8000)
 * @returns {Promise<import('firebase/auth').User|null>}
 */
export function waitForAuth(timeoutMs = 8000) {
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      unsub();
      console.warn('[AstroNuit] waitForAuth timeout — traitement comme non-authentifié');
      resolve(null);
    }, timeoutMs);

    const unsub = onAuthStateChanged(auth, user => {
      clearTimeout(timer);
      unsub();
      resolve(user);
    });
  });
}

// ── Email ───────────────────────────────────────────────────────────────────

/**
 * Envoie l'email de vérification
 * @param {import('firebase/auth').User} user
 * @returns {Promise<void>}
 */
export async function sendVerification(user) {
  return sendEmailVerification(user || auth.currentUser);
}

/**
 * Envoie un email de réinitialisation de mot de passe
 * @param {string} email
 * @returns {Promise<void>}
 */
export async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

// ── Profil ──────────────────────────────────────────────────────────────────

/**
 * Met à jour le displayName et/ou photoURL sur Firebase Auth
 * @param {object} profileData - { displayName?, photoURL? }
 * @returns {Promise<void>}
 */
export async function updateAuthProfile(profileData) {
  return fbUpdateProfile(auth.currentUser, profileData);
}

/**
 * Change le mot de passe (nécessite reauthentication récente)
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
export async function changePassword(newPassword) {
  return fbUpdatePassword(auth.currentUser, newPassword);
}

/**
 * Ré-authentifie l'utilisateur avec son mot de passe actuel
 * Requis avant les opérations sensibles (changement mdp, suppression compte)
 * @param {string} currentPassword
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function reauthenticate(currentPassword) {
  const user = auth.currentUser;
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  return reauthenticateWithCredential(user, credential);
}

/**
 * Supprime le compte Firebase Auth de l'utilisateur courant
 * Note : Cloud Function onUserDelete se déclenche automatiquement
 * @returns {Promise<void>}
 */
export async function deleteAccount() {
  return deleteUser(auth.currentUser);
}
