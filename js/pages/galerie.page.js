/**
 * AstroNuit — Page Galerie
 * Remplace : js/gallery.js + js/app.js
 */

import { Toast, initAuthNavbar, registerServiceWorker } from '../utils/app.js';

function init() {
  initAuthNavbar();
  initCategoryFilters();
  initLikes();
  initUploadModal();
  registerServiceWorker();
}

function initCategoryFilters() {
  const tabs = document.querySelectorAll('.gallery-tab');
  const cards = document.querySelectorAll('.gallery-card');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.cat;
      cards.forEach(card => {
        card.style.display = (cat === 'all' || card.dataset.cat === cat) ? 'block' : 'none';
      });
    });
  });
}

function initLikes() {
  document.querySelectorAll('.gallery-like').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isLiked = btn.dataset.liked === 'true';
      const count = parseInt(btn.textContent.replace(/[^0-9]/g, ''));
      if (isLiked) {
        btn.textContent = `\u2764\uFE0F ${count - 1}`;
        btn.dataset.liked = 'false';
        btn.style.opacity = '0.7';
      } else {
        btn.textContent = `\u2764\uFE0F ${count + 1}`;
        btn.dataset.liked = 'true';
        btn.style.opacity = '1';
      }
    });
  });
}

function initUploadModal() {
  const btnUpload = document.getElementById('btn-upload');
  const modal = document.getElementById('upload-modal');
  const fileInput = document.getElementById('file-input');
  const preview = document.getElementById('upload-preview');
  const previewImg = document.getElementById('preview-img');
  const uploadZone = document.getElementById('upload-zone');
  const btnSubmit = document.getElementById('btn-upload-submit');

  if (btnUpload && modal) {
    btnUpload.addEventListener('click', () => { modal.style.display = 'flex'; });
  }

  // Close modal
  const closeModal = () => { if (modal) modal.style.display = 'none'; };
  modal?.querySelector('.modal-close')?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) { Toast.error('Fichier trop volumineux (max 10 Mo)'); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (previewImg) previewImg.src = ev.target.result;
        if (uploadZone) uploadZone.style.display = 'none';
        if (preview) preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });
  }

  if (uploadZone) {
    uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.style.borderColor = 'var(--color-primary-light)'; });
    uploadZone.addEventListener('dragleave', () => { uploadZone.style.borderColor = ''; });
    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.style.borderColor = '';
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        fileInput.files = e.dataTransfer.files;
        fileInput.dispatchEvent(new Event('change'));
      }
    });
  }

  if (btnSubmit) {
    btnSubmit.addEventListener('click', async () => {
      if (!fileInput?.files[0]) { Toast.error('Selectionnez une photo'); return; }
      btnSubmit.disabled = true;
      btnSubmit.textContent = '\u23F3 Publication en cours...';
      setTimeout(() => {
        Toast.success('Photo publiee avec succes !');
        closeModal();
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Publier la photo';
      }, 1500);
    });
  }
}

init();
