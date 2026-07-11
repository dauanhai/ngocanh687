// Lấy config public (URL + anon key) từ server rồi khởi tạo Supabase client.
// window.sbReady là Promise mà các script khác await để chắc chắn client đã sẵn sàng.
window.sbReady = (async function () {
  const res = await fetch('/api/lms/public-config');
  const config = await res.json();
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    console.error('Thiếu SUPABASE_URL/SUPABASE_ANON_KEY trong .env của server');
  }
  const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  return { client, bank: config.bank };
})();
