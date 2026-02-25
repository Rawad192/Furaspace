/**
 * AstroNuit — Page Accueil
 * Remplace : js/home.js + js/feed.js + js/app.js
 * Note: js/astronomy.js et js/weather.js restent en classic scripts (window.Astronomy, window.Weather)
 */

import { Toast, initAuthNavbar, Geoloc, registerServiceWorker } from '../utils/app.js';

// ── Feed data ───────────────────────────────────────────────────────────────

const FEED_SPOTS = [
  { id: 'l8', name: 'Mont Lozere', region: 'Occitanie', bortle: 1, type: 'observation', clouds: 5, addedAt: new Date(Date.now() - 45 * 86400000) },
  { id: 'l5', name: 'Pointe de Pen Hir', region: 'Bretagne', bortle: 2, type: 'observation', clouds: 12, addedAt: new Date(Date.now() - 5 * 86400000) },
  { id: 'l1', name: 'Causse Mejean', region: 'Occitanie', bortle: 2, type: 'observation', clouds: 8, addedAt: new Date(Date.now() - 3 * 86400000) },
  { id: 'l6', name: 'Vercors \u2014 Font d\'Urle', region: 'Auvergne-Rhone-Alpes', bortle: 2, type: 'observation', clouds: 22, addedAt: new Date(Date.now() - 10 * 86400000) },
  { id: 'l2', name: 'Col du Tourmalet', region: 'Occitanie', bortle: 3, type: 'panorama', clouds: 35, addedAt: new Date(Date.now() - 7 * 86400000) },
  { id: 'l4', name: 'Montagne Sainte-Victoire', region: 'PACA', bortle: 3, type: 'panorama', clouds: 15, addedAt: new Date(Date.now() - 21 * 86400000) },
];

// ── Init ────────────────────────────────────────────────────────────────────

function init() {
  initAuthNavbar();
  initMiniMap();
  initCounters();
  initParallax();
  initGeolocButton();
  initAstroData();
  renderFavorableSpots();
  renderNewSpots();
  registerServiceWorker();
}

// ── Mini-map Leaflet ────────────────────────────────────────────────────────

function initMiniMap() {
  const miniMapEl = document.getElementById('mini-map');
  if (!miniMapEl || typeof L === 'undefined') return;

  const miniMap = L.map('mini-map', { center: [46.6, 2.3], zoom: 5, zoomControl: false, scrollWheelZoom: false });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '\u00A9 CartoDB', subdomains: 'abcd' }).addTo(miniMap);

  const demoSites = [
    { lat: 43.834, lng: 5.984, name: 'Plateau de Valensole', bortle: 2, icon: '\uD83C\uDF0C' },
    { lat: 44.1, lng: 3.65, name: 'Cevennes', bortle: 2, icon: '\u2B50' },
    { lat: 45.5, lng: 3.0, name: 'Auvergne', bortle: 3, icon: '\uD83D\uDD2D' },
    { lat: 48.87, lng: -0.42, name: 'Suisse Normande', bortle: 4, icon: '\uD83C\uDF19' },
    { lat: 48.15, lng: -4.08, name: 'Finistere', bortle: 4, icon: '\uD83E\uDE90' },
    { lat: 42.8, lng: 1.5, name: 'Pyrenees', bortle: 2, icon: '\u2728' },
    { lat: 44.5, lng: 6.8, name: 'Alpes du Sud', bortle: 1, icon: '\uD83C\uDF1F' },
  ];

  const bortleColors = { 1: '#10b981', 2: '#10b981', 3: '#3b82f6', 4: '#3b82f6', 5: '#f59e0b' };
  demoSites.forEach(site => {
    L.circleMarker([site.lat, site.lng], {
      radius: 10, fillColor: bortleColors[site.bortle] || '#f59e0b',
      color: 'rgba(255,255,255,0.4)', weight: 1, opacity: 1, fillOpacity: 0.7,
    }).bindPopup(`<b>${site.icon} ${site.name}</b><br>Bortle ${site.bortle}`).addTo(miniMap);
  });

  [{ lat: 43.834, lng: 5.984 }, { lat: 44.1, lng: 3.65 }, { lat: 48.15, lng: -4.08 }].forEach(ev => {
    L.circleMarker([ev.lat, ev.lng], {
      radius: 14, fillColor: 'rgba(108,62,184,0.6)', color: '#8b5cf6', weight: 2, fillOpacity: 0.5, dashArray: '4',
    }).addTo(miniMap);
  });
}

// ── Animated counters ───────────────────────────────────────────────────────

function initCounters() {
  const statsSection = document.querySelector('.hero-stats');
  if (!statsSection) return;

  function animateCounter(el, target, duration = 1500) {
    if (!el) return;
    const step = Math.ceil(target / (duration / 16));
    let current = 0;
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current.toLocaleString('fr-FR');
      if (current >= target) clearInterval(interval);
    }, 16);
  }

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      animateCounter(document.getElementById('stat-members'), 842);
      animateCounter(document.getElementById('stat-events'), 127);
      animateCounter(document.getElementById('stat-sites'), 58);
      observer.disconnect();
    }
  });
  observer.observe(statsSection);
}

// ── Parallax ────────────────────────────────────────────────────────────────

function initParallax() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    hero.querySelectorAll('.nebula').forEach((neb, i) => {
      neb.style.transform = `translateY(${scrollY * (0.1 + i * 0.05)}px)`;
    });
  }, { passive: true });
}

// ── Geoloc button ───────────────────────────────────────────────────────────

function initGeolocButton() {
  const btn = document.getElementById('btn-geoloc');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = '\u23F3 Localisation...';
    try {
      const pos = await Geoloc.get();
      Geoloc.save(pos.lat, pos.lng);
      if (window.Weather) {
        await window.Weather.updateHomePage(pos.lat, pos.lng);
        window.Weather.updateBortleWidget(pos.lat, pos.lng);
      }
      if (window.Astronomy) window.Astronomy.updateHomePage(pos.lat, pos.lng);
      btn.textContent = '\u2705 Localise';
      Toast.success('Localisation reussie !');
    } catch {
      Toast.error('Impossible de vous localiser. Verifiez les permissions.');
      btn.textContent = '\uD83D\uDCCD Me localiser';
      btn.disabled = false;
    }
  });
}

// ── Astro data init ─────────────────────────────────────────────────────────

function initAstroData() {
  const cached = Geoloc.load();
  if (window.Astronomy) {
    const lat = cached ? cached.lat : 46.6;
    const lng = cached ? cached.lng : 2.3;
    window.Astronomy.updateHomePage(lat, lng);
    if (cached && window.Weather) {
      window.Weather.updateHomePage(lat, lng);
      window.Weather.updateBortleWidget(lat, lng);
    }
  }
}

// ── Feed: Favorable spots ───────────────────────────────────────────────────

function getBortleClass(b) { return b <= 2 ? 'bortle-2' : b <= 4 ? 'bortle-3' : 'bortle-5'; }
function getConditionsClass(clouds) { return clouds < 20 ? 'conditions-clear' : clouds < 50 ? 'conditions-partial' : 'conditions-cloudy'; }
function timeAgo(date) {
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days === 0) return 'Aujourd\'hui';
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days} j`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem`;
  return `Il y a ${Math.floor(days / 30)} mois`;
}

function renderFavorableSpots() {
  const container = document.getElementById('feed-favorable');
  if (!container) return;

  const favorable = FEED_SPOTS.filter(s => s.clouds < 35 && s.bortle <= 3).sort((a, b) => a.clouds - b.clouds).slice(0, 4);
  if (favorable.length === 0) { container.innerHTML = '<p style="color:var(--color-text-dim);font-size:.85rem;">Aucun spot favorable ce soir.</p>'; return; }

  container.innerHTML = favorable.map(s => `
    <a href="lieu-detail.html?id=${s.id}" class="feed-item">
      <div class="feed-item-icon"><span style="position:relative;z-index:1;">${s.type === 'observation' ? '\uD83D\uDD2D' : '\uD83C\uDFD4\uFE0F'}</span></div>
      <div class="feed-item-info">
        <div class="feed-item-title">${s.name}</div>
        <div class="feed-item-sub"><span class="bortle-badge ${getBortleClass(s.bortle)}" style="margin-right:4px;">\u2B1B Bortle ${s.bortle}</span>${s.region}</div>
      </div>
      <div class="feed-item-right">
        <div><span class="feed-conditions-dot ${getConditionsClass(s.clouds)}"></span></div>
        <div style="font-size:.7rem;color:var(--color-text-dim);">${s.clouds}% nuages</div>
      </div>
    </a>
  `).join('');
}

function renderNewSpots() {
  const container = document.getElementById('feed-new-spots');
  if (!container) return;

  const recent = [...FEED_SPOTS].sort((a, b) => b.addedAt - a.addedAt).slice(0, 4);
  container.innerHTML = recent.map(s => `
    <a href="lieu-detail.html?id=${s.id}" class="feed-item">
      <div class="feed-item-icon"><span style="position:relative;z-index:1;">${s.type === 'observation' ? '\uD83D\uDD2D' : '\uD83C\uDFD4\uFE0F'}</span></div>
      <div class="feed-item-info">
        <div class="feed-item-title">${s.name}</div>
        <div class="feed-item-sub"><span class="bortle-badge ${getBortleClass(s.bortle)}" style="margin-right:4px;">\u2B1B Bortle ${s.bortle}</span>${s.region}</div>
      </div>
      <div class="feed-item-right"><div style="font-size:.7rem;color:var(--color-text-dim);">${timeAgo(s.addedAt)}</div></div>
    </a>
  `).join('');
}

// ── Launch ──────────────────────────────────────────────────────────────────
init();
