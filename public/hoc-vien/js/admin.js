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

  function formatVnd(n) {
    if (!n) return 'Miễn phí';
    return Number(n).toLocaleString('vi-VN') + 'đ';
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleString('vi-VN');
  }

  let passcode = sessionStorage.getItem('lms_admin_passcode') || '';
  let currentStatus = 'pending';

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
      await apiFetch('/api/lms/admin/orders?status=pending');
      sessionStorage.setItem('lms_admin_passcode', passcode);
      document.getElementById('passcode-card').style.display = 'none';
      document.getElementById('admin-panel').style.display = '';
      await loadOrders();
    } catch (err) {
      showToast('Sai mật khẩu hoặc lỗi server: ' + err.message, 'error');
    }
  }

  async function loadOrders() {
    const tbody = document.getElementById('orders-tbody');
    tbody.innerHTML = '<tr><td colspan="6">Đang tải...</td></tr>';
    try {
      const { data: orders } = await apiFetch('/api/lms/admin/orders?status=' + currentStatus);
      if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">Không có đơn hàng nào.</td></tr>';
        return;
      }
      tbody.innerHTML = orders.map((o) => `
        <tr>
          <td>${escapeHtml(o.studentEmail || '(không rõ)')}</td>
          <td>${escapeHtml(o.courseTitle)}</td>
          <td>${formatVnd(o.amount)}</td>
          <td><code>${o.transferCode}</code></td>
          <td>${formatDate(o.createdAt)}</td>
          <td>
            ${o.status === 'pending' ? `
              <button class="btn btn-primary btn-sm" data-confirm="${o.id}">Xác nhận</button>
              <button class="btn btn-danger btn-sm" data-reject="${o.id}">Từ chối</button>
            ` : `<span class="badge ${o.status === 'confirmed' ? 'badge-success' : 'badge-danger'}">${o.status === 'confirmed' ? 'Đã xác nhận' : 'Đã từ chối'}</span>`}
          </td>
        </tr>
      `).join('');

      tbody.querySelectorAll('[data-confirm]').forEach((btn) => {
        btn.addEventListener('click', () => actOnOrder(btn.dataset.confirm, 'confirm'));
      });
      tbody.querySelectorAll('[data-reject]').forEach((btn) => {
        btn.addEventListener('click', () => actOnOrder(btn.dataset.reject, 'reject'));
      });
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="6">Lỗi: ' + escapeHtml(err.message) + '</td></tr>';
    }
  }

  async function actOnOrder(orderId, action) {
    try {
      const result = await apiFetch(`/api/lms/admin/orders/${orderId}/${action}`, { method: 'POST' });
      showToast(result.message || 'Thành công');
      await loadOrders();
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'error');
    }
  }

  document.getElementById('passcode-submit').addEventListener('click', tryEnter);
  document.getElementById('passcode-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') tryEnter(); });

  document.querySelectorAll('.tabs button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tabs button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentStatus = btn.dataset.status;
      loadOrders();
    });
  });

  // Nếu đã có passcode lưu từ trước trong phiên này, vào thẳng
  if (passcode) {
    document.getElementById('passcode-input').value = passcode;
    tryEnter();
  }
})();
