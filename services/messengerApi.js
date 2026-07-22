const fetch = require('node-fetch');

// Messenger Send API — gửi tin nhắn/trạng thái "đang gõ" cho khách qua Fanpage.
class MessengerApiService {
  constructor() {
    this.baseUrl = `https://graph.facebook.com/${process.env.GRAPH_API_VERSION}`;
    this.accessToken = process.env.PAGE_ACCESS_TOKEN;
  }

  async _send(payload) {
    const url = `${this.baseUrl}/me/messages?access_token=${this.accessToken}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(`Messenger Send API error: ${data.error.message} (Code: ${data.error.code})`);
    }
    return data;
  }

  // Messenger giới hạn ~2000 ký tự/tin nhắn — cắt theo câu để không vỡ ý.
  _splitLong(text, maxLen = 1800) {
    if (text.length <= maxLen) return [text];
    const chunks = [];
    let rest = text;
    while (rest.length > maxLen) {
      let cut = rest.lastIndexOf('\n', maxLen);
      if (cut < maxLen * 0.5) cut = rest.lastIndexOf('. ', maxLen);
      if (cut < maxLen * 0.5) cut = maxLen;
      chunks.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) chunks.push(rest);
    return chunks;
  }

  async sendText(psid, text) {
    const chunks = this._splitLong(String(text || '').trim());
    for (const chunk of chunks) {
      if (!chunk) continue;
      await this._send({
        recipient: { id: psid },
        message: { text: chunk },
        messaging_type: 'RESPONSE'
      });
    }
  }

  async sendTypingOn(psid) {
    try {
      await this._send({ recipient: { id: psid }, sender_action: 'typing_on' });
    } catch (_) {
      // Không quan trọng nếu lỗi — chỉ là hiệu ứng UX, bỏ qua.
    }
  }
}

module.exports = new MessengerApiService();
