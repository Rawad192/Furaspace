/**
 * AstroNuit — Page Lieux (Spots)
 * Remplace : js/lieux.js + js/app.js
 */

import { Toast, initAuthNavbar, registerServiceWorker } from '../utils/app.js';
import { haversine } from '../utils/helpers.js';

// ── Demo data ───────────────────────────────────────────────────────────────

const DEMO_LIEUX = [
  { id: 'l1', name: 'Causse Mejean \u2014 Chaos de Nimes-le-Vieux', description: 'Plateau calcaire du Massif Central, ciel exceptionnel.', lat: 44.2833, lng: 3.3500, type: 'observation', bortle: 2, access: 'car', facilities: { water: false, shelter: false, parking: true }, isPublicAccess: true, region: 'Occitanie', departement: '48', departementName: 'Lozere', thumbsUp: 47, thumbsDown: 2, visitCount: 134, createdBy: '@astronome_pro', createdAt: new Date(Date.now() - 3 * 86400000), distance: null },
  { id: 'l2', name: 'Col du Tourmalet', description: 'A 2115m d\'altitude, panorama epoustouflant.', lat: 42.9078, lng: 0.1451, type: 'panorama', bortle: 3, access: 'car', facilities: { water: false, shelter: false, parking: true }, isPublicAccess: true, region: 'Occitanie', departement: '65', departementName: 'Hautes-Pyrenees', thumbsUp: 38, thumbsDown: 4, visitCount: 89, createdBy: '@ciel_breton', createdAt: new Date(Date.now() - 7 * 86400000), distance: null },
  { id: 'l3', name: 'Foret de Fontainebleau', description: 'Clairiere isolee, Bortle 4 acceptable pour l\'IdF.', lat: 48.3867, lng: 2.6543, type: 'observation', bortle: 4, access: 'foot', facilities: { water: false, shelter: false, parking: true }, isPublicAccess: true, region: 'Ile-de-France', departement: '77', departementName: 'Seine-et-Marne', thumbsUp: 22, thumbsDown: 5, visitCount: 67, createdBy: '@stargazer42', createdAt: new Date(Date.now() - 14 * 86400000), distance: null },
  { id: 'l4', name: 'Montagne Sainte-Victoire', description: 'Versant nord plus sombre, Voie lactee visible en ete.', lat: 43.5311, lng: 5.6156, type: 'panorama', bortle: 3, access: '4x4', facilities: { water: false, shelter: true, parking: false }, isPublicAccess: true, region: 'Provence-Alpes-Cote d\'Azur', departement: '13', departementName: 'Bouches-du-Rhone', thumbsUp: 31, thumbsDown: 3, visitCount: 78, createdBy: '@jupiterobserver', createdAt: new Date(Date.now() - 21 * 86400000), distance: null },
  { id: 'l5', name: 'Presqu\'ile de Crozon \u2014 Pointe de Pen Hir', description: 'Falaises atlantiques, horizon infini vers l\'ouest.', lat: 48.2434, lng: -4.5512, type: 'observation', bortle: 2, access: 'foot', facilities: { water: false, shelter: false, parking: true }, isPublicAccess: true, region: 'Bretagne', departement: '29', departementName: 'Finistere', thumbsUp: 54, thumbsDown: 1, visitCount: 201, createdBy: '@ciel_breton', createdAt: new Date(Date.now() - 5 * 86400000), distance: null },
  { id: 'l6', name: 'Vercors \u2014 Plateau de Font d\'Urle', description: 'Haut plateau karstique a 1450m, acces facile.', lat: 44.8634, lng: 5.2812, type: 'observation', bortle: 2, access: 'car', facilities: { water: false, shelter: false, parking: true }, isPublicAccess: true, region: 'Auvergne-Rhone-Alpes', departement: '26', departementName: 'Drome', thumbsUp: 43, thumbsDown: 3, visitCount: 115, createdBy: '@astronome_pro', createdAt: new Date(Date.now() - 10 * 86400000), distance: null },
  { id: 'l7', name: 'Gorges du Verdon \u2014 Belvedere de la Maline', description: 'Vue plongeante sur les gorges, Bortle 3.', lat: 43.7680, lng: 6.3045, type: 'panorama', bortle: 3, access: 'car', facilities: { water: false, shelter: false, parking: true }, isPublicAccess: true, region: 'Provence-Alpes-Cote d\'Azur', departement: '04', departementName: 'Alpes-de-Haute-Provence', thumbsUp: 29, thumbsDown: 6, visitCount: 92, createdBy: '@stargazer42', createdAt: new Date(Date.now() - 30 * 86400000), distance: null },
  { id: 'l8', name: 'Parc National des Cevennes \u2014 Mont Lozere', description: 'Zone RICE officielle, Bortle 1 au sommet.', lat: 44.5123, lng: 3.7234, type: 'observation', bortle: 1, access: 'foot', facilities: { water: false, shelter: true, parking: true }, isPublicAccess: true, region: 'Occitanie', departement: '48', departementName: 'Lozere', thumbsUp: 78, thumbsDown: 0, visitCount: 243, createdBy: '@astronome_pro', createdAt: new Date(Date.now() - 45 * 86400000), distance: null },
  { id: 'l9', name: 'Cote d\'Opale \u2014 Cap Blanc-Nez', description: 'Falaises de craie, ciel Bortle 5 mais photogenique.', lat: 50.9278, lng: 1.7223, type: 'panorama', bortle: 5, access: 'foot', facilities: { water: false, shelter: false, parking: true }, isPublicAccess: true, region: 'Hauts-de-France', departement: '62', departementName: 'Pas-de-Calais', thumbsUp: 18, thumbsDown: 7, visitCount: 45, createdBy: '@telescopeur75', createdAt: new Date(Date.now() - 60 * 86400000), distance: null },
];

// ── State ───────────────────────────────────────────────────────────────────

const state = {
  lieux: [...DEMO_LIEUX],
  filtered: [...DEMO_LIEUX],
  view: 'grid',
  page: 1,
  perPage: 6,
  userLat: null,
  userLng: null,
  map: null,
  clusterGroup: null,
  favorites: JSON.parse(localStorage.getItem('astronuit_fav_lieux') || '[]'),
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function getBortleBadge(b) { return `<span class="bortle-badge bortle-${b}">\u2B1B Bortle ${b}</span>`; }
function getAccessBadge(a) { const m = { foot: '\uD83D\uDC5F Pied', car: '\uD83D\uDE97 Voiture', '4x4': '\uD83D\uDE99 4x4' }; return `<span class="access-badge">${m[a] || a}</span>`; }
function getTypeBadge(t) { const m = { observation: '\uD83D\uDD2D Observation', panorama: '\uD83C\uDFD4\uFE0F Panorama' }; return `<span class="badge ${t === 'observation' ? 'badge-primary' : 'badge-secondary'}">${m[t] || t}</span>`; }
function isFav(id) { return state.favorites.includes(id); }
function formatDistance(km) { if (km === null) return ''; return km < 1 ? `${Math.round(km * 1000)} m` : `${Math.round(km)} km`; }
function timeAgo(d) { const days = Math.floor((Date.now() - d.getTime()) / 86400000); if (days === 0) return 'Aujourd\'hui'; if (days === 1) return 'Hier'; if (days < 7) return `Il y a ${days} j`; if (days < 30) return `Il y a ${Math.floor(days / 7)} sem`; return `Il y a ${Math.floor(days / 30)} mois`; }

// Expose toggleFav globally for onclick handlers
window.toggleFav = function(id, btn) {
  if (isFav(id)) {
    state.favorites = state.favorites.filter(f => f !== id);
    btn.textContent = '\u2661'; btn.classList.remove('active');
    Toast.info('Retire des favoris');
  } else {
    state.favorites.push(id);
    btn.textContent = '\u2665'; btn.classList.add('active');
    Toast.success('Ajoute aux favoris !');
  }
  localStorage.setItem('astronuit_fav_lieux', JSON.stringify(state.favorites));
};

// ── Render functions ────────────────────────────────────────────────────────

function renderLieuCard(l) {
  const favActive = isFav(l.id) ? 'active' : '';
  const favIcon = isFav(l.id) ? '\u2665' : '\u2661';
  const typeIcon = l.type === 'observation' ? '\uD83D\uDD2D' : '\uD83C\uDFD4\uFE0F';
  const dist = l.distance !== null ? `<span class="lieu-meta-item">\uD83D\uDCCD ${formatDistance(l.distance)}</span>` : '';

  return `
    <a href="lieu-detail.html?id=${l.id}" class="card lieu-card">
      <div class="lieu-card-image">
        <div class="lieu-card-image-bg"><span class="lieu-type-icon">${typeIcon}</span></div>
        <div class="lieu-card-badges">${getTypeBadge(l.type)}${getBortleBadge(l.bortle)}</div>
        <button class="lieu-card-fav ${favActive}" data-id="${l.id}" onclick="event.preventDefault();toggleFav('${l.id}',this)">${favIcon}</button>
      </div>
      <div class="lieu-card-body">
        <div class="lieu-card-title">${l.name}</div>
        <div class="lieu-card-location">\uD83D\uDCCD ${l.departementName} \u00B7 ${l.region}</div>
        <div class="lieu-vote-row">
          <button class="lieu-vote-btn up" onclick="event.preventDefault()">\uD83D\uDC4D ${l.thumbsUp}</button>
          <button class="lieu-vote-btn down" onclick="event.preventDefault()">\uD83D\uDC4E ${l.thumbsDown}</button>
        </div>
        <div class="lieu-card-meta">${getAccessBadge(l.access)}<span class="lieu-meta-item">\uD83D\uDC63 ${l.visitCount} visites</span>${dist}<span class="lieu-meta-item" style="margin-left:auto;">${timeAgo(l.createdAt)}</span></div>
      </div>
    </a>
  `;
}

function renderLieuListItem(l) {
  const favActive = isFav(l.id) ? 'active' : '';
  const favIcon = isFav(l.id) ? '\u2665' : '\u2661';
  const typeIcon = l.type === 'observation' ? '\uD83D\uDD2D' : '\uD83C\uDFD4\uFE0F';
  const dist = l.distance !== null ? `<span class="lieu-meta-item">\uD83D\uDCCD ${formatDistance(l.distance)}</span>` : '';

  return `
    <a href="lieu-detail.html?id=${l.id}" class="lieu-list-item">
      <div class="lieu-list-thumb"><span style="position:relative;z-index:1;">${typeIcon}</span></div>
      <div class="lieu-list-body">
        <div class="lieu-list-title">${l.name}</div>
        <div class="lieu-list-location">\uD83D\uDCCD ${l.departementName} \u00B7 ${l.region}</div>
        <div class="lieu-list-tags">${getBortleBadge(l.bortle)}${getAccessBadge(l.access)}${dist}</div>
      </div>
      <div class="lieu-list-right">
        <div class="lieu-list-votes"><span>\uD83D\uDC4D ${l.thumbsUp}</span><span>\uD83D\uDC63 ${l.visitCount}</span></div>
        <button class="lieu-card-fav ${favActive}" data-id="${l.id}" onclick="event.preventDefault();toggleFav('${l.id}',this)" style="position:static;width:30px;height:30px;">${favIcon}</button>
      </div>
    </a>
  `;
}

// ── Filters ─────────────────────────────────────────────────────────────────

function applyFilters() {
  const search = document.getElementById('search-input')?.value.toLowerCase().trim() || '';
  const type = document.getElementById('filter-type')?.value || '';
  const bortle = parseInt(document.getElementById('filter-bortle')?.value || '0');
  const access = document.getElementById('filter-access')?.value || '';
  const distance = parseInt(document.getElementById('filter-distance')?.value || '0');
  const sort = document.getElementById('filter-sort')?.value || 'recent';

  let result = [...DEMO_LIEUX];
  if (search) result = result.filter(l => l.name.toLowerCase().includes(search) || l.region.toLowerCase().includes(search) || l.departementName.toLowerCase().includes(search));
  if (type) result = result.filter(l => l.type === type);
  if (bortle) result = result.filter(l => l.bortle <= bortle);
  if (access) result = result.filter(l => l.access === access);

  result = result.map(l => ({
    ...l,
    distance: state.userLat !== null ? haversine(state.userLat, state.userLng, l.lat, l.lng) : null,
  }));

  if (distance && state.userLat !== null) result = result.filter(l => l.distance <= distance);

  switch (sort) {
    case 'popular': result.sort((a, b) => (b.thumbsUp - b.thumbsDown) - (a.thumbsUp - a.thumbsDown)); break;
    case 'bortle': result.sort((a, b) => a.bortle - b.bortle); break;
    case 'visited': result.sort((a, b) => b.visitCount - a.visitCount); break;
    case 'distance': if (state.userLat !== null) result.sort((a, b) => (a.distance || 999) - (b.distance || 999)); break;
    default: result.sort((a, b) => b.createdAt - a.createdAt);
  }

  state.filtered = result;
  state.page = 1;
  renderCurrentView();
}

// ── View rendering ──────────────────────────────────────────────────────────

function renderCurrentView() {
  const count = state.filtered.length;
  const countEl = document.getElementById('filtered-count');
  if (countEl) countEl.textContent = count;

  const emptyEl = document.getElementById('lieux-empty');
  const loadMore = document.getElementById('load-more-container');
  if (count === 0) { emptyEl?.removeAttribute('style'); if (loadMore) loadMore.style.display = 'none'; }
  else { if (emptyEl) emptyEl.style.display = 'none'; if (loadMore) loadMore.style.display = ''; }

  if (state.view === 'grid') renderGrid();
  else if (state.view === 'list') renderList();
  else if (state.view === 'map') renderMap();
}

function renderGrid() {
  const container = document.getElementById('view-grid');
  if (!container) return;
  const items = state.filtered.slice(0, state.page * state.perPage);
  container.innerHTML = items.map(renderLieuCard).join('');
  const loadMore = document.getElementById('load-more-container');
  if (loadMore) loadMore.style.display = items.length < state.filtered.length ? '' : 'none';
}

function renderList() {
  const container = document.getElementById('view-list');
  if (!container) return;
  const items = state.filtered.slice(0, state.page * state.perPage);
  container.innerHTML = items.map(renderLieuListItem).join('');
  const loadMore = document.getElementById('load-more-container');
  if (loadMore) loadMore.style.display = items.length < state.filtered.length ? '' : 'none';
}

function initMapView() {
  if (state.map) return;
  const mapEl = document.getElementById('lieux-map');
  if (!mapEl || typeof L === 'undefined') return;

  state.map = L.map('lieux-map', { center: [46.8, 2.3], zoom: 6 });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '\u00A9 OpenStreetMap, \u00A9 CARTO', maxZoom: 18 }).addTo(state.map);
  state.clusterGroup = L.markerClusterGroup({
    iconCreateFunction: (cluster) => L.divIcon({
      html: `<div style="width:40px;height:40px;border-radius:50%;background:rgba(108,62,184,.4);border:2px solid rgba(108,62,184,.7);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:.85rem;">${cluster.getChildCount()}</div>`,
      className: '', iconSize: [40, 40],
    })
  });
  state.map.addLayer(state.clusterGroup);
  updateMapMarkers();
}

function renderMap() {
  initMapView();
  updateMapMarkers();
  setTimeout(() => state.map?.invalidateSize(), 100);
}

function updateMapMarkers() {
  if (!state.clusterGroup) return;
  state.clusterGroup.clearLayers();
  state.filtered.forEach(l => {
    const typeIcon = l.type === 'observation' ? '\uD83D\uDD2D' : '\uD83C\uDFD4\uFE0F';
    const icon = L.divIcon({ html: `<div class="lieu-marker type-${l.type}"><span class="lieu-marker-inner">${typeIcon}</span></div>`, className: '', iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -36] });
    const marker = L.marker([l.lat, l.lng], { icon });
    marker.bindPopup(`<div class="map-popup"><div class="map-popup-title">${l.name}</div><div class="map-popup-location">\uD83D\uDCCD ${l.departementName} \u00B7 ${l.region}</div><div class="map-popup-tags">${getBortleBadge(l.bortle)}${getAccessBadge(l.access)}</div><div style="display:flex;gap:12px;font-size:.75rem;color:#888;margin-bottom:10px;"><span>\uD83D\uDC4D ${l.thumbsUp}</span><span>\uD83D\uDC63 ${l.visitCount} visites</span></div><a href="lieu-detail.html?id=${l.id}" class="map-popup-link">Voir la fiche \u2192</a></div>`, { maxWidth: 260, minWidth: 200 });
    state.clusterGroup.addLayer(marker);
  });
}

function switchView(view) {
  state.view = view;
  document.querySelectorAll('.view-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
  const viewGrid = document.getElementById('view-grid');
  const viewList = document.getElementById('view-list');
  const viewMap = document.getElementById('view-map');
  if (viewGrid) viewGrid.style.display = view === 'grid' ? '' : 'none';
  if (viewList) viewList.style.display = view === 'list' ? '' : 'none';
  if (viewMap) viewMap.style.display = view === 'map' ? '' : 'none';
  renderCurrentView();
}

// ── Geolocate ───────────────────────────────────────────────────────────────

function geolocateUser() {
  if (!navigator.geolocation) { Toast.warning('Geolocalisation non disponible'); return; }
  const btn = document.getElementById('btn-geolocate-lieux');
  if (btn) btn.textContent = '\u23F3 Localisation\u2026';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      state.userLat = pos.coords.latitude;
      state.userLng = pos.coords.longitude;
      if (btn) btn.textContent = '\uD83D\uDCCD Pres de moi';
      document.getElementById('filter-sort').value = 'distance';
      Toast.success('Position detectee !');
      applyFilters();
      if (state.map) {
        state.map.setView([state.userLat, state.userLng], 9);
        L.circleMarker([state.userLat, state.userLng], { radius: 8, fillColor: '#f5a623', fillOpacity: .8, color: '#fff', weight: 2 }).addTo(state.map).bindPopup('Vous etes ici').openPopup();
      }
    },
    () => { if (btn) btn.textContent = '\uD83D\uDCCD Pres de moi'; Toast.error('Impossible de vous localiser'); },
    { timeout: 8000 }
  );
}

// ── Init ────────────────────────────────────────────────────────────────────

function init() {
  initAuthNavbar();

  document.getElementById('search-input')?.addEventListener('input', applyFilters);
  document.getElementById('filter-type')?.addEventListener('change', applyFilters);
  document.getElementById('filter-bortle')?.addEventListener('change', applyFilters);
  document.getElementById('filter-access')?.addEventListener('change', applyFilters);
  document.getElementById('filter-distance')?.addEventListener('change', applyFilters);
  document.getElementById('filter-sort')?.addEventListener('change', applyFilters);

  document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
    document.getElementById('search-input').value = '';
    document.getElementById('filter-type').value = '';
    document.getElementById('filter-bortle').value = '';
    document.getElementById('filter-access').value = '';
    document.getElementById('filter-distance').value = '';
    document.getElementById('filter-sort').value = 'recent';
    applyFilters();
  });

  document.getElementById('btn-geolocate-lieux')?.addEventListener('click', geolocateUser);
  document.querySelectorAll('.view-btn').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
  document.getElementById('btn-load-more')?.addEventListener('click', () => { state.page++; renderCurrentView(); });

  document.getElementById('btn-add-lieu')?.addEventListener('click', (e) => {
    if (!window.currentUser) {
      e.preventDefault();
      Toast.warning('Connectez-vous pour ajouter un spot');
      setTimeout(() => window.location.href = 'connexion.html', 1200);
    }
  });

  applyFilters();
  registerServiceWorker();
}

init();
