/**
 * AstroNuit — Page Connexion / Inscription
 * Remplace : inline <script type="module"> + js/auth.js + js/app.js
 */

import { signIn, signUp, signInGoogle, resetPassword, sendVerification, updateAuthProfile, translateError } from '../services/auth.service.js';
import { setDocument, getDocument, updateDocument, serverTimestamp } from '../services/firestore.service.js';
import { COLLECTIONS } from '../firebase.js';
import { Toast, initNavbar, registerServiceWorker } from '../utils/app.js';
import { evaluatePasswordStrength } from '../utils/helpers.js';
import { redirectIfAuthenticated, getRedirectUrl, getUrlMessage } from '../utils/router.js';

// ── Init ────────────────────────────────────────────────────────────────────

async function init() {
  // Si deja connecte, rediriger (avec try/catch pour ne pas bloquer l'init des formulaires)
  try {
    await redirectIfAuthenticated(getRedirectUrl() || 'index.html');
  } catch (e) {
    console.warn('[AstroNuit] Vérification auth échouée, poursuite de l\'init:', e.message);
  }

  initNavbar();
  showUrlMessages();
  initTabs();
  initPasswordToggles();
  initPasswordStrength();
  initLoginForm();
  initRegisterForm();
  initGoogleAuth();
  initForgotPassword();
  registerServiceWorker();
}

// ── Messages URL ────────────────────────────────────────────────────────────

function showUrlMessages() {
  const msg = getUrlMessage();
  if (!msg) return;

  const messages = {
    'verify-email': 'Veuillez verifier votre email avant de vous connecter.',
    'session-expired': 'Votre session a expire. Veuillez vous reconnecter.',
    'account-created': 'Compte cree ! Verifiez votre email puis connectez-vous.',
    'password-reset': 'Email de reinitialisation envoye. Verifiez votre boite mail.',
  };

  const text = messages[msg];
  if (text) {
    // Afficher comme banniere en haut du formulaire
    const container = document.querySelector('.auth-container');
    if (container) {
      const banner = document.createElement('div');
      banner.className = 'auth-message-banner';
      banner.innerHTML = `<span class="banner-icon">${msg === 'account-created' ? '\u2705' : '\u2139\uFE0F'}</span><p>${text}</p>`;
      banner.style.cssText = 'display:flex;align-items:center;gap:.75rem;padding:1rem 1.25rem;margin-bottom:1.5rem;background:rgba(108,62,184,.12);border:1px solid rgba(108,62,184,.3);border-radius:var(--radius-lg);font-size:var(--text-sm);color:var(--color-text-secondary);';
      container.insertBefore(banner, container.firstChild);
    }

    // Toast aussi pour visibilite
    if (msg === 'verify-email') Toast.warning(text);
    else Toast.info(text);
  }
}

// ── Tabs login/register ─────────────────────────────────────────────────────

function initTabs() {
  const tabs = document.querySelectorAll('.auth-tab');
  const panels = {
    login: document.getElementById('panel-login'),
    register: document.getElementById('panel-register')
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      Object.entries(panels).forEach(([key, el]) => {
        if (el) el.style.display = key === target ? 'block' : 'none';
      });
    });
  });

  // Hash URL → ouvrir directement l'inscription
  if (window.location.hash === '#inscription') {
    tabs.forEach(t => {
      t.classList.remove('active');
      if (t.dataset.tab === 'register') t.classList.add('active');
    });
    if (panels.login) panels.login.style.display = 'none';
    if (panels.register) panels.register.style.display = 'block';
  }
}

// ── Toggle password visibility ──────────────────────────────────────────────

function initPasswordToggles() {
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '\uD83D\uDE48';
      } else {
        input.type = 'password';
        btn.textContent = '\uD83D\uDC41';
      }
    });
  });
}

// ── Password strength meter ─────────────────────────────────────────────────

function initPasswordStrength() {
  const regPassword = document.getElementById('reg-password');
  if (!regPassword) return;

  regPassword.addEventListener('input', () => {
    const { score, label, color } = evaluatePasswordStrength(regPassword.value);
    const fill = document.getElementById('strength-fill');
    const labelEl = document.getElementById('strength-label');

    if (fill) {
      fill.style.width = `${(score / 5) * 100}%`;
      fill.style.background = color;
    }
    if (labelEl) labelEl.textContent = label;
  });
}

// ── Login form ──────────────────────────────────────────────────────────────

function initLoginForm() {
  const form = document.getElementById('form-login');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('btn-login-submit');

    if (!email || !password) {
      Toast.warning('Veuillez remplir tous les champs.');
      return;
    }

    btn.disabled = true;
    btn.textContent = '\u23F3 Connexion...';

    try {
      const cred = await signIn(email, password);

      // Verifier que l'email est verifie
      if (!cred.user.emailVerified) {
        Toast.warning('Veuillez verifier votre email. Un lien de verification a ete envoye.');
        await sendVerification(cred.user);
        btn.disabled = false;
        btn.textContent = 'Se connecter';
        return;
      }

      // Mettre a jour lastLogin dans Firestore
      try {
        await updateDocument(COLLECTIONS.USERS, cred.user.uid, { lastLogin: serverTimestamp() });
      } catch { /* silencieux — le profil peut ne pas encore exister */ }

      Toast.success('Connexion reussie ! Bienvenue sur AstroNuit.');
      setTimeout(() => {
        window.location.href = getRedirectUrl() || 'index.html';
      }, 1000);
    } catch (err) {
      Toast.error(translateError(err));
      btn.disabled = false;
      btn.textContent = 'Se connecter';
    }
  });
}

// ── Register form ───────────────────────────────────────────────────────────

function initRegisterForm() {
  const form = document.getElementById('form-register');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pseudo = document.getElementById('reg-pseudo').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const region = document.getElementById('reg-region').value;
    const level = document.getElementById('reg-level').value;
    const equipment = document.getElementById('reg-equipment').value.trim();
    const terms = document.getElementById('reg-terms')?.checked;
    const btn = document.getElementById('btn-register-submit');

    // Validations
    if (!pseudo || pseudo.length < 3) {
      Toast.error('Le pseudo doit faire au moins 3 caracteres.');
      return;
    }
    if (pseudo.length > 30) {
      Toast.error('Le pseudo ne doit pas depasser 30 caracteres.');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(pseudo)) {
      Toast.error('Le pseudo ne peut contenir que des lettres, chiffres, tirets et underscores.');
      return;
    }
    if (password.length < 8) {
      Toast.error('Le mot de passe doit faire au moins 8 caracteres.');
      return;
    }
    if (!terms) {
      Toast.error('Vous devez accepter la charte communautaire.');
      return;
    }

    btn.disabled = true;
    btn.textContent = '\u23F3 Creation du compte...';

    try {
      const cred = await signUp(email, password);

      // Mettre a jour le displayName dans Firebase Auth
      await updateAuthProfile({ displayName: pseudo });

      // Creer le profil Firestore
      await setDocument(COLLECTIONS.USERS, cred.user.uid, {
        pseudo,
        email,
        region: region || '',
        level: level || 'beginner',
        equipment: equipment || '',
        bio: '',
        photoURL: '',
        role: 'member',
        score: { total: 0, monthly: 0, constellationId: null },
        stats: {
          spotsAdded: 0,
          eventsOrganized: 0,
          eventsAttended: 0,
          photosPosted: 0,
          checkins: 0,
          reportsValidated: 0,
        },
        badges: [],
        departements_visites: [],
        constellationId: null,
        following: [],
        followers: [],
        lieux_ajoutes: [],
        favoris_lieux: [],
        collections: [],
        moderation: { warnings: 0, strikes: 0, suspended: false, suspendedUntil: null, banned: false },
        notifications: {
          newSpotInRegion: true,
          clearSkyOnFavorite: true,
          reviewOnMySpot: true,
          socialActivity: true,
        },
        fcmToken: null,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        gdprConsentAt: serverTimestamp(),
      });

      // Envoyer email de verification
      await sendVerification(cred.user);

      Toast.success('Compte cree ! Verifiez votre email pour activer votre compte.');
      setTimeout(() => {
        window.location.href = 'connexion.html?message=account-created';
      }, 2000);
    } catch (err) {
      Toast.error(translateError(err));
      btn.disabled = false;
      btn.textContent = 'Rejoindre AstroNuit \uD83D\uDE80';
    }
  });
}

// ── Google Auth ─────────────────────────────────────────────────────────────

function initGoogleAuth() {
  const btn = document.getElementById('btn-google');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    try {
      const cred = await signInGoogle();

      // Verifier si le profil Firestore existe deja
      const existingProfile = await getDocument(COLLECTIONS.USERS, cred.user.uid);

      if (!existingProfile) {
        // Premier login Google — creer le profil Firestore
        const displayName = cred.user.displayName || '';
        const pseudo = displayName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() || `user_${cred.user.uid.slice(0, 8)}`;

        await setDocument(COLLECTIONS.USERS, cred.user.uid, {
          pseudo,
          email: cred.user.email || '',
          region: '',
          level: 'beginner',
          equipment: '',
          bio: '',
          photoURL: cred.user.photoURL || '',
          role: 'member',
          score: { total: 0, monthly: 0, constellationId: null },
          stats: {
            spotsAdded: 0,
            eventsOrganized: 0,
            eventsAttended: 0,
            photosPosted: 0,
            checkins: 0,
            reportsValidated: 0,
          },
          badges: [],
          departements_visites: [],
          constellationId: null,
          following: [],
          followers: [],
          lieux_ajoutes: [],
          favoris_lieux: [],
          collections: [],
          moderation: { warnings: 0, strikes: 0, suspended: false, suspendedUntil: null, banned: false },
          notifications: {
            newSpotInRegion: true,
            clearSkyOnFavorite: true,
            reviewOnMySpot: true,
            socialActivity: true,
          },
          fcmToken: null,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          gdprConsentAt: serverTimestamp(),
        });

        Toast.success('Compte Google cree ! Bienvenue sur AstroNuit.');
      } else {
        // Profil existe — mettre a jour lastLogin
        await updateDocument(COLLECTIONS.USERS, cred.user.uid, { lastLogin: serverTimestamp() });
        Toast.success('Connexion Google reussie !');
      }

      setTimeout(() => {
        window.location.href = getRedirectUrl() || 'index.html';
      }, 1000);
    } catch (err) {
      Toast.error(translateError(err));
    } finally {
      btn.disabled = false;
    }
  });
}

// ── Forgot Password ─────────────────────────────────────────────────────────

function initForgotPassword() {
  const forgotLink = document.querySelector('.forgot-link');
  if (!forgotLink) return;

  forgotLink.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();

    if (!email) {
      Toast.warning('Entrez votre adresse email puis cliquez sur "Oublie ?"');
      document.getElementById('login-email')?.focus();
      return;
    }

    try {
      await resetPassword(email);
      Toast.success('Email de reinitialisation envoye ! Verifiez votre boite mail.');
    } catch (err) {
      Toast.error(translateError(err));
    }
  });
}

// ── Lancement ───────────────────────────────────────────────────────────────
init().catch(err => {
  console.error('[AstroNuit] Erreur critique lors de l\'initialisation de la page connexion:', err);
});
