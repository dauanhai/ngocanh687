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

  function formatVnd(n) {
    if (!n) return 'Miễn phí';
    return Number(n).toLocaleString('vi-VN') + 'đ';
  }

  let sb, bankInfo, currentUser = null;

  async function init() {
    const ready = await window.sbReady;
    sb = ready.client;
    bankInfo = ready.bank;

    wireAuthTabs();
    wireAuthForms();
    document.getElementById('logout-btn').addEventListener('click', doLogout);
    document.getElementById('order-modal-close').addEventListener('click', () => {
      document.getElementById('order-modal').style.display = 'none';
    });

    const { data } = await sb.auth.getSession();
    currentUser = data.session ? data.session.user : null;
    applyAuthState();

    sb.auth.onAuthStateChange((_event, session) => {
      currentUser = session ? session.user : null;
      applyAuthState();
    });

    await loadCourses();
  }

  function applyAuthState() {
    const loggedIn = !!currentUser;
    document.getElementById('auth-card').style.display = loggedIn ? 'none' : '';
    document.getElementById('welcome-card').style.display = loggedIn ? '' : 'none';
    document.getElementById('dashboard-link').style.display = loggedIn ? '' : 'none';
    document.getElementById('logout-btn').style.display = loggedIn ? '' : 'none';
    if (loggedIn) document.getElementById('welcome-email').textContent = currentUser.email;
  }

  function wireAuthTabs() {
    document.querySelectorAll('.tabs button').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tabs button').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
        document.getElementById(btn.dataset.tab + '-form').classList.add('active');
      });
    });
  }

  function wireAuthForms() {
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const { error } = await sb.auth.signInWithPassword({
        email: fd.get('email'), password: fd.get('password')
      });
      if (error) return showToast('Đăng nhập thất bại: ' + error.message, 'error');
      showToast('Đăng nhập thành công!');
      e.target.reset();
    });

    document.getElementById('register-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const { error } = await sb.auth.signUp({
        email: fd.get('email'),
        password: fd.get('password'),
        options: { data: { full_name: fd.get('fullName') } }
      });
      if (error) return showToast('Đăng ký thất bại: ' + error.message, 'error');
      showToast('Tạo tài khoản thành công!');
      e.target.reset();
    });
  }

  async function doLogout() {
    await sb.auth.signOut();
    showToast('Đã đăng xuất');
  }

  async function loadCourses() {
    const grid = document.getElementById('course-grid');
    const { data: courses, error } = await sb
      .from('courses')
      .select('id, title, description, price, is_bundle')
      .order('sort_order', { ascending: true });

    if (error) {
      grid.innerHTML = '<div class="empty-state">Không tải được danh sách khoá học: ' + error.message + '</div>';
      return;
    }
    if (!courses || courses.length === 0) {
      grid.innerHTML = '<div class="empty-state">Chưa có khoá học nào. Thêm khoá học trong Supabase Table Editor (bảng "courses").</div>';
      return;
    }

    grid.innerHTML = courses.map((c) => `
      <div class="course-card">
        ${c.is_bundle ? '<span class="badge">Trọn bộ</span>' : ''}
        <h3>${escapeHtml(c.title)}</h3>
        <p>${escapeHtml(c.description || '')}</p>
        <div class="course-price">${formatVnd(c.price)}</div>
        <button class="btn btn-primary btn-block" data-buy="${c.id}" data-title="${escapeHtml(c.title)}" data-price="${c.price}">Mua khoá học</button>
      </div>
    `).join('');

    grid.querySelectorAll('[data-buy]').forEach((btn) => {
      btn.addEventListener('click', () => buyCourse(btn.dataset.buy, btn.dataset.title, Number(btn.dataset.price)));
    });
  }

  async function buyCourse(courseId, title, price) {
    if (!currentUser) {
      showToast('Vui lòng đăng nhập hoặc đăng ký trước khi mua khoá học', 'error');
      document.getElementById('auth-card').scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const { data: order, error } = await sb
      .from('orders')
      .insert({ student_id: currentUser.id, course_id: courseId, amount: price })
      .select('transfer_code, amount')
      .single();
    if (error) return showToast('Không tạo được đơn hàng: ' + error.message, 'error');

    const note = document.getElementById('order-note');
    note.innerHTML = `
      <p><strong>Khoá học:</strong> ${escapeHtml(title)}</p>
      <p><strong>Số tiền:</strong> ${formatVnd(order.amount)}</p>
      <p><strong>Ngân hàng:</strong> ${escapeHtml(bankInfo.name || '(chưa cấu hình)')}</p>
      <p><strong>Số tài khoản:</strong> ${escapeHtml(bankInfo.accountNumber || '(chưa cấu hình)')}</p>
      <p><strong>Chủ tài khoản:</strong> ${escapeHtml(bankInfo.accountHolder || '(chưa cấu hình)')}</p>
      <p><strong>Nội dung chuyển khoản:</strong> ghi đúng mã <code>${order.transfer_code}</code></p>
      <p style="margin-top:10px; color:var(--text-faint)">Sau khi chuyển khoản, đợi admin xác nhận (thường trong vài giờ), rồi vào "Bài giảng của tôi" để học.</p>
    `;
    document.getElementById('order-modal').style.display = 'flex';
  }

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  document.addEventListener('DOMContentLoaded', init);
})();
