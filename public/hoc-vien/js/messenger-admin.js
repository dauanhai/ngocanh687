(function () {
  'use strict';

  const toastContainer = document.getElementById('toast-container');
  function showToast(message, type) {
    const el = document.createElement('div');
    el.className = 'toast' + (type === 'error' ? ' error' : '');
    el.textContent = message;
    toastContainer.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleString('vi-VN');
  }

  let passcode = sessionStorage.getItem('lms_admin_passcode') || '';
  let currentLeadStatus = 'new';

  async function apiFetch(path, options) {
    const res = await fetch(path, {
      ...options,
      headers: { ...(options?.headers || {}), 'x-admin-passcode': passcode }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Lỗi ' + res.status);
    return data;
  }

  async function tryEnter() {
    passcode = document.getElementById('passcode-input').value.trim();
    if (!passcode) return;
    try {
      await apiFetch('/api/messenger/admin/leads?status=new');
      sessionStorage.setItem('lms_admin_passcode', passcode);
      document.getElementById('passcode-card').style.display = 'none';
      document.getElementById('admin-panel').style.display = '';
      await Promise.all([loadLeads(), loadConversations()]);
    } catch (err) {
      showToast('Sai mật khẩu hoặc lỗi server: ' + err.message, 'error');
    }
  }

  async function loadLeads() {
    const tbody = document.getElementById('leads-tbody');
    tbody.innerHTML = '<tr><td colspan="6">Đang tải...</td></tr>';
    try {
      const { data: leads } = await apiFetch('/api/messenger/admin/leads?status=' + currentLeadStatus);
      if (!leads || leads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">Không có lead nào.</td></tr>';
        return;
      }
      tbody.innerHTML = leads.map((l) => `
        <tr>
          <td>${escapeHtml(l.name || '(chưa rõ)')}</td>
          <td>${l.phone ? `<code>${escapeHtml(l.phone)}</code>` : '-'}</td>
          <td>${escapeHtml(l.product_interest || '-')}</td>
          <td>${escapeHtml(l.note || '-')}</td>
          <td>${formatDate(l.created_at)}</td>
          <td>
            ${l.status === 'new' ? `<button class="btn btn-outline btn-sm" data-lead="${l.id}" data-next="contacted">Đã liên hệ</button>` : ''}
            ${l.status === 'contacted' ? `<button class="btn btn-primary btn-sm" data-lead="${l.id}" data-next="closed">Đã chốt</button>` : ''}
            ${l.status === 'closed' ? `<span class="badge badge-success">Đã đóng</span>` : ''}
          </td>
        </tr>
      `).join('');

      tbody.querySelectorAll('[data-lead]').forEach((btn) => {
        btn.addEventListener('click', () => updateLeadStatus(btn.dataset.lead, btn.dataset.next));
      });
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="6">Lỗi: ' + escapeHtml(err.message) + '</td></tr>';
    }
  }

  async function updateLeadStatus(leadId, status) {
    try {
      await apiFetch(`/api/messenger/admin/leads/${leadId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      showToast('Đã cập nhật lead');
      await loadLeads();
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'error');
    }
  }

  async function loadConversations() {
    const tbody = document.getElementById('convos-tbody');
    tbody.innerHTML = '<tr><td colspan="4">Đang tải...</td></tr>';
    try {
      const { data: convos } = await apiFetch('/api/messenger/admin/conversations');
      if (!convos || convos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">Không có hội thoại nào cần xử lý tay.</td></tr>';
        return;
      }
      tbody.innerHTML = convos.map((c) => `
        <tr>
          <td><code>${escapeHtml(c.psid)}</code></td>
          <td><span class="badge badge-danger">${escapeHtml(c.status)}</span></td>
          <td>${formatDate(c.updated_at)}</td>
          <td><button class="btn btn-primary btn-sm" data-resume="${c.psid}">Mở lại AI</button></td>
        </tr>
      `).join('');

      tbody.querySelectorAll('[data-resume]').forEach((btn) => {
        btn.addEventListener('click', () => resumeConversation(btn.dataset.resume));
      });
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="4">Lỗi: ' + escapeHtml(err.message) + '</td></tr>';
    }
  }

  async function resumeConversation(psid) {
    try {
      await apiFetch(`/api/messenger/admin/conversations/${encodeURIComponent(psid)}/resume`, { method: 'POST' });
      showToast('Đã mở lại AI cho hội thoại này');
      await loadConversations();
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'error');
    }
  }

  document.getElementById('passcode-submit').addEventListener('click', tryEnter);
  document.getElementById('passcode-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') tryEnter(); });

  document.querySelectorAll('#lead-tabs button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#lead-tabs button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentLeadStatus = btn.dataset.status;
      loadLeads();
    });
  });

  if (passcode) {
    document.getElementById('passcode-input').value = passcode;
    tryEnter();
  }
})();
