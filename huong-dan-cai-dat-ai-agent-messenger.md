# AI Agent tự trả lời & chốt khách trên Messenger — Hướng dẫn cài đặt

Đã code xong và gắn thẳng vào app hiện tại (`dau-anh-facebook-agent`, deploy trên Vercel). Phần này bạn cần tự làm trên tài khoản Facebook/Supabase/Vercel của mình — mình không có quyền truy cập các tài khoản đó.

## 0. Những gì đã được thêm vào code

| File | Vai trò |
|---|---|
| `db/migration-003-messenger-agent.sql` | 3 bảng Supabase mới: `messenger_messages` (lịch sử chat), `messenger_leads` (khách đã chốt), `messenger_conversations` (trạng thái tạm dừng AI) |
| `services/messengerApi.js` | Gửi tin nhắn/trạng thái "đang gõ" qua Messenger Send API |
| `services/aiAgent.js` | Gọi Claude API, chứa toàn bộ văn phong thương hiệu (`BRAND_VOICE`) + 2 tool: `capture_lead` (ghi nhận khách chốt), `flag_human` (nhường cho bạn xử lý tay) |
| `routes/messenger.js` | Webhook nhận tin Messenger + API quản trị (`/api/messenger/admin/...`) |
| `public/hoc-vien/messenger-admin.html` | Trang xem lead + mở lại AI cho hội thoại đang tạm dừng |

AI **không** tự động tạo đơn/thu tiền — khi khách chốt, AI ghi lại tên/SĐT/khoá học quan tâm vào bảng lead để bạn theo dõi và gửi link thanh toán (trang `/hoc-vien/` đã có sẵn luồng chuyển khoản + mã đơn hàng). Khi gặp khiếu nại, mặc cả, hoặc câu hỏi ngoài khả năng, AI tự ngừng trả lời hội thoại đó và chờ bạn xử lý tay — tránh AI trả treo trả bừa lúc bạn không kiểm soát được.

## 1. Chạy migration trên Supabase

Vào Supabase Dashboard → SQL Editor → New query, dán nội dung file `db/migration-003-messenger-agent.sql` → Run.

## 2. Lấy API key Claude

1. Vào console.anthropic.com → API Keys → tạo key mới.
2. Điền vào `.env` (và vào Environment Variables của Vercel nếu đã deploy):
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. `ANTHROPIC_MODEL` để trống là được (mặc định dùng `claude-sonnet-5`).

Lưu ý chi phí: mỗi tin nhắn khách gửi vào sẽ tốn 1 lần gọi API (tính theo token). Theo dõi usage tại console.anthropic.com → Usage.

## 3. Đặt Verify Token cho Webhook

Tự nghĩ một chuỗi bất kỳ (càng khó đoán càng tốt), điền vào `.env`:
```
FB_VERIFY_TOKEN=mot-chuoi-bi-mat-tu-dat-vd-daudanh2026xyz
```

## 4. Kiểm tra Page Access Token có quyền nhắn tin chưa

Token hiện tại trong `.env` (`PAGE_ACCESS_TOKEN`) dùng để đăng bài. Để **gửi/nhận tin nhắn**, token cần thêm quyền `pages_messaging`:

1. Vào **developers.facebook.com** → App của bạn (dùng đúng App đã tạo `APP_ID`/`APP_SECRET`).
2. Nếu app chưa có sản phẩm **Messenger**: bấm **Add Product** → **Messenger** → **Set up**.
3. Ở mục **Access Tokens**, chọn đúng Page → **Generate Token**. Nếu Facebook hỏi cấp quyền, xác nhận cấp `pages_messaging` (và giữ nguyên các quyền cũ như `pages_manage_posts` nếu có).
4. Nếu token mới khác token cũ, **cập nhật `PAGE_ACCESS_TOKEN`** trong `.env` và trên Vercel.

> App của bạn cần ở chế độ Live (không phải Development) và có quyền `pages_messaging` được App Review duyệt nếu muốn dùng lâu dài cho khách thật ngoài danh sách Tester/Admin của app. Nếu app đang ở Development, chỉ tài khoản Facebook được thêm làm Admin/Tester/Developer của app mới nhắn thử được.

## 5. Deploy lên Vercel với biến môi trường mới

Vào Vercel → Project → Settings → Environment Variables, thêm:
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL` (tuỳ chọn)
- `FB_VERIFY_TOKEN`
- (đảm bảo `PAGE_ACCESS_TOKEN`, `PAGE_ID`, `APP_ID`, `APP_SECRET`, `GRAPH_API_VERSION` đã có sẵn từ trước)

Deploy lại (`git push` hoặc Redeploy trên Vercel) để code webhook mới có hiệu lực.

## 6. Khai báo Webhook trên Meta for Developers

1. Trong App → sản phẩm **Messenger** → **Webhooks** (hoặc **Messenger API Settings** → **Webhooks**).
2. Bấm **Add Callback URL**:
   - **Callback URL:** `https://<domain-vercel-của-bạn>/api/messenger/webhook`
   - **Verify Token:** đúng chuỗi bạn đặt ở `FB_VERIFY_TOKEN` bước 3.
3. Bấm **Verify and Save** — nếu deploy đúng, Facebook sẽ xác thực thành công ngay.
4. Ở mục **Webhook Fields**, subscribe Page của bạn vào ít nhất: `messages`. (Có thể thêm `messaging_postbacks` nếu sau này dùng nút bấm.)

## 7. Test thử

Nhắn tin vào Fanpage từ một tài khoản Facebook cá nhân (không phải chính admin Page, hoặc dùng tài khoản Tester nếu app đang Development). AI sẽ trả lời theo văn phong đã cấu hình trong `services/aiAgent.js`.

Kiểm tra nhanh log trên Vercel (Deployments → Functions → Logs) nếu không thấy trả lời — thường do thiếu quyền `pages_messaging` hoặc sai `ANTHROPIC_API_KEY`.

## 8. Xem lead & quản lý hội thoại

Vào `https://<domain>/hoc-vien/messenger-admin.html`, nhập đúng `ADMIN_PASSCODE` (giống trang quản trị đơn hàng) để:
- Xem danh sách khách đã chốt (lead) — tên/SĐT/khoá học quan tâm.
- Xem hội thoại đang tạm dừng (AI đã nhường cho bạn) và bấm **Mở lại AI** sau khi bạn xử lý xong.

## 9. Chỉnh văn phong / quy tắc trả lời

Toàn bộ "tính cách" AI nằm trong biến `BRAND_VOICE` ở đầu file `services/aiAgent.js` — sửa trực tiếp đoạn text đó (giọng văn, cách xưng hô, điều được/không được hứa). Danh sách khoá học AI dùng để trả lời được lấy tự động từ bảng `courses` trên Supabase, không cần sửa code khi bạn thêm/sửa khoá học.
