/**
 * AstroNuit — Constellations listing page
 */

const DEMO_CONSTELLATIONS = [
  {
    id: 'c1',
    name: 'Observateurs du Vercors',
    description: 'Groupe d\'astronomes amateurs basés dans le Vercors et ses alentours. Sorties régulières chaque nouvelle lune depuis des spots Bortle ≤ 3. Débutants bienvenus !',
    region: 'Auvergne-Rhône-Alpes',
    regionShort: 'Auvergne-RA',
    leaderId: 'u1',
    leaderPseudo: '@astronome_pro',
    leaderVerified: true,
    memberCount: 28,
    eventCount: 14,
    spotCount: 47,
    color: '#6c3eb8',
    emoji: '🌌',
    createdAt: '2025-01-15',
    members: ['A', 'M', 'T', 'J', 'S']
  },
  {
    id: 'c2',
    name: 'Ciel Breton',
    description: 'Les fins de nuit au bout du Finistère ! Pointe du Raz, Île de Sein, Presqu\'île de Crozon... Les meilleurs skies bretons explorés ensemble.',
    region: 'Bretagne',
    regionShort: 'Bretagne',
    leaderId: 'u2',
    leaderPseudo: '@ciel_breton',
    leaderVerified: true,
    memberCount: 41,
    eventCount: 22,
    spotCount: 31,
    color: '#3b82f6',
    emoji: '🌊',
    createdAt: '2024-10-03',
    members: ['C', 'P', 'L', 'A', 'B']
  },
  {
    id: 'c3',
    name: 'Nuits Occitanes',
    description: 'Du Pic du Midi aux Cévennes, en passant par le Causse Noir. L\'Occitanie regorge de trésors astronomiques que nous explorons ensemble.',
    region: 'Occitanie',
    regionShort: 'Occitanie',
    leaderId: 'u3',
    leaderPseudo: '@stargazer_occitan',
    leaderVerified: false,
    memberCount: 56,
    eventCount: 31,
    spotCount: 68,
    color: '#f59e0b',
    emoji: '🌟',
    createdAt: '2024-07-20',
    members: ['S', 'R', 'N', 'O', 'F']
  },
  {
    id: 'c4',
    name: 'Astro PACA',
    description: 'La PACA abrite certains des meilleurs ciels de France. Observatoire de Haute-Provence, Plateau de Valensole, Luberon... rejoignez-nous !',
    region: 'Provence-Alpes-Côte d\'Azur',
    regionShort: 'PACA',
    leaderId: 'u4',
    leaderPseudo: '@astrophoto_aura',
    leaderVerified: true,
    memberCount: 73,
    eventCount: 38,
    spotCount: 84,
    color: '#10b981',
    emoji: '🌠',
    createdAt: '2024-05-01',
    members: ['A', 'P', 'V', 'M', 'C']
  },
  {
    id: 'c5',
    name: 'Étoiles du Grand Est',
    description: 'Alsace, Lorraine, Champagne-Ardenne — les ciels souvent sous-estimés du Grand Est. Vosges du Nord, parc naturel de la Forêt d\'Orient...',
    region: 'Grand Est',
    regionShort: 'Grand Est',
    leaderId: 'u5',
    leaderPseudo: '@normand_etoile',
    leaderVerified: false,
    memberCount: 19,
    eventCount: 8,
    spotCount: 23,
    color: '#ec4899',
    emoji: '🌸',
    createdAt: '2025-02-10',
    members: ['N', 'E', 'G']
  },
  {
    id: 'c6',
    name: 'Cézallier Stargazers',
    description: 'Le plateau du Cézallier, classé réserve de ciel étoilé en Auvergne. Un des rares endroits en France avec un Bortle 1-2 accessible en voiture.',
    region: 'Auvergne-Rhône-Alpes',
    regionShort: 'Auvergne-RA',
    leaderId: 'u6',
    leaderPseudo: '@cezallier_astro',
    leaderVerified: true,
    memberCount: 34,
    eventCount: 19,
    spotCount: 15,
    color: '#14b8a6',
    emoji: '🏔️',
    createdAt: '2024-09-12',
    members: ['C', 'A', 'R', 'F']
  }
];

let state = {
  all: DEMO_CONSTELLATIONS,
  filtered: [...DEMO_CONSTELLATIONS],
  filter: 'all',
  search: '',
  selectedColor: '#6c3eb8',
  page: 1,
  perPage: 6
};

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderGrid();
  initFilters();
  initSearch();
  initCreateModal();
  updateHeroStats();
});

// ── Stats héro ────────────────────────────────────────────────────────────────
function updateHeroStats() {
  const totalMembers = state.all.reduce((s, c) => s + c.memberCount, 0);
  const totalEvents  = state.all.reduce((s, c) => s + c.eventCount, 0);
  const el = id => document.getElementById(id);
  if (el('stat-constellations')) el('stat-constellations').textContent = state.all.length;
  if (el('stat-members'))        el('stat-members').textContent = totalMembers.toLocaleString('fr');
  if (el('stat-events'))         el('stat-events').textContent = totalEvents;
}

// ── Rendu grille ──────────────────────────────────────────────────────────────
function renderGrid() {
  const grid = document.getElementById('constellations-grid');
  const empty = document.getElementById('constellations-empty');
  const paginationEl = document.getElementById('pagination');
  if (!grid) return;

  applyFilters();

  if (state.filtered.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.style.display = 'block';
    if (paginationEl) paginationEl.style.display = 'none';
    return;
  }
  if (empty) empty.style.display = 'none';

  const start = (state.page - 1) * state.perPage;
  const page  = state.filtered.slice(start, start + state.perPage);
  grid.innerHTML = page.map(renderConstCard).join('');

  // Pagination
  const totalPages = Math.ceil(state.filtered.length / state.perPage);
  const info = document.getElementById('pagination-info');
  const prev = document.getElementById('btn-prev');
  const next = document.getElementById('btn-next');
  if (info) info.textContent = `Page ${state.page} / ${totalPages}`;
  if (prev) prev.disabled = state.page <= 1;
  if (next) next.disabled = state.page >= totalPages;
  if (paginationEl) paginationEl.style.display = totalPages <= 1 ? 'none' : 'flex';

  if (prev) prev.onclick = () => { if (state.page > 1) { state.page--; renderGrid(); } };
  if (next) next.onclick = () => { if (state.page < totalPages) { state.page++; renderGrid(); } };
}

function renderConstCard(c) {
  const membersAvatars = c.members.slice(0, 5).map(letter =>
    `<div class="avatar" style="width:28px;height:28px;font-size:.65rem;">${letter}</div>`
  ).join('');

  const verifiedBadge = c.leaderVerified
    ? '<span class="verified-star">⭐</span>'
    : '';

  return `
    <div class="const-card" onclick="location.href='constellation-detail.html?id=${c.id}'">
      <div class="const-card-banner" style="background: linear-gradient(135deg, ${c.color}33, ${c.color}11);">
        <span style="font-size:2.5rem; position:relative; z-index:1;">${c.emoji}</span>
        <div style="position:absolute; inset:0; background: linear-gradient(to bottom, transparent 40%, var(--color-surface) 100%);"></div>
      </div>
      <div class="const-card-body">
        <div class="const-card-header">
          <div class="const-card-name">${c.name}</div>
          <span class="badge badge-primary" style="font-size:.65rem; white-space:nowrap;">${c.regionShort}</span>
        </div>
        <div class="const-leader-badge">
          <div class="avatar" style="width:22px;height:22px;font-size:.6rem;">${c.leaderPseudo.charAt(1).toUpperCase()}</div>
          Leader : <a href="profil.html" style="color: var(--color-primary-light);" onclick="event.stopPropagation();">${c.leaderPseudo}</a>
          ${verifiedBadge}
        </div>
        <p class="const-description">${c.description}</p>
        <div class="const-stats">
          <div class="const-stat">👥 ${c.memberCount} membres</div>
          <div class="const-stat">📅 ${c.eventCount} sorties</div>
          <div class="const-stat">📍 ${c.spotCount} spots</div>
        </div>
      </div>
      <div class="const-card-footer">
        <div style="display:flex; gap:-4px;">
          ${membersAvatars}
        </div>
        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); joinConstellation('${c.id}', event)">
          Rejoindre
        </button>
      </div>
    </div>
  `;
}

// ── Filtres ───────────────────────────────────────────────────────────────────
function applyFilters() {
  const q = state.search.toLowerCase();
  state.filtered = state.all.filter(c => {
    const matchRegion = state.filter === 'all' || c.regionShort === state.filter || c.region === state.filter;
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.leaderPseudo.toLowerCase().includes(q);
    return matchRegion && matchSearch;
  });
}

function initFilters() {
  document.querySelectorAll('.const-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.const-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filter = btn.dataset.filter || 'all';
      state.page = 1;
      renderGrid();
    });
  });
}

function initSearch() {
  const input = document.getElementById('const-search');
  if (!input) return;
  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      state.search = input.value.trim();
      state.page = 1;
      renderGrid();
    }, 250);
  });
}

// ── Actions ───────────────────────────────────────────────────────────────────
function joinConstellation(id, e) {
  if (e) e.stopPropagation();
  // V2 : requireAuth() → Firestore write
  showToast('Connexion requise pour rejoindre une Constellation', 'info');
}

// ── Modal création ────────────────────────────────────────────────────────────
function initCreateModal() {
  const btn = document.getElementById('btn-create-constellation');
  if (btn) btn.addEventListener('click', openCreateModal);

  // Compteur description
  const desc = document.getElementById('const-description');
  const counter = document.getElementById('desc-counter');
  if (desc && counter) {
    desc.addEventListener('input', () => {
      counter.textContent = `${desc.value.length} / 300 caractères`;
    });
  }

  // Color picker
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      swatch.classList.add('selected');
      state.selectedColor = swatch.dataset.color;
    });
  });
}

function openCreateModal() {
  // V2 : vérifier éligibilité via Cloud Function eligibilityCheck
  // Pour démo : ouvre simplement le modal
  const modal = document.getElementById('create-modal');
  if (modal) modal.style.display = 'flex';
}

function closeCreateModal() {
  const modal = document.getElementById('create-modal');
  if (modal) modal.style.display = 'none';
}

function submitConstellation() {
  const name = document.getElementById('const-name')?.value.trim();
  const region = document.getElementById('const-region')?.value;
  const description = document.getElementById('const-description')?.value.trim();
  const charter = document.getElementById('const-charter')?.checked;

  if (!name || name.length < 3) { showToast('Le nom doit faire au moins 3 caractères', 'error'); return; }
  if (!region) { showToast('Sélectionnez une région', 'error'); return; }
  if (!description || description.length < 20) { showToast('La description doit faire au moins 20 caractères', 'error'); return; }
  if (!charter) { showToast('Vous devez accepter la charte des organisateurs', 'error'); return; }

  const btn = document.getElementById('btn-submit-constellation');
  if (btn) { btn.disabled = true; btn.textContent = 'Création en cours...'; }

  // V2 : Firestore write + Cloud Function eligibilityCheck
  setTimeout(() => {
    closeCreateModal();
    showToast(`La Constellation "${name}" a été créée avec succès !`, 'success');
    if (btn) { btn.disabled = false; btn.textContent = '✦ Créer la Constellation'; }
  }, 1200);
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  if (typeof window.showToast === 'function' && window.showToast !== showToast) {
    window.showToast(message, type); return;
  }
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
