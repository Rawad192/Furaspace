/**
 * AstroNuit — Fond étoilé animé (canvas)
 */
(function () {
  const canvas = document.getElementById('stars-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let stars = [];
  let shootingStars = [];
  let animationId;
  let lastShootingTime = 0;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    generateStars();
  }

  function generateStars() {
    const count = Math.floor((canvas.width * canvas.height) / 4000);
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.2,
        opacity: Math.random() * 0.7 + 0.1,
        speed: Math.random() * 0.005 + 0.002,
        phase: Math.random() * Math.PI * 2,
        color: getStarColor(),
      });
    }
  }

  function getStarColor() {
    const colors = ['#ffffff', '#ffe8d6', '#d6e8ff', '#ffd6ff', '#d6fff0'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function addShootingStar() {
    const angle = Math.random() * 0.4 + 0.1;
    const startX = Math.random() * canvas.width;
    shootingStars.push({
      x: startX,
      y: 0,
      len: Math.random() * 150 + 80,
      speed: Math.random() * 8 + 6,
      angle: angle,
      opacity: 1,
      trail: [],
    });
  }

  function drawStars(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Étoiles fixes avec scintillement
    for (const star of stars) {
      const flicker = Math.sin(time * star.speed + star.phase) * 0.3 + 0.7;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fillStyle = star.color;
      ctx.globalAlpha = star.opacity * flicker;
      ctx.fill();
    }

    // Étoile filantes
    if (time - lastShootingTime > 4000 + Math.random() * 6000) {
      addShootingStar();
      lastShootingTime = time;
    }

    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const ss = shootingStars[i];
      ss.trail.push({ x: ss.x, y: ss.y });
      if (ss.trail.length > 20) ss.trail.shift();

      ss.x += Math.cos(ss.angle) * ss.speed;
      ss.y += Math.sin(ss.angle) * ss.speed;
      ss.opacity -= 0.015;

      if (ss.opacity <= 0 || ss.x > canvas.width || ss.y > canvas.height) {
        shootingStars.splice(i, 1);
        continue;
      }

      // Tracer le sillage
      if (ss.trail.length > 1) {
        const grad = ctx.createLinearGradient(
          ss.trail[0].x, ss.trail[0].y,
          ss.x, ss.y
        );
        grad.addColorStop(0, `rgba(255,255,255,0)`);
        grad.addColorStop(1, `rgba(255,255,255,${ss.opacity})`);
        ctx.beginPath();
        ctx.moveTo(ss.trail[0].x, ss.trail[0].y);
        for (const p of ss.trail) ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = ss.opacity;
        ctx.stroke();
      }

      // Tête
      ctx.beginPath();
      ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.globalAlpha = ss.opacity;
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  function animate(time) {
    drawStars(time);
    animationId = requestAnimationFrame(animate);
  }

  // Init
  resize();
  animate(0);

  // Responsive
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  });
})();
