/**
 * AstroNuit — Firestore Service
 * Couche d'abstraction Firestore. Aucun DOM ici.
 * Centralise toutes les opérations Firestore client-side.
 */

import { db, COLLECTIONS, ROLE_HIERARCHY } from '../firebase.js';

import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, limit, startAfter,
  getDocs, onSnapshot, addDoc,
  serverTimestamp, increment, arrayUnion, arrayRemove,
  Timestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ── Réexports pour usage direct dans les modules ────────────────────────────
export { serverTimestamp, increment, arrayUnion, arrayRemove, Timestamp, where, orderBy };

// ── CRUD générique ──────────────────────────────────────────────────────────

/**
 * Récupère un document par sa collection et son ID
 * @param {string} collectionName
 * @param {string} docId
 * @returns {Promise<object|null>} données du document ou null
 */
export async function getDocument(collectionName, docId) {
  const snap = await getDoc(doc(db, collectionName, docId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Crée ou remplace un document (set avec merge optionnel)
 * @param {string} collectionName
 * @param {string} docId
 * @param {object} data
 * @param {boolean} merge - true pour fusionner, false pour écraser
 * @returns {Promise<void>}
 */
export async function setDocument(collectionName, docId, data, merge = false) {
  return setDoc(doc(db, collectionName, docId), data, { merge });
}

/**
 * Met à jour partiellement un document existant
 * @param {string} collectionName
 * @param {string} docId
 * @param {object} data - champs à mettre à jour
 * @returns {Promise<void>}
 */
export async function updateDocument(collectionName, docId, data) {
  return updateDoc(doc(db, collectionName, docId), data);
}

/**
 * Supprime un document
 * @param {string} collectionName
 * @param {string} docId
 * @returns {Promise<void>}
 */
export async function deleteDocument(collectionName, docId) {
  return deleteDoc(doc(db, collectionName, docId));
}

/**
 * Ajoute un document avec ID auto-généré
 * @param {string} collectionName
 * @param {object} data
 * @returns {Promise<string>} l'ID du nouveau document
 */
export async function addDocument(collectionName, data) {
  const ref = await addDoc(collection(db, collectionName), data);
  return ref.id;
}

// ── Queries ─────────────────────────────────────────────────────────────────

/**
 * Récupère des documents avec filtres, tri et limite
 * @param {string} collectionName
 * @param {object} options
 * @param {Array} options.filters - [{ field, op, value }]
 * @param {object} options.sort - { field, direction: 'asc'|'desc' }
 * @param {number} options.max - limite (défaut: 20)
 * @returns {Promise<Array<object>>}
 */
export async function getCollection(collectionName, options = {}) {
  const constraints = [];

  if (options.filters) {
    for (const f of options.filters) {
      constraints.push(where(f.field, f.op, f.value));
    }
  }

  if (options.sort) {
    constraints.push(orderBy(options.sort.field, options.sort.direction || 'desc'));
  }

  constraints.push(limit(options.max || 20));

  const q = query(collection(db, collectionName), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Pagination cursor-based — récupère la page suivante
 * @param {string} collectionName
 * @param {object} options - mêmes options que getCollection
 * @param {object} lastDoc - dernier document de la page précédente (snapshot)
 * @returns {Promise<{ docs: Array<object>, lastDoc: object|null, hasMore: boolean }>}
 */
export async function getPaginatedCollection(collectionName, options = {}, lastDoc = null) {
  const pageSize = options.max || 20;
  const constraints = [];

  if (options.filters) {
    for (const f of options.filters) {
      constraints.push(where(f.field, f.op, f.value));
    }
  }

  if (options.sort) {
    constraints.push(orderBy(options.sort.field, options.sort.direction || 'desc'));
  }

  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  constraints.push(limit(pageSize + 1)); // +1 pour détecter hasMore

  const q = query(collection(db, collectionName), ...constraints);
  const snap = await getDocs(q);

  const hasMore = snap.docs.length > pageSize;
  const docs = snap.docs.slice(0, pageSize).map(d => ({ id: d.id, ...d.data() }));
  const newLastDoc = hasMore ? snap.docs[pageSize - 1] : null;

  return { docs, lastDoc: newLastDoc, hasMore };
}

// ── Real-time listener ──────────────────────────────────────────────────────

/**
 * Écoute un document en temps réel (pour admin/modération uniquement)
 * @param {string} collectionName
 * @param {string} docId
 * @param {function} callback - (data|null) => void
 * @returns {function} unsubscribe
 */
export function watchDocument(collectionName, docId, callback) {
  return onSnapshot(doc(db, collectionName, docId), snap => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

/**
 * Écoute une collection avec filtres en temps réel
 * @param {string} collectionName
 * @param {Array} filters - [{ field, op, value }]
 * @param {function} callback - (docs[]) => void
 * @returns {function} unsubscribe
 */
export function watchCollection(collectionName, filters, callback) {
  const constraints = filters.map(f => where(f.field, f.op, f.value));
  const q = query(collection(db, collectionName), ...constraints, limit(50));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ── Helpers spécifiques ─────────────────────────────────────────────────────

/**
 * Récupère le rôle de l'utilisateur depuis Firestore (avec cache session)
 * @param {string} uid
 * @returns {Promise<string>}
 */
export async function getUserRole(uid) {
  const cacheKey = 'astronuit_user_role';
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return cached;

  try {
    const userData = await getDocument(COLLECTIONS.USERS, uid);
    const role = userData?.role || 'member';
    sessionStorage.setItem(cacheKey, role);
    return role;
  } catch (e) {
    console.warn('[AstroNuit] Lecture rôle échouée:', e.message);
    return 'member';
  }
}

/**
 * Invalide le cache de rôle (appeler après changement de rôle)
 */
export function clearRoleCache() {
  sessionStorage.removeItem('astronuit_user_role');
}

/**
 * Vérifie si l'utilisateur a au minimum le rôle requis
 * @param {string} uid
 * @param {string} minRole
 * @returns {Promise<boolean>}
 */
export async function hasMinRole(uid, minRole) {
  const role = await getUserRole(uid);
  return (ROLE_HIERARCHY[role] ?? 0) >= (ROLE_HIERARCHY[minRole] ?? 0);
}

// ── Sous-collections ────────────────────────────────────────────────────────

/**
 * Ajoute un document dans une sous-collection
 * @param {string} parentCol - ex: 'lieux'
 * @param {string} parentId
 * @param {string} subCol - ex: 'avis'
 * @param {object} data
 * @returns {Promise<string>}
 */
export async function addSubDocument(parentCol, parentId, subCol, data) {
  const ref = await addDoc(
    collection(db, parentCol, parentId, subCol), data
  );
  return ref.id;
}

/**
 * Récupère les documents d'une sous-collection
 * @param {string} parentCol
 * @param {string} parentId
 * @param {string} subCol
 * @param {object} options - { sort, max, filters }
 * @returns {Promise<Array<object>>}
 */
export async function getSubCollection(parentCol, parentId, subCol, options = {}) {
  const constraints = [];
  if (options.filters) {
    for (const f of options.filters) {
      constraints.push(where(f.field, f.op, f.value));
    }
  }
  if (options.sort) {
    constraints.push(orderBy(options.sort.field, options.sort.direction || 'desc'));
  }
  constraints.push(limit(options.max || 20));

  const q = query(collection(db, parentCol, parentId, subCol), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
