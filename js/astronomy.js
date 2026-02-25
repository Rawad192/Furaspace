/**
 * AstroNuit — Données astronomiques (SunCalc)
 * Calcule les éphémérides et la phase lunaire
 */

const Astronomy = {
  /**
   * Phases lunaires en emoji + nom
   */
  getMoonPhase(date = new Date()) {
    const moonData = SunCalc.getMoonIllumination(date);
    const fraction = moonData.fraction;
    const phase = moonData.phase;

    let name, emoji;
    if (phase < 0.0625) { name = 'Nouvelle Lune'; emoji = '🌑'; }
    else if (phase < 0.1875) { name = 'Premier Croissant'; emoji = '🌒'; }
    else if (phase < 0.3125) { name = 'Premier Quartier'; emoji = '🌓'; }
    else if (phase < 0.4375) { name = 'Lune Gibbeuse Croissante'; emoji = '🌔'; }
    else if (phase < 0.5625) { name = 'Pleine Lune'; emoji = '🌕'; }
    else if (phase < 0.6875) { name = 'Lune Gibbeuse Décroissante'; emoji = '🌖'; }
    else if (phase < 0.8125) { name = 'Dernier Quartier'; emoji = '🌗'; }
    else if (phase < 0.9375) { name = 'Dernier Croissant'; emoji = '🌘'; }
    else { name = 'Nouvelle Lune'; emoji = '🌑'; }

    return {
      name,
      emoji,
      illumination: Math.round(fraction * 100),
      phase,
    };
  },

  /**
   * Lever/coucher du soleil et crépuscule astronomique
   */
  getSunTimes(lat, lng, date = new Date()) {
    const times = SunCalc.getTimes(date, lat, lng);
    return {
      sunrise: times.sunrise,
      sunset: times.sunset,
      nauticalDawn: times.nauticalDawn,
      nauticalDusk: times.nauticalDusk,
      night: times.night,               // Nuit astronomique début
      nightEnd: times.nightEnd,         // Fin de nuit astronomique
      dawn: times.dawn,
      dusk: times.dusk,
    };
  },

  /**
   * Lever/coucher de la lune
   */
  getMoonTimes(lat, lng, date = new Date()) {
    return SunCalc.getMoonTimes(date, lat, lng);
  },

  /**
   * Formate une heure en HH:MM
   */
  formatTime(date) {
    if (!date || isNaN(date)) return '--:--';
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  },

  /**
   * Qualité d'observation en fonction des conditions
   */
  getObservingQuality(moonIllumination, cloudCover) {
    let score = 10;
    score -= moonIllumination / 15;
    score -= cloudCover / 12;
    if (score >= 8) return { label: 'Excellente', color: '#10b981' };
    if (score >= 5) return { label: 'Bonne', color: '#f59e0b' };
    if (score >= 3) return { label: 'Passable', color: '#f97316' };
    return { label: 'Mauvaise', color: '#ef4444' };
  },

  /**
   * Dessine l'arc du soleil sur canvas
   */
  drawSunArc(canvasEl, lat, lng) {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    const w = canvasEl.width;
    const h = canvasEl.height;
    ctx.clearRect(0, 0, w, h);

    const now = new Date();
    const times = this.getSunTimes(lat || 46.6, lng || 2.3);

    const dayStart = times.sunrise ? times.sunrise.getTime() : (now.setHours(6, 0, 0, 0), now.getTime());
    const dayEnd = times.sunset ? times.sunset.getTime() : (now.setHours(20, 0, 0, 0), now.getTime());
    const dayDuration = dayEnd - dayStart;

    // Arc de fond
    ctx.beginPath();
    ctx.arc(w / 2, h, h - 10, Math.PI, 0, false);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Arc du jour
    const nowTime = Date.now();
    let progress = (nowTime - dayStart) / dayDuration;
    progress = Math.max(0, Math.min(1, progress));

    const endAngle = Math.PI - (progress * Math.PI);
    ctx.beginPath();
    ctx.arc(w / 2, h, h - 10, Math.PI, endAngle, false);
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#f97316');
    grad.addColorStop(0.5, '#fbbf24');
    grad.addColorStop(1, '#f97316');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Position actuelle du soleil
    const angle = Math.PI - (progress * Math.PI);
    const sunX = w / 2 + (h - 10) * Math.cos(angle);
    const sunY = h + (h - 10) * Math.sin(angle);

    if (progress > 0 && progress < 1) {
      ctx.beginPath();
      ctx.arc(sunX, sunY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#fbbf24';
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  },

  /**
   * Met à jour tous les éléments astronomiques sur la page d'accueil
   */
  updateHomePage(lat, lng) {
    const date = new Date();

    // Phase lunaire
    const moon = this.getMoonPhase(date);
    const moonGraphic = document.getElementById('moon-graphic');
    const moonPhaseName = document.getElementById('moon-phase-name');
    const moonIllumination = document.getElementById('moon-illumination');
    if (moonGraphic) moonGraphic.textContent = moon.emoji;
    if (moonPhaseName) moonPhaseName.textContent = moon.name;
    if (moonIllumination) moonIllumination.textContent = moon.illumination + '%';

    // Lever/coucher
    const sunTimes = this.getSunTimes(lat || 46.6, lng || 2.3, date);
    const el = (id) => document.getElementById(id);
    if (el('sun-rise')) el('sun-rise').textContent = this.formatTime(sunTimes.sunrise);
    if (el('sun-set')) el('sun-set').textContent = this.formatTime(sunTimes.sunset);
    if (el('astro-dark')) el('astro-dark').textContent = this.formatTime(sunTimes.night);

    // Coucher lune
    const moonTimes = this.getMoonTimes(lat || 46.6, lng || 2.3, date);
    if (el('moon-set')) el('moon-set').textContent = this.formatTime(moonTimes.set);

    // Arc soleil
    this.drawSunArc(el('sun-arc'), lat, lng);
  },
};

// Exposer globalement
window.Astronomy = Astronomy;
