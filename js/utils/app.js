/**
 * AstroNuit — App Utilities (ES Module)
 * Navbar, Toast, Auth UI, Geoloc, Service Worker.
 * Remplace l'ancien js/app.js global.
 */

import { onAuthChanged } from '../services/auth.service.js';

// ── Toast System ────────────────────────────────────────────────────────────

export const Toast = {
  show(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { info: '\u2139\uFE0F', success: '\u2705', warning: '\u26A0\uFE0F', error: '\u274C' };
    const colors = {
      info: 'var(--color-info)',
      success: 'var(--color-success)',
      warning: 'var(--color-warning)',
      error: 'var(--color-error)',
    };

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.borderLeft = `3px solid ${colors[type]}`;
    toast.innerHTML = `
      <span style="font-size:1.2rem;">${icons[type]}</span>
      <p style="flex:1; font-size: var(--text-sm);">${message}</p>
      <button style="color:var(--color-text-dim); font-size:1.2rem; cursor:pointer;">\u00D7</button>
    `;

    toast.querySelector('button').addEventListener('click', () => toast.remove());
    container.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, duration);
  },

  success: (msg) => Toast.show(msg, 'success'),
  error: (msg) => Toast.show(msg, 'error'),
  warning: (msg) => Toast.show(msg, 'warning'),
  info: (msg) => Toast.show(msg, 'info'),
};

// ── Navbar ──────────────────────────────────────────────────────────────────

export function initNavbar() {
  const navToggle = document.getElementById('navbar-toggle');
  const navMenu = document.getElementById('navbar-nav');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      navToggle.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
        navMenu.classList.remove('open');
        navToggle.classList.remove('active');
      }
    });
  }

  // Active link
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.href === window.location.href) {
      link.classList.add('active');
    }
  });
}

// ── Auth UI (navbar avatar/login buttons) ───────────────────────────────────

function updateAuthUI(user) {
  const btnLogin = document.getElementById('btn-login');
  const btnRegister = document.getElementById('btn-register');
  const navbarUser = document.getElementById('navbar-user');
  const userAvatar = document.getElementById('user-avatar');

  if (user) {
    if (btnLogin) btnLogin.style.display = 'none';
    if (btnRegister) btnRegister.style.display = 'none';
    if (navbarUser) navbarUser.style.display = 'flex';
    if (userAvatar) {
      if (user.photoURL) {
        userAvatar.innerHTML = `<img src="${user.photoURL}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
      } else {
        userAvatar.textContent = (user.displayName || user.email || '?')[0].toUpperCase();
      }
      userAvatar.style.cursor = 'pointer';
      userAvatar.addEventListener('click', () => { window.location.href = 'profil.html'; });
    }
  } else {
    if (btnLogin) btnLogin.style.display = 'inline-flex';
    if (btnRegister) btnRegister.style.display = 'inline-flex';
    if (navbarUser) navbarUser.style.display = 'none';
  }
}

/**
 * Initialise la navbar + auth state observer.
 * Appeler dans chaque page module.
 */
export function initAuthNavbar() {
  initNavbar();
  onAuthChanged(updateAuthUI);
}

// ── Geolocation ─────────────────────────────────────────────────────────────

export const Geoloc = {
  async get() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalisation non supportee'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(err),
        { timeout: 8000 }
      );
    });
  },

  save(lat, lng) {
    localStorage.setItem('user_location', JSON.stringify({ lat, lng, ts: Date.now() }));
  },

  load() {
    const stored = localStorage.getItem('user_location');
    if (!stored) return null;
    const data = JSON.parse(stored);
    if (Date.now() - data.ts > 3600000) return null;
    return { lat: data.lat, lng: data.lng };
  },
};

// ── Service Worker ──────────────────────────────────────────────────────────

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('[AstroNuit] Service Worker enregistre:', reg.scope);
      }).catch((err) => {
        console.warn('[AstroNuit] Service Worker non disponible:', err);
      });
    });
  }
}
