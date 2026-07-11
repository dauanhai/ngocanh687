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

  let sb;

  async function init() {
    const ready = await window.sbReady;
    sb = ready.client;

    const { data } = await sb.auth.getSession();
    if (!data.session) {
      window.location.href = '/hoc-vien/';
      return;
    }
    document.getElementById('welcome-line').textContent = 'Đăng nhập với ' + data.session.user.email;
    document.getElementById('logout-btn').addEventListener('click', async () => {
      await sb.auth.signOut();
      window.location.href = '/hoc-vien/';
    });

    await Promise.all([loadPendingOrders(data.session.user.id), loadEnrolledCourses(data.session.user.id)]);
  }

  async function loadPendingOrders(userId) {
    const { data: orders } = await sb
      .from('orders')
      .select('id, amount, transfer_code, status, courses(title)')
      .eq('student_id', userId)
      .eq('status', 'pending');

    const section = document.getElementById('pending-section');
    if (!orders || orders.length === 0) { section.innerHTML = ''; return; }

    section.innerHTML = `
      <div class="card" style="margin-bottom:28px">
        <h3 style="font-family:var(--font-display); font-size:16px; margin-bottom:12px">⏳ Đơn hàng đang chờ xác nhận</h3>
        ${orders.map((o) => `
          <div class="order-note" style="margin-bottom:10px">
            <strong>${escapeHtml(o.courses?.title || '')}</strong> — ${formatVnd(o.amount)}<br>
            Mã chuyển khoản: <code>${o.transfer_code}</code> — chờ admin xác nhận.
          </div>
        `).join('')}
      </div>
    `;
  }

  async function loadEnrolledCourses(userId) {
    const section = document.getElementById('courses-section');
    const { data: enrollments, error } = await sb
      .from('enrollments')
      .select('course_id, courses(id, title, description)')
      .eq('student_id', userId);

    if (error) {
      section.innerHTML = '<div class="empty-state">Lỗi tải dữ liệu: ' + error.message + '</div>';
      return;
    }
    if (!enrollments || enrollments.length === 0) {
      section.innerHTML = '<div class="empty-state">Bạn chưa mở khoá khoá học nào. <a href="/hoc-vien/" style="color:var(--gold)">Xem Kho Mật Mã →</a></div>';
      return;
    }

    section.innerHTML = enrollments.map((e) => `
      <div class="card" style="margin-bottom:20px">
        <h3 style="font-family:var(--font-display); font-size:19px; margin-bottom:14px">${escapeHtml(e.courses.title)}</h3>
        <div class="lesson-list" data-course="${e.course_id}"><div class="empty-state">Đang tải bài học...</div></div>
      </div>
    `).join('');

    await Promise.all(enrollments.map((e) => loadLessons(e.course_id)));
  }

  async function loadLessons(courseId) {
    const container = document.querySelector(`.lesson-list[data-course="${courseId}"]`);
    const { data: lessons, error } = await sb
      .from('lessons')
      .select('id, title, sort_order')
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true });

    if (error) { container.innerHTML = '<div class="empty-state">Lỗi tải bài học</div>'; return; }
    if (!lessons || lessons.length === 0) { container.innerHTML = '<div class="empty-state">Chưa có bài học nào.</div>'; return; }

    const { data: { user } } = await sb.auth.getUser();
    const { data: progress } = await sb
      .from('lesson_progress')
      .select('lesson_id')
      .eq('student_id', user.id)
      .in('lesson_id', lessons.map((l) => l.id));
    const doneSet = new Set((progress || []).map((p) => p.lesson_id));

    container.innerHTML = lessons.map((l, idx) => `
      <div class="lesson-row" data-lesson="${l.id}">
        <div class="lesson-row-head">
          <strong>Bài ${idx + 1}: ${escapeHtml(l.title)}</strong>
          <div style="display:flex; align-items:center; gap:14px">
            <label class="lesson-check">
              <input type="checkbox" class="progress-check" data-lesson="${l.id}" ${doneSet.has(l.id) ? 'checked' : ''}>
              Đã học xong
            </label>
            <button class="btn btn-outline btn-sm play-btn" data-lesson="${l.id}">▶ Xem bài học</button>
          </div>
        </div>
        <div class="lesson-content" style="display:none"></div>
      </div>
    `).join('');

    container.querySelectorAll('.play-btn').forEach((btn) => {
      btn.addEventListener('click', () => playLesson(btn.dataset.lesson));
    });
    container.querySelectorAll('.progress-check').forEach((input) => {
      input.addEventListener('change', () => toggleProgress(input.dataset.lesson, input.checked));
    });
  }

  async function playLesson(lessonId) {
    const row = document.querySelector(`.lesson-row[data-lesson="${lessonId}"]`);
    const contentBox = row.querySelector('.lesson-content');
    if (contentBox.style.display === 'block') { contentBox.style.display = 'none'; return; }

    const { data: content, error } = await sb
      .from('lesson_videos')
      .select('youtube_id, content_text')
      .eq('lesson_id', lessonId)
      .single();

    if (error || !content || (!content.youtube_id && !content.content_text)) {
      showToast('Bài học này chưa có nội dung, hoặc bạn chưa được mở khoá.', 'error');
      return;
    }

    let html = '';
    if (content.youtube_id) {
      html += `<div class="lesson-video"><iframe src="https://www.youtube.com/embed/${content.youtube_id}" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>`;
    }
    if (content.content_text) {
      html += `<div class="lesson-text">${marked.parse(content.content_text)}</div>`;
    }
    contentBox.innerHTML = html;
    contentBox.style.display = 'block';
  }

  async function toggleProgress(lessonId, completed) {
    const { data: { user } } = await sb.auth.getUser();
    if (completed) {
      const { error } = await sb.from('lesson_progress').upsert(
        { student_id: user.id, lesson_id: lessonId, completed: true, completed_at: new Date().toISOString() },
        { onConflict: 'student_id,lesson_id' }
      );
      if (error) showToast('Không lưu được tiến độ: ' + error.message, 'error');
    } else {
      const { error } = await sb.from('lesson_progress').delete().eq('student_id', user.id).eq('lesson_id', lessonId);
      if (error) showToast('Không lưu được tiến độ: ' + error.message, 'error');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
