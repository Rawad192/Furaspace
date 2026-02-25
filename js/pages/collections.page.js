/**
 * AstroNuit — Page Collections
 * Remplace : js/collections.js + js/app.js
 */

import { Toast, initAuthNavbar, registerServiceWorker } from '../utils/app.js';

const DEMO_PUBLIC_COLLECTIONS = [
  { id: 'c1', name: 'Top Bortle \u2264 2 en France', description: 'Les meilleurs ciels noirs de France.', isPublic: true, author: '@astronome_pro', authorInitial: 'A', lieux: [{ id: 'l8', name: 'Mont Lozere', type: 'observation', bortle: 1 }, { id: 'l1', name: 'Causse Mejean', type: 'observation', bortle: 2 }, { id: 'l5', name: 'Pointe de Pen Hir', type: 'observation', bortle: 2 }, { id: 'l6', name: 'Vercors', type: 'observation', bortle: 2 }], createdAt: new Date(Date.now() - 30 * 86400000), views: 342 },
  { id: 'c2', name: 'Panoramas de montagne', description: 'Points de vue epoustouflants.', isPublic: true, author: '@ciel_breton', authorInitial: 'C', lieux: [{ id: 'l2', name: 'Col du Tourmalet', type: 'panorama', bortle: 3 }, { id: 'l4', name: 'Sainte-Victoire', type: 'panorama', bortle: 3 }, { id: 'l7', name: 'Gorges du Verdon', type: 'panorama', bortle: 3 }], createdAt: new Date(Date.now() - 15 * 86400000), views: 189 },
  { id: 'c3', name: 'Accessibles en voiture \u2014 Bretagne', description: 'Spots bretons accessibles facilement.', isPublic: true, author: '@stargazer42', authorInitial: 'S', lieux: [{ id: 'l5', name: 'Pointe de Pen Hir', type: 'observation', bortle: 2 }], createdAt: new Date(Date.now() - 7 * 86400000), views: 97 },
  { id: 'c4', name: 'Reserves de Ciel Etoile', description: 'Zones RICE officielles.', isPublic: true, author: '@jupiterobserver', authorInitial: 'J', lieux: [{ id: 'l8', name: 'Mont Lozere', type: 'observation', bortle: 1 }], createdAt: new Date(Date.now() - 60 * 86400000), views: 521 },
];

function getMyCollections() { try { return JSON.parse(localStorage.getItem('astronuit_collections') || '[]'); } catch { return []; } }
function saveMyCollections(c) { localStorage.setItem('astronuit_collections', JSON.stringify(c)); }
function timeAgo(d) { const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000); if (days === 0) return 'Aujourd\'hui'; if (days === 1) return 'Hier'; if (days < 7) return `Il y a ${days} j`; if (days < 30) return `Il y a ${Math.floor(days / 7)} sem`; return `Il y a ${Math.floor(days / 30)} mois`; }

let currentTab = 'public';

window.openCollection = (id) => { const col = DEMO_PUBLIC_COLLECTIONS.find(c => c.id === id) || getMyCollections().find(c => c.id === id); if (col) Toast.info(`Collection "${col.name}" \u2014 ${col.lieux.length} spots`); };
window.shareCollection = (id) => { const url = `${window.location.origin}/lieux.html?collection=${id}`; if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => Toast.success('Lien copie !')); else Toast.info(`URL : ${url}`); };
window.deleteCollection = (id) => { saveMyCollections(getMyCollections().filter(c => c.id !== id)); renderMineCollections(); Toast.info('Collection supprimee'); };

function renderCollectionCard(col, isMine = false) {
  const icons = col.lieux.map(l => l.type === 'observation' ? '\uD83D\uDD2D' : '\uD83C\uDFD4\uFE0F');
  const spotTags = col.lieux.slice(0, 3).map(l => `<span class="collection-spot-tag">${l.name.length > 20 ? l.name.slice(0, 20) + '\u2026' : l.name}</span>`).join('');
  const moreCount = col.lieux.length > 3 ? `<span class="collection-spot-tag">+${col.lieux.length - 3}</span>` : '';
  const coverHTML = col.lieux.length >= 3 ? `<div class="collection-cover-cell">${icons[0]}</div><div class="collection-cover-cell">${icons[1]}</div><div class="collection-cover-cell">${icons[2]}</div><div class="collection-cover-cell">${icons[3] || '\u2726'}</div>` : `<div class="collection-cover-cell main">${icons[0] || '\u2726'}</div>`;

  return `<div class="card collection-card" onclick="openCollection('${col.id}')"><div class="collection-cover">${coverHTML}<div class="collection-cover-overlay"></div>${col.isPublic ? '<span class="collection-public-badge badge badge-secondary" style="font-size:.65rem;">\uD83C\uDF10 Public</span>' : '<span class="collection-public-badge badge badge-ghost" style="font-size:.65rem;">\uD83D\uDD12 Prive</span>'}</div><div class="collection-body"><div class="collection-name">${col.name}</div><div class="collection-meta">${col.lieux.length} spot${col.lieux.length > 1 ? 's' : ''} \u00B7 ${timeAgo(col.createdAt)}</div><div class="collection-spots-preview">${spotTags}${moreCount}</div></div><div class="collection-footer"><div class="collection-author"><div class="avatar">${col.authorInitial || '?'}</div><span>${col.author}</span></div><div class="collection-actions" onclick="event.stopPropagation()">${col.isPublic ? `<button class="btn btn-ghost btn-sm" onclick="shareCollection('${col.id}')" title="Partager">\uD83D\uDD17</button>` : ''}${isMine ? `<button class="btn btn-ghost btn-sm" onclick="deleteCollection('${col.id}')" title="Supprimer" style="color:var(--color-text-dim);">\uD83D\uDDD1</button>` : ''}</div></div></div>`;
}

function renderPublicCollections() {
  const container = document.getElementById('public-collections-grid');
  if (container) container.innerHTML = DEMO_PUBLIC_COLLECTIONS.sort((a, b) => b.views - a.views).map(c => renderCollectionCard(c)).join('');
}

function renderMineCollections() {
  const mine = getMyCollections();
  const emptyEl = document.getElementById('mine-empty');
  const gridEl = document.getElementById('mine-collections-grid');
  if (mine.length === 0) { emptyEl?.removeAttribute('style'); if (gridEl) gridEl.innerHTML = ''; }
  else { if (emptyEl) emptyEl.style.display = 'none'; if (gridEl) gridEl.innerHTML = mine.map(c => renderCollectionCard(c, true)).join(''); }
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.collection-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  document.getElementById('tab-public').style.display = tab === 'public' ? '' : 'none';
  document.getElementById('tab-mine').style.display = tab === 'mine' ? '' : 'none';
}

function init() {
  initAuthNavbar();
  renderPublicCollections();
  renderMineCollections();

  document.querySelectorAll('.collection-tab').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

  const openModal = () => document.getElementById('modal-create').style.display = 'flex';
  document.getElementById('btn-new-collection')?.addEventListener('click', openModal);
  document.getElementById('btn-new-collection-empty')?.addEventListener('click', openModal);
  document.getElementById('modal-create-close')?.addEventListener('click', () => { document.getElementById('modal-create').style.display = 'none'; });

  document.getElementById('btn-confirm-create')?.addEventListener('click', () => {
    const name = document.getElementById('new-collection-name')?.value.trim();
    if (!name) { Toast.warning('Donnez un nom a votre collection'); return; }
    const desc = document.getElementById('new-collection-desc')?.value.trim();
    const isPublic = document.getElementById('new-collection-public')?.checked;
    const collections = getMyCollections();
    collections.push({ id: `mine-${Date.now()}`, name, description: desc || '', isPublic, author: '@moi', authorInitial: 'M', lieux: [], createdAt: new Date().toISOString(), views: 0 });
    saveMyCollections(collections);
    document.getElementById('modal-create').style.display = 'none';
    document.getElementById('new-collection-name').value = '';
    document.getElementById('new-collection-desc').value = '';
    switchTab('mine');
    renderMineCollections();
    Toast.success(`Collection "${name}" creee !`);
  });

  document.getElementById('modal-create')?.addEventListener('click', (e) => { if (e.target === document.getElementById('modal-create')) document.getElementById('modal-create').style.display = 'none'; });

  const params = new URLSearchParams(window.location.search);
  const colId = params.get('collection');
  if (colId) { const col = DEMO_PUBLIC_COLLECTIONS.find(c => c.id === colId); if (col) setTimeout(() => { Toast.info(`Collection partagee : "${col.name}"`); }, 800); }

  registerServiceWorker();
}

init();
