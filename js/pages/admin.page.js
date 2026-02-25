/**
 * AstroNuit — Page Admin
 * Remplace : inline script + js/app.js
 */

import { Toast, initAuthNavbar, registerServiceWorker } from '../utils/app.js';
import { requireRole } from '../utils/router.js';
import { ROLES } from '../firebase.js';

async function init() {
  await requireRole(ROLES.ADMIN);
  initAuthNavbar();

  // Admin nav
  document.querySelectorAll('.admin-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      Toast.info(`Section "${link.textContent.trim()}" \u2014 en cours de developpement`);
    });
  });

  // Approve/reject buttons
  document.querySelectorAll('.member-actions button').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.member-row');
      const name = row.querySelector('.member-name').textContent;
      if (btn.textContent.includes('Approuver')) Toast.success(`${name} approuve \u2014 Email de confirmation envoye`);
      else Toast.info(`${name} refuse`);
      row.style.opacity = '0.3';
      row.style.pointerEvents = 'none';
    });
  });

  registerServiceWorker();
}

init();
