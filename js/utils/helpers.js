/**
 * AstroNuit — Helpers / Utilitaires
 * Fonctions pures sans dépendance externe.
 */

// ── Formatage dates ─────────────────────────────────────────────────────────

/**
 * Formate un Timestamp Firestore ou Date en "15 janvier 2025"
 * @param {object|Date|number} ts - Timestamp Firestore, Date, ou ms
 * @returns {string}
 */
export function formatDate(ts) {
  const d = toDate(ts);
  if (!d) return '';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Formate en "15 jan."
 * @param {object|Date|number} ts
 * @returns {string}
 */
export function formatDateShort(ts) {
  const d = toDate(ts);
  if (!d) return '';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/**
 * Formate en "21h30"
 * @param {object|Date|number} ts
 * @returns {string}
 */
export function formatTime(ts) {
  const d = toDate(ts);
  if (!d) return '';
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    .replace(':', 'h');
}

/**
 * Formate en temps relatif ("Il y a 3 jours", "À l'instant")
 * @param {object|Date|number} ts
 * @returns {string}
 */
export function formatRelative(ts) {
  const d = toDate(ts);
  if (!d) return '';
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'À l\'instant';
  if (mins < 60) return `Il y a ${mins} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} semaine${days >= 14 ? 's' : ''}`;
  return formatDate(ts);
}

/**
 * Convertit un Timestamp Firestore / Date / number en Date JS
 * @param {*} ts
 * @returns {Date|null}
 */
function toDate(ts) {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (ts.toDate) return ts.toDate(); // Firestore Timestamp
  if (typeof ts === 'number') return new Date(ts);
  if (typeof ts === 'string') return new Date(ts);
  return null;
}

// ── Géographie ──────────────────────────────────────────────────────────────

/**
 * Calcule la distance entre deux points GPS (formule de Haversine)
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} distance en km
 */
export function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return deg * Math.PI / 180; }

// ── Utilitaires DOM ─────────────────────────────────────────────────────────

/**
 * Assainit du HTML pour éviter les XSS (wrapper DOMPurify si disponible)
 * @param {string} dirty - HTML potentiellement dangereux
 * @returns {string} HTML nettoyé
 */
export function sanitize(dirty) {
  if (typeof DOMPurify !== 'undefined') {
    return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'a'], ALLOWED_ATTR: ['href', 'target', 'rel'] });
  }
  // Fallback basique si DOMPurify non chargé
  const div = document.createElement('div');
  div.textContent = dirty;
  return div.innerHTML;
}

/**
 * Échappe du HTML (transforme < > & " en entités)
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Utilitaires génériques ──────────────────────────────────────────────────

/**
 * Debounce — retarde l'exécution d'une fonction
 * @param {function} fn
 * @param {number} ms - délai en millisecondes
 * @returns {function}
 */
export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Génère un ID court aléatoire (pour usage client uniquement, pas pour Firestore)
 * @param {number} len
 * @returns {string}
 */
export function generateId(len = 8) {
  return Array.from(crypto.getRandomValues(new Uint8Array(len)))
    .map(b => b.toString(36))
    .join('')
    .substring(0, len);
}

/**
 * Divise un tableau en morceaux de taille n
 * @param {Array} arr
 * @param {number} size
 * @returns {Array<Array>}
 */
export function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * Tronque un texte à une longueur max avec ellipsis
 * @param {string} text
 * @param {number} max
 * @returns {string}
 */
export function truncate(text, max = 100) {
  if (!text || text.length <= max) return text || '';
  return text.substring(0, max).trimEnd() + '…';
}

/**
 * Capitalise la première lettre
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Force mot de passe ──────────────────────────────────────────────────────

/**
 * Évalue la force d'un mot de passe
 * @param {string} password
 * @returns {{ score: number, label: string, color: string }}
 */
export function evaluatePasswordStrength(password) {
  if (!password) return { score: 0, label: 'Entrez un mot de passe', color: 'transparent' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const levels = [
    { label: 'Très faible', color: '#ef4444' },
    { label: 'Faible', color: '#f59e0b' },
    { label: 'Moyen', color: '#eab308' },
    { label: 'Fort', color: '#22c55e' },
    { label: 'Très fort', color: '#10b981' }
  ];

  const idx = Math.min(score, levels.length) - 1;
  const level = levels[Math.max(0, idx)];
  return { score, label: level.label, color: level.color };
}
