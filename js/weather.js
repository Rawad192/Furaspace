/**
 * AstroNuit — Météo via OpenWeatherMap
 * Clé API gratuite : https://openweathermap.org/api
 */

const Weather = {
  API_KEY: 'VOTRE_CLE_OPENWEATHERMAP', // Remplacez par votre clé
  BASE_URL: 'https://api.openweathermap.org/data/2.5',

  /**
   * Récupère la météo actuelle pour une position GPS
   */
  async getCurrentWeather(lat, lng) {
    try {
      const url = `${this.BASE_URL}/weather?lat=${lat}&lon=${lng}&appid=${this.API_KEY}&units=metric&lang=fr`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Météo non disponible');
      return await res.json();
    } catch (e) {
      console.warn('Météo indisponible:', e.message);
      return null;
    }
  },

  /**
   * Récupère les prévisions (5 jours / 3h)
   */
  async getForecast(lat, lng) {
    try {
      const url = `${this.BASE_URL}/forecast?lat=${lat}&lon=${lng}&appid=${this.API_KEY}&units=metric&lang=fr`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Prévisions non disponibles');
      return await res.json();
    } catch (e) {
      console.warn('Prévisions indisponibles:', e.message);
      return null;
    }
  },

  /**
   * Estime la qualité pour l'observation (couverture nuageuse → météo badge)
   */
  getMeteoQuality(cloudCover) {
    if (cloudCover <= 20) return { class: 'meteo-clear', label: '☀️ Ciel dégagé', icon: '☀️' };
    if (cloudCover <= 50) return { class: 'meteo-clouds', label: '🌤️ Partiellement nuageux', icon: '🌤️' };
    return { class: 'meteo-bad', label: '☁️ Trop nuageux', icon: '☁️' };
  },

  /**
   * Met à jour les éléments météo sur la page d'accueil
   */
  async updateHomePage(lat, lng) {
    const data = await this.getCurrentWeather(lat, lng);
    if (!data) {
      document.getElementById('weather-badge').textContent = 'Météo indisponible';
      return;
    }

    const temp = Math.round(data.main.temp);
    const clouds = data.clouds.all;
    const humidity = data.main.humidity;
    const wind = Math.round(data.wind.speed * 3.6); // m/s → km/h

    const el = (id) => document.getElementById(id);

    const mainValue = document.querySelector('.tonight-main-value');
    if (mainValue) mainValue.textContent = temp + '°';

    if (el('clouds')) el('clouds').textContent = clouds + '%';
    if (el('humidity')) el('humidity').textContent = humidity + '%';
    if (el('wind')) el('wind').textContent = wind + ' km/h';

    const quality = this.getMeteoQuality(clouds);
    const badge = el('weather-badge');
    if (badge) {
      badge.textContent = quality.label;
      badge.className = `meteo-badge ${quality.class}`;
    }

    // Icône météo dans le card
    const icon = document.querySelector('.tonight-icon');
    if (icon) icon.textContent = quality.icon;
  },

  /**
   * Estimation Bortle basée sur la position (simplifié)
   * En production : utiliser l'API lightpollutionmap.info
   */
  estimateBortle(lat, lng) {
    // Simulation - en production utiliser une vraie API
    const seed = (lat * 13 + lng * 7) % 9 + 1;
    return Math.max(1, Math.min(9, Math.round(seed)));
  },

  getBortleInfo(level) {
    const info = {
      1: { label: 'Ciel noir exceptionnel', class: 'bortle-1', desc: 'Vision de la Voie Lactée par le simple reflet sur les rochers. Conditions optimales.' },
      2: { label: 'Ciel noir vrai', class: 'bortle-2', desc: 'Voie Lactée très détaillée. M33 visible à l\'œil nu. Conditions excellentes.' },
      3: { label: 'Ciel rural', class: 'bortle-3', desc: 'Voie Lactée encore très belle. Légère pollution lumineuse à l\'horizon.' },
      4: { label: 'Rural / Suburban', class: 'bortle-4', desc: 'Quelques structures de la Voie Lactée visibles. Bonne observation encore possible.' },
      5: { label: 'Suburban', class: 'bortle-5', desc: 'Voie Lactée pâle. Fond de ciel légèrement grisé. Observable mais sous-optimal.' },
      6: { label: 'Suburban brillant', class: 'bortle-6', desc: 'Voie Lactée difficile. Objets faibles invisibles.' },
      7: { label: 'Transitoire', class: 'bortle-7', desc: 'Dôme lumineux visible. Observation planétaire uniquement recommandée.' },
      8: { label: 'Urbain', class: 'bortle-8', desc: 'Ciel très lumineux. Seulement les étoiles les plus brillantes visibles.' },
      9: { label: 'Cœur de ville', class: 'bortle-9', desc: 'Ciel quasi entièrement pollué. Observation difficile.' },
    };
    return info[level] || info[5];
  },

  /**
   * Met à jour le widget Bortle sur la page d'accueil
   */
  updateBortleWidget(lat, lng) {
    const level = this.estimateBortle(lat, lng);
    const info = this.getBortleInfo(level);

    const el = (id) => document.getElementById(id);
    if (el('bortle-value')) el('bortle-value').textContent = level;
    if (el('bortle-badge')) {
      el('bortle-badge').textContent = info.label;
      el('bortle-badge').className = `bortle-badge ${info.class}`;
    }
    if (el('bortle-fill')) {
      el('bortle-fill').style.width = `${(level / 9) * 100}%`;
    }
    if (el('bortle-desc')) el('bortle-desc').textContent = info.desc;
  },
};

window.Weather = Weather;
