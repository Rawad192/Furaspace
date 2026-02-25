/**
 * AstroNuit — Cloud Function: astronomyProxy
 * Calcule la visibilité planétaire via astronomy-engine (MIT).
 * Cache Firestore 24h par région/date.
 *
 * GET /astronomyProxy?lat={lat}&lng={lng}&date={YYYY-MM-DD}
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Astronomy = require('astronomy-engine');

const db = admin.firestore();
const CACHE_TTL_HOURS = 24;

// Planètes à calculer
const PLANETS = [
  { id: 'Mercury', name: 'Mercure', emoji: '⚫' },
  { id: 'Venus',   name: 'Vénus',   emoji: '⚡' },
  { id: 'Mars',    name: 'Mars',    emoji: '🔴' },
  { id: 'Jupiter', name: 'Jupiter', emoji: '🌑' },
  { id: 'Saturn',  name: 'Saturne', emoji: '🪐' },
  { id: 'Uranus',  name: 'Uranus',  emoji: '🔵' },
  { id: 'Neptune', name: 'Neptune', emoji: '💙' }
];

exports.astronomyProxy = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    // CORS
    res.set('Access-Control-Allow-Origin', 'https://astronuit.fr');
    res.set('Access-Control-Allow-Methods', 'GET');
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'GET') { res.status(405).json({ error: 'Méthode non autorisée' }); return; }

    const { lat, lng, date } = req.query;
    if (!lat || !lng) {
      res.status(400).json({ error: 'Paramètres lat et lng requis' });
      return;
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      res.status(400).json({ error: 'Coordonnées invalides' });
      return;
    }

    // Date d'observation (défaut: aujourd'hui)
    let obsDate;
    if (date) {
      obsDate = new Date(date + 'T21:00:00'); // 21h00 heure locale
      if (isNaN(obsDate.getTime())) {
        res.status(400).json({ error: 'Format de date invalide (YYYY-MM-DD attendu)' });
        return;
      }
    } else {
      obsDate = new Date();
      obsDate.setHours(21, 0, 0, 0);
    }

    // Clé de cache : région (0.5°) + date
    const latRound = Math.round(latNum * 2) / 2;
    const lngRound = Math.round(lngNum * 2) / 2;
    const dateStr = obsDate.toISOString().split('T')[0];
    const cacheId = `${latRound}_${lngRound}_${dateStr}`.replace(/\./g, 'p').replace(/-/g, '').replace(/[+]/g, '');

    try {
      // Vérifier cache
      const cacheRef = db.collection('cache_planets').doc(cacheId);
      const cacheDoc = await cacheRef.get();

      if (cacheDoc.exists) {
        const cached = cacheDoc.data();
        const expiresAt = cached.expiresAt?.toDate();
        if (expiresAt && expiresAt > new Date()) {
          functions.logger.info(`[astronomyProxy] Cache HIT pour ${cacheId}`);
          res.json({ planets: cached.planets, _cached: true, date: dateStr });
          return;
        }
      }

      // Calculer les positions planétaires
      const observer = new Astronomy.Observer(latNum, lngNum, 0);
      const results = [];

      for (const planet of PLANETS) {
        try {
          const body = Astronomy.Body[planet.id];
          const equatorial = Astronomy.GeoVector(body, obsDate, false);
          const horizontal = Astronomy.HorizonFromVector(equatorial, observer, obsDate, 'normal');
          const illum = Astronomy.Illumination(body, obsDate);

          // Lever et coucher
          let riseTime = null, setTime = null;
          try {
            const rise = Astronomy.SearchRiseSet(body, observer, +1, obsDate, 1);
            riseTime = rise ? rise.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null;
          } catch {}
          try {
            const set = Astronomy.SearchRiseSet(body, observer, -1, obsDate, 1);
            setTime = set ? set.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null;
          } catch {}

          const altitude = horizontal?.altitude ?? 0;
          const visible = altitude > 5; // visible si > 5° au-dessus de l'horizon

          let visibility = 'invisible';
          if (visible) {
            if (altitude > 30) visibility = 'excellente';
            else if (altitude > 15) visibility = 'bonne';
            else visibility = 'difficile';
          }

          // Constellation (approximation par RA)
          const constellation = getConstellationFromRA(equatorial?.x ?? 0);

          results.push({
            id: planet.id,
            name: planet.name,
            emoji: planet.emoji,
            visible,
            altitude: Math.round(altitude * 10) / 10,
            azimuth: Math.round((horizontal?.azimuth ?? 0) * 10) / 10,
            magnitude: Math.round((illum?.mag ?? 0) * 10) / 10,
            visibility,
            riseTime,
            setTime,
            constellation
          });
        } catch (planetError) {
          functions.logger.warn(`[astronomyProxy] Erreur calcul ${planet.id}:`, planetError.message);
          results.push({
            id: planet.id,
            name: planet.name,
            emoji: planet.emoji,
            visible: false,
            altitude: null,
            azimuth: null,
            magnitude: null,
            visibility: 'inconnu',
            riseTime: null,
            setTime: null,
            constellation: null
          });
        }
      }

      // Stocker en cache 24h
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + CACHE_TTL_HOURS);
      await cacheRef.set({
        planets: results,
        lat: latRound,
        lng: lngRound,
        date: dateStr,
        fetchedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt)
      });

      functions.logger.info(`[astronomyProxy] Données fraîches calculées pour ${cacheId}`);
      res.json({ planets: results, _cached: false, date: dateStr });

    } catch (error) {
      functions.logger.error('[astronomyProxy] Erreur:', error);
      res.status(500).json({ error: 'Erreur calcul astronomique' });
    }
  });

/**
 * Approximation de la constellation depuis l'ascension droite (RA en heures)
 * Simplifié — en production utiliser une table écliptique complète
 */
function getConstellationFromRA(xEcliptic) {
  const constellations = [
    'Bélier', 'Taureau', 'Gémeaux', 'Cancer', 'Lion', 'Vierge',
    'Balance', 'Scorpion', 'Sagittaire', 'Capricorne', 'Verseau', 'Poissons'
  ];
  const ra = ((xEcliptic % 24) + 24) % 24; // normaliser 0-24h
  const index = Math.floor(ra / 2) % 12;
  return constellations[index] || 'Inconnue';
}
