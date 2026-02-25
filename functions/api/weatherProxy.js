/**
 * AstroNuit — Cloud Function: weatherProxy
 * Proxy sécurisé vers OpenWeatherMap avec cache Firestore 10 minutes.
 * La clé API n'est jamais exposée côté client.
 *
 * GET /weatherProxy?lat={lat}&lng={lng}
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

const db = admin.firestore();
const CACHE_TTL_MINUTES = 10;

exports.weatherProxy = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    // CORS
    res.set('Access-Control-Allow-Origin', 'https://astronuit.fr');
    res.set('Access-Control-Allow-Methods', 'GET');
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'GET') { res.status(405).json({ error: 'Méthode non autorisée' }); return; }

    const { lat, lng } = req.query;
    if (!lat || !lng) {
      res.status(400).json({ error: 'Paramètres lat et lng requis' });
      return;
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      res.status(400).json({ error: 'Coordonnées invalides' });
      return;
    }

    // Arrondi pour le cache (0.1° ≈ 11km)
    const latRound = Math.round(latNum * 10) / 10;
    const lngRound = Math.round(lngNum * 10) / 10;
    const cacheId = `${latRound}_${lngRound}`.replace('.', 'p').replace('-', 'n');

    try {
      // Vérifier le cache Firestore
      const cacheRef = db.collection('cache_weather').doc(cacheId);
      const cacheDoc = await cacheRef.get();

      if (cacheDoc.exists) {
        const cached = cacheDoc.data();
        const expiresAt = cached.expiresAt?.toDate();
        if (expiresAt && expiresAt > new Date()) {
          functions.logger.info(`[weatherProxy] Cache HIT pour ${cacheId}`);
          res.json({ ...cached.data, _cached: true, _cachedAt: cached.fetchedAt?.toDate()?.toISOString() });
          return;
        }
      }

      // Récupérer la clé API depuis Firebase Secret Manager (ou config)
      const apiKey = functions.config().openweathermap?.key || process.env.OPENWEATHERMAP_KEY;
      if (!apiKey) {
        functions.logger.error('[weatherProxy] Clé API OpenWeatherMap manquante');
        res.status(503).json({ error: 'Service météo temporairement indisponible' });
        return;
      }

      // Appel OpenWeatherMap
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latNum}&lon=${lngNum}&units=metric&lang=fr&appid=${apiKey}`;
      const response = await fetch(url, { timeout: 8000 });

      if (!response.ok) {
        functions.logger.error(`[weatherProxy] Erreur OWM ${response.status} pour ${latNum},${lngNum}`);
        res.status(502).json({ error: 'Erreur service météo externe' });
        return;
      }

      const owmData = await response.json();

      // Normaliser les données (expose seulement ce dont on a besoin)
      const weatherData = {
        temp: Math.round(owmData.main?.temp ?? 0),
        feelsLike: Math.round(owmData.main?.feels_like ?? 0),
        humidity: owmData.main?.humidity ?? 0,
        pressure: owmData.main?.pressure ?? 0,
        windSpeed: Math.round((owmData.wind?.speed ?? 0) * 3.6), // m/s → km/h
        windDeg: owmData.wind?.deg ?? 0,
        clouds: owmData.clouds?.all ?? 0,            // % couverture nuageuse
        visibility: (owmData.visibility ?? 10000) / 1000, // m → km
        condition: owmData.weather?.[0]?.description ?? '',
        conditionId: owmData.weather?.[0]?.id ?? 0,
        icon: owmData.weather?.[0]?.icon ?? '',
        lat: latNum,
        lng: lngNum,
        cityName: owmData.name ?? ''
      };

      // Stocker en cache
      const now = admin.firestore.Timestamp.now();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + CACHE_TTL_MINUTES);

      await cacheRef.set({
        data: weatherData,
        fetchedAt: now,
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt)
      });

      functions.logger.info(`[weatherProxy] Cache MISS, données fraîches pour ${cacheId}`);
      res.json({ ...weatherData, _cached: false });

    } catch (error) {
      functions.logger.error('[weatherProxy] Erreur:', error);
      res.status(500).json({ error: 'Erreur interne du service météo' });
    }
  });
