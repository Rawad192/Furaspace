/**
 * AstroNuit — Constellation detail page
 */

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initActions();
  initPostComposer();
  initPostLikes();
});

// ── Onglets ───────────────────────────────────────────────────────────────────
function initTabs() {
  const panels = { posts: 'tab-posts', events: 'tab-events', photos: 'tab-photos' };

  document.querySelectorAll('.activity-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.activity-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      Object.values(panels).forEach(p => {
        const el = document.getElementById(p);
        if (el) el.style.display = 'none';
      });

      const panelId = panels[tab.dataset.tab];
      const panel = document.getElementById(panelId);
      if (panel) panel.style.display = 'block';
    });
  });
}

// ── Actions boutons ───────────────────────────────────────────────────────────
function initActions() {
  const btnJoin = document.getElementById('btn-join-const');
  if (btnJoin) {
    btnJoin.addEventListener('click', () => {
      // V2 : requireAuth() → Firestore write
      const isJoined = btnJoin.dataset.joined === 'true';
      if (isJoined) {
        btnJoin.dataset.joined = 'false';
        btnJoin.textContent = '✦ Rejoindre';
        btnJoin.classList.replace('btn-ghost', 'btn-accent');
        showToast('Vous avez quitté la Constellation', 'info');
      } else {
        btnJoin.dataset.joined = 'true';
        btnJoin.textContent = '✓ Membre';
        btnJoin.classList.replace('btn-accent', 'btn-ghost');
        showToast('Bienvenue dans la Constellation !', 'success');
        // Afficher le composer
        const composer = document.getElementById('post-composer');
        if (composer) composer.style.display = 'flex';
      }
    });
  }

  const btnShare = document.getElementById('btn-share-const');
  if (btnShare) {
    btnShare.addEventListener('click', () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
        showToast('Lien copié dans le presse-papier', 'success');
      }
    });
  }

  const btnLoadPosts = document.getElementById('btn-load-posts');
  if (btnLoadPosts) {
    btnLoadPosts.addEventListener('click', () => {
      showToast('Tous les messages sont affichés', 'info');
    });
  }

  const btnAllMembers = document.getElementById('btn-see-all-members');
  if (btnAllMembers) {
    btnAllMembers.addEventListener('click', () => {
      showToast('Vue détaillée des membres bientôt disponible', 'info');
    });
  }
}

// ── Composer de post ──────────────────────────────────────────────────────────
function initPostComposer() {
  const btn = document.getElementById('btn-post');
  const textarea = document.getElementById('post-content');
  if (!btn || !textarea) return;

  btn.addEventListener('click', () => {
    const text = textarea.value.trim();
    if (!text || text.length < 3) {
      showToast('Rédigez un message avant de publier', 'error');
      return;
    }
    if (text.length > 2000) {
      showToast('Message trop long (max 2000 caractères)', 'error');
      return;
    }

    // V2 : Firestore write + DOMPurify.sanitize(text)
    btn.disabled = true;
    btn.textContent = '...';
    setTimeout(() => {
      const postsList = document.getElementById('posts-list');
      if (postsList) {
        const newPost = document.createElement('div');
        newPost.className = 'const-post';
        newPost.innerHTML = `
          <div class="avatar" style="width:36px;height:36px;font-size:.8rem;">?</div>
          <div class="const-post-body">
            <div class="const-post-header">
              <span class="const-post-author">@vous</span>
              <span class="const-post-date">À l'instant</span>
            </div>
            <div class="const-post-text">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</div>
            <div class="const-post-actions">
              <button class="post-action-btn">❤️ 0</button>
              <button class="post-action-btn">💬 0 réponses</button>
            </div>
          </div>
        `;
        postsList.insertBefore(newPost, postsList.firstChild);
      }
      textarea.value = '';
      btn.disabled = false;
      btn.textContent = 'Publier';
      showToast('Message publié', 'success');
    }, 600);
  });

  // Auto-resize textarea
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  });
}

// ── Likes sur les posts ───────────────────────────────────────────────────────
function initPostLikes() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.post-action-btn');
    if (!btn || !btn.textContent.startsWith('❤️')) return;

    const isLiked = btn.classList.contains('liked');
    const countMatch = btn.textContent.match(/\d+/);
    let count = countMatch ? parseInt(countMatch[0]) : 0;

    if (isLiked) {
      btn.classList.remove('liked');
      count = Math.max(0, count - 1);
    } else {
      btn.classList.add('liked');
      count++;
    }
    btn.textContent = `❤️ ${count}`;
  });
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  if (typeof window.showToast === 'function' && window.showToast !== showToast) {
    window.showToast(message, type); return;
  }
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
