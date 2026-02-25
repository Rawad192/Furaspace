/**
 * AstroNuit — Page Ajouter Lieu
 * Remplace : js/ajouter-lieu.js + js/app.js
 */

import { Toast, initAuthNavbar, registerServiceWorker } from '../utils/app.js';
import { requireAuth } from '../utils/router.js';

let currentStep = 1;
let pickMap = null;
let pickMarker = null;
let selectedType = 'observation';

async function init() {
  await requireAuth();
  initAuthNavbar();
  initDescCounter();
  initTypePicker();
  initFacilities();
  initCoordsSync();
  document.getElementById('btn-geolocate-form')?.addEventListener('click', geolocateForm);
  document.getElementById('btn-submit-lieu')?.addEventListener('click', submitLieu);
  checkUrlParams();
  registerServiceWorker();
}

// Expose goToStep globally for onclick in HTML
window.goToStep = function(target) {
  if (target > currentStep && !validateStep(currentStep)) return;
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById(`panel-${target}`);
  if (panel) panel.classList.add('active');
  currentStep = target;
  updateStepper(target);
  if (target === 2) initPickMap();
  if (target === 3) renderPreview();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

function updateStepper(step) {
  for (let i = 1; i <= 3; i++) {
    const circle = document.getElementById(`step-circle-${i}`);
    const item = document.getElementById(`step-item-${i}`);
    if (!circle || !item) continue;
    circle.classList.remove('active', 'done');
    item.classList.remove('active', 'done');
    if (i < step) { circle.classList.add('done'); item.classList.add('done'); circle.textContent = '\u2713'; }
    else if (i === step) { circle.classList.add('active'); item.classList.add('active'); circle.textContent = i; }
    else circle.textContent = i;
  }
  for (let i = 1; i <= 2; i++) { const c = document.getElementById(`step-connector-${i}`); if (c) c.classList.toggle('done', i < step); }
}

function validateStep(step) {
  if (step === 1) {
    const name = document.getElementById('lieu-name')?.value.trim();
    const desc = document.getElementById('lieu-desc')?.value.trim();
    if (!name || name.length < 5) { Toast.warning('Le nom doit faire au moins 5 caracteres'); return false; }
    if (!desc || desc.length < 20) { Toast.warning('La description doit faire au moins 20 caracteres'); return false; }
    if (!document.getElementById('lieu-bortle')?.value) { Toast.warning('Indiquez l\'indice Bortle'); return false; }
    if (!document.getElementById('lieu-access')?.value) { Toast.warning('Precisez le type d\'acces'); return false; }
    return true;
  }
  if (step === 2) {
    const lat = parseFloat(document.getElementById('lieu-lat')?.value);
    const lng = parseFloat(document.getElementById('lieu-lng')?.value);
    if (isNaN(lat) || isNaN(lng)) { Toast.warning('Placez le spot sur la carte ou saisissez les coordonnees GPS'); return false; }
    if (lat < 41 || lat > 52 || lng < -5 || lng > 10) { Toast.warning('Coordonnees hors de France metropolitaine'); return false; }
    return true;
  }
  return true;
}

function initPickMap() {
  if (pickMap) { setTimeout(() => pickMap.invalidateSize(), 100); return; }
  const mapEl = document.getElementById('pick-map');
  if (!mapEl || typeof L === 'undefined') return;
  pickMap = L.map('pick-map', { center: [46.8, 2.3], zoom: 6 });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '\u00A9 OpenStreetMap, \u00A9 CARTO', maxZoom: 19 }).addTo(pickMap);
  pickMap.on('click', (e) => placeMarker(e.latlng.lat, e.latlng.lng));
  const latVal = parseFloat(document.getElementById('lieu-lat')?.value);
  const lngVal = parseFloat(document.getElementById('lieu-lng')?.value);
  if (!isNaN(latVal) && !isNaN(lngVal)) { placeMarker(latVal, lngVal); pickMap.setView([latVal, lngVal], 13); }
}

function placeMarker(lat, lng) {
  lat = parseFloat(lat.toFixed(6));
  lng = parseFloat(lng.toFixed(6));
  if (pickMarker) pickMarker.setLatLng([lat, lng]);
  else {
    const icon = L.divIcon({ html: '<div style="width:36px;height:36px;border-radius:50%;background:rgba(108,62,184,.85);border:3px solid rgba(178,132,255,.7);display:flex;align-items:center;justify-content:center;font-size:1.2rem;box-shadow:0 0 20px rgba(108,62,184,.7);">\uD83D\uDCCD</div>', className: '', iconSize: [36, 36], iconAnchor: [18, 18] });
    pickMarker = L.marker([lat, lng], { icon, draggable: true }).addTo(pickMap);
    pickMarker.on('dragend', (e) => { const p = e.target.getLatLng(); updateCoordsInputs(p.lat, p.lng); });
    document.getElementById('pick-map')?.classList.add('has-marker');
  }
  updateCoordsInputs(lat, lng);
  const hint = document.getElementById('map-hint');
  if (hint) hint.textContent = `\u2705 Spot place : ${lat.toFixed(4)}, ${lng.toFixed(4)} \u2014 Glissez pour ajuster`;
}

function updateCoordsInputs(lat, lng) {
  const latEl = document.getElementById('lieu-lat');
  const lngEl = document.getElementById('lieu-lng');
  if (latEl) latEl.value = lat.toFixed(6);
  if (lngEl) lngEl.value = lng.toFixed(6);
}

function geolocateForm() {
  if (!navigator.geolocation) { Toast.warning('Geolocalisation non disponible'); return; }
  const btn = document.getElementById('btn-geolocate-form');
  if (btn) btn.textContent = '\u23F3 Localisation\u2026';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      if (btn) btn.textContent = '\uD83D\uDCCD Utiliser ma position';
      if (pickMap) { pickMap.setView([lat, lng], 14); placeMarker(lat, lng); }
      else updateCoordsInputs(lat, lng);
      Toast.success('Position detectee !');
    },
    () => { if (btn) btn.textContent = '\uD83D\uDCCD Utiliser ma position'; Toast.error('Impossible de vous localiser'); },
    { timeout: 8000 }
  );
}

function renderPreview() {
  const name = document.getElementById('lieu-name')?.value || '\u2014';
  const desc = document.getElementById('lieu-desc')?.value || '';
  const bortle = document.getElementById('lieu-bortle')?.value || '?';
  const access = document.getElementById('lieu-access')?.value || '';
  const region = document.getElementById('lieu-region')?.value || 'France';
  const type = document.getElementById('lieu-type')?.value || 'observation';
  const lat = document.getElementById('lieu-lat')?.value || '?';
  const lng = document.getElementById('lieu-lng')?.value || '?';

  document.getElementById('preview-name').textContent = name;
  document.getElementById('preview-location').textContent = `\uD83D\uDCCD ${region} \u00B7 GPS ${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;
  document.getElementById('preview-desc').textContent = desc.length > 200 ? desc.slice(0, 200) + '\u2026' : desc;
  document.getElementById('preview-hero').textContent = type === 'observation' ? '\uD83D\uDD2D' : '\uD83C\uDFD4\uFE0F';

  const typeBadge = type === 'observation' ? '<span class="badge badge-primary">\uD83D\uDD2D Observation</span>' : '<span class="badge badge-secondary">\uD83C\uDFD4\uFE0F Panorama</span>';
  const bortleClass = bortle <= 2 ? 'bortle-2' : bortle <= 4 ? 'bortle-3' : 'bortle-5';
  document.getElementById('preview-badges').innerHTML = typeBadge + `<span class="bortle-badge ${bortleClass}">\u2B1B Bortle ${bortle}</span>`;

  const accessMap = { foot: '\uD83D\uDC5F Pied', car: '\uD83D\uDE97 Voiture', '4x4': '\uD83D\uDE99 4x4' };
  const tags = [accessMap[access], document.getElementById('fac-parking-cb')?.checked ? '\u2705 Parking' : '', document.getElementById('fac-water-cb')?.checked ? '\uD83D\uDCA7 Eau' : '', document.getElementById('fac-shelter-cb')?.checked ? '\uD83C\uDFE0 Abri' : ''].filter(Boolean);
  document.getElementById('preview-tags').innerHTML = tags.map(t => `<span class="badge badge-ghost">${t}</span>`).join('');
}

function submitLieu() {
  if (!document.getElementById('confirm-check')?.checked) { Toast.warning('Cochez la case de confirmation'); return; }
  const btn = document.getElementById('btn-submit-lieu');
  if (btn) { btn.disabled = true; btn.textContent = '\u23F3 Publication\u2026'; }
  setTimeout(() => { Toast.success('\u2705 Spot publie ! Merci pour votre contribution.'); setTimeout(() => window.location.href = 'lieux.html', 1500); }, 1200);
}

function initDescCounter() {
  const desc = document.getElementById('lieu-desc');
  const counter = document.getElementById('desc-counter');
  if (desc && counter) desc.addEventListener('input', () => { counter.textContent = `${desc.value.length} / 1000 caracteres`; });
}

function initTypePicker() {
  document.querySelectorAll('.type-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.type-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedType = opt.dataset.type;
      const hidden = document.getElementById('lieu-type');
      if (hidden) hidden.value = selectedType;
    });
  });
}

function initFacilities() {
  document.querySelectorAll('.facility-toggle').forEach(label => {
    label.addEventListener('click', () => label.classList.toggle('checked'));
  });
}

function initCoordsSync() {
  ['lieu-lat', 'lieu-lng'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => {
      const lat = parseFloat(document.getElementById('lieu-lat')?.value);
      const lng = parseFloat(document.getElementById('lieu-lng')?.value);
      if (!isNaN(lat) && !isNaN(lng) && pickMap) { placeMarker(lat, lng); pickMap.setView([lat, lng], 13); }
    });
  });
}

function checkUrlParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('lat') && params.get('lng')) {
    updateCoordsInputs(parseFloat(params.get('lat')), parseFloat(params.get('lng')));
  }
}

init();
