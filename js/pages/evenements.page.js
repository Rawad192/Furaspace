/**
 * AstroNuit — Page Evenements
 * Remplace : js/events.js + js/app.js
 */

import { Toast, initAuthNavbar, registerServiceWorker } from '../utils/app.js';

// ── Demo data ───────────────────────────────────────────────────────────────

const DEMO_EVENTS = [
  { id: '1', title: 'Perseides 2025 \u2014 Alpes-de-Haute-Provence', type: 'Pluie de meteorites', date: new Date('2025-08-12T22:00:00'), endDate: new Date('2025-08-13T02:00:00'), location: 'Plateau de Valensole', region: 'Provence-Alpes-Cote d\'Azur', lat: 43.834, lng: 5.984, participants: 14, maxParticipants: 30, organizer: 'astronome_pro', bortle: 2, weather: 'clear', icon: '\uD83C\uDF0C', description: 'Nuit d\'observation des Perseides au pic d\'activite...' },
  { id: '2', title: 'Jupiter au plus proche \u2014 Bretagne', type: 'Opposition planetaire', date: new Date('2025-08-18T21:30:00'), endDate: new Date('2025-08-19T01:00:00'), location: 'Finistere (29)', region: 'Bretagne', lat: 48.15, lng: -4.08, participants: 7, maxParticipants: 15, organizer: 'ciel_breton', bortle: 4, weather: 'clouds', icon: '\uD83E\uDE90', description: 'Jupiter en opposition, proche de la Terre...' },
  { id: '3', title: 'Nuit Voie Lactee \u2014 Cevennes', type: 'Voie Lactee', date: new Date('2025-08-25T22:30:00'), endDate: new Date('2025-08-26T03:00:00'), location: 'Parc National des Cevennes', region: 'Occitanie', lat: 44.1, lng: 3.65, participants: 22, maxParticipants: 40, organizer: 'stargazer_occitan', bortle: 2, weather: 'clear', icon: '\u2B50', description: 'Coeur de la Voie Lactee au zenith...' },
  { id: '4', title: 'Eclipse partielle de Lune \u2014 Normandie', type: 'Eclipse', date: new Date('2025-09-07T23:00:00'), endDate: new Date('2025-09-08T01:30:00'), location: 'Suisse Normande', region: 'Normandie', lat: 48.87, lng: -0.42, participants: 11, maxParticipants: 25, organizer: 'normand_etoile', bortle: 4, weather: 'clouds', icon: '\uD83C\uDF19', description: 'Observation de l\'eclipse partielle de Lune...' },
  { id: '5', title: 'Soiree debutants \u2014 Ile-de-France', type: 'Debutants bienvenus', date: new Date('2025-09-15T21:00:00'), endDate: new Date('2025-09-15T23:30:00'), location: 'Foret de Fontainebleau', region: 'Ile-de-France', lat: 48.4, lng: 2.7, participants: 18, maxParticipants: 20, organizer: 'astronome_idf', bortle: 5, weather: 'clear', icon: '\uD83D\uDD2D', description: 'Initiation a l\'astronomie...' },
  { id: '6', title: 'Astrophoto grand angle \u2014 Auvergne', type: 'Astrophotographie', date: new Date('2025-09-20T22:00:00'), endDate: new Date('2025-09-21T04:00:00'), location: 'Plateau du Cezallier', region: 'Auvergne-Rhone-Alpes', lat: 45.5, lng: 3.0, participants: 9, maxParticipants: 12, organizer: 'astrophoto_aura', bortle: 3, weather: 'clear', icon: '\uD83D\uDCF8', description: 'Nuit dediee a l\'astrophotographie...' },
];

let filteredEvents = [...DEMO_EVENTS];
let map = null;
let markers = [];

function init() {
  initAuthNavbar();
  renderEventsList();
  initFilters();
  initViewToggle();
  registerServiceWorker();
}

function formatEventDate(date) {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) + ' \u00B7 ' +
    date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function renderEventCard(event) {
  const meteoClass = { clear: 'meteo-clear', clouds: 'meteo-clouds', bad: 'meteo-bad' }[event.weather] || 'meteo-clouds';
  const meteoLabel = { clear: '\u2600\uFE0F Ciel degage prevu', clouds: '\uD83C\uDF24\uFE0F Partiellement nuageux', bad: '\u2601\uFE0F Couvert' }[event.weather] || '\u2014 Meteo inconnue';
  const spotsLeft = event.maxParticipants - event.participants;
  const isFull = spotsLeft <= 0;

  return `
    <div class="card event-card" data-event-id="${event.id}">
      <div class="event-card-image" style="background:linear-gradient(135deg,#1a0533,#0d1b4b);">${event.icon}</div>
      <div class="event-card-body">
        <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.75rem;">
          <span class="badge badge-primary">${event.type}</span>
          ${isFull ? '<span class="badge badge-error">Complet</span>' : spotsLeft <= 3 ? `<span class="badge badge-accent">${spotsLeft} place(s)</span>` : ''}
        </div>
        <h3 class="event-card-title">${event.title}</h3>
        <div class="event-card-meta">
          <div class="event-meta-item"><span class="icon">\uD83D\uDCC5</span><span>${formatEventDate(event.date)}</span></div>
          <div class="event-meta-item"><span class="icon">\uD83D\uDCCD</span><span>${event.location}</span></div>
          <div class="event-meta-item"><span class="icon">\uD83D\uDC65</span><span>${event.participants} / ${event.maxParticipants} inscrits</span></div>
        </div>
        <div class="event-card-footer">
          <span class="meteo-badge ${meteoClass}">${meteoLabel}</span>
          <a href="evenement-detail.html?id=${event.id}" class="btn btn-primary btn-sm">Voir \u2192</a>
        </div>
      </div>
    </div>
  `;
}

function renderEventsList() {
  const grid = document.getElementById('events-grid');
  const empty = document.getElementById('events-empty');
  const count = document.getElementById('count-number');
  if (!grid) return;

  if (count) count.textContent = filteredEvents.length;
  if (filteredEvents.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.style.display = 'block';
  } else {
    if (empty) empty.style.display = 'none';
    grid.innerHTML = filteredEvents.map(renderEventCard).join('');
  }
}

function applyFilters() {
  const region = document.getElementById('filter-region')?.value;
  const type = document.getElementById('filter-type')?.value;
  const dateVal = document.getElementById('filter-date')?.value;
  const bortleMax = parseInt(document.getElementById('filter-bortle')?.value);

  filteredEvents = DEMO_EVENTS.filter(ev => {
    if (region && ev.region !== region) return false;
    if (type && ev.type !== type) return false;
    if (dateVal) { const fd = new Date(dateVal); if (new Date(ev.date).toDateString() !== fd.toDateString()) return false; }
    if (bortleMax && ev.bortle > bortleMax) return false;
    return true;
  });
  renderEventsList();
  updateMap();
}

function initFilters() {
  document.getElementById('btn-filter')?.addEventListener('click', applyFilters);
}

// ── Map ─────────────────────────────────────────────────────────────────────

function initMap() {
  const mapEl = document.getElementById('events-map');
  if (!mapEl || map) return;
  map = L.map('events-map', { center: [46.6, 2.3], zoom: 5 });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '\u00A9 OpenStreetMap \u00B7 \u00A9 CartoDB', subdomains: 'abcd', maxZoom: 19 }).addTo(map);
  updateMap();
}

function updateMap() {
  if (!map) return;
  markers.forEach(m => m.remove());
  markers = [];

  filteredEvents.forEach(ev => {
    const icon = L.divIcon({
      className: '',
      html: `<div style="background:rgba(108,62,184,0.9);border:2px solid rgba(139,92,246,0.8);border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;box-shadow:0 0 12px rgba(108,62,184,0.6);">${ev.icon}</div>`,
      iconSize: [36, 36], iconAnchor: [18, 18],
    });
    const marker = L.marker([ev.lat, ev.lng], { icon })
      .bindPopup(`<div style="background:#0f0f1a;color:#e8e8f0;padding:12px;border-radius:8px;min-width:200px;">
        <strong style="font-size:0.9rem;">${ev.title}</strong><br>
        <small style="color:#9090b0;">\uD83D\uDCC5 ${formatEventDate(ev.date)}</small><br>
        <small style="color:#9090b0;">\uD83D\uDC65 ${ev.participants}/${ev.maxParticipants}</small><br>
        <a href="evenement-detail.html?id=${ev.id}" style="display:inline-block;margin-top:8px;background:#6c3eb8;color:white;padding:4px 12px;border-radius:6px;font-size:0.8rem;">Voir la sortie \u2192</a>
      </div>`, { className: 'dark-popup' })
      .addTo(map);
    markers.push(marker);
  });
}

function initViewToggle() {
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      const listC = document.getElementById('events-list-container');
      const mapC = document.getElementById('events-map-container');
      if (view === 'map') {
        if (listC) listC.style.display = 'none';
        if (mapC) mapC.style.display = 'block';
        initMap();
      } else {
        if (listC) listC.style.display = 'block';
        if (mapC) mapC.style.display = 'none';
      }
    });
  });
}

init();
