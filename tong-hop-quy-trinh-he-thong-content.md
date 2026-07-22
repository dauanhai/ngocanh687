# Hệ thống sản xuất Content cho Trang bán hàng — TPCN
### Tài liệu tổng hợp toàn bộ quy trình

---

## 0. Mục tiêu hệ thống

Xây dựng một hệ thống khép kín: **quét content/landing page đối thủ đang "win" → nghiên cứu → viết content → dựng trang bán hàng → phân phối → đo lường**, dành riêng cho sản phẩm thực phẩm chức năng (TPCN) tự bán, không qua affiliate.

Hệ thống gồm 2 lớp:
- **Lớp kỹ năng (skills):** bộ 52 kỹ năng từ `affiliate-skills`, cài vào Claude Code/Cursor.
- **Lớp dữ liệu (data):** hai nguồn dữ liệu thời gian thực — `hidrix-tools` (MXH: TikTok, X, YouTube, Reddit) và `Windsor.ai` (Facebook/Meta Ads, đã kết nối qua Claude Connectors).

```
Research (quét content/đối thủ)
      │  trending-content-scout · competitor-spy · traffic-analyzer
      ▼
Research Brief (gom số liệu thật)
      │  content-research-brief
      ▼
Content (viết bài/kịch bản)
      │  viral-post-writer · tiktok-script-writer
      ▼
Offer & Landing Page (dựng trang bán hàng)
      │  grand-slam-offer → bonus-stack-builder → guarantee-generator → landing-page-creator
      ▼
Distribution (phân phối)
      │  bio-link-deployer · social-media-scheduler
      ▼
Analytics (đo lường, quay lại bước 1 để tối ưu)
      │  conversion-tracker · ab-test-generator
      └──────────────────────────────────────────┘
```

---

## 1. Cài đặt bộ kỹ năng `affiliate-skills`

Chạy trên máy có Claude Code/Cursor (không chạy được trong chat này vì sandbox không có mạng ra ngoài):

```bash
npx skills add Affitor/affiliate-skills
```

Hoặc cài thủ công:
```bash
git clone https://github.com/Affitor/affiliate-skills.git ~/.claude/skills/affiliate-skills
cd ~/.claude/skills/affiliate-skills && ./setup
```

**Bỏ qua** kỹ năng `affiliate-program-search` — chỉ dùng cho affiliate marketer quảng bá sản phẩm người khác, không áp dụng cho sản phẩm tự bán.

Các kỹ năng dùng chính, theo 6 giai đoạn ở trên: xem chi tiết trong `CLAUDE.md` ở mục 4.

---

## 2. Cài đặt `hidrix-tools` (MCP — dữ liệu MXH thời gian thực)

```bash
git clone https://github.com/sonpiaz/hidrix-tools.git ~/.hidrix-tools
cd ~/.hidrix-tools
bun install
cp .env.example .env
```

4 tool miễn phí, không cần API key: `reddit_thread_reader`, `reddit_subreddit_top`, `content_scorer`, `content_analyzer`, `facebook_scraper` (quét cả Meta Ad Library). Các tool khác (X, YouTube, SimilarWeb) cần điền key tương ứng vào `.env` — có thể bỏ qua lúc đầu.

Kết nối vào Claude Code:
```bash
claude mcp add hidrix-tools -- bun run ~/.hidrix-tools/src/index.ts
```

Khởi động lại Claude Code, gõ `/mcp` để xác nhận đã kết nối.

---

## 3. Kết nối Windsor.ai (dữ liệu Facebook/Meta Ads)

Thực hiện ngay trong claude.ai, không cần cài gì trên máy:

1. **Settings → Connectors.**
2. Tìm **Windsor.ai** trong danh sách → bấm **Connect**.
3. Trên trang windsor.ai bật lên: chọn nguồn dữ liệu **Facebook Ads** → bấm **"Grant Facebook Ads Access"** → đăng nhập Facebook, xác nhận quyền.
4. Ở bước **"Select Facebook Accounts"**: tick chọn tài khoản Ads cần theo dõi → **Next**.
5. Ở bước **"Preview and Destination"**: bấm **Finish** (không cần chờ có dữ liệu preview — mọi field/account đều dùng được khi Claude truy vấn, bất kể có tick trong bảng preview hay không).
6. Quay lại đoạn chat Claude: bấm nút **"+"** góc dưới trái khung chat → **Connectors** → bật (toggle) **Windsor.ai** cho cuộc trò chuyện.

> Nếu gặp lỗi *"tool calls via the Claude connector directory đang fail"*: đây là sự cố tạm thời từ phía Claude, không phải do bạn làm sai. Cách vượt qua: dùng file `facebook-ads-dashboard.html` ở mục 5 — nó gọi thẳng Anthropic API kèm Windsor.ai, không phụ thuộc vào connector directory trong chat.

**Lưu ý bảo mật quan trọng:** không bao giờ dán access token hoặc App Secret của Facebook trực tiếp vào bất kỳ khung chat AI nào (kể cả Claude). Luôn dùng luồng OAuth (bấm nút Connect/Grant Access) như trên. Nếu đã lỡ dán, vào Meta for Developers → App → Settings → Basic → **Reset App Secret**, và revoke token cũ trong Graph API Explorer ngay.

---

## 4. Cấu hình dự án — `CLAUDE.md` và `.mcp.json`

Hai file này copy vào **thư mục gốc** dự án Claude Code của bạn:

- **`CLAUDE.md`** — bối cảnh thương hiệu (tên, khách hàng mục tiêu, tông giọng, đối thủ cần theo dõi), danh sách kỹ năng ưu tiên theo đúng thứ tự quy trình, và các quy tắc bắt buộc (luôn lấy số liệu thật trước khi khẳng định content "đang viral"; tuân thủ quy định quảng cáo TPCN của Bộ Y tế — không dùng từ "điều trị", "chữa khỏi").
- **`.mcp.json`** — cấu hình kết nối `hidrix-tools` tự động mỗi khi mở project.

*(Đã gửi ở tin nhắn trước — nếu cần bản mới nhất, nói mình gửi lại.)*

**Việc bạn cần làm:** điền các mục `[ĐIỀN TÊN]` trong `CLAUDE.md` (tên thương hiệu, sản phẩm, khách hàng mục tiêu, tông giọng, đối thủ) — đây là phần quyết định content tạo ra có đúng "chất" thương hiệu hay không.

---

## 5. Dashboard Facebook Ads (artifact gọi trực tiếp Windsor.ai)

File `facebook-ads-dashboard.html` — mở file này (hoặc dùng artifact đã tạo trong chat), bấm **"Lấy dữ liệu mới nhất"** để lấy chi tiêu, clicks, impressions Facebook Ads 28 ngày qua, gộp theo chiến dịch. Gọi thẳng Anthropic API + Windsor.ai, không phụ thuộc connector directory của chat.

---

## 6. Quy trình vận hành đề xuất (hàng tuần)

| Ngày | Việc làm | Kỹ năng/công cụ |
|---|---|---|
| Thứ 2 | Quét content + landing page đối thủ TPCN đang "win" | `trending-content-scout`, `competitor-spy`, `hidrix-tools` |
| Thứ 3 | Gom số liệu/nguồn thật về công dụng sản phẩm | `content-research-brief` |
| Thứ 4 | Viết 3-5 bài/kịch bản content dựa trên dữ liệu thật | `viral-post-writer`, `tiktok-script-writer` |
| Thứ 5 | Tối ưu offer + landing page (nếu cần trang mới) | `grand-slam-offer`, `landing-page-creator` |
| Thứ 6 | Lên lịch phân phối tuần sau | `social-media-scheduler`, `bio-link-deployer` |
| Cuối tuần | Xem báo cáo chi tiêu/chuyển đổi, so sánh A/B | `conversion-tracker`, `ab-test-generator`, Dashboard Windsor.ai |

---

## 7. Tài liệu tham khảo

- Bộ kỹ năng: https://github.com/Affitor/affiliate-skills
- MCP dữ liệu MXH thời gian thực: https://github.com/sonpiaz/hidrix-tools
- Windsor.ai (kết nối Meta/Facebook Ads qua Claude Connectors)
- Hướng dẫn chính thức Claude Custom Connectors: support.claude.com → "Get started with custom connectors using remote MCP"
