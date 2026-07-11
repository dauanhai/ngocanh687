const { createClient } = require('@supabase/supabase-js');

// Service-role client — bỏ qua Row Level Security. Chỉ dùng ở server,
// cho các thao tác đặc quyền (xác nhận đơn hàng, mở khoá khoá học).
// Không bao giờ gửi SUPABASE_SERVICE_ROLE_KEY xuống frontend.
let client = null;

function getSupabaseAdmin() {
  if (client) return client;
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Chưa cấu hình SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY trong .env');
  }
  client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  return client;
}

module.exports = { getSupabaseAdmin };
