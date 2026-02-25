/**
 * AstroNuit — Page Carte principale
 * Remplace : js/map.js + js/app.js
 */

import { Toast, initAuthNavbar, registerServiceWorker } from '../utils/app.js';

// ── Demo data ───────────────────────────────────────────────────────────────

const SITES = [
  { name: 'Plateau de Valensole', lat: 43.834, lng: 5.984, bortle: 2, region: 'PACA', rating: 4.8, notes: 'Parfait pour la Voie Lactee' },
  { name: 'Parc National des Cevennes', lat: 44.1, lng: 3.65, bortle: 2, region: 'Occitanie', rating: 4.9, notes: 'Reserve internationale de ciel etoile' },
  { name: 'Plateau du Cezallier', lat: 45.5, lng: 3.0, bortle: 3, region: 'Auvergne', rating: 4.6, notes: 'Ciel noir loin des villes' },
  { name: 'Col du Lautaret', lat: 45.034, lng: 6.404, bortle: 1, region: 'Alpes', rating: 4.9, notes: 'Ciel exceptionnel en altitude' },
  { name: 'Foret des Landes', lat: 44.0, lng: -0.9, bortle: 3, region: 'Nouvelle-Aquitaine', rating: 4.5, notes: 'Immense foret, faible pollution' },
  { name: 'Presqu\'ile de Crozon', lat: 48.23, lng: -4.55, bortle: 3, region: 'Bretagne', rating: 4.7, notes: 'Atlantique comme horizon' },
  { name: 'Suisse Normande', lat: 48.87, lng: -0.42, bortle: 4, region: 'Normandie', rating: 4.2, notes: 'Accessible depuis Paris' },
  { name: 'Gorges du Verdon', lat: 43.73, lng: 6.32, bortle: 2, region: 'PACA', rating: 4.8, notes: 'Vue degagee au bord des gorges' },
  { name: 'Pyrenees Ariegeoises', lat: 42.8, lng: 1.5, bortle: 2, region: 'Occitanie', rating: 4.7, notes: 'Montagne + ciel noir parfait' },
  { name: 'Morvan', lat: 47.15, lng: 4.08, bortle: 4, region: 'Bourgogne', rating: 4.1, notes: 'Parc naturel regional' },
  { name: 'Foret de Fontainebleau', lat: 48.4, lng: 2.7, bortle: 5, region: 'Ile-de-France', rating: 3.8, notes: 'Meilleur depuis Paris (1h)' },
  { name: 'Pic du Midi de Bigorre', lat: 42.936, lng: 0.143, bortle: 1, region: 'Hautes-Pyrenees', rating: 5.0, notes: 'Observatoire pro + visites' },
];

const EVENTS = [
  { title: 'Perseides 2025', lat: 43.834, lng: 5.984, date: '12 aout', icon: '\uD83C\uDF0C', participants: '14/30' },
  { title: 'Jupiter \u2014 Bretagne', lat: 48.15, lng: -4.08, date: '18 aout', icon: '\uD83E\uDE90', participants: '7/15' },
  { title: 'Nuit Voie Lactee', lat: 44.1, lng: 3.65, date: '25 aout', icon: '\u2B50', participants: '22/40' },
];

function getBortleColor(b) { return b <= 2 ? '#10b981' : b <= 4 ? '#3b82f6' : b <= 6 ? '#f59e0b' : '#ef4444'; }

function init() {
  initAuthNavbar();

  const mapEl = document.getElementById('main-map');
  if (!mapEl) return;

  const map = L.map('main-map', { center: [46.6, 2.3], zoom: 6 });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '\u00A9 OpenStreetMap \u00B7 \u00A9 CartoDB', subdomains: 'abcd', maxZoom: 19 }).addTo(map);

  const sitesLayer = L.layerGroup(), sitesMedLayer = L.layerGroup(), sitesPoorLayer = L.layerGroup(), eventsLayer = L.layerGroup();

  SITES.forEach(site => {
    const color = getBortleColor(site.bortle);
    const marker = L.circleMarker([site.lat, site.lng], { radius: 12, fillColor: color, color: 'rgba(255,255,255,0.5)', weight: 1.5, opacity: 1, fillOpacity: 0.8 })
      .bindPopup(`<div style="background:#0f0f1a;color:#e8e8f0;padding:14px;border-radius:8px;min-width:220px;"><strong>${site.name}</strong><br><span style="color:#9090b0;font-size:.8rem;">\uD83D\uDCCD ${site.region}</span><br><br><span style="color:${color};font-size:.75rem;font-weight:700;">Bortle ${site.bortle}</span> <span style="color:#fbbf24;">${'\u2605'.repeat(Math.round(site.rating))}</span><p style="color:#9090b0;font-size:.8rem;margin-bottom:8px;">${site.notes}</p></div>`, { className: 'dark-popup' });

    if (site.bortle <= 3) sitesLayer.addLayer(marker);
    else if (site.bortle <= 5) sitesMedLayer.addLayer(marker);
    else sitesPoorLayer.addLayer(marker);
  });

  EVENTS.forEach(ev => {
    const icon = L.divIcon({ className: '', html: `<div style="background:rgba(108,62,184,0.85);border:2px solid rgba(139,92,246,0.8);border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;box-shadow:0 0 15px rgba(108,62,184,0.6);">${ev.icon}</div>`, iconSize: [40, 40], iconAnchor: [20, 20] });
    L.marker([ev.lat, ev.lng], { icon }).bindPopup(`<div style="background:#0f0f1a;color:#e8e8f0;padding:12px;border-radius:8px;min-width:200px;"><strong>${ev.title}</strong><br><small style="color:#9090b0;">\uD83D\uDCC5 ${ev.date} \u00B7 \uD83D\uDC65 ${ev.participants}</small></div>`, { className: 'dark-popup' }).addTo(eventsLayer);
  });

  sitesLayer.addTo(map);
  eventsLayer.addTo(map);

  const layerMap = { 'layer-events': eventsLayer, 'layer-sites': sitesLayer, 'layer-sites-medium': sitesMedLayer, 'layer-sites-poor': sitesPoorLayer };
  Object.entries(layerMap).forEach(([id, layer]) => {
    document.getElementById(id)?.addEventListener('change', (e) => { if (e.target.checked) layer.addTo(map); else map.removeLayer(layer); });
  });

  document.getElementById('btn-geolocate')?.addEventListener('click', () => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      map.setView([pos.coords.latitude, pos.coords.longitude], 10);
      L.circleMarker([pos.coords.latitude, pos.coords.longitude], { radius: 10, fillColor: '#f5a623', color: 'white', weight: 2, fillOpacity: 1 }).bindPopup('\uD83D\uDCCD Vous etes ici').addTo(map).openPopup();
    });
  });

  // Sites list sidebar
  const listEl = document.getElementById('sites-list-items');
  if (listEl) {
    listEl.innerHTML = SITES.map(site => `
      <div class="site-list-item" style="cursor:pointer;padding:.75rem;border-bottom:1px solid var(--color-border-subtle);">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div><strong style="font-size:.85rem;">${site.name}</strong><p style="color:var(--color-text-muted);font-size:.75rem;">${site.region}</p></div>
          <span class="bortle-badge bortle-${site.bortle}" style="white-space:nowrap;">B${site.bortle}</span>
        </div>
      </div>
    `).join('');

    listEl.querySelectorAll('.site-list-item').forEach((item, idx) => {
      item.addEventListener('click', () => map.flyTo([SITES[idx].lat, SITES[idx].lng], 12));
    });
  }

  registerServiceWorker();
}

init();
