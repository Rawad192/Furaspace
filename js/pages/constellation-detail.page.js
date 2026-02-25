/**
 * AstroNuit — Page Constellation Detail
 * Wrapper module: inits navbar + auth + SW.
 * js/constellation-detail.js reste en classic script (pas de deps Firebase).
 */

import { Toast, initAuthNavbar, registerServiceWorker } from '../utils/app.js';

window.Toast = Toast;

initAuthNavbar();
registerServiceWorker();
