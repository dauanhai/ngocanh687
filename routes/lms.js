const express = require('express');
const { getSupabaseAdmin } = require('../services/supabaseAdmin');

const router = express.Router();

// Config an toàn để frontend khởi tạo Supabase JS SDK (anon key được thiết kế
// để lộ ra công khai — quyền thật sự do Row Level Security ở Supabase quyết định).
router.get('/public-config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    bank: {
      name: process.env.BANK_NAME || '',
      accountNumber: process.env.BANK_ACCOUNT_NUMBER || '',
      accountHolder: process.env.BANK_ACCOUNT_HOLDER || ''
    }
  });
});

// Chặn toàn bộ route /admin/* phía dưới nếu thiếu/sai passcode
function requireAdminPasscode(req, res, next) {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) {
    return res.status(500).json({ error: 'Server chưa cấu hình ADMIN_PASSCODE' });
  }
  if (req.get('x-admin-passcode') !== expected) {
    return res.status(401).json({ error: 'Sai mật khẩu quản trị' });
  }
  next();
}

router.use('/admin', requireAdminPasscode);

// Danh sách đơn hàng theo trạng thái (mặc định: pending)
router.get('/admin/orders', async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const supabase = getSupabaseAdmin();

    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, student_id, course_id, amount, transfer_code, status, created_at, courses(title)')
      .eq('status', status)
      .order('created_at', { ascending: true });
    if (error) throw error;

    // Gắn thêm email học viên (auth.users không lộ qua PostgREST nên phải gọi Admin API riêng)
    const enriched = await Promise.all((orders || []).map(async (order) => {
      let email = null;
      try {
        const { data } = await supabase.auth.admin.getUserById(order.student_id);
        email = data?.user?.email || null;
      } catch (_) { /* bỏ qua, vẫn trả về đơn hàng dù không lấy được email */ }
      return {
        id: order.id,
        studentEmail: email,
        courseTitle: order.courses?.title || '(không rõ khoá học)',
        amount: order.amount,
        transferCode: order.transfer_code,
        status: order.status,
        createdAt: order.created_at
      };
    }));

    res.json({ data: enriched });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Xác nhận đã nhận tiền -> mở khoá khoá học cho học viên
router.post('/admin/orders/:id/confirm', async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('id, student_id, course_id, status')
      .eq('id', req.params.id)
      .single();
    if (findError || !order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    if (order.status !== 'pending') {
      return res.status(400).json({ error: `Đơn hàng đã ở trạng thái "${order.status}"` });
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', order.id);
    if (updateError) throw updateError;

    const { error: enrollError } = await supabase
      .from('enrollments')
      .upsert(
        { student_id: order.student_id, course_id: order.course_id, order_id: order.id },
        { onConflict: 'student_id,course_id' }
      );
    if (enrollError) throw enrollError;

    res.json({ success: true, message: 'Đã xác nhận và mở khoá khoá học cho học viên!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Từ chối đơn hàng (chuyển sai nội dung/số tiền...)
router.post('/admin/orders/:id/reject', async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'rejected' })
      .eq('id', req.params.id)
      .eq('status', 'pending')
      .select()
      .single();
    if (error || !data) return res.status(404).json({ error: 'Không tìm thấy đơn hàng đang chờ xử lý' });
    res.json({ success: true, message: 'Đã từ chối đơn hàng.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
