/**
 * AstroNuit — Page Evenement Detail
 * Remplace : js/event-detail.js (absent) + js/app.js
 */

import { Toast, initAuthNavbar, registerServiceWorker } from '../utils/app.js';

function init() {
  initAuthNavbar();

  // Bouton inscription
  document.getElementById('btn-join-event')?.addEventListener('click', () => {
    Toast.success('Inscription enregistree ! Vous recevrez un email de confirmation.');
  });

  // Bouton partager
  document.getElementById('btn-share-event')?.addEventListener('click', () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => Toast.success('Lien copie !'));
    }
  });

  registerServiceWorker();
}

init();
