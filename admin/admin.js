// ========== Admin Panel JavaScript ==========

let adminToken = localStorage.getItem('admin-token');

// ========== Auth ==========
function login() {
  const password = document.getElementById('passwordInput').value;
  const btn = document.getElementById('loginBtn');

  if (!password) return;

  btn.disabled = true;
  btn.textContent = '登录中...';

  fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  })
  .then(res => {
    if (!res.ok) throw new Error('密码错误');
    return res.json();
  })
  .then(data => {
    adminToken = data.token;
    localStorage.setItem('admin-token', data.token);
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';
    loadAllContent();
    loadImages();
  })
  .catch(() => {
    document.getElementById('loginError').textContent = '密码错误，请重试';
    btn.disabled = false;
    btn.textContent = '登录';
  });
}

function logout() {
  localStorage.removeItem('admin-token');
  fetch('/api/logout', { method: 'POST' });
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('dashboard').style.display = 'none';
  location.reload();
}

// Check session on page load
document.addEventListener('DOMContentLoaded', () => {
  if (adminToken) {
    // Try to load content - if fails, show login
    fetch('/api/content')
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        loadAllContent();
        loadImages();
      })
      .catch(() => {
        localStorage.removeItem('admin-token');
      });
  }

  // Enter key on password input
  document.getElementById('passwordInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') login();
  });
});

// ========== Tab Navigation ==========
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  document.getElementById('tab-' + tabId).classList.add('active');
  document.querySelector(`.nav-item[onclick*="'${tabId}'"]`).classList.add('active');

  // Load gallery data when switching to gallery tab
  if (tabId === 'gallery') {
    loadGalleryImages();
  }
}

// ========== Toast ==========
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast ' + type + ' show';
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ========== Content Loading ==========
let contentCache = {};

function loadAllContent() {
  fetch('/api/content')
    .then(res => res.json())
    .then(data => {
      contentCache = data;
      populateForm(data);
    })
    .catch(err => {
      console.error('Failed to load content:', err);
      showToast('加载内容失败', 'error');
    });
}

function populateForm(data) {
  // Flatten all key-value pairs into form fields
  const walk = (obj, prefix = '') => {
    for (const [key, val] of Object.entries(obj)) {
      if (typeof val === 'object' && !Array.isArray(val) && val !== null) {
        walk(val, prefix + key + '-');
      } else {
        const fieldId = prefix + key;
        const el = document.getElementById(fieldId);
        if (el) el.value = val;
      }
    }
  };
  walk(data);
}

// ========== Content Saving ==========
function saveSetting(section, key, value) {
  const payload = { section, key, value };
  // Determine if it's English by checking if key ends with _en
  if (key.endsWith('_en')) {
    payload.lang = 'en';
  }

  fetch('/api/content', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': adminToken
    },
    body: JSON.stringify(payload)
  })
  .then(res => {
    if (!res.ok) throw new Error('Save failed');
    showToast('已保存 ✓');
  })
  .catch(() => showToast('保存失败', 'error'));
}

// ========== Image Management ==========
function loadImages() {
  fetch('/api/images', {
    headers: { 'x-admin-token': adminToken }
  })
  .then(res => res.json())
  .then(images => {
    const grid = document.getElementById('imageGrid');
    if (images.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-light);text-align:center;padding:40px;grid-column:1/-1;">暂无图片，请上传</p>';
      return;
    }
    grid.innerHTML = images.map(img => `
      <div class="image-card">
        <img src="${img.url}?t=${Date.now()}" alt="${img.name}" loading="lazy">
        <div class="img-info">${img.name}</div>
        <div class="img-actions">
          <button class="btn-copy-url" onclick="copyUrl('${img.url}')">复制链接</button>
          <button class="btn-delete" onclick="deleteImage('${img.name}')">删除</button>
        </div>
      </div>
    `).join('');
  });
}

// ========== Image Picker ==========
let activeImageField = null;

function openImagePicker(fieldId) {
  activeImageField = fieldId;
  const modal = document.getElementById('imagePickerModal');
  const grid = document.getElementById('pickerImageGrid');
  const confirmBtn = document.getElementById('pickerConfirm');
  const uploadInput = document.getElementById('pickerFileInput');

  modal.classList.add('open');
  confirmBtn.disabled = true;
  grid.innerHTML = '<div class="modal-empty">加载中...</div>';

  // Reset upload input
  uploadInput.value = '';

  fetch('/api/images', {
    headers: { 'x-admin-token': adminToken }
  })
  .then(res => res.json())
  .then(images => {
    if (images.length === 0) {
      grid.innerHTML = '<div class="modal-empty">暂无图片，请先上传</div>';
      return;
    }
    const currentVal = document.getElementById(fieldId)?.value || '';
    grid.innerHTML = images.map(img => `
      <div class="image-card ${img.url === currentVal ? 'selected' : ''}" data-url="${img.url}" onclick="selectPickerImage(this)">
        <img src="${img.url}?t=${Date.now()}" alt="${img.name}" loading="lazy">
        <div class="img-info">${img.name}</div>
      </div>
    `).join('');
    // Enable confirm if there's a pre-selected image
    if (currentVal) confirmBtn.disabled = false;
  })
  .catch(() => {
    grid.innerHTML = '<div class="modal-empty">加载失败</div>';
  });
}

function selectPickerImage(el) {
  document.querySelectorAll('#pickerImageGrid .image-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('pickerConfirm').disabled = false;
}

function confirmImagePicker() {
  const selected = document.querySelector('#pickerImageGrid .image-card.selected');
  if (!selected) return;

  const url = selected.dataset.url;
  const fieldId = activeImageField;
  if (!fieldId) return;

  // Update hidden input
  const input = document.getElementById(fieldId);
  if (input) {
    input.value = url;
    input.onchange({ target: input });
  }

  // Update preview
  updateImagePreview(fieldId, url);

  closeImagePicker();
}

function closeImagePicker() {
  document.getElementById('imagePickerModal').classList.remove('open');
  activeImageField = null;
}

// ========== Gallery Management ==========
let galleryData = { images: [] };

function loadGalleryImages() {
  const list = document.getElementById('galleryImageList');
  const empty = document.getElementById('galleryEmpty');
  if (!list) return;

  fetch('/api/gallery', {
    headers: { 'x-admin-token': adminToken }
  })
  .then(res => res.json())
  .then(data => {
    galleryData = data;
    if (!galleryData.images) galleryData.images = [];

    if (galleryData.images.length === 0) {
      list.innerHTML = '';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    list.innerHTML = galleryData.images.map((img, idx) => `
      <div class="gallery-admin-item" data-index="${idx}">
        <div class="gallery-admin-img">
          <img src="${img.src}?t=${Date.now()}" alt="${img.title || ''}" loading="lazy">
        </div>
        <div class="gallery-admin-fields">
          <div class="form-row" style="grid-template-columns:1fr 1fr;">
            <div>
              <label style="font-size:0.78rem;color:var(--text-light);">标题 (中文)</label>
              <input type="text" class="cms-input" value="${escapeHtml(img.title || '')}"
                onchange="updateGalleryMeta(${idx}, 'title', this.value)">
            </div>
            <div>
              <label style="font-size:0.78rem;color:var(--text-light);">Title (English)</label>
              <input type="text" class="cms-input" value="${escapeHtml(img.title_en || '')}"
                onchange="updateGalleryMeta(${idx}, 'title_en', this.value)">
            </div>
          </div>
          <div style="display:flex;gap:12px;margin-top:8px;align-items:center;">
            <div>
              <label style="font-size:0.78rem;color:var(--text-light);">分类</label>
              <select class="cms-input" onchange="updateGalleryMeta(${idx}, 'category', this.value)"
                style="padding:6px 12px;font-size:0.83rem;">
                <option value="door" ${img.category === 'door' ? 'selected' : ''}>室内门系列</option>
                <option value="aluminum" ${img.category === 'aluminum' ? 'selected' : ''}>铝型材系列</option>
                <option value="custom" ${img.category === 'custom' ? 'selected' : ''}>定制系列</option>
              </select>
            </div>
            <button class="btn-small btn-small-danger" onclick="removeGalleryImage(${idx})"
              style="margin-left:auto;">删除</button>
          </div>
        </div>
      </div>
    `).join('');
    addGalleryStyles();
  });
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function addGalleryStyles() {
  if (document.getElementById('gallery-admin-styles')) return;
  const style = document.createElement('style');
  style.id = 'gallery-admin-styles';
  style.textContent = `
    .gallery-admin-item {
      display: flex;
      gap: 16px;
      padding: 12px;
      background: #fafafa;
      border: 1px solid var(--border);
      border-radius: 8px;
      margin-bottom: 12px;
      align-items: flex-start;
    }
    .gallery-admin-img {
      width: 120px;
      min-width: 120px;
      height: 90px;
      border-radius: 6px;
      overflow: hidden;
      background: #f0f0f0;
      border: 1px solid var(--border);
    }
    .gallery-admin-img img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .gallery-admin-fields {
      flex: 1;
    }
    @media (max-width: 600px) {
      .gallery-admin-item { flex-direction: column; }
      .gallery-admin-img { width: 100%; height: 140px; }
    }
  `;
  document.head.appendChild(style);
}

function openGalleryImagePicker() {
  activeImageField = 'gallery-picker';
  const modal = document.getElementById('imagePickerModal');
  const grid = document.getElementById('pickerImageGrid');
  const confirmBtn = document.getElementById('pickerConfirm');

  modal.classList.add('open');
  confirmBtn.disabled = true;
  grid.innerHTML = '<div class="modal-empty">加载中...</div>';

  fetch('/api/images', {
    headers: { 'x-admin-token': adminToken }
  })
  .then(res => res.json())
  .then(images => {
    if (images.length === 0) {
      grid.innerHTML = '<div class="modal-empty">暂无图片，请先上传</div>';
      return;
    }
    grid.innerHTML = images.map(img => `
      <div class="image-card" data-url="${img.url}" onclick="selectPickerImage(this)">
        <img src="${img.url}?t=${Date.now()}" alt="${img.name}" loading="lazy">
        <div class="img-info">${img.name}</div>
      </div>
    `).join('');
  });
}

function confirmImagePicker() {
  if (activeImageField === 'gallery-picker') {
    const selected = document.querySelector('#pickerImageGrid .image-card.selected');
    if (!selected) return;
    addGalleryImage(selected.dataset.url);
    closeImagePicker();
    return;
  }
  const selected = document.querySelector('#pickerImageGrid .image-card.selected');
  if (!selected) return;
  const url = selected.dataset.url;
  const fieldId = activeImageField;
  if (!fieldId) return;
  const input = document.getElementById(fieldId);
  if (input) {
    input.value = url;
    input.onchange({ target: input });
  }
  updateImagePreview(fieldId, url);
  closeImagePicker();
}

function addGalleryImage(src) {
  fetch('/api/gallery/image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': adminToken
    },
    body: JSON.stringify({ src, title: '', title_en: '', category: 'door' })
  })
  .then(res => {
    if (!res.ok) throw new Error('Failed');
    showToast('已添加到图册 ✓');
    loadGalleryImages();
  })
  .catch(() => showToast('添加失败', 'error'));
}

function updateGalleryMeta(index, field, value) {
  fetch('/api/gallery/image/' + index, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': adminToken
    },
    body: JSON.stringify({ [field]: value })
  })
  .then(res => {
    if (!res.ok) throw new Error('Failed');
    showToast('已保存');
  })
  .catch(() => showToast('保存失败', 'error'));
}

function removeGalleryImage(index) {
  if (!confirm('确定要从图册中移除这张图片？（图片文件不会被删除）')) return;

  fetch('/api/gallery/image/' + index, {
    method: 'DELETE',
    headers: { 'x-admin-token': adminToken }
  })
  .then(res => {
    if (!res.ok) throw new Error('Failed');
    showToast('已移除 ✓');
    loadGalleryImages();
  })
  .catch(() => showToast('移除失败', 'error'));
}

function updateImagePreview(fieldId, url) {
  const preview = document.getElementById('preview-' + fieldId);
  if (!preview) return;

  const img = preview.querySelector('img');
  const placeholder = preview.querySelector('.image-placeholder-text');

  if (url) {
    img.src = url;
    img.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
  } else {
    img.style.display = 'none';
    if (placeholder) placeholder.style.display = 'block';
  }
}

function clearImage(fieldId) {
  const input = document.getElementById(fieldId);
  if (input) {
    input.value = '';
    input.onchange({ target: input });
  }
  updateImagePreview(fieldId, '');
}

function uploadAndSelect() {
  const input = document.getElementById('pickerFileInput');
  input.click();
}

function handlePickerUpload(files) {
  if (!files.length) return;
  const formData = new FormData();
  for (const f of files) formData.append('image', f);

  const confirmBtn = document.getElementById('pickerConfirm');
  confirmBtn.disabled = true;
  confirmBtn.textContent = '上传中...';

  fetch('/api/upload', {
    method: 'POST',
    headers: { 'x-admin-token': adminToken },
    body: formData
  })
  .then(res => {
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  })
  .then(data => {
    // Refresh the picker grid
    openImagePicker(activeImageField);
    confirmBtn.textContent = '确认选择';
  })
  .catch(() => {
    alert('上传失败');
    confirmBtn.textContent = '确认选择';
    confirmBtn.disabled = false;
  });
}

// Intercept populateForm to also handle image previews
const origPopulateForm = populateForm;
populateForm = function(data) {
  origPopulateForm(data);
  // After populating text fields, update image previews
  document.querySelectorAll('.cms-image-input').forEach(input => {
    const val = input.value;
    if (val) updateImagePreview(input.id, val);
  });
};

function copyUrl(url) {
  navigator.clipboard.writeText(window.location.origin + url)
    .then(() => showToast('链接已复制 ✓'))
    .catch(() => showToast('复制失败', 'error'));
}

function uploadFiles(files) {
  const formData = new FormData();
  for (const file of files) {
    formData.append('image', file);
  }

  fetch('/api/upload', {
    method: 'POST',
    headers: { 'x-admin-token': adminToken },
    body: formData
  })
  .then(res => {
    if (!res.ok) throw new Error('Upload failed');
    showToast('上传成功 ✓');
    loadImages();
  })
  .catch(() => showToast('上传失败，请检查文件大小', 'error'));
}

function deleteImage(name) {
  if (!confirm('确定要删除这张图片吗？')) return;

  fetch('/api/images/' + encodeURIComponent(name), {
    method: 'DELETE',
    headers: { 'x-admin-token': adminToken }
  })
  .then(res => {
    if (!res.ok) throw new Error('Delete failed');
    showToast('已删除 ✓');
    loadImages();
  })
  .catch(() => showToast('删除失败', 'error'));
}

// ========== Drag & Drop Upload ==========
const uploadArea = document.getElementById('uploadArea');
if (uploadArea) {
  uploadArea.addEventListener('dragover', e => {
    e.preventDefault();
    uploadArea.style.borderColor = '#A67C52';
    uploadArea.style.background = 'rgba(166,124,82,0.05)';
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '';
    uploadArea.style.background = '';
  });

  uploadArea.addEventListener('drop', e => {
    e.preventDefault();
    uploadArea.style.borderColor = '';
    uploadArea.style.background = '';
    if (e.dataTransfer.files.length) {
      uploadFiles(e.dataTransfer.files);
    }
  });
}
