/**
 * AstroNuit — Page Classement (Leaderboard)
 * Wrapper module: inits navbar + auth + SW.
 * js/ranking.js reste en classic script (pas de deps Firebase).
 */

import { Toast, initAuthNavbar, registerServiceWorker } from '../utils/app.js';

window.Toast = Toast;

initAuthNavbar();
registerServiceWorker();
