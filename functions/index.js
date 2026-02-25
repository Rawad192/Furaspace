/**
 * AstroNuit — Firebase Cloud Functions entry point
 * Node.js 20 / Firebase Functions v6
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// ── Auth ──────────────────────────────────────────────────────────────────────
const { onUserCreate } = require('./auth/onUserCreate');
const { onUserDelete } = require('./auth/onUserDelete');

// ── Scoring ───────────────────────────────────────────────────────────────────
const { updateScore } = require('./scoring/updateScore');

// ── Moderation ────────────────────────────────────────────────────────────────
const { autoFlag } = require('./moderation/autoFlag');
const { applyPenalty } = require('./moderation/applyPenalty');

// ── Notifications ─────────────────────────────────────────────────────────────
const { weatherAlert } = require('./notifications/weatherAlert');
const { eventReminder } = require('./notifications/eventReminder');

// ── API Proxies ───────────────────────────────────────────────────────────────
const { weatherProxy } = require('./api/weatherProxy');
const { astronomyProxy } = require('./api/astronomyProxy');

// ── Constellations ────────────────────────────────────────────────────────────
const { eligibilityCheck } = require('./constellations/eligibilityCheck');

module.exports = {
  // Auth triggers
  onUserCreate,
  onUserDelete,

  // Scoring triggers
  updateScore,

  // Moderation triggers
  autoFlag,

  // Admin callable
  applyPenalty,
  eligibilityCheck,

  // Scheduled
  weatherAlert,
  eventReminder,

  // HTTP
  weatherProxy,
  astronomyProxy
};
