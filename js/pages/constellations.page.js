/**
 * AstroNuit — Page Constellations (groupes)
 * Wrapper module: inits navbar + auth + SW.
 * js/constellations.js reste en classic script (pas de deps Firebase).
 */

import { Toast, initAuthNavbar, registerServiceWorker } from '../utils/app.js';

// Expose Toast on window for the classic constellations.js script
window.Toast = Toast;

initAuthNavbar();
registerServiceWorker();
