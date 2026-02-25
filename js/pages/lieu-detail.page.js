/**
 * AstroNuit — Page Lieu Detail
 * Remplace : js/lieu-detail.js + js/app.js
 */

import { Toast, initAuthNavbar, registerServiceWorker } from '../utils/app.js';

// ── Demo data ───────────────────────────────────────────────────────────────

const LIEUX_DATA = [
  { id: 'l1', name: 'Causse Mejean \u2014 Chaos de Nimes-le-Vieux', description: 'Plateau calcaire du Massif Central, ciel exceptionnel loin de toute lumiere. Horizon a 360\u00B0.', lat: 44.2833, lng: 3.3500, type: 'observation', bortle: 2, access: 'car', facilities: { water: false, shelter: false, parking: true }, isPublicAccess: true, region: 'Occitanie', departement: '48', departementName: 'Lozere', thumbsUp: 47, thumbsDown: 2, visitCount: 134, createdBy: '@astronome_pro', createdAt: new Date(Date.now() - 3 * 86400000) },
  { id: 'l2', name: 'Col du Tourmalet', description: 'A 2115m d\'altitude, panorama epoustouflant et ciel tres sombre.', lat: 42.9078, lng: 0.1451, type: 'panorama', bortle: 3, access: 'car', facilities: { water: false, shelter: false, parking: true }, isPublicAccess: true, region: 'Occitanie', departement: '65', departementName: 'Hautes-Pyrenees', thumbsUp: 38, thumbsDown: 4, visitCount: 89, createdBy: '@ciel_breton', createdAt: new Date(Date.now() - 7 * 86400000) },
  { id: 'l5', name: 'Presqu\'ile de Crozon \u2014 Pointe de Pen Hir', description: 'Falaises atlantiques spectaculaires, horizon infini vers l\'ouest.', lat: 48.2434, lng: -4.5512, type: 'observation', bortle: 2, access: 'foot', facilities: { water: false, shelter: false, parking: true }, isPublicAccess: true, region: 'Bretagne', departement: '29', departementName: 'Finistere', thumbsUp: 54, thumbsDown: 1, visitCount: 201, createdBy: '@ciel_breton', createdAt: new Date(Date.now() - 5 * 86400000) },
  { id: 'l8', name: 'Parc National des Cevennes \u2014 Mont Lozere', description: 'Zone RICE officielle. Bortle 1 au sommet. Un des meilleurs ciels de France.', lat: 44.5123, lng: 3.7234, type: 'observation', bortle: 1, access: 'foot', facilities: { water: false, shelter: true, parking: true }, isPublicAccess: true, region: 'Occitanie', departement: '48', departementName: 'Lozere', thumbsUp: 78, thumbsDown: 0, visitCount: 243, createdBy: '@astronome_pro', createdAt: new Date(Date.now() - 45 * 86400000) },
];

const DEMO_AVIS = [
  { id: 'a1', userId: 'u2', pseudo: '@stargazer42', initial: 'S', vote: 'up', text: 'Spot exceptionnel. Voie lactee visible a l\'oeil nu des 22h30 en ete.', date: new Date(Date.now() - 5 * 86400000) },
  { id: 'a2', userId: 'u3', pseudo: '@ciel_breton', initial: 'C', vote: 'up', text: 'Ciel vraiment tres noir. Attention chemin d\'acces un peu defonce.', date: new Date(Date.now() - 12 * 86400000) },
  { id: 'a3', userId: 'u4', pseudo: '@jupiterobserver', initial: 'J', vote: 'up', text: 'Vent assez fort en automne, prevoir du lestage.', date: new Date(Date.now() - 30 * 86400000) },
];

const DEMO_CHECKINS = [
  { pseudo: '@stargazer42', initial: 'S', date: new Date(Date.now() - 2 * 86400000) },
  { pseudo: '@ciel_breton', initial: 'C', date: new Date(Date.now() - 5 * 86400000) },
  { pseudo: '@astronome_pro', initial: 'A', date: new Date(Date.now() - 10 * 86400000) },
  { pseudo: '@luna_obs', initial: 'L', date: new Date(Date.now() - 21 * 86400000) },
];

const DEMO_EVENTS_LIEU = [
  { id: 'e1', title: 'Soiree Dobson & Voie Lactee', date: new Date(Date.now() + 8 * 86400000), participants: 12, maxParticipants: 20, organizer: '@astronome_pro' },
  { id: 'e2', title: 'Observation des Perseides', date: new Date(Date.now() + 22 * 86400000), participants: 7, maxParticipants: 15, organizer: '@ciel_breton' },
];

// ── State ───────────────────────────────────────────────────────────────────

let currentLieu = null;
let selectedVote = null;
let checkins = [...DEMO_CHECKINS];
let avis = [...DEMO_AVIS];
let isFav = false;

// ── Helpers ─────────────────────────────────────────────────────────────────

function getBortleBadge(b) { return `<span class="bortle-badge bortle-${b}">\u2B1B Bortle ${b}</span>`; }
function getTypeBadge(t) { const m = { observation: '\uD83D\uDD2D Observation', panorama: '\uD83C\uDFD4\uFE0F Panorama' }; return `<span class="badge ${t === 'observation' ? 'badge-primary' : 'badge-secondary'}">${m[t] || t}</span>`; }
function timeAgo(d) { const days = Math.floor((Date.now() - d.getTime()) / 86400000); if (days === 0) return 'Aujourd\'hui'; if (days === 1) return 'Hier'; if (days < 7) return `Il y a ${days} j`; if (days < 30) return `Il y a ${Math.floor(days / 7)} sem`; return `Il y a ${Math.floor(days / 30)} mois`; }
function formatDate(d) { return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }

// ── Init ────────────────────────────────────────────────────────────────────

function init() {
  initAuthNavbar();

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || 'l1';
  currentLieu = LIEUX_DATA.find(l => l.id === id) || LIEUX_DATA[0];

  renderHero();
  renderInfos();
  renderMap();
  renderConditions();
  renderCheckins();
  renderAvis();
  renderEvents();
  renderNearby();
  renderAddedBy();
  updateStats();
  initButtons();
  initModal();
  registerServiceWorker();
}

function renderHero() {
  if (!currentLieu) return;
  document.title = `${currentLieu.name} \u2014 AstroNuit`;
  const nameEl = document.getElementById('breadcrumb-name');
  if (nameEl) nameEl.textContent = currentLieu.name;
  const titleEl = document.getElementById('lieu-hero-title');
  if (titleEl) titleEl.textContent = currentLieu.name;
  const locationEl = document.getElementById('lieu-hero-location');
  if (locationEl) locationEl.textContent = `\uD83D\uDCCD ${currentLieu.departementName} \u00B7 ${currentLieu.region}`;
  const badgesEl = document.getElementById('lieu-hero-badges');
  if (badgesEl) badgesEl.innerHTML = getTypeBadge(currentLieu.type) + getBortleBadge(currentLieu.bortle);
  const btnEvent = document.getElementById('btn-create-event-here');
  if (btnEvent) btnEvent.href = `creer-evenement.html?lieu=${currentLieu.id}&lat=${currentLieu.lat}&lng=${currentLieu.lng}&name=${encodeURIComponent(currentLieu.name)}`;
}

function renderInfos() {
  if (!currentLieu) return;
  const accessMap = { foot: '\uD83D\uDC5F A pied', car: '\uD83D\uDE97 Voiture', '4x4': '\uD83D\uDE99 4x4' };
  const f = currentLieu.facilities;
  const container = document.getElementById('infos-grid');
  if (container) container.innerHTML = `
    <div class="info-item"><div class="info-icon">\uD83C\uDFC3</div><div class="info-content"><div class="info-label">Acces</div><div class="info-value">${accessMap[currentLieu.access] || currentLieu.access}</div></div></div>
    <div class="info-item"><div class="info-icon">${currentLieu.isPublicAccess ? '\u2705' : '\uD83D\uDD12'}</div><div class="info-content"><div class="info-label">Acces</div><div class="info-value">${currentLieu.isPublicAccess ? 'Acces libre' : 'Acces prive'}</div></div></div>
    <div class="info-item"><div class="info-icon">\uD83C\uDD7F\uFE0F</div><div class="info-content"><div class="info-label">Parking</div><div class="info-value">${f.parking ? 'Disponible' : 'Pas de parking'}</div></div></div>
    <div class="info-item"><div class="info-icon">\uD83C\uDFE0</div><div class="info-content"><div class="info-label">Abri</div><div class="info-value">${f.shelter ? 'Oui' : 'Aucun'}</div></div></div>
    <div class="info-item"><div class="info-icon">\uD83D\uDCA7</div><div class="info-content"><div class="info-label">Eau potable</div><div class="info-value">${f.water ? 'Disponible' : 'A prevoir'}</div></div></div>
    <div class="info-item"><div class="info-icon">\u2B1B</div><div class="info-content"><div class="info-label">Echelle Bortle</div><div class="info-value">${currentLieu.bortle} / 9 \u2014 ${currentLieu.bortle <= 2 ? 'Ciel noir' : currentLieu.bortle <= 4 ? 'Rural' : 'Suburban'}</div></div></div>
  `;
  const gpsEl = document.getElementById('gps-coords');
  if (gpsEl) gpsEl.textContent = `GPS : ${currentLieu.lat.toFixed(4)}, ${currentLieu.lng.toFixed(4)}`;
  const itinBtn = document.getElementById('btn-itinerary');
  if (itinBtn) itinBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${currentLieu.lat},${currentLieu.lng}`;
}

function renderMap() {
  if (!currentLieu || typeof L === 'undefined') return;
  const map = L.map('lieu-map', { center: [currentLieu.lat, currentLieu.lng], zoom: 13, zoomControl: true, scrollWheelZoom: false });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '\u00A9 OpenStreetMap, \u00A9 CARTO', maxZoom: 18 }).addTo(map);
  const typeIcon = currentLieu.type === 'observation' ? '\uD83D\uDD2D' : '\uD83C\uDFD4\uFE0F';
  const icon = L.divIcon({ html: `<div style="width:40px;height:40px;border-radius:50%;background:rgba(108,62,184,.8);border:2px solid rgba(178,132,255,.6);display:flex;align-items:center;justify-content:center;font-size:1.2rem;box-shadow:0 0 16px rgba(108,62,184,.6);">${typeIcon}</div>`, className: '', iconSize: [40, 40], iconAnchor: [20, 20] });
  L.marker([currentLieu.lat, currentLieu.lng], { icon }).addTo(map).bindPopup(`<strong>${currentLieu.name}</strong>`).openPopup();
}

function renderConditions() {
  if (!currentLieu || typeof SunCalc === 'undefined') return;
  const now = new Date();
  const moonIllum = SunCalc.getMoonIllumination(now);
  const moonTimes = SunCalc.getMoonTimes(now, currentLieu.lat, currentLieu.lng);
  const sunTimes = SunCalc.getTimes(now, currentLieu.lat, currentLieu.lng);
  const illumPct = Math.round(moonIllum.fraction * 100);
  const phaseNames = ['\uD83C\uDF11', '\uD83C\uDF12', '\uD83C\uDF13', '\uD83C\uDF14', '\uD83C\uDF15', '\uD83C\uDF16', '\uD83C\uDF17', '\uD83C\uDF18'];
  const phaseIdx = Math.round(moonIllum.phase * 8) % 8;

  const el = id => document.getElementById(id);
  if (el('cond-moon')) el('cond-moon').textContent = `${phaseNames[phaseIdx]} ${illumPct}%`;
  if (moonTimes.set && el('cond-moon-set')) { const h = moonTimes.set.getHours().toString().padStart(2, '0'); const m = moonTimes.set.getMinutes().toString().padStart(2, '0'); el('cond-moon-set').textContent = `Coucher ${h}:${m}`; }
  if (sunTimes.astronomicalDusk && el('cond-darknight')) { const h = sunTimes.astronomicalDusk.getHours().toString().padStart(2, '0'); const m = sunTimes.astronomicalDusk.getMinutes().toString().padStart(2, '0'); el('cond-darknight').textContent = `${h}:${m}`; }
  if (sunTimes.astronomicalDawn && el('cond-darknight-end')) { const h = sunTimes.astronomicalDawn.getHours().toString().padStart(2, '0'); const m = sunTimes.astronomicalDawn.getMinutes().toString().padStart(2, '0'); el('cond-darknight-end').textContent = `Fin ${h}:${m}`; }

  const seeings = ['Excellent', 'Tres bon', 'Bon', 'Moyen', 'Faible'];
  const seeingIdx = Math.min(Math.floor((currentLieu.bortle - 1) / 2), 4);
  if (el('cond-seeing')) el('cond-seeing').textContent = seeings[seeingIdx];
  if (el('cond-seeing-sub')) el('cond-seeing-sub').textContent = currentLieu.bortle <= 2 ? '\u2605\u2605\u2605\u2605\u2605' : currentLieu.bortle <= 4 ? '\u2605\u2605\u2605\u2605\u2606' : '\u2605\u2605\u2605\u2606\u2606';

  const moonGood = illumPct < 25, bortleGood = currentLieu.bortle <= 3;
  let globalIcon, globalVal, globalClass;
  if (moonGood && bortleGood) { globalIcon = '\u2705'; globalVal = 'Excellentes'; globalClass = 'good'; }
  else if (moonGood || bortleGood) { globalIcon = '\u26A0\uFE0F'; globalVal = 'Correctes'; globalClass = 'medium'; }
  else { globalIcon = '\u274C'; globalVal = 'Defavorables'; globalClass = 'bad'; }
  if (el('cond-global-icon')) el('cond-global-icon').textContent = globalIcon;
  if (el('cond-global-val')) el('cond-global-val').textContent = globalVal;
  const globalEl = el('cond-global');
  if (globalEl) globalEl.className = `condition-item conditions-global ${globalClass}`;

  const mockClouds = Math.floor(Math.random() * 40);
  if (el('cond-weather')) el('cond-weather').textContent = mockClouds < 20 ? '\u2600\uFE0F Degage' : mockClouds < 50 ? '\u26C5 Partiel' : '\u2601\uFE0F Couvert';
  if (el('cond-clouds')) el('cond-clouds').textContent = `${mockClouds}% nuages`;
  if (el('cond-wind')) el('cond-wind').textContent = `${Math.floor(Math.random() * 25 + 5)} km/h`;
  if (el('cond-humidity')) el('cond-humidity').textContent = `Humidite ${Math.floor(Math.random() * 40 + 30)}%`;
}

function renderCheckins() {
  const container = document.getElementById('checkins-list');
  if (!container) return;
  if (checkins.length === 0) { container.innerHTML = '<p style="color:var(--color-text-dim);font-size:.85rem;">Aucun check-in. Soyez le premier !</p>'; return; }
  container.innerHTML = checkins.slice(0, 4).map(c => `<div class="checkin-item"><div class="avatar">${c.initial}</div><div class="checkin-info"><div class="checkin-name">${c.pseudo}</div><div class="checkin-date">${timeAgo(c.date)}</div></div></div>`).join('');
}

function renderAvis() {
  const upCount = currentLieu ? currentLieu.thumbsUp : 0;
  const downCount = currentLieu ? currentLieu.thumbsDown : 0;
  const totalVotes = upCount + downCount;
  const pct = totalVotes > 0 ? Math.round(upCount / totalVotes * 100) : 0;
  const summaryEl = document.getElementById('votes-summary');
  if (summaryEl) summaryEl.innerHTML = `<span class="badge" style="background:rgba(74,222,128,.15);color:#4ade80;border:1px solid rgba(74,222,128,.3);">\uD83D\uDC4D ${upCount} (${pct}%)</span><span class="badge" style="background:rgba(248,113,113,.1);color:#f87171;border:1px solid rgba(248,113,113,.3);">\uD83D\uDC4E ${downCount}</span>`;

  const container = document.getElementById('avis-list');
  if (!container) return;
  if (avis.length === 0) { container.innerHTML = '<p style="color:var(--color-text-dim);font-size:.85rem;text-align:center;padding:2rem 0;">Aucun avis. Soyez le premier !</p>'; return; }
  container.innerHTML = avis.map(a => `<div class="avis-item"><div class="avis-header"><div class="avatar" style="width:36px;height:36px;font-size:.9rem;">${a.initial}</div><div><div class="avis-author">${a.pseudo}</div><div class="avis-date">${formatDate(a.date)}</div></div><div class="avis-vote-badge">${a.vote === 'up' ? '<span style="color:#4ade80;">\uD83D\uDC4D Recommande</span>' : '<span style="color:#f87171;">\uD83D\uDC4E Deconseille</span>'}</div></div><div class="avis-text">${a.text}</div></div>`).join('');
}

function renderEvents() {
  const container = document.getElementById('lieu-events-list');
  if (!container) return;
  if (DEMO_EVENTS_LIEU.length === 0) { container.innerHTML = '<p style="color:var(--color-text-dim);">Aucune sortie planifiee ici.</p>'; return; }
  container.innerHTML = DEMO_EVENTS_LIEU.map(ev => {
    const d = ev.date;
    return `<div class="lieu-event-item"><div class="lieu-event-date"><div class="lieu-event-date-day">${d.getDate()}</div><div class="lieu-event-date-month">${d.toLocaleDateString('fr-FR', { month: 'short' })}</div></div><div class="lieu-event-body"><div class="lieu-event-title">${ev.title}</div><div class="lieu-event-meta">par ${ev.organizer} \u00B7 ${ev.participants}/${ev.maxParticipants} participants</div></div><a href="evenement-detail.html?id=${ev.id}" class="btn btn-ghost btn-sm">Voir \u2192</a></div>`;
  }).join('');
}

function renderNearby() {
  const container = document.getElementById('nearby-list');
  if (!container || !currentLieu) return;
  function dist(a, b) { const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180, aa = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2; return R * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa)); }
  const nearby = LIEUX_DATA.filter(l => l.id !== currentLieu.id).map(l => ({ ...l, distance: dist(currentLieu, l) })).sort((a, b) => a.distance - b.distance).slice(0, 3);
  if (nearby.length === 0) { container.innerHTML = '<p style="font-size:.8rem;color:var(--color-text-dim);">Aucun spot proche.</p>'; return; }
  container.innerHTML = nearby.map(l => `<a href="lieu-detail.html?id=${l.id}" class="nearby-item"><div class="nearby-icon">${l.type === 'observation' ? '\uD83D\uDD2D' : '\uD83C\uDFD4\uFE0F'}</div><div class="nearby-info"><div class="nearby-name">${l.name}</div><div class="nearby-dist">${Math.round(l.distance)} km \u00B7 Bortle ${l.bortle}</div></div></a>`).join('');
}

function renderAddedBy() {
  const container = document.getElementById('added-by');
  if (!container || !currentLieu) return;
  const initial = currentLieu.createdBy.replace('@', '').charAt(0).toUpperCase();
  container.innerHTML = `<div class="contributor-mini"><div class="avatar" style="width:44px;height:44px;font-size:1.1rem;">${initial}</div><div class="contributor-mini-info"><div class="contributor-mini-name">${currentLieu.createdBy}</div><div class="contributor-mini-meta">Ajoute ${timeAgo(currentLieu.createdAt)}</div></div></div>`;
}

function updateStats() {
  if (!currentLieu) return;
  const el = id => document.getElementById(id);
  if (el('stat-visits')) el('stat-visits').textContent = currentLieu.visitCount;
  if (el('stat-thumbsup')) el('stat-thumbsup').textContent = currentLieu.thumbsUp;
  if (el('stat-avis')) el('stat-avis').textContent = avis.length;
}

function initButtons() {
  const favKey = 'astronuit_fav_lieux';
  const favList = JSON.parse(localStorage.getItem(favKey) || '[]');
  isFav = currentLieu ? favList.includes(currentLieu.id) : false;

  const favBtn = document.getElementById('btn-fav');
  if (favBtn) {
    favBtn.textContent = isFav ? '\u2665 Favoris' : '\u2661 Favoris';
    favBtn.addEventListener('click', () => {
      isFav = !isFav;
      const list = JSON.parse(localStorage.getItem(favKey) || '[]');
      if (isFav) { list.push(currentLieu.id); favBtn.textContent = '\u2665 Favoris'; Toast.success('Ajoute aux favoris !'); }
      else { const idx = list.indexOf(currentLieu.id); if (idx >= 0) list.splice(idx, 1); favBtn.textContent = '\u2661 Favoris'; Toast.info('Retire des favoris'); }
      localStorage.setItem(favKey, JSON.stringify(list));
    });
  }

  document.getElementById('btn-share')?.addEventListener('click', () => {
    if (navigator.clipboard) navigator.clipboard.writeText(window.location.href).then(() => Toast.success('Lien copie !'));
    else Toast.info('Copiez le lien dans la barre d\'adresse');
  });

  document.querySelectorAll('.avis-vote').forEach(btn => {
    btn.addEventListener('click', () => {
      const vote = btn.dataset.vote;
      selectedVote = selectedVote === vote ? null : vote;
      document.querySelectorAll('.avis-vote').forEach(b => b.classList.remove('selected-up', 'selected-down'));
      if (selectedVote) btn.classList.add(`selected-${selectedVote}`);
    });
  });

  document.getElementById('btn-submit-avis')?.addEventListener('click', () => {
    const text = document.getElementById('avis-text')?.value.trim();
    if (!text) { Toast.warning('Ecrivez quelque chose avant de publier'); return; }
    avis.unshift({ id: `a${Date.now()}`, userId: 'me', pseudo: '@moi', initial: 'M', vote: selectedVote || 'up', text, date: new Date() });
    document.getElementById('avis-text').value = '';
    selectedVote = null;
    document.querySelectorAll('.avis-vote').forEach(b => b.classList.remove('selected-up', 'selected-down'));
    renderAvis();
    updateStats();
    Toast.success('Avis publie, merci !');
  });

  document.getElementById('btn-add-to-collection')?.addEventListener('click', () => Toast.info('Connectez-vous pour gerer vos collections'));
}

function initModal() {
  const openCheckin = () => { document.getElementById('checkin-date').value = new Date().toISOString().split('T')[0]; document.getElementById('modal-checkin').style.display = 'flex'; };
  document.getElementById('btn-checkin')?.addEventListener('click', openCheckin);
  document.getElementById('btn-checkin-sidebar')?.addEventListener('click', openCheckin);
  document.getElementById('modal-checkin-close')?.addEventListener('click', () => { document.getElementById('modal-checkin').style.display = 'none'; });
  document.getElementById('btn-confirm-checkin')?.addEventListener('click', () => {
    const note = document.getElementById('checkin-note')?.value;
    checkins.unshift({ pseudo: '@moi', initial: 'M', date: new Date(), note });
    if (currentLieu) currentLieu.visitCount++;
    renderCheckins();
    updateStats();
    document.getElementById('modal-checkin').style.display = 'none';
    Toast.success('Check-in enregistre ! \uD83D\uDC63');
  });

  document.getElementById('btn-report')?.addEventListener('click', () => { document.getElementById('modal-report').style.display = 'flex'; });
  document.getElementById('modal-report-close')?.addEventListener('click', () => { document.getElementById('modal-report').style.display = 'none'; });
  document.getElementById('btn-confirm-report')?.addEventListener('click', () => {
    if (!document.getElementById('report-reason')?.value) { Toast.warning('Choisissez un motif'); return; }
    document.getElementById('modal-report').style.display = 'none';
    Toast.success('Signalement envoye. Merci !');
  });

  document.getElementById('btn-upload-photo')?.addEventListener('click', () => Toast.info('Connexion requise pour ajouter des photos'));
  document.querySelectorAll('.modal-overlay').forEach(overlay => { overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.style.display = 'none'; }); });
}

init();
