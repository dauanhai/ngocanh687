# Quy trình cài đặt Bot AI cho Fanpage Cây Thuốc Vườn Nhà

## Tình trạng hiện tại (dựa theo những gì bạn đã làm)
- [x] Tạo App Messenger trên Meta for Developers (app "mimibox")
- [x] Lấy Page Access Token cho Fanpage "CÂY THUỐC VƯỜN NHÀ"
- [x] Lấy Gemini API Key
- [x] Tạo project trên Vercel, đã điền đủ 3 biến môi trường (VERIFY_TOKEN, PAGE_ACCESS_TOKEN, GEMINI_API_KEY)
- [x] Tạo repo GitHub tên `cay-thuoc-vuon-nha-bot`
- [ ] **Upload code vào repo GitHub** ← bạn đang kẹt ở đây, repo đang trống
- [ ] Deploy thành công trên Vercel (tự chạy sau khi có code)
- [ ] Lấy URL Vercel
- [ ] Dán URL + Verify Token vào Meta (mục "1. Đặt cấu hình webhook")
- [ ] Đăng ký webhook nhận trường "messages" (mục "2. Tạo mã truy cập")
- [ ] Test thử trong Messenger (chỉ admin/tester nhắn được lúc này)
- [ ] Sửa nội dung SYSTEM_PROMPT bằng thông tin thật của shop
- [ ] Nộp App Review xin quyền `pages_messaging` để bot trả lời được mọi khách thật

---

## BƯỚC TIẾP THEO NGAY BÂY GIỜ: Đưa code vào repo GitHub trống

### Nếu bạn đang thao tác trên máy tính:
1. Tải file `messenger-ai-bot.zip` (mình đã gửi lại ở tin trước) → giải nén ra một thư mục.
2. Vào repo `cay-thuoc-vuon-nha-bot` trên GitHub → bấm **"uploading an existing file"**.
3. Kéo thả toàn bộ nội dung bên trong thư mục đã giải nén (gồm thư mục `api/`, file `package.json`, `.env.example`, `README.md`) vào khung upload.
4. Cuộn xuống, bấm **"Commit changes"**.

### Nếu bạn đang thao tác trên điện thoại (không cần giải nén zip):
Tạo trực tiếp từng file ngay trên web GitHub bằng trình duyệt điện thoại — không cần tải/giải nén gì cả:

1. Vào repo `cay-thuoc-vuon-nha-bot` trên GitHub bằng trình duyệt điện thoại.
2. Bấm **"creating a new file"** (hoặc nút **"+"** → **"Create new file"**).
3. Ở ô tên file, gõ: `api/webhook.js` (gõ luôn cả `api/` phía trước, GitHub sẽ tự tạo thư mục `api`).
4. Dán nội dung file `webhook.js` vào khung soạn thảo bên dưới (nội dung ở cuối tài liệu này, phần "Nội dung file để copy").
5. Cuộn xuống, bấm **"Commit changes"**.
6. Lặp lại từ bước 2, tạo tiếp file `package.json`, dán đúng nội dung tương ứng, Commit.
7. Lặp lại tạo file `.env.example`, dán nội dung, Commit. (File này không bắt buộc để chạy, có thể bỏ qua nếu muốn nhanh.)

→ Chỉ cần 2 file bắt buộc để chạy được: `api/webhook.js` và `package.json`. Các file còn lại chỉ mang tính tham khảo/tài liệu.

---

## Các bước sau khi đã có code trong repo

**Bước A — Kiểm tra Vercel tự deploy**
Quay lại Vercel → tab "Deployments" → đợi khoảng 30 giây–1 phút, sẽ thấy bản deploy mới tự chạy (vì Vercel phát hiện commit mới). Đợi tới khi thấy dấu tích xanh "Ready".

**Bước B — Lấy URL**
Vào tab "Overview" hoặc "Domains" của project trên Vercel, copy URL dạng:
`https://cay-thuoc-vuon-xxxx.vercel.app`

**Bước C — Điền vào Meta**
Quay lại trang Messenger Settings trên Meta for Developers, mục **"1. Đặt cấu hình webhook"**:
- URL gọi lại: `https://cay-thuoc-vuon-xxxx.vercel.app/api/webhook` (nhớ thêm `/api/webhook` ở cuối)
- Xác minh mã: đúng chuỗi bạn đã đặt cho `VERIFY_TOKEN`
- Bấm **"Xác minh và lưu"**

**Bước D — Đăng ký nhận sự kiện tin nhắn**
Ở mục **"2. Tạo mã truy cập"**, bấm **"Thêm đăng ký"** cho Fanpage "CÂY THUỐC VƯỜN NHÀ" → tick vào **"messages"**.

**Bước E — Test thử**
Nhắn tin vào Fanpage (bằng chính tài khoản của bạn hoặc tài khoản admin/tester của App) → bot sẽ tự trả lời bằng AI.

**Bước F — Tùy chỉnh nội dung bot**
Sửa phần `SYSTEM_PROMPT` trong file `api/webhook.js` trên GitHub (bấm biểu tượng cây bút để sửa trực tiếp trên web) → điền tên shop, sản phẩm, giá, chính sách thật → Commit → Vercel tự deploy lại.

**Bước G — Xin quyền để bot trả lời khách thật**
Ở mục **"3. Hoàn tất quy trình Xét duyệt ứng dụng"**, bấm **"Yêu cầu cấp quyền"** cho `pages_messaging`, làm theo hướng dẫn nộp App Review của Meta.

---

## Nội dung file để copy (dùng cho cách làm trên điện thoại)

Toàn bộ nội dung 2 file bắt buộc, copy đúng nguyên văn dán vào GitHub như hướng dẫn ở trên, đã có sẵn trong file `messenger-ai-bot.zip` — mở file đó bằng ứng dụng đọc file zip trên điện thoại (ví dụ app "Files" có sẵn trên Android/iPhone hỗ trợ mở file nén) để xem và copy nội dung từng file.
