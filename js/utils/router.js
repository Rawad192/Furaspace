/**
 * AstroNuit — Router / Navigation Guards
 * Guards d'authentification et de rôle pour les pages protégées.
 */

import { waitForAuth, onAuthChanged } from '../services/auth.service.js';
import { getUserRole } from '../services/firestore.service.js';
import { ROLE_HIERARCHY } from '../firebase.js';

/**
 * Guard d'authentification — redirige vers connexion.html si non connecté
 * @param {boolean} requireVerified - exige aussi emailVerified (défaut: false)
 * @param {string} redirectUrl - URL de redirection si non authentifié
 * @returns {Promise<import('firebase/auth').User>}
 */
export async function requireAuth(requireVerified = false, redirectUrl = 'connexion.html') {
  const user = await waitForAuth();

  if (!user) {
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `${redirectUrl}?redirect=${returnTo}`;
    // Retourne une promesse qui ne résout jamais (la page va rediriger)
    return new Promise(() => {});
  }

  if (requireVerified && !user.emailVerified) {
    window.location.href = `${redirectUrl}?message=verify-email`;
    return new Promise(() => {});
  }

  return user;
}

/**
 * Guard de rôle — vérifie que l'utilisateur a le rôle minimum requis
 * @param {string} minRole - rôle minimum (ex: 'verified_member', 'admin')
 * @param {string} redirectUrl - URL si rôle insuffisant
 * @returns {Promise<{ user: object, role: string }>}
 */
export async function requireRole(minRole, redirectUrl = 'index.html') {
  const user = await requireAuth(true);
  const role = await getUserRole(user.uid);
  const userLevel = ROLE_HIERARCHY[role] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[minRole] ?? 0;

  if (userLevel < requiredLevel) {
    console.warn(`[Router] Accès refusé. Requis: ${minRole}, actuel: ${role}`);
    window.location.href = redirectUrl;
    return new Promise(() => {});
  }

  return { user, role };
}

/**
 * Redirige si l'utilisateur EST déjà connecté (ex: page connexion.html)
 * Ne bloque jamais l'appelant en cas d'erreur (la page connexion doit toujours s'afficher).
 * @param {string} redirectUrl - URL de redirection si connecté
 * @returns {Promise<void>}
 */
export async function redirectIfAuthenticated(redirectUrl = 'index.html') {
  let user;
  try {
    user = await waitForAuth();
  } catch (e) {
    console.warn('[Router] waitForAuth échoué dans redirectIfAuthenticated:', e.message);
    return; // pas de redirection — on laisse la page s'afficher
  }
  if (user) {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    window.location.href = redirect || redirectUrl;
  }
}

/**
 * Récupère le paramètre ?redirect= pour rediriger après connexion
 * @param {string} fallback - URL par défaut si pas de redirect
 * @returns {string}
 */
export function getRedirectUrl(fallback = 'index.html') {
  const params = new URLSearchParams(window.location.search);
  return params.get('redirect') || fallback;
}

/**
 * Récupère un message spécial dans l'URL (ex: ?message=verify-email)
 * @returns {string|null}
 */
export function getUrlMessage() {
  const params = new URLSearchParams(window.location.search);
  return params.get('message');
}
