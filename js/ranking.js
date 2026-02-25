/**
 * AstroNuit — Classement (leaderboard) page
 */

// ── Données de démo ───────────────────────────────────────────────────────────

const MONTHLY_DATA = [
  { rank: 1, uid: 'u1', pseudo: '@astronome_pro', avatar: 'A', color: 'rgba(108,62,184,.3)', score: 4820, trend: +2, region: 'PACA', constellation: 'Observateurs du Vercors', verified: true },
  { rank: 2, uid: 'u2', pseudo: '@astrophoto_aura', avatar: 'P', color: 'rgba(16,185,129,.25)', score: 3940, trend: -1, region: 'Auvergne-RA', constellation: 'Cézallier Stargazers', verified: false },
  { rank: 3, uid: 'u3', pseudo: '@stargazer_occitan', avatar: 'S', color: 'rgba(245,158,11,.25)', score: 3210, trend: +5, region: 'Occitanie', constellation: 'Nuits Occitanes', verified: false },
  { rank: 4, uid: 'u4', pseudo: '@ciel_breton', avatar: 'C', color: 'rgba(59,130,246,.25)', score: 2870, trend: +1, region: 'Bretagne', constellation: 'Ciel Breton', verified: true },
  { rank: 5, uid: 'u5', pseudo: '@mariefils', avatar: 'M', color: 'rgba(236,72,153,.25)', score: 2140, trend: -2, region: 'Bretagne', constellation: 'Ciel Breton', verified: false },
  { rank: 6, uid: 'u6', pseudo: '@normand_etoile', avatar: 'N', color: 'rgba(20,184,166,.25)', score: 1920, trend: 0, region: 'Normandie', constellation: null, verified: false },
  { rank: 7, uid: 'u7', pseudo: '@stargazer42', avatar: 'S', color: '', score: 1740, trend: +3, region: 'Cévennes', constellation: 'Nuits Occitanes', verified: false },
  { rank: 8, uid: 'u8', pseudo: '@julien_astro', avatar: 'J', color: 'rgba(59,130,246,.25)', score: 1580, trend: -1, region: 'Auvergne-RA', constellation: 'Observateurs du Vercors', verified: false },
  { rank: 9, uid: 'u9', pseudo: '@telescope_thomas', avatar: 'T', color: 'rgba(16,185,129,.15)', score: 1490, trend: +4, region: 'Auvergne-RA', constellation: 'Observateurs du Vercors', verified: false },
  { rank: 24, uid: 'me', pseudo: '@vous', avatar: '?', color: '', score: 1480, trend: +3, region: 'Paris', constellation: null, verified: false, isMe: true }
];

const ALLTIME_DATA = [
  { rank: 1, uid: 'u4', pseudo: '@ciel_breton', avatar: 'C', color: 'rgba(59,130,246,.25)', score: 48200, trend: 0, region: 'Bretagne', constellation: 'Ciel Breton', verified: true },
  { rank: 2, uid: 'u1', pseudo: '@astronome_pro', avatar: 'A', color: 'rgba(108,62,184,.3)', score: 43150, trend: +1, region: 'PACA', constellation: 'Observateurs du Vercors', verified: true },
  { rank: 3, uid: 'u3', pseudo: '@stargazer_occitan', avatar: 'S', color: 'rgba(245,158,11,.25)', score: 38920, trend: -1, region: 'Occitanie', constellation: 'Nuits Occitanes', verified: false },
  { rank: 4, uid: 'u2', pseudo: '@astrophoto_aura', avatar: 'P', color: 'rgba(16,185,129,.25)', score: 31400, trend: 0, region: 'Auvergne-RA', constellation: 'Cézallier Stargazers', verified: false },
  { rank: 5, uid: 'u5', pseudo: '@mariefils', avatar: 'M', color: 'rgba(236,72,153,.25)', score: 28760, trend: +2, region: 'Bretagne', constellation: 'Ciel Breton', verified: false },
  { rank: 6, uid: 'u7', pseudo: '@stargazer42', avatar: 'S', color: '', score: 24300, trend: -1, region: 'Cévennes', constellation: 'Nuits Occitanes', verified: false },
  { rank: 7, uid: 'u6', pseudo: '@normand_etoile', avatar: 'N', color: 'rgba(20,184,166,.25)', score: 19840, trend: 0, region: 'Normandie', constellation: null, verified: false },
  { rank: 8, uid: 'u8', pseudo: '@julien_astro', avatar: 'J', color: 'rgba(59,130,246,.25)', score: 17210, trend: +3, region: 'Auvergne-RA', constellation: 'Observateurs du Vercors', verified: false },
];

const CONSTELLATION_DATA = [
  { rank: 1, id: 'c4', name: 'Astro PACA', emoji: '🌠', color: '#10b981', memberCount: 73, eventCount: 38, totalScore: 142800, region: 'PACA' },
  { rank: 2, id: 'c3', name: 'Nuits Occitanes', emoji: '🌟', color: '#f59e0b', memberCount: 56, eventCount: 31, totalScore: 118400, region: 'Occitanie' },
  { rank: 3, id: 'c2', name: 'Ciel Breton', emoji: '🌊', color: '#3b82f6', memberCount: 41, eventCount: 22, totalScore: 98600, region: 'Bretagne' },
  { rank: 4, id: 'c1', name: 'Observateurs du Vercors', emoji: '🌌', color: '#6c3eb8', memberCount: 28, eventCount: 14, totalScore: 74200, region: 'Auvergne-RA' },
  { rank: 5, id: 'c6', name: 'Cézallier Stargazers', emoji: '🏔️', color: '#14b8a6', memberCount: 34, eventCount: 19, totalScore: 68900, region: 'Auvergne-RA' },
  { rank: 6, id: 'c5', name: 'Étoiles du Grand Est', emoji: '🌸', color: '#ec4899', memberCount: 19, eventCount: 8, totalScore: 32100, region: 'Grand Est' },
];

// ── État ──────────────────────────────────────────────────────────────────────
let currentTab = 'monthly';

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updatePeriodLabel();
  renderPodium(MONTHLY_DATA.slice(0, 3));
  renderLeaderboard('monthly', MONTHLY_DATA);
  renderLeaderboard('alltime', ALLTIME_DATA);
  renderConstellationBoard();
  initTabs();
});

// ── Période ───────────────────────────────────────────────────────────────────
function updatePeriodLabel() {
  const now = new Date();
  const label = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const el = document.getElementById('period-label');
  if (el) el.innerHTML = `📅 ${label.charAt(0).toUpperCase() + label.slice(1)} — Mensuel`;
}

// ── Podium ────────────────────────────────────────────────────────────────────
function renderPodium(top3) {
  const podium = document.getElementById('podium');
  if (!podium) return;

  // Ordre visuel : 2e, 1er, 3e
  const order = [top3[1], top3[0], top3[2]];
  const cssClass = ['rank-2', 'rank-1', 'rank-3'];
  const crowns   = ['🥈', '🥇', '🥉'];
  const heights  = [56, 80, 40];

  podium.innerHTML = order.map((user, i) => {
    if (!user) return '';
    return `
      <div class="podium-place ${cssClass[i]}">
        <div class="podium-avatar-wrap">
          <div class="podium-rank-crown">${crowns[i]}</div>
          <div class="avatar podium-avatar" style="width:56px;height:56px;font-size:1.3rem;${user.color ? 'background:' + user.color + ';' : ''}">${user.avatar}</div>
        </div>
        <div class="podium-pseudo">${user.pseudo}</div>
        <div class="podium-score-val">${user.score.toLocaleString('fr')} pts</div>
        <div class="podium-block" style="height:${heights[i]}px;">${user.rank}</div>
      </div>
    `;
  }).join('');
}

// ── Classement membres ────────────────────────────────────────────────────────
function renderLeaderboard(type, data) {
  const container = document.getElementById(`leaderboard-${type}`);
  if (!container) return;

  const topData = data.filter(u => !u.isMe);
  const meData  = data.filter(u => u.isMe);

  let html = topData.slice(0, 50).map(user => renderRow(user)).join('');

  // Séparateur + ligne "moi" si pas dans le top
  if (meData.length > 0 && meData[0].rank > topData.length) {
    html += `<div style="text-align:center;font-size:var(--text-xs);color:var(--color-text-dim);padding:0.5rem;">• • •</div>`;
    html += renderRow(meData[0]);
  }

  container.innerHTML = html;
}

function renderRow(user) {
  const rankClass = user.rank === 1 ? 'rank-gold' : user.rank === 2 ? 'rank-silver' : user.rank === 3 ? 'rank-bronze' : '';
  const rankNumClass = user.rank === 1 ? 'rank-gold-num' : user.rank === 2 ? 'rank-silver-num' : user.rank === 3 ? 'rank-bronze-num' : 'rank-default-num';
  const meClass = user.isMe ? 'is-me' : '';

  let trendHtml = '';
  if (user.trend > 0) trendHtml = `<span class="trend-up">▲ +${user.trend}</span>`;
  else if (user.trend < 0) trendHtml = `<span class="trend-down">▼ ${user.trend}</span>`;
  else trendHtml = `<span class="trend-flat">—</span>`;

  const verifiedStar = user.verified ? ' ⭐' : '';
  const constInfo = user.constellation ? `✦ ${user.constellation}` : '';

  return `
    <div class="ranking-row ${rankClass} ${meClass}" onclick="location.href='profil.html'">
      <div class="rank-num ${rankNumClass}">${user.rank}</div>
      <div class="user-cell">
        <div class="avatar" style="width:36px;height:36px;font-size:.8rem;${user.color ? 'background:' + user.color + ';' : ''}">${user.avatar}</div>
        <div>
          <div class="user-pseudo">${user.pseudo}${verifiedStar}${user.isMe ? ' <span style="font-size:.65rem;background:rgba(108,62,184,.2);color:var(--color-primary-light);padding:.1rem .4rem;border-radius:999px;">Vous</span>' : ''}</div>
          <div class="user-const">${constInfo}</div>
        </div>
      </div>
      <div class="score-cell">${user.score.toLocaleString('fr')}</div>
      <div class="trend-cell">${trendHtml}</div>
      <div class="region-cell">${user.region || ''}</div>
    </div>
  `;
}

// ── Classement Constellations ─────────────────────────────────────────────────
function renderConstellationBoard() {
  const container = document.getElementById('leaderboard-constellations');
  if (!container) return;

  container.innerHTML = CONSTELLATION_DATA.map(c => {
    const rankNum = c.rank === 1 ? `<span style="color:#fbbf24;">🥇</span>` :
                    c.rank === 2 ? `<span style="color:#9ca3af;">🥈</span>` :
                    c.rank === 3 ? `<span style="color:#92400e;">🥉</span>` :
                    `<span class="rank-default-num">${c.rank}</span>`;
    return `
      <div class="const-rank-row" onclick="location.href='constellation-detail.html'">
        <div class="const-rank-num">${rankNum}</div>
        <div style="font-size:1.3rem;">${c.emoji}</div>
        <div class="const-rank-info">
          <div class="const-rank-name">${c.name}</div>
          <div class="const-rank-meta">${c.memberCount} membres · ${c.eventCount} sorties · ${c.region}</div>
        </div>
        <div class="const-rank-score">${c.totalScore.toLocaleString('fr')} pts</div>
      </div>
    `;
  }).join('');
}

// ── Onglets ───────────────────────────────────────────────────────────────────
function initTabs() {
  const tabPanels = {
    monthly: 'tab-monthly',
    alltime: 'tab-alltime',
    constellations: 'tab-constellations'
  };

  document.querySelectorAll('.ranking-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.ranking-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;

      Object.values(tabPanels).forEach(p => {
        const el = document.getElementById(p);
        if (el) el.style.display = 'none';
      });

      const panel = document.getElementById(tabPanels[currentTab]);
      if (panel) panel.style.display = 'block';

      // Mettre à jour le podium pour all-time
      if (currentTab === 'alltime') renderPodium(ALLTIME_DATA.slice(0, 3));
      else if (currentTab === 'monthly') renderPodium(MONTHLY_DATA.slice(0, 3));
      else {
        // Podium constellations
        const top3const = CONSTELLATION_DATA.slice(0, 3).map(c => ({
          rank: c.rank,
          pseudo: c.name,
          avatar: c.emoji,
          color: c.color + '33',
          score: c.totalScore,
        }));
        renderPodium(top3const);
      }

      // Mettre à jour le label mon classement
      const myPos = document.getElementById('my-rank-pos');
      const myScore = document.getElementById('my-rank-score');
      const myLabel = document.querySelector('.my-rank-label');
      if (currentTab === 'monthly') {
        if (myPos) myPos.textContent = '#24';
        if (myScore) myScore.textContent = '1 480 pts';
        if (myLabel) myLabel.textContent = 'Ce mois-ci';
      } else if (currentTab === 'alltime') {
        if (myPos) myPos.textContent = '#142';
        if (myScore) myScore.textContent = '8 340 pts';
        if (myLabel) myLabel.textContent = 'All-time';
      } else {
        if (myPos) myPos.textContent = '—';
        if (myScore) myScore.textContent = 'Pas de Constellation';
        if (myLabel) myLabel.textContent = 'Rejoignez une Constellation';
      }
    });
  });
}
