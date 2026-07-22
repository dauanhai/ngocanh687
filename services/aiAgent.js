const Anthropic = require('@anthropic-ai/sdk');
const { getSupabaseAdmin } = require('./supabaseAdmin');

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

let client = null;
function getClient() {
  if (client) return client;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Chưa cấu hình ANTHROPIC_API_KEY trong .env');
  }
  client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

// ==================== Văn phong & quy tắc thương hiệu ====================
// Chỉnh trực tiếp đoạn này cho đúng "chất" của bạn — đây là toàn bộ "tính cách"
// của AI Agent, không có nơi cấu hình nào khác.
const BRAND_VOICE = `
Bạn là trợ lý nhắn tin của Fanpage "Đậu Ánh - Tự Do Thịnh Vượng", thay chủ trang trả lời khách trên Messenger.
Giọng văn: chân thành, gần gũi, xưng "mình", gọi khách là "anh/chị"; không dùng ngôn ngữ quảng cáo sáo rỗng, không thề thốt, không viết hoa toàn bộ, không dùng nhiều emoji.
Không bao giờ cam kết những điều không chắc chắn: không hứa "chắc chắn thành công", không cam kết mức thu nhập/lợi nhuận cụ thể, không tự ý giảm giá nếu không được liệt kê trong danh sách bên dưới.
Chỉ trả lời dựa trên danh sách khoá học/ebook được cung cấp bên dưới — không bịa thêm nội dung hay mức giá.
Khi khách tỏ ý muốn mua hoặc đăng ký: hỏi xin tên và số điện thoại để lên đơn, sau đó BẮT BUỘC gọi tool "capture_lead" để ghi nhận (kể cả khi khách chỉ cho một phần thông tin).
Khi gặp: khiếu nại, xin hoàn tiền, mặc cả giá ngoài phạm vi, câu hỏi bạn không chắc chắn, hoặc khách chủ động xin gặp người thật — gọi tool "flag_human" VÀ trả lời khách rằng sẽ có người liên hệ lại sớm, không tự ý hứa hẹn thay chủ trang.
Trả lời ngắn gọn (2-4 câu), đúng kiểu nhắn tin Messenger đời thường, không dùng markdown/bullet.
`.trim();

const TOOLS = [
  {
    name: 'capture_lead',
    description: 'Ghi nhận một khách hàng tiềm năng đã sẵn sàng mua hoặc để lại thông tin liên hệ.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Tên khách hàng, nếu khách đã cung cấp' },
        phone: { type: 'string', description: 'Số điện thoại khách cung cấp, nếu có' },
        product_interest: { type: 'string', description: 'Khoá học/sản phẩm khách quan tâm' },
        note: { type: 'string', description: 'Ghi chú thêm về nhu cầu/hoàn cảnh khách (nếu có)' }
      },
      required: ['product_interest']
    }
  },
  {
    name: 'flag_human',
    description: 'Đánh dấu hội thoại cần chủ trang xử lý trực tiếp. AI sẽ tạm ngừng tự trả lời hội thoại này cho tới khi chủ trang mở lại.',
    input_schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Lý do cần người thật xử lý' }
      },
      required: ['reason']
    }
  }
];

async function getCatalogText() {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('courses')
      .select('title, description, price')
      .order('sort_order', { ascending: true });
    if (!data || data.length === 0) return 'Chưa có dữ liệu khoá học nào trong hệ thống.';
    return data
      .map((c) => `- ${c.title}: ${c.description || ''} (Giá: ${c.price ? Number(c.price).toLocaleString('vi-VN') + 'đ' : 'Miễn phí'})`)
      .join('\n');
  } catch (_) {
    return 'Chưa có dữ liệu khoá học nào trong hệ thống.';
  }
}

// history: mảng [{ role: 'user'|'assistant', content: string }], cũ -> mới,
// phần tử cuối cùng phải là tin của khách vừa gửi.
async function generateReply(history) {
  const catalog = await getCatalogText();
  const system = `${BRAND_VOICE}\n\nDanh sách khoá học/ebook hiện có:\n${catalog}`;

  const messages = history
    .filter((m) => m.content && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content }));

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 500,
    system,
    tools: TOOLS,
    messages
  });

  let replyText = '';
  const toolCalls = [];
  for (const block of response.content) {
    if (block.type === 'text') replyText += block.text;
    if (block.type === 'tool_use') toolCalls.push({ name: block.name, input: block.input });
  }
  if (!replyText.trim()) {
    replyText = 'Dạ mình đã ghi nhận, sẽ có người liên hệ lại anh/chị sớm ạ!';
  }
  return { replyText: replyText.trim(), toolCalls };
}

module.exports = { generateReply };
