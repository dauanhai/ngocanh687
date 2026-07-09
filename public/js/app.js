// Đậu Ánh Facebook Agent - SPA logic
(function () {
  const state = {
    page: 'dashboard',
    pageInfo: null,
    selectedTemplateCategory: 'sales',
    createImageMode: 'url', // 'url' | 'upload'
    selectedFile: null,
    metricPeriod: 'day'
  };

  const mainContent = document.getElementById('main-content');
  const pageTitle = document.getElementById('page-title');
  const toastContainer = document.getElementById('toast-container');
  const modalContainer = document.getElementById('modal-container');
  const modalContent = document.getElementById('modal-content');

  const PAGE_TITLES = {
    dashboard: 'Tổng quan',
    create: 'Tạo bài viết',
    posts: 'Quản lý bài viết',
    analytics: 'Thống kê',
    settings: 'Kết nối API'
  };

  // ==================== Helpers ====================
  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function formatNumber(n) {
    if (n === null || n === undefined) return '0';
    return Number(n).toLocaleString('vi-VN');
  }

  async function api(path, options = {}) {
    const res = await fetch(path, options);
    let data;
    try { data = await res.json(); } catch (e) { data = {}; }
    if (!res.ok || data.error) {
      throw new Error(data.error || `Lỗi ${res.status}`);
    }
    return data;
  }

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-fade');
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  function openModal(html) {
    modalContent.innerHTML = html;
    modalContainer.classList.add('active');
  }

  function closeModal() {
    modalContainer.classList.remove('active');
    modalContent.innerHTML = '';
  }

  modalContainer.addEventListener('click', (e) => {
    if (e.target === modalContainer) closeModal();
  });

  function confirmAction(message, onConfirm) {
    openModal(`
      <div class="modal-header"><h3>Xác nhận</h3><button class="modal-close" data-action="close-modal">✕</button></div>
      <p>${escapeHtml(message)}</p>
      <div class="modal-actions">
        <button class="btn btn-outline" data-action="close-modal">Huỷ</button>
        <button class="btn btn-danger" id="confirm-yes">Xác nhận</button>
      </div>
    `);
    document.getElementById('confirm-yes').addEventListener('click', async () => {
      closeModal();
      await onConfirm();
    });
  }

  // ==================== Router ====================
  function navigate(page) {
    if (!PAGE_TITLES[page]) page = 'dashboard';
    state.page = page;
    document.querySelectorAll('.nav-item').forEach((el) => {
      el.classList.toggle('active', el.dataset.page === page);
    });
    pageTitle.textContent = PAGE_TITLES[page];
    document.getElementById('sidebar').classList.remove('open');
    const renderers = {
      dashboard: renderDashboard,
      create: renderCreate,
      posts: renderPosts,
      analytics: renderAnalytics,
      settings: renderSettings
    };
    renderers[page]();
  }

  window.addEventListener('hashchange', () => {
    navigate(location.hash.replace('#', '') || 'dashboard');
  });

  document.querySelectorAll('.nav-item').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      location.hash = el.dataset.page;
    });
  });

  document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // ==================== Header status ====================
  async function refreshStatus() {
    const statusEl = document.getElementById('connection-status');
    const statusText = statusEl.querySelector('.status-text');
    try {
      const data = await api('/api/status');
      state.pageInfo = data.page;
      statusEl.classList.remove('offline');
      statusEl.classList.add('online');
      statusText.textContent = 'Đã kết nối';
      document.getElementById('page-name-display').textContent = data.page?.name || 'Không rõ';
      if (data.page?.picture) document.getElementById('page-avatar').src = data.page.picture;
    } catch (err) {
      statusEl.classList.remove('online');
      statusEl.classList.add('offline');
      statusText.textContent = 'Mất kết nối';
      document.getElementById('page-name-display').textContent = 'Chưa kết nối';
    }
  }

  function initClock() {
    const el = document.getElementById('current-time');
    const tick = () => { el.textContent = new Date().toLocaleString('vi-VN'); };
    tick();
    setInterval(tick, 1000);
  }

  // ==================== Dashboard ====================
  async function renderDashboard() {
    mainContent.innerHTML = `<div class="loading-state">Đang tải...</div>`;
    try {
      const [status, postsData] = await Promise.all([
        api('/api/status').catch((e) => ({ error: e.message })),
        api('/api/posts?limit=5').catch(() => ({ data: [] }))
      ]);
      const page = status.page || {};
      const posts = postsData.data || [];
      mainContent.innerHTML = `
        <div class="page-header">
          <div><h2>Chào mừng trở lại 👋</h2><p>Tổng quan hoạt động Fanpage Đậu Ánh</p></div>
          <button class="btn btn-primary" data-action="go-create">✏️ Tạo bài viết mới</button>
        </div>
        <div class="grid grid-4" style="margin-bottom:24px">
          <div class="stat-tile"><div class="stat-label">👥 Người theo dõi</div><div class="stat-value">${formatNumber(page.followers)}</div></div>
          <div class="stat-tile"><div class="stat-label">❤️ Lượt thích trang</div><div class="stat-value">${formatNumber(page.fans)}</div></div>
          <div class="stat-tile"><div class="stat-label">📝 Bài viết gần đây</div><div class="stat-value">${posts.length}</div></div>
          <div class="stat-tile"><div class="stat-label">🔑 Trạng thái token</div><div class="stat-value" style="font-size:16px">${status.error ? '⚠️ Lỗi' : '✅ Hoạt động'}</div></div>
        </div>
        <div class="section-title">📋 Bài viết gần đây</div>
        <div class="post-list" id="recent-posts">${posts.length ? posts.map(postCardHtml).join('') : emptyStateHtml('📭', 'Chưa có bài viết nào')}</div>
      `;
      mainContent.querySelector('[data-action="go-create"]').addEventListener('click', () => location.hash = 'create');
      wirePostActions(mainContent.querySelector('#recent-posts'));
    } catch (err) {
      mainContent.innerHTML = errorStateHtml(err.message);
    }
  }

  function emptyStateHtml(icon, text) {
    return `<div class="empty-state"><div class="empty-icon">${icon}</div>${escapeHtml(text)}</div>`;
  }

  function errorStateHtml(message) {
    return `<div class="empty-state"><div class="empty-icon">⚠️</div>Không thể tải dữ liệu: ${escapeHtml(message)}</div>`;
  }

  function postCardHtml(post) {
    const likes = post.likes?.summary?.total_count ?? 0;
    const comments = post.comments?.summary?.total_count ?? 0;
    const shares = post.shares?.count ?? 0;
    return `
      <div class="post-card" data-post-id="${post.id}">
        ${post.full_picture ? `<img class="post-thumb" src="${post.full_picture}" alt="">` : ''}
        <div class="post-body">
          <div class="post-message">${escapeHtml(post.message || '(Không có nội dung văn bản)')}</div>
          <div class="post-meta">
            <span>🕒 ${formatDate(post.created_time)}</span>
            <span>👍 ${formatNumber(likes)}</span>
            <span>💬 ${formatNumber(comments)}</span>
            <span>🔁 ${formatNumber(shares)}</span>
          </div>
          <div class="post-actions">
            ${post.permalink_url ? `<a class="btn btn-sm btn-outline" href="${post.permalink_url}" target="_blank" rel="noopener">🔗 Xem trên Facebook</a>` : ''}
            <button class="btn btn-sm btn-outline" data-action="view-insights" data-id="${post.id}">📊 Insights</button>
            <button class="btn btn-sm btn-outline" data-action="edit-post" data-id="${post.id}" data-message="${escapeHtml(post.message || '')}">✏️ Sửa</button>
            <button class="btn btn-sm btn-danger" data-action="delete-post" data-id="${post.id}">🗑️ Xoá</button>
          </div>
        </div>
      </div>
    `;
  }

  function scheduledCardHtml(post) {
    return `
      <div class="post-card" data-post-id="${post.id}">
        <div class="post-body">
          <div class="post-message">${escapeHtml(post.message || '(Không có nội dung văn bản)')}</div>
          <div class="post-meta">
            <span class="badge badge-scheduled">⏰ Đã lên lịch</span>
            <span>📅 ${formatDate(post.scheduled_publish_time)}</span>
          </div>
          <div class="post-actions">
            <button class="btn btn-sm btn-danger" data-action="delete-post" data-id="${post.id}">🗑️ Huỷ lịch</button>
          </div>
        </div>
      </div>
    `;
  }

  function wirePostActions(container) {
    if (!container) return;
    container.querySelectorAll('[data-action="delete-post"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        confirmAction('Bạn có chắc muốn xoá/huỷ bài viết này?', async () => {
          try {
            await api(`/api/posts/${id}`, { method: 'DELETE' });
            showToast('Xoá bài viết thành công!');
            renderers_reload();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      });
    });
    container.querySelectorAll('[data-action="edit-post"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const message = btn.dataset.message;
        openModal(`
          <div class="modal-header"><h3>Sửa bài viết</h3><button class="modal-close" data-action="close-modal">✕</button></div>
          <div class="form-group">
            <textarea class="form-control" id="edit-message" rows="6">${escapeHtml(message)}</textarea>
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" data-action="close-modal">Huỷ</button>
            <button class="btn btn-primary" id="save-edit">💾 Lưu thay đổi</button>
          </div>
        `);
        document.getElementById('save-edit').addEventListener('click', async () => {
          const newMessage = document.getElementById('edit-message').value.trim();
          try {
            await api(`/api/posts/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: newMessage })
            });
            showToast('Cập nhật bài viết thành công!');
            closeModal();
            renderers_reload();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      });
    });
    container.querySelectorAll('[data-action="view-insights"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        openModal(`<div class="modal-header"><h3>Thống kê bài viết</h3><button class="modal-close" data-action="close-modal">✕</button></div><div class="loading-state">Đang tải...</div>`);
        try {
          const data = await api(`/api/posts/${id}/insights`);
          const rows = (data.data || []).map((m) => {
            const val = m.values?.[0]?.value;
            const displayVal = typeof val === 'object' ? Object.entries(val || {}).map(([k, v]) => `${k}: ${v}`).join(', ') : formatNumber(val);
            return `<div class="info-row"><span>${escapeHtml(m.title || m.name)}</span><span>${displayVal || '0'}</span></div>`;
          }).join('');
          modalContent.innerHTML = `
            <div class="modal-header"><h3>Thống kê bài viết</h3><button class="modal-close" data-action="close-modal">✕</button></div>
            ${rows || emptyStateHtml('📊', 'Chưa có dữ liệu thống kê')}
          `;
          wireCloseButtons();
        } catch (err) {
          modalContent.innerHTML = `
            <div class="modal-header"><h3>Thống kê bài viết</h3><button class="modal-close" data-action="close-modal">✕</button></div>
            ${errorStateHtml(err.message)}
          `;
          wireCloseButtons();
        }
      });
    });
    wireCloseButtons(container);
  }

  function wireCloseButtons(scope) {
    const root = scope || document;
    root.querySelectorAll('[data-action="close-modal"]').forEach((btn) => {
      btn.addEventListener('click', closeModal);
    });
  }

  function renderers_reload() {
    if (state.page === 'dashboard') renderDashboard();
    else if (state.page === 'posts') renderPosts();
  }

  // ==================== Create post ====================
  function renderCreate() {
    mainContent.innerHTML = `
      <div class="page-header">
        <div><h2>Tạo bài viết mới</h2><p>Soạn nội dung, chọn mẫu có sẵn hoặc đăng ảnh cho Fanpage</p></div>
      </div>
      <div class="grid" style="grid-template-columns: 1.4fr 1fr; gap: 20px;">
        <div class="card"><div class="card-body">
          <div class="section-title" style="margin-top:0">📚 Chọn mẫu nội dung</div>
          <div class="template-categories" id="template-categories"></div>
          <div class="template-list" id="template-list"></div>

          <div class="form-group">
            <label class="form-label">Nội dung bài viết</label>
            <textarea class="form-control" id="post-message" rows="8" placeholder="Nhập nội dung bài viết..."></textarea>
            <div class="char-counter" id="char-counter">0 ký tự</div>
          </div>

          <div class="form-group">
            <label class="form-label">Link đính kèm (tuỳ chọn)</label>
            <input type="url" class="form-control" id="post-link" placeholder="https://...">
          </div>

          <div class="form-group">
            <label class="form-label">Ảnh (tuỳ chọn)</label>
            <div class="tabs">
              <button class="tab-btn active" data-mode="url">🔗 Ảnh từ URL</button>
              <button class="tab-btn" data-mode="upload">📤 Tải ảnh lên</button>
            </div>
            <div id="image-url-panel">
              <input type="url" class="form-control" id="post-image-url" placeholder="https://... (đường dẫn ảnh)">
            </div>
            <div id="image-upload-panel" style="display:none">
              <div class="image-drop" id="image-drop">📁 Nhấn để chọn ảnh từ máy tính (tối đa 10MB)</div>
              <input type="file" id="post-image-file" accept="image/*" style="display:none">
              <div class="image-preview" id="image-preview" style="display:none"></div>
            </div>
            <div class="form-hint">Lưu ý: bài đăng kèm ảnh sẽ được đăng ngay, không hỗ trợ lên lịch.</div>
          </div>

          <div class="form-group">
            <div class="checkbox-row">
              <input type="checkbox" id="post-schedule-toggle">
              <label for="post-schedule-toggle">Lên lịch đăng bài (chỉ áp dụng cho bài viết không kèm ảnh)</label>
            </div>
            <div class="form-group" id="schedule-time-group" style="display:none; margin-top:10px">
              <input type="datetime-local" class="form-control" id="post-schedule-time">
            </div>
          </div>

          <button class="btn btn-primary btn-block" id="submit-post">🚀 Đăng bài viết</button>
        </div></div>

        <div class="card"><div class="card-body">
          <div class="section-title" style="margin-top:0">👀 Xem trước</div>
          <div class="post-card" style="flex-direction:column">
            <div id="preview-image"></div>
            <div class="post-body">
              <div class="post-message" id="preview-message" style="max-height:none">Nội dung bài viết sẽ hiện ở đây...</div>
            </div>
          </div>
        </div></div>
      </div>
    `;

    renderTemplateCategories();
    renderTemplateList();

    const messageEl = document.getElementById('post-message');
    const counterEl = document.getElementById('char-counter');
    const previewEl = document.getElementById('preview-message');
    const updatePreview = () => {
      const len = messageEl.value.length;
      counterEl.textContent = `${len} ký tự`;
      counterEl.classList.toggle('over', len > 63206);
      previewEl.textContent = messageEl.value || 'Nội dung bài viết sẽ hiện ở đây...';
    };
    messageEl.addEventListener('input', updatePreview);

    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.createImageMode = btn.dataset.mode;
        document.getElementById('image-url-panel').style.display = state.createImageMode === 'url' ? '' : 'none';
        document.getElementById('image-upload-panel').style.display = state.createImageMode === 'upload' ? '' : 'none';
      });
    });

    const imageDrop = document.getElementById('image-drop');
    const imageFileInput = document.getElementById('post-image-file');
    imageDrop.addEventListener('click', () => imageFileInput.click());
    imageFileInput.addEventListener('change', () => {
      const file = imageFileInput.files[0];
      state.selectedFile = file || null;
      const previewBox = document.getElementById('image-preview');
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          previewBox.style.display = '';
          previewBox.innerHTML = `<img src="${e.target.result}" alt="">`;
        };
        reader.readAsDataURL(file);
      } else {
        previewBox.style.display = 'none';
        previewBox.innerHTML = '';
      }
    });

    document.getElementById('post-schedule-toggle').addEventListener('change', (e) => {
      document.getElementById('schedule-time-group').style.display = e.target.checked ? '' : 'none';
    });

    document.getElementById('submit-post').addEventListener('click', submitCreatePost);
  }

  function renderTemplateCategories() {
    const el = document.getElementById('template-categories');
    el.innerHTML = ContentTemplates.categories.map((cat) => `
      <button class="template-cat-btn ${cat.id === state.selectedTemplateCategory ? 'active' : ''}" data-cat="${cat.id}">${cat.name}</button>
    `).join('');
    el.querySelectorAll('.template-cat-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.selectedTemplateCategory = btn.dataset.cat;
        renderTemplateCategories();
        renderTemplateList();
      });
    });
  }

  function renderTemplateList() {
    const el = document.getElementById('template-list');
    const templates = ContentTemplates.getByCategory(state.selectedTemplateCategory);
    el.innerHTML = templates.map((t, idx) => `
      <button class="template-card" data-idx="${idx}">
        <span class="t-name">${escapeHtml(t.name)}</span>
        <span class="t-preview">${escapeHtml(t.content)}</span>
      </button>
    `).join('');
    el.querySelectorAll('.template-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        const t = templates[Number(btn.dataset.idx)];
        const messageEl = document.getElementById('post-message');
        messageEl.value = t.content;
        messageEl.dispatchEvent(new Event('input'));
      });
    });
  }

  async function submitCreatePost() {
    const submitBtn = document.getElementById('submit-post');
    const message = document.getElementById('post-message').value.trim();
    const link = document.getElementById('post-link').value.trim();
    const imageUrl = document.getElementById('post-image-url').value.trim();
    const isScheduled = document.getElementById('post-schedule-toggle').checked;
    const scheduleTime = document.getElementById('post-schedule-time').value;
    const hasUploadFile = state.createImageMode === 'upload' && state.selectedFile;
    const hasImageUrl = state.createImageMode === 'url' && imageUrl;

    if (!message && !hasUploadFile && !hasImageUrl) {
      showToast('Vui lòng nhập nội dung hoặc chọn ảnh', 'error');
      return;
    }
    if (isScheduled && (hasUploadFile || hasImageUrl)) {
      showToast('Bài viết kèm ảnh không hỗ trợ lên lịch', 'error');
      return;
    }
    if (isScheduled && !scheduleTime) {
      showToast('Vui lòng chọn thời gian lên lịch', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang xử lý...';
    try {
      if (hasUploadFile) {
        const formData = new FormData();
        formData.append('image', state.selectedFile);
        formData.append('caption', message);
        await api('/api/posts/photo/upload', { method: 'POST', body: formData });
      } else if (hasImageUrl) {
        await api('/api/posts/photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl, caption: message })
        });
      } else if (isScheduled) {
        await api('/api/posts/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, scheduledTime: scheduleTime, link: link || undefined })
        });
      } else {
        await api('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, link: link || undefined })
        });
      }
      showToast(isScheduled ? 'Lên lịch đăng bài thành công!' : 'Đăng bài thành công!');
      location.hash = 'posts';
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '🚀 Đăng bài viết';
    }
  }

  // ==================== Posts management ====================
  async function renderPosts() {
    mainContent.innerHTML = `
      <div class="page-header">
        <div><h2>Quản lý bài viết</h2><p>Danh sách bài đã đăng và bài đã lên lịch</p></div>
        <button class="btn btn-primary" data-action="go-create">✏️ Tạo bài viết mới</button>
      </div>
      <div class="section-title">⏰ Đã lên lịch</div>
      <div class="post-list" id="scheduled-list"><div class="loading-state">Đang tải...</div></div>
      <div class="section-title">📋 Đã đăng</div>
      <div class="post-list" id="published-list"><div class="loading-state">Đang tải...</div></div>
    `;
    mainContent.querySelector('[data-action="go-create"]').addEventListener('click', () => location.hash = 'create');

    try {
      const scheduled = await api('/api/posts/scheduled');
      const list = scheduled.data || [];
      const el = document.getElementById('scheduled-list');
      el.innerHTML = list.length ? list.map(scheduledCardHtml).join('') : emptyStateHtml('⏰', 'Không có bài viết nào đang chờ lên lịch');
      wirePostActions(el);
    } catch (err) {
      document.getElementById('scheduled-list').innerHTML = errorStateHtml(err.message);
    }

    try {
      const posts = await api('/api/posts?limit=25');
      const list = posts.data || [];
      const el = document.getElementById('published-list');
      el.innerHTML = list.length ? list.map(postCardHtml).join('') : emptyStateHtml('📭', 'Chưa có bài viết nào');
      wirePostActions(el);
    } catch (err) {
      document.getElementById('published-list').innerHTML = errorStateHtml(err.message);
    }
  }

  // ==================== Analytics ====================
  const METRIC_LABELS = {
    page_impressions: '👁️ Lượt hiển thị trang',
    page_engaged_users: '🤝 Người dùng tương tác',
    page_fans: '❤️ Người theo dõi',
    page_views_total: '📄 Lượt xem trang'
  };

  async function renderAnalytics() {
    mainContent.innerHTML = `
      <div class="page-header">
        <div><h2>Thống kê</h2><p>Số liệu tương tác của Fanpage theo thời gian</p></div>
      </div>
      <div class="metric-period" id="metric-period">
        <button data-period="day" class="active">Theo ngày</button>
        <button data-period="week">Theo tuần</button>
        <button data-period="days_28">28 ngày</button>
      </div>
      <div id="metrics-container"><div class="loading-state">Đang tải...</div></div>
    `;
    document.querySelectorAll('#metric-period button').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#metric-period button').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.metricPeriod = btn.dataset.period;
        loadMetrics();
      });
    });
    await loadMetrics();
  }

  async function loadMetrics() {
    const container = document.getElementById('metrics-container');
    container.innerHTML = `<div class="loading-state">Đang tải...</div>`;
    try {
      const data = await api(`/api/insights?period=${state.metricPeriod}`);
      const metrics = data.data || [];
      if (!metrics.length) {
        container.innerHTML = emptyStateHtml('📊', 'Chưa có dữ liệu thống kê');
        return;
      }
      container.innerHTML = `<div class="grid grid-2">${metrics.map(metricTileHtml).join('')}</div>`;
    } catch (err) {
      container.innerHTML = errorStateHtml(err.message);
    }
  }

  function metricTileHtml(metric) {
    const values = metric.values || [];
    const last = values[values.length - 1]?.value;
    const lastVal = typeof last === 'object' ? Object.values(last || {}).reduce((a, b) => a + b, 0) : (last || 0);
    const max = Math.max(1, ...values.map((v) => (typeof v.value === 'object' ? Object.values(v.value).reduce((a, b) => a + b, 0) : v.value || 0)));
    const bars = values.map((v) => {
      const val = typeof v.value === 'object' ? Object.values(v.value).reduce((a, b) => a + b, 0) : (v.value || 0);
      const pct = Math.max(4, Math.round((val / max) * 100));
      return `<div class="bar" style="height:${pct}%" title="${formatDate(v.end_time)}: ${formatNumber(val)}"></div>`;
    }).join('');
    return `
      <div class="stat-tile">
        <div class="stat-label">${METRIC_LABELS[metric.name] || metric.title || metric.name}</div>
        <div class="stat-value">${formatNumber(lastVal)}</div>
        <div class="metric-trend">${bars}</div>
      </div>
    `;
  }

  // ==================== Settings ====================
  async function renderSettings() {
    mainContent.innerHTML = `<div class="loading-state">Đang tải...</div>`;
    await loadSettingsContent();
  }

  async function loadSettingsContent() {
    let page = {};
    let token = { valid: false };
    let pageError = null, tokenError = null;
    try { page = await api('/api/page-info'); } catch (err) { pageError = err.message; }
    try { token = await api('/api/verify-token'); } catch (err) { tokenError = err.message; }

    mainContent.innerHTML = `
      <div class="page-header">
        <div><h2>Kết nối API</h2><p>Trạng thái kết nối với Facebook Graph API</p></div>
        <button class="btn btn-outline" id="recheck-btn">🔄 Kiểm tra lại</button>
      </div>
      <div class="grid grid-2" style="align-items:start">
        <div class="card"><div class="card-body">
          <div class="section-title" style="margin-top:0">📄 Thông tin Fanpage</div>
          ${pageError ? errorStateHtml(pageError) : `
            <div class="info-row"><span>Tên Fanpage</span><span>${escapeHtml(page.name || '—')}</span></div>
            <div class="info-row"><span>ID</span><span>${escapeHtml(page.id || '—')}</span></div>
            <div class="info-row"><span>Danh mục</span><span>${escapeHtml(page.category || '—')}</span></div>
            <div class="info-row"><span>Người theo dõi</span><span>${formatNumber(page.followers_count)}</span></div>
            <div class="info-row"><span>Lượt thích</span><span>${formatNumber(page.fan_count)}</span></div>
            ${page.link ? `<div class="info-row"><span>Link</span><span><a href="${page.link}" target="_blank" rel="noopener">Xem trang →</a></span></div>` : ''}
          `}
        </div></div>
        <div class="card"><div class="card-body">
          <div class="section-title" style="margin-top:0">🔑 Trạng thái Access Token</div>
          ${tokenError ? errorStateHtml(tokenError) : `
            <div class="info-row"><span>Hợp lệ</span><span>${token.valid ? '✅ Có' : '❌ Không'}</span></div>
            <div class="info-row"><span>Hết hạn</span><span>${escapeHtml(token.expiresAt || 'N/A')}</span></div>
            <div class="info-row"><span>Quyền (scopes)</span><span class="scope-tags">${(token.scopes || []).map((s) => `<span class="scope-tag">${escapeHtml(s)}</span>`).join('') || '—'}</span></div>
          `}
        </div></div>
      </div>
      <div class="section-title">⚙️ Hướng dẫn cấu hình</div>
      <div class="setup-guide">
        Ứng dụng đọc cấu hình từ file <code>.env</code> ở thư mục gốc dự án (dựa theo mẫu <code>.env.example</code>). Nếu chưa kết nối được, hãy kiểm tra:
        <ol>
          <li>Đã tạo file <code>.env</code> và điền đủ <code>PAGE_ID</code>, <code>PAGE_ACCESS_TOKEN</code>, <code>APP_ID</code>, <code>APP_SECRET</code>, <code>GRAPH_API_VERSION</code>.</li>
          <li>Access Token còn hạn sử dụng và có đủ quyền (scope) cần thiết (<code>pages_manage_posts</code>, <code>pages_read_engagement</code>, ...).</li>
          <li>Đã khởi động lại server (<code>npm start</code>) sau khi chỉnh sửa <code>.env</code>.</li>
        </ol>
      </div>
    `;
    document.getElementById('recheck-btn').addEventListener('click', async () => {
      await refreshStatus();
      await loadSettingsContent();
      showToast('Đã kiểm tra lại kết nối');
    });
  }

  // ==================== Init ====================
  document.addEventListener('DOMContentLoaded', () => {
    initClock();
    refreshStatus();
    setInterval(refreshStatus, 60000);
    navigate(location.hash.replace('#', '') || 'dashboard');
  });
})();
