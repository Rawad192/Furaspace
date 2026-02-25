/**
 * AstroNuit — Page Creer Evenement
 * Remplace : js/create-event.js + js/app.js
 */

import { Toast, initAuthNavbar, registerServiceWorker } from '../utils/app.js';
import { requireAuth } from '../utils/router.js';

let createMap = null;
let createMarker = null;
let currentStep = 1;

async function init() {
  await requireAuth();
  initAuthNavbar();
  initDateMin();
  initFormSubmit();
  registerServiceWorker();
}

window.goToStep = function(step) {
  if (step > currentStep) {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
  }
  document.getElementById(`step-${currentStep}`).style.display = 'none';
  document.getElementById(`step-${step}`).style.display = 'block';
  document.querySelectorAll('.step-ind').forEach(ind => {
    const s = parseInt(ind.dataset.step);
    ind.classList.remove('active', 'completed');
    if (s === step) ind.classList.add('active');
    if (s < step) ind.classList.add('completed');
  });
  currentStep = step;
  if (step === 2) initCreateMap();
  if (step === 3) renderPreview();
};

function validateStep1() {
  const title = document.getElementById('ev-title')?.value;
  const type = document.getElementById('ev-type')?.value;
  const date = document.getElementById('ev-date')?.value;
  const desc = document.getElementById('ev-description')?.value;
  if (!title || !type || !date || !desc) { Toast.error('Remplissez tous les champs obligatoires'); return false; }
  return true;
}

function validateStep2() {
  if (!document.getElementById('ev-location')?.value) { Toast.error('Indiquez un lieu de rendez-vous'); return false; }
  return true;
}

function initCreateMap() {
  if (createMap) return;
  const mapEl = document.getElementById('create-map');
  if (!mapEl) return;
  createMap = L.map('create-map', { center: [46.6, 2.3], zoom: 5 });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '\u00A9 CartoDB', subdomains: 'abcd' }).addTo(createMap);
  createMap.on('click', (e) => {
    if (createMarker) createMarker.remove();
    createMarker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(createMap);
    document.getElementById('ev-lat').value = e.latlng.lat.toFixed(4);
    document.getElementById('ev-lng').value = e.latlng.lng.toFixed(4);
    Toast.info('Point de rendez-vous place !');
  });
  document.getElementById('btn-locate-event')?.addEventListener('click', () => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      createMap.setView([pos.coords.latitude, pos.coords.longitude], 12);
      if (createMarker) createMarker.remove();
      createMarker = L.marker([pos.coords.latitude, pos.coords.longitude]).addTo(createMap);
      document.getElementById('ev-lat').value = pos.coords.latitude.toFixed(4);
      document.getElementById('ev-lng').value = pos.coords.longitude.toFixed(4);
    });
  });
}

function renderPreview() {
  const preview = document.getElementById('event-preview');
  if (!preview) return;
  const title = document.getElementById('ev-title')?.value || '--';
  const type = document.getElementById('ev-type')?.value || '--';
  const date = document.getElementById('ev-date')?.value;
  const start = document.getElementById('ev-start')?.value || '--';
  const end = document.getElementById('ev-end')?.value || '--';
  const location = document.getElementById('ev-location')?.value || '--';
  const max = document.getElementById('ev-max')?.value || '--';
  const bortle = document.getElementById('ev-bortle')?.value;
  const desc = document.getElementById('ev-description')?.value || '';

  preview.innerHTML = `<div class="card" style="background:rgba(255,255,255,0.02);"><div class="event-card-image" style="background:linear-gradient(135deg,#1a0533,#0d1b4b);height:150px;">\uD83C\uDF0C</div><div style="padding:1.5rem;"><span class="badge badge-primary">${type}</span><h2 style="margin:1rem 0;">${title}</h2><div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:1rem;"><div class="event-meta-item"><span class="icon">\uD83D\uDCC5</span><span>${date ? new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '--'} \u00B7 ${start} \u2192 ${end}</span></div><div class="event-meta-item"><span class="icon">\uD83D\uDCCD</span><span>${location}</span></div><div class="event-meta-item"><span class="icon">\uD83D\uDC65</span><span>0 / ${max} inscrits</span></div>${bortle ? `<div class="event-meta-item"><span class="icon">\uD83D\uDCA1</span><span>Bortle ${bortle}</span></div>` : ''}</div><p style="color:var(--color-text-muted);font-size:var(--text-sm);">${desc.slice(0, 200)}${desc.length > 200 ? '...' : ''}</p></div></div>`;
}

function initDateMin() {
  const dateInput = document.getElementById('ev-date');
  if (dateInput) { const tm = new Date(); tm.setDate(tm.getDate() + 1); dateInput.min = tm.toISOString().split('T')[0]; }
}

function initFormSubmit() {
  const form = document.getElementById('form-create-event');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('[type=submit]');
      btn.disabled = true;
      btn.textContent = '\u23F3 Publication...';
      setTimeout(() => { Toast.success('Sortie publiee avec succes !'); setTimeout(() => window.location.href = 'evenements.html', 1500); }, 1500);
    });
  }
}

init();
