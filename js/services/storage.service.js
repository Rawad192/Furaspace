/**
 * AstroNuit — Storage Service
 * Couche d'abstraction Firebase Storage. Aucun DOM ici.
 */

import { storage } from '../firebase.js';

import {
  ref, uploadBytes, getDownloadURL, deleteObject, listAll,
  uploadBytesResumable
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

// ── Constantes ──────────────────────────────────────────────────────────────
const MAX_FILE_SIZE = 10 * 1024 * 1024;  // 10 MB
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ── Validation ──────────────────────────────────────────────────────────────

/**
 * Valide un fichier avant upload
 * @param {File} file
 * @param {number} maxSize - en bytes
 * @returns {{ valid: boolean, error?: string }}
 */
function validateFile(file, maxSize = MAX_FILE_SIZE) {
  if (!file) return { valid: false, error: 'Aucun fichier sélectionné.' };
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Format non supporté. Utilisez JPG, PNG ou WebP.' };
  }
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / 1024 / 1024);
    return { valid: false, error: `Fichier trop volumineux (max ${maxMB} MB).` };
  }
  return { valid: true };
}

/**
 * Génère un nom de fichier sûr (supprime caractères spéciaux)
 * @param {string} originalName
 * @returns {string}
 */
function sanitizeFilename(originalName) {
  const ext = originalName.split('.').pop().toLowerCase();
  const base = originalName
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 80);
  const timestamp = Date.now();
  return `${base}_${timestamp}.${ext}`;
}

// ── Upload ──────────────────────────────────────────────────────────────────

/**
 * Upload un fichier dans Firebase Storage
 * @param {string} path - ex: 'media/uid123' ou 'lieux/lieuId'
 * @param {File} file
 * @param {object} options
 * @param {function} options.onProgress - (percent) => void
 * @param {number} options.maxSize - override max size
 * @returns {Promise<{ url: string, path: string }>}
 */
export async function uploadFile(path, file, options = {}) {
  const maxSize = options.maxSize || MAX_FILE_SIZE;
  const validation = validateFile(file, maxSize);
  if (!validation.valid) throw new Error(validation.error);

  const filename = sanitizeFilename(file.name);
  const fullPath = `${path}/${filename}`;
  const storageRef = ref(storage, fullPath);

  if (options.onProgress) {
    // Upload avec progression
    return new Promise((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, file, {
        contentType: file.type
      });

      task.on('state_changed',
        snapshot => {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          options.onProgress(percent);
        },
        error => reject(error),
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve({ url, path: fullPath });
        }
      );
    });
  } else {
    // Upload simple (sans progression)
    await uploadBytes(storageRef, file, { contentType: file.type });
    const url = await getDownloadURL(storageRef);
    return { url, path: fullPath };
  }
}

/**
 * Upload un avatar (max 2 MB, écrase l'existant)
 * @param {string} uid
 * @param {File} file
 * @returns {Promise<string>} URL de téléchargement
 */
export async function uploadAvatar(uid, file) {
  const result = await uploadFile(`avatars/${uid}`, file, {
    maxSize: MAX_AVATAR_SIZE
  });
  return result.url;
}

/**
 * Upload une photo de spot
 * @param {string} lieuId
 * @param {File} file
 * @param {function} onProgress
 * @returns {Promise<{ url: string, path: string }>}
 */
export async function uploadSpotPhoto(lieuId, file, onProgress) {
  return uploadFile(`lieux/${lieuId}`, file, { onProgress });
}

/**
 * Upload un média personnel
 * @param {string} uid
 * @param {File} file
 * @param {function} onProgress
 * @returns {Promise<{ url: string, path: string }>}
 */
export async function uploadMedia(uid, file, onProgress) {
  return uploadFile(`media/${uid}`, file, { onProgress });
}

// ── Suppression ─────────────────────────────────────────────────────────────

/**
 * Supprime un fichier par son chemin Storage
 * @param {string} path - chemin complet dans Storage
 * @returns {Promise<void>}
 */
export async function deleteFile(path) {
  const storageRef = ref(storage, path);
  return deleteObject(storageRef);
}

// ── URL ─────────────────────────────────────────────────────────────────────

/**
 * Récupère l'URL de téléchargement d'un fichier
 * @param {string} path
 * @returns {Promise<string>}
 */
export async function getFileURL(path) {
  return getDownloadURL(ref(storage, path));
}
