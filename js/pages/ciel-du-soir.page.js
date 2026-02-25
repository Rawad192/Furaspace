/**
 * AstroNuit — Page Ciel du soir
 * Remplace : js/sky.js + js/app.js
 * Note: js/astronomy.js reste en classic script (window.Astronomy)
 */

import { Toast, initAuthNavbar, Geoloc, registerServiceWorker } from '../utils/app.js';

let lat = 46.6, lng = 2.3;

function init() {
  initAuthNavbar();

  const cached = Geoloc.load();
  if (cached) { lat = cached.lat; lng = cached.lng; }

  updateSkyPage();
  initLocateButton();
  registerServiceWorker();
}

function updateSkyPage() {
  if (!window.Astronomy) return;
  const sunTimes = window.Astronomy.getSunTimes(lat, lng);
  const moon = window.Astronomy.getMoonPhase();

  const el = id => document.getElementById(id);
  if (el('sky-sunset')) el('sky-sunset').textContent = window.Astronomy.formatTime(sunTimes.sunset);
  if (el('sky-nautical-dusk')) el('sky-nautical-dusk').textContent = window.Astronomy.formatTime(sunTimes.nauticalDusk);
  if (el('sky-astro-night')) el('sky-astro-night').textContent = window.Astronomy.formatTime(sunTimes.night);
  if (el('sky-sunrise')) el('sky-sunrise').textContent = window.Astronomy.formatTime(sunTimes.sunrise);
  if (el('sky-moon-phase')) el('sky-moon-phase').textContent = `${moon.emoji} ${moon.name}`;
  if (el('sky-moon-illum')) el('sky-moon-illum').textContent = moon.illumination + '%';
}

function initLocateButton() {
  const btn = document.getElementById('btn-sky-locate');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    btn.textContent = '\u23F3';
    try {
      const pos = await Geoloc.get();
      lat = pos.lat;
      lng = pos.lng;
      updateSkyPage();
      const label = document.getElementById('sky-location-label');
      if (label) label.textContent = `\uD83D\uDCCD ${lat.toFixed(2)}\u00B0 N, ${Math.abs(lng).toFixed(2)}\u00B0 ${lng >= 0 ? 'E' : 'O'}`;
      Toast.success('Position mise a jour');
    } catch {
      Toast.error('Impossible de vous localiser');
    }
    btn.textContent = '\uD83D\uDCCD Ma position';
  });
}

init();
