const express = require('express');
const crypto = require('crypto');
const { getSupabaseAdmin } = require('../services/supabaseAdmin');
const messengerApi = require('../services/messengerApi');
const aiAgent = require('../services/aiAgent');

const router = express.Router();

// ==================== Webhook Messenger ====================

// Meta gọi GET một lần để xác thực webhook khi bạn bấm "Verify and Save".
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token && token === process.env.FB_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Xác thực request thực sự đến từ Meta bằng chữ ký HMAC-SHA256 ký với APP_SECRET.
function isValidSignature(req) {
  const signature = req.get('x-hub-signature-256');
  if (!signature || !req.rawBody || !process.env.APP_SECRET) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', process.env.APP_SECRET).update(req.rawBody).digest('hex');
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

router.post('/webhook', async (req, res) => {
  // Trả 200 ngay để Facebook không coi là lỗi và retry dồn dập; xử lý ở nền.
  res.sendStatus(200);

  if (!isValidSignature(req)) {
    console.warn('Messenger webhook: chữ ký không hợp lệ, đã bỏ qua request.');
    return;
  }

  const body = req.body;
  if (body.object !== 'page') return;

  for (const entry of body.entry || []) {
    for (const event of entry.messaging || []) {
      handleMessagingEvent(event).catch((err) => {
        console.error('Lỗi xử lý sự kiện Messenger:', err);
      });
    }
  }
});

async function handleMessagingEvent(event) {
  const psid = event.sender && event.sender.id;
  const messageText = event.message && event.message.text;
  if (!psid || !event.message || event.message.is_echo || !messageText) return;

  const supabase = getSupabaseAdmin();

  const { data: convo } = await supabase
    .from('messenger_conversations')
    .select('psid, paused')
    .eq('psid', psid)
    .maybeSingle();

  await supabase.from('messenger_messages').insert({ psid, role: 'user', content: messageText });

  if (convo && convo.paused) {
    // Chủ trang đang tự xử lý hội thoại này — AI không chen vào.
    return;
  }

  await supabase
    .from('messenger_conversations')
    .upsert({ psid, updated_at: new Date().toISOString() }, { onConflict: 'psid' });

  await messengerApi.sendTypingOn(psid);

  const { data: recentMessages } = await supabase
    .from('messenger_messages')
    .select('role, content')
    .eq('psid', psid)
    .order('created_at', { ascending: false })
    .limit(20);
  const history = (recentMessages || []).reverse();

  const { replyText, toolCalls } = await aiAgent.generateReply(history);

  await messengerApi.sendText(psid, replyText);
  await supabase.from('messenger_messages').insert({ psid, role: 'assistant', content: replyText });

  for (const call of toolCalls) {
    if (call.name === 'capture_lead') {
      await supabase.from('messenger_leads').insert({
        psid,
        name: call.input.name || null,
        phone: call.input.phone || null,
        product_interest: call.input.product_interest || null,
        note: call.input.note || null
      });
    }
    if (call.name === 'flag_human') {
      await supabase
        .from('messenger_conversations')
        .upsert(
          { psid, paused: true, status: 'needs_human', updated_at: new Date().toISOString() },
          { onConflict: 'psid' }
        );
    }
  }
}

// ==================== Admin (xem lead / tạm dừng-mở lại AI) ====================

function requireAdminPasscode(req, res, next) {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) return res.status(500).json({ error: 'Server chưa cấu hình ADMIN_PASSCODE' });
  if (req.get('x-admin-passcode') !== expected) return res.status(401).json({ error: 'Sai mật khẩu quản trị' });
  next();
}

router.use('/admin', requireAdminPasscode);

// Danh sách lead theo trạng thái (mặc định: new)
router.get('/admin/leads', async (req, res) => {
  try {
    const status = req.query.status || 'new';
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('messenger_leads')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Đổi trạng thái lead (new -> contacted -> closed)
router.post('/admin/leads/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['new', 'contacted', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('messenger_leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Hội thoại đang bị tạm dừng (cần chủ trang tự trả lời tay)
router.get('/admin/conversations', async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('messenger_conversations')
      .select('*')
      .eq('paused', true)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lịch sử chat của một khách (để xem trước khi trả lời tay)
router.get('/admin/conversations/:psid/messages', async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('messenger_messages')
      .select('role, content, created_at')
      .eq('psid', req.params.psid)
      .order('created_at', { ascending: true })
      .limit(100);
    if (error) throw error;
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mở lại AI cho hội thoại này (sau khi chủ trang đã tự xử lý xong)
router.post('/admin/conversations/:psid/resume', async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('messenger_conversations')
      .update({ paused: false, status: 'active', updated_at: new Date().toISOString() })
      .eq('psid', req.params.psid);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
