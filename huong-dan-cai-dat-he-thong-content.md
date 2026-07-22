# Hướng dẫn kết nối "affiliate-skills" + "hidrix-tools" thành hệ thống sản xuất content cho trang bán hàng (ngành TPCN)

> Lưu ý quan trọng trước khi bắt đầu: mình (Claude trong đoạn chat này) đang chạy trong một sandbox **không có kết nối mạng ra ngoài**, nên mình không thể tự `git clone`, `npx`, hay chạy các lệnh cài đặt này giúp bạn. Bạn cần chạy các lệnh dưới đây **trên máy tính của chính bạn** (nơi có Claude Code hoặc Cursor cài sẵn). Mình đã soạn sẵn từng bước để bạn copy-paste là chạy được.

---

## 0. Chuẩn bị

Cần có trên máy bạn:
- **Node.js** (>= 18) — để chạy `npx`
- **Git**
- **Claude Code** (khuyên dùng) hoặc **Cursor** — cài theo hướng dẫn tại claude.com/claude-code
- (Tuỳ chọn, để lấy dữ liệu mạng xã hội thời gian thực) **Bun** — cài tại bun.sh

---

## 1. Cài bộ 52 skills (affiliate-skills)

Mở terminal, chạy:

```bash
# Cách khuyên dùng — tự động cho Claude Code
npx skills add Affitor/affiliate-skills
```

Hoặc cài thủ công:

```bash
git clone https://github.com/Affitor/affiliate-skills.git ~/.claude/skills/affiliate-skills
cd ~/.claude/skills/affiliate-skills && ./setup
```

Sau khi cài, mở Claude Code trong project của bạn, gõ:
```
Hãy thêm affiliate-skills vào CLAUDE.md của project này
```
→ Claude Code sẽ tự ghi nhận bộ kỹ năng vào project.

**Ghi chú riêng cho bạn:** bộ skill này được thiết kế cho affiliate marketer (quảng bá sản phẩm người khác). Vì bạn bán **thực phẩm chức năng của chính mình**, bạn có thể bỏ qua kỹ năng `affiliate-program-search` (tìm chương trình affiliate) — không cần dùng. Các kỹ năng bạn sẽ dùng nhiều nhất:

| Kỹ năng | Dùng để làm gì cho bạn |
|---|---|
| `trending-content-scout` | Quét content đang "win" về chủ đề sức khỏe/TPCN trên TikTok/YouTube/X/Reddit |
| `competitor-spy` | Phân tích trang bán hàng + quảng cáo của đối thủ cùng ngành |
| `traffic-analyzer` | Đánh giá sức khỏe website đối thủ (traffic, nguồn traffic) |
| `content-research-brief` | Gom số liệu/nguồn thật trước khi viết bài (tránh viết bừa) |
| `viral-post-writer`, `tiktok-script-writer` | Viết bài/kịch bản dựa trên dữ liệu vừa quét |
| `landing-page-creator`, `grand-slam-offer`, `bonus-stack-builder`, `guarantee-generator` | Dựng trang bán hàng (HTML/CSS thuần) theo khung AIDA + offer thuyết phục |
| `ab-test-generator` | Tạo biến thể tiêu đề/CTA để test A/B |
| `funnel-planner` | Lên lộ trình 4-6 tuần từ nghiên cứu → content → landing page → tối ưu |

---

## 2. Cài hidrix-tools (MCP server) — để có dữ liệu mạng xã hội **thời gian thực**

Không có bước này, `trending-content-scout` và `competitor-spy` chỉ dựa vào kiến thức chung của AI, không có số liệu engagement thật. Có bước này, các skill sẽ tự gọi API thật để lấy view/like/share.

```bash
git clone https://github.com/sonpiaz/hidrix-tools.git ~/.hidrix-tools
cd ~/.hidrix-tools
bun install
cp .env.example .env
```

Mở file `.env` vừa tạo, điền API key cho các nguồn bạn cần (không bắt buộc phải điền hết — 4 tool sau **miễn phí, không cần key**: `reddit_thread_reader`, `reddit_subreddit_top`, `content_scorer`, `content_analyzer`):

| Biến trong `.env` | Dùng cho tool nào | Bắt buộc? |
|---|---|---|
| `TWITTER_API_KEY` (hoặc tương đương) | `x_search`, `x_thread_reader`, `x_user_posts` | Tuỳ chọn |
| `YOUTUBE_API_KEY` | `youtube_search` | Tuỳ chọn |
| `SIMILARWEB_API_KEY` | `similarweb_traffic` (đánh giá traffic đối thủ) | Tuỳ chọn |
| Không cần key | Reddit, content_scorer, content_analyzer | Miễn phí sẵn |

> Gợi ý: nếu ngân sách hạn chế, bạn có thể **bỏ qua các key trả phí lúc đầu** — vẫn dùng được `competitor-spy` qua Reddit + `content_analyzer`, và `facebook_scraper` (quét cả Meta Ad Library — miễn phí) để soi quảng cáo TPCN của đối thủ.

### Kết nối MCP server vào Claude Code

```bash
claude mcp add hidrix-tools -- bun run ~/.hidrix-tools/src/index.ts
```

(Với Cursor/Windsurf: thêm entry tương ứng vào file cấu hình MCP của app, trỏ tới cùng lệnh chạy trên.)

Khởi động lại Claude Code. Gõ `/mcp` để kiểm tra `hidrix-tools` đã hiện trong danh sách server chưa.

---

## 3. Kiểm tra hệ thống đã chạy

Trong Claude Code, thử lệnh:

```
Dùng trending-content-scout để tìm content đang viral về "thực phẩm chức năng tăng đề kháng" trên TikTok và Reddit.
```

Nếu MCP kết nối đúng, AI sẽ gọi `tiktok_search` / `reddit_subreddit_top` thật và trả về số liệu engagement cụ thể, không chỉ đoán chung chung.

---

## 4. Quy trình gợi ý cho ngành TPCN (không cần affiliate)

```
Bước 1 — Research:      trending-content-scout + competitor-spy
                         (quét content & landing page đối thủ TPCN đang "win")
Bước 2 — Research Brief: content-research-brief
                         (gom số liệu khoa học/nguồn thật về công dụng sản phẩm)
Bước 3 — Content:        viral-post-writer / tiktok-script-writer
                         (viết bài dựa trên dữ liệu thật vừa quét)
Bước 4 — Offer + Landing: grand-slam-offer → landing-page-creator
                         (dựng trang bán hàng theo khung AIDA)
Bước 5 — Distribution:   bio-link-deployer, social-media-scheduler
Bước 6 — Analytics:      conversion-tracker, ab-test-generator
                         → quay lại Bước 1 với dữ liệu thật để tối ưu tiếp
```

---

## Tài liệu tham khảo gốc

- Repo skills: https://github.com/Affitor/affiliate-skills
- Repo MCP server (dữ liệu thời gian thực): https://github.com/sonpiaz/hidrix-tools
- Danh sách skill máy đọc được: `registry.json` trong repo
