/**
 * AstroNuit — Page Profil
 * Charge les donnees reelles depuis Firestore.
 * Gere : affichage profil, badges, social, parametres, avatar.
 */

import { signOutUser, updateAuthProfile, changePassword, reauthenticate, translateError } from '../services/auth.service.js';
import { getDocument, updateDocument, getCollection, serverTimestamp } from '../services/firestore.service.js';
import { uploadAvatar } from '../services/storage.service.js';
import { COLLECTIONS } from '../firebase.js';
import { Toast, initAuthNavbar, registerServiceWorker } from '../utils/app.js';
import { formatDate, escapeHtml } from '../utils/helpers.js';
import { requireAuth } from '../utils/router.js';

// ── State ──────────────────────────────────────────────────────────────────

let currentUser = null;   // Firebase Auth user
let userProfile = null;   // Firestore profile document

// ── Badge definitions ──────────────────────────────────────────────────────

const BADGE_DEFINITIONS = [
  { id: 'primo', icon: '\uD83C\uDF1F', name: 'Primo-Explorateur', desc: 'Ajoutez votre 1er spot', threshold: 1, stat: 'spotsAdded' },
  { id: 'cartographe', icon: '\uD83D\uDDFA\uFE0F', name: 'Cartographe', desc: 'Ajoutez 5 spots', threshold: 5, stat: 'spotsAdded' },
  { id: 'passionne', icon: '\uD83D\uDD2D', name: 'Passionne', desc: 'Ajoutez 10 spots', threshold: 10, stat: 'spotsAdded' },
  { id: 'legende', icon: '\uD83C\uDF0C', name: 'Legende', desc: 'Ajoutez 25 spots', threshold: 25, stat: 'spotsAdded' },
  { id: 'aventurier', icon: '\uD83D\uDC63', name: 'Aventurier', desc: '10 check-ins sur des spots', threshold: 10, stat: 'checkins' },
  { id: 'photographe', icon: '\uD83D\uDCF8', name: 'Photographe', desc: 'Deposez 10 photos', threshold: 10, stat: 'photosPosted' },
  { id: 'organisateur', icon: '\uD83C\uDFAF', name: 'Organisateur', desc: 'Organisez 5 sorties', threshold: 5, stat: 'eventsOrganized' },
  { id: 'participant', icon: '\uD83C\uDF1B', name: 'Noctambule', desc: 'Participez a 10 sorties', threshold: 10, stat: 'eventsAttended' },
];

// ── Init ────────────────────────────────────────────────────────────────────

async function init() {
  currentUser = await requireAuth();
  initAuthNavbar();

  // Charger le profil Firestore
  await loadProfile();

  initTabs();
  initLogout();
  initEditProfile();
  initAvatarUpload();
  initSettings();
  renderBadges();
  renderProfileLieux();
  renderFranceMap();
  initSocial();
  registerServiceWorker();
}

// ── Load Profile ───────────────────────────────────────────────────────────

async function loadProfile() {
  try {
    userProfile = await getDocument(COLLECTIONS.USERS, currentUser.uid);
  } catch (err) {
    console.warn('[Profil] Erreur chargement profil Firestore:', err.message);
  }

  if (!userProfile) {
    // Profil Firestore non trouve — fallback sur Auth data
    userProfile = {
      pseudo: currentUser.displayName || currentUser.email?.split('@')[0] || 'Utilisateur',
      email: currentUser.email || '',
      region: '',
      level: 'beginner',
      equipment: '',
      bio: '',
      photoURL: currentUser.photoURL || '',
      role: 'member',
      score: { total: 0, monthly: 0 },
      stats: { spotsAdded: 0, eventsOrganized: 0, eventsAttended: 0, photosPosted: 0, checkins: 0, reportsValidated: 0 },
      badges: [],
      departements_visites: [],
      following: [],
      followers: [],
      lieux_ajoutes: [],
      createdAt: null,
    };
    Toast.warning('Profil incomplet. Completez vos parametres.');
  }

  populateProfileUI();
}

// ── Populate UI ────────────────────────────────────────────────────────────

function populateProfileUI() {
  const p = userProfile;
  const stats = p.stats || {};

  // Header
  setText('profile-pseudo', '@' + (p.pseudo || 'utilisateur'));
  setText('profile-region', p.region || 'Non renseignee');
  setText('profile-equipment', p.equipment ? '\uD83D\uDD2D ' + escapeHtml(p.equipment) : '');
  setText('profile-since', p.createdAt ? formatDate(p.createdAt) : 'Recemment');

  // Level badge
  const levelEl = document.getElementById('profile-level');
  if (levelEl) {
    const levelLabels = { beginner: 'Debutant', intermediate: 'Intermediaire', expert: 'Expert' };
    levelEl.textContent = levelLabels[p.level] || 'Membre';
  }

  // Status badge
  const statusEl = document.getElementById('profile-status');
  if (statusEl) {
    const roleLabels = { member: 'Membre', verified_member: 'Membre verifie', constellation_leader: 'Leader', regional_moderator: 'Moderateur', admin: 'Admin' };
    statusEl.textContent = roleLabels[p.role] || 'Membre';
    if (p.role === 'admin') statusEl.className = 'badge badge-accent';
    else if (p.role === 'verified_member' || p.role === 'constellation_leader') statusEl.className = 'badge badge-success';
  }

  // Avatar
  const avatarEl = document.getElementById('profile-avatar');
  if (avatarEl) {
    const photoURL = p.photoURL || currentUser.photoURL;
    if (photoURL) {
      avatarEl.innerHTML = `<img src="${escapeHtml(photoURL)}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    } else {
      avatarEl.textContent = (p.pseudo || 'U')[0].toUpperCase();
    }
  }

  // Stats
  setText('stat-organized', stats.eventsOrganized || 0);
  setText('stat-attended', stats.eventsAttended || 0);
  setText('stat-photos', stats.photosPosted || 0);
  setText('stat-spots-added', stats.spotsAdded || 0);
  setText('stat-checkins', stats.checkins || 0);

  // Score
  const scoreTotal = typeof p.score === 'object' ? (p.score?.total || 0) : (p.score || 0);
  setText('stat-rating', scoreTotal);
  setText('stat-rating-count', stats.reportsValidated || 0);

  // Departments visited
  const depts = p.departements_visites || [];
  setText('stat-depts', depts.length);
  setText('depts-visited-count', `${depts.length} / 96`);

  // Social counts
  setText('followers-count', (p.followers || []).length);
  setText('following-count', (p.following || []).length);

  // Pre-fill settings form
  prefillSettings();
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ── Tabs ────────────────────────────────────────────────────────────────────

function initTabs() {
  document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      document.querySelectorAll('.profile-panel').forEach(panel => {
        panel.style.display = panel.id === `panel-${target}` ? 'block' : 'none';
      });
    });
  });
}

// ── Logout ──────────────────────────────────────────────────────────────────

function initLogout() {
  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await signOutUser();
    window.location.href = 'index.html';
  });
}

// ── Edit Profile (toggle settings panel) ────────────────────────────────────

function initEditProfile() {
  document.getElementById('btn-edit-profile')?.addEventListener('click', () => {
    // Activer l'onglet Parametres
    document.querySelectorAll('.profile-tab').forEach(t => {
      t.classList.remove('active');
      if (t.dataset.tab === 'settings') t.classList.add('active');
    });
    document.querySelectorAll('.profile-panel').forEach(panel => {
      panel.style.display = panel.id === 'panel-settings' ? 'block' : 'none';
    });
    document.getElementById('panel-settings')?.scrollIntoView({ behavior: 'smooth' });
  });
}

// ── Avatar Upload ──────────────────────────────────────────────────────────

function initAvatarUpload() {
  const editBtn = document.getElementById('btn-edit-avatar');
  if (!editBtn) return;

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/jpeg,image/png,image/webp';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  editBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    Toast.info('Upload de l\'avatar en cours...');

    try {
      const url = await uploadAvatar(currentUser.uid, file);

      // Mettre a jour Firebase Auth
      await updateAuthProfile({ photoURL: url });

      // Mettre a jour Firestore
      await updateDocument(COLLECTIONS.USERS, currentUser.uid, { photoURL: url });

      // Mettre a jour l'UI
      userProfile.photoURL = url;
      const avatarEl = document.getElementById('profile-avatar');
      if (avatarEl) {
        avatarEl.innerHTML = `<img src="${escapeHtml(url)}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
      }

      Toast.success('Avatar mis a jour !');
    } catch (err) {
      Toast.error(err.message || 'Erreur lors de l\'upload de l\'avatar.');
    }

    fileInput.value = '';
  });
}

// ── Settings ───────────────────────────────────────────────────────────────

function prefillSettings() {
  const p = userProfile;
  setVal('settings-pseudo', p.pseudo || '');
  setVal('settings-email', p.email || currentUser.email || '');
  setVal('settings-region', p.region || '');
  setVal('settings-level', p.level || 'beginner');
  setVal('settings-equipment', p.equipment || '');
  setVal('settings-bio', p.bio || '');

  // Notifications
  const notifs = p.notifications || {};
  setChecked('notif-spot-region', notifs.newSpotInRegion !== false);
  setChecked('notif-clear-sky', notifs.clearSkyOnFavorite !== false);
  setChecked('notif-review', notifs.reviewOnMySpot !== false);
  setChecked('notif-social', notifs.socialActivity !== false);
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function setChecked(id, checked) {
  const el = document.getElementById(id);
  if (el) el.checked = checked;
}

function initSettings() {
  // Profile form
  const form = document.getElementById('form-settings');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = '\u23F3 Sauvegarde...'; }

      const pseudo = document.getElementById('settings-pseudo')?.value.trim();
      const region = document.getElementById('settings-region')?.value || '';
      const level = document.getElementById('settings-level')?.value || 'beginner';
      const equipment = document.getElementById('settings-equipment')?.value.trim() || '';
      const bio = document.getElementById('settings-bio')?.value.trim() || '';

      // Validations
      if (!pseudo || pseudo.length < 3) {
        Toast.error('Le pseudo doit faire au moins 3 caracteres.');
        if (btn) { btn.disabled = false; btn.textContent = 'Sauvegarder'; }
        return;
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(pseudo)) {
        Toast.error('Le pseudo ne peut contenir que des lettres, chiffres, tirets et underscores.');
        if (btn) { btn.disabled = false; btn.textContent = 'Sauvegarder'; }
        return;
      }

      const notifications = {
        newSpotInRegion: document.getElementById('notif-spot-region')?.checked ?? true,
        clearSkyOnFavorite: document.getElementById('notif-clear-sky')?.checked ?? true,
        reviewOnMySpot: document.getElementById('notif-review')?.checked ?? true,
        socialActivity: document.getElementById('notif-social')?.checked ?? true,
      };

      try {
        await updateDocument(COLLECTIONS.USERS, currentUser.uid, {
          pseudo, region, level, equipment, bio, notifications,
        });

        // Mettre a jour displayName dans Auth
        await updateAuthProfile({ displayName: pseudo });

        // Mettre a jour le state local
        Object.assign(userProfile, { pseudo, region, level, equipment, bio, notifications });
        populateProfileUI();

        Toast.success('Profil mis a jour !');
      } catch (err) {
        Toast.error('Erreur: ' + (err.message || 'Impossible de sauvegarder.'));
      }

      if (btn) { btn.disabled = false; btn.textContent = 'Sauvegarder'; }
    });
  }

  // Password change form
  const pwdForm = document.getElementById('form-password');
  if (pwdForm) {
    pwdForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPwd = document.getElementById('current-password')?.value;
      const newPwd = document.getElementById('new-password')?.value;
      const confirmPwd = document.getElementById('confirm-password')?.value;
      const btn = pwdForm.querySelector('button[type="submit"]');

      if (!currentPwd || !newPwd) {
        Toast.error('Remplissez tous les champs.');
        return;
      }
      if (newPwd.length < 8) {
        Toast.error('Le nouveau mot de passe doit faire au moins 8 caracteres.');
        return;
      }
      if (newPwd !== confirmPwd) {
        Toast.error('Les mots de passe ne correspondent pas.');
        return;
      }

      if (btn) { btn.disabled = true; btn.textContent = '\u23F3 Modification...'; }

      try {
        await reauthenticate(currentPwd);
        await changePassword(newPwd);
        Toast.success('Mot de passe modifie avec succes !');
        pwdForm.reset();
      } catch (err) {
        Toast.error(translateError(err));
      }

      if (btn) { btn.disabled = false; btn.textContent = 'Changer le mot de passe'; }
    });
  }
}

// ── Badges ──────────────────────────────────────────────────────────────────

function renderBadges() {
  const container = document.getElementById('badges-grid');
  if (!container) return;

  const stats = userProfile.stats || {};
  let earnedCount = 0;

  container.innerHTML = BADGE_DEFINITIONS.map(def => {
    const val = stats[def.stat] || 0;
    const earned = val >= def.threshold;
    if (earned) earnedCount++;
    const progress = Math.min(val / def.threshold, 1);

    return `
      <div class="badge-card ${earned ? 'earned' : 'locked'}">
        <div class="badge-icon">${def.icon}</div>
        <div class="badge-name">${def.name}</div>
        <div class="badge-desc">${def.desc}</div>
        ${earned
          ? '<div class="badge-earned-label">\u2713 Obtenu</div>'
          : `<div class="badge-progress" style="margin-top:var(--space-3);"><div class="badge-progress-fill" style="width:${Math.round(progress * 100)}%;"></div></div>
             <div style="font-size:.7rem;color:var(--color-text-dim);margin-top:4px;">${val} / ${def.threshold}</div>`
        }
      </div>
    `;
  }).join('');

  const countEl = document.getElementById('badges-count');
  if (countEl) countEl.textContent = `${earnedCount} / ${BADGE_DEFINITIONS.length} obtenus`;

  renderLeaderboard();
}

// ── Leaderboard ────────────────────────────────────────────────────────────

async function renderLeaderboard() {
  const container = document.getElementById('leaderboard');
  if (!container) return;

  let topUsers = [];
  try {
    topUsers = await getCollection(COLLECTIONS.USERS, {
      sort: { field: 'score.total', direction: 'desc' },
      max: 10,
    });
  } catch (err) {
    console.warn('[Profil] Erreur chargement leaderboard:', err.message);
  }

  if (topUsers.length === 0) {
    topUsers = [{
      id: currentUser.uid,
      pseudo: userProfile.pseudo,
      score: userProfile.score,
      stats: userProfile.stats,
    }];
  }

  container.innerHTML = topUsers.map((item, idx) => {
    const isMe = item.id === currentUser.uid;
    const scoreVal = typeof item.score === 'object' ? (item.score?.total || 0) : (item.score || 0);
    const spotsCount = item.stats?.spotsAdded || 0;
    const initial = (item.pseudo || 'U')[0].toUpperCase();
    const rankLabel = idx === 0 ? '\uD83E\uDD47' : idx === 1 ? '\uD83E\uDD48' : idx === 2 ? '\uD83E\uDD49' : `#${idx + 1}`;
    const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-other';

    return `
      <div class="leaderboard-item ${isMe ? 'me' : ''}">
        <div class="leaderboard-rank ${rankClass}">${rankLabel}</div>
        <div class="avatar" style="width:36px;height:36px;font-size:.9rem;flex-shrink:0;">${initial}</div>
        <div class="leaderboard-info">
          <div class="leaderboard-name">@${escapeHtml(item.pseudo || 'utilisateur')}${isMe ? ' <span style="color:var(--color-primary-light);font-size:.7rem;">(vous)</span>' : ''}</div>
          <div class="leaderboard-stats">${scoreVal} pts \u00B7 ${spotsCount} spots</div>
        </div>
        <div class="leaderboard-spots">${scoreVal}</div>
      </div>
    `;
  }).join('');
}

// ── Profile Lieux ──────────────────────────────────────────────────────────

async function renderProfileLieux() {
  const container = document.getElementById('profile-lieux-grid');
  if (!container) return;

  let userLieux = [];
  try {
    userLieux = await getCollection(COLLECTIONS.LIEUX, {
      filters: [{ field: 'createdBy', op: '==', value: currentUser.uid }],
      sort: { field: 'createdAt', direction: 'desc' },
      max: 20,
    });
  } catch (err) {
    console.warn('[Profil] Erreur chargement lieux:', err.message);
  }

  if (userLieux.length === 0) {
    container.innerHTML = `
      <div class="card" style="padding:2rem;text-align:center;grid-column:1/-1;color:var(--color-text-muted);">
        <p style="font-size:1.5rem;margin-bottom:.5rem;">\uD83D\uDD2D</p>
        <p>Vous n'avez pas encore ajoute de spot.</p>
        <a href="ajouter-lieu.html" class="btn btn-primary btn-sm" style="margin-top:1rem;">Ajouter mon premier spot</a>
      </div>
    `;
    return;
  }

  container.innerHTML = userLieux.map(l => {
    const typeIcon = l.type === 'observation' ? '\uD83D\uDD2D' : '\uD83C\uDFD4\uFE0F';
    const bortleClass = (l.bortle || 5) <= 2 ? 'bortle-2' : (l.bortle || 5) <= 4 ? 'bortle-3' : 'bortle-5';
    return `
      <a href="lieu-detail.html?id=${l.id}" class="card profile-lieu-card">
        <div class="profile-lieu-thumb"><span style="position:relative;z-index:1;">${typeIcon}</span></div>
        <div class="profile-lieu-body">
          <div class="profile-lieu-name">${escapeHtml(l.name)}</div>
          <div class="profile-lieu-meta"><span class="bortle-badge ${bortleClass}">\u2B1B Bortle ${l.bortle || '?'}</span> \u00B7 ${escapeHtml(l.region || '')}</div>
          <div style="font-size:.75rem;color:var(--color-text-dim);margin-top:4px;">\uD83D\uDC63 ${l.visitCount || 0} visites</div>
        </div>
      </a>
    `;
  }).join('') + `
    <a href="ajouter-lieu.html" class="card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--space-2);min-height:160px;cursor:pointer;border:2px dashed var(--color-border-subtle);background:rgba(108,62,184,.04);text-decoration:none;color:var(--color-text-dim);transition:all var(--transition-fast);">
      <div style="font-size:2rem;">+</div>
      <div style="font-size:.85rem;font-weight:600;">Ajouter un spot</div>
    </a>
  `;
}

// ── France Map Canvas ──────────────────────────────────────────────────────

function renderFranceMap() {
  const canvas = document.getElementById('france-map-canvas');
  if (!canvas) return;

  const visitedDepts = userProfile.departements_visites || [];
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, W, H);

  const cols = 12, rows = 8;
  const cellW = (W - 40) / cols, cellH = (H - 40) / rows;
  const offsetX = 20, offsetY = 20;

  const depts = [];
  for (let i = 1; i <= 95; i++) depts.push(i < 10 ? `0${i}` : `${i}`);
  depts.push('2A', '2B');

  depts.forEach((d, idx) => {
    const col = idx % cols, row = Math.floor(idx / cols);
    const x = offsetX + col * cellW, y = offsetY + row * cellH;
    const isVisited = visitedDepts.includes(d);

    ctx.fillStyle = isVisited ? 'rgba(108,62,184,0.7)' : 'rgba(255,255,255,0.05)';
    ctx.strokeStyle = isVisited ? 'rgba(178,132,255,0.5)' : 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, cellW - 4, cellH - 4, 4);
    ctx.fill();
    ctx.stroke();

    if (isVisited) {
      ctx.fillStyle = 'rgba(245,166,35,0.9)';
      ctx.beginPath();
      ctx.arc(x + cellW / 2, y + cellH / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = isVisited ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)';
    ctx.font = `${Math.min(cellW * 0.35, 10)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(d, x + cellW / 2, y + cellH / 2);
  });
}

// ── Social ─────────────────────────────────────────────────────────────────

function initSocial() {
  document.getElementById('btn-followers')?.addEventListener('click', () => showFollowModal('followers'));
  document.getElementById('btn-following')?.addEventListener('click', () => showFollowModal('following'));
}

async function showFollowModal(type) {
  const uids = type === 'followers' ? (userProfile.followers || []) : (userProfile.following || []);
  const title = type === 'followers' ? 'Abonnes' : 'Suivis';

  let users = [];
  if (uids.length > 0) {
    try {
      const batch = uids.slice(0, 10);
      const promises = batch.map(uid => getDocument(COLLECTIONS.USERS, uid));
      users = (await Promise.all(promises)).filter(Boolean);
    } catch (err) {
      console.warn('[Profil] Erreur chargement followers:', err.message);
    }
  }

  const existing = document.getElementById('modal-social');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'modal-social';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:1rem;';

  const content = users.length > 0
    ? users.map(u => `
        <div style="display:flex;align-items:center;gap:.75rem;padding:.75rem 0;border-bottom:1px solid var(--color-border-subtle);">
          <div class="avatar" style="width:40px;height:40px;font-size:1rem;flex-shrink:0;">${(u.pseudo || 'U')[0].toUpperCase()}</div>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:.9rem;">@${escapeHtml(u.pseudo || 'utilisateur')}</div>
            <div style="font-size:.75rem;color:var(--color-text-muted);">${escapeHtml(u.region || '')}</div>
          </div>
        </div>
      `).join('')
    : '<p style="text-align:center;color:var(--color-text-muted);padding:2rem 0;">Aucun utilisateur pour le moment.</p>';

  modal.innerHTML = `
    <div style="background:var(--color-bg-card);border:1px solid var(--color-border-subtle);border-radius:var(--radius-2xl);width:100%;max-width:400px;box-shadow:var(--shadow-xl);">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid var(--color-border-subtle);">
        <h3>${title} (${uids.length})</h3>
        <button style="background:transparent;border:none;color:var(--color-text-muted);cursor:pointer;font-size:1rem;padding:.5rem;border-radius:var(--radius-md);">\u2715</button>
      </div>
      <div style="padding:1rem 1.5rem;max-height:400px;overflow-y:auto;">
        ${content}
      </div>
    </div>
  `;

  modal.querySelector('button').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

// ── Launch ──────────────────────────────────────────────────────────────────
init();
