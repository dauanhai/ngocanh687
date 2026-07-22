# Messenger AI Bot — Trả lời khách hàng tự động bằng Google Gemini (miễn phí)

Bot này nhận tin nhắn từ Fanpage Facebook, gọi Google Gemini để tạo câu trả lời tự nhiên,
rồi gửi lại cho khách — chạy hoàn toàn miễn phí trên Vercel + Gemini free tier (không cần thẻ).

## Chi phí thực tế
- GitHub: miễn phí
- Vercel (gói Hobby): miễn phí
- Gemini API: **miễn phí, không cần thẻ**, hạn mức khoảng 1.500 tin nhắn/ngày với model
  `gemini-2.5-flash` — đủ dùng cho shop nhỏ/vừa. Nếu cần hạn mức cao hơn, đổi sang
  `gemini-2.5-flash-lite` trong code.

**Lưu ý về dữ liệu:** ở gói miễn phí, Google có thể dùng nội dung chat để cải thiện mô hình
của họ. Nếu không muốn chia sẻ dữ liệu khách hàng, cần bật billing (trả phí) cho project —
lúc đó vẫn rất rẻ (dưới 0,001 USD/tin nhắn) nhưng dữ liệu không bị dùng để train.

## Bước 1: Chuẩn bị code trên GitHub
1. Tạo một repository mới trên [github.com](https://github.com) (Public hoặc Private đều được).
2. Upload toàn bộ nội dung thư mục này lên repo đó (kéo thả file trên giao diện web GitHub
   là đơn giản nhất nếu bạn chưa quen dùng lệnh `git`).

## Bước 2: Tạo App trên Meta for Developers
1. Vào [developers.facebook.com](https://developers.facebook.com) → **My Apps** → **Create App**.
2. Chọn loại app **"Business"**.
3. Sau khi tạo xong, vào **Add Product** → thêm **Messenger**.
4. Trong mục Messenger → **Settings**, phần **Tạo mã truy cập** (Access Tokens), chọn đúng
   Fanpage của bạn và bấm **Tạo** → copy lại, đây chính là `PAGE_ACCESS_TOKEN`.

## Bước 3: Lấy Gemini API Key (miễn phí)
1. Vào [aistudio.google.com/apikey](https://aistudio.google.com/apikey), đăng nhập bằng
   tài khoản Google.
2. Bấm **Create API key** → chọn hoặc tạo một Google Cloud project mới.
3. Copy key vừa tạo — đây chính là `GEMINI_API_KEY`. Không cần thẻ thanh toán ở bước này.

## Bước 4: Deploy lên Vercel
1. Vào [vercel.com](https://vercel.com) → đăng nhập bằng tài khoản GitHub.
2. Bấm **Add New Project** → chọn repo bạn vừa tạo ở Bước 1 → **Import**.
3. Trước khi bấm Deploy, mở mục **Environment Variables** và thêm 3 biến:
   - `VERIFY_TOKEN` = một chuỗi bất kỳ do bạn tự đặt, ví dụ `shopABC2026`
   - `PAGE_ACCESS_TOKEN` = token lấy ở Bước 2
   - `GEMINI_API_KEY` = key lấy ở Bước 3
4. Bấm **Deploy**. Sau khi xong, bạn sẽ có một URL dạng:
   `https://ten-du-an-cua-ban.vercel.app`

   → Webhook URL cần dùng ở bước sau là:
   `https://ten-du-an-cua-ban.vercel.app/api/webhook`

## Bước 5: Kết nối Webhook vào App Messenger
1. Quay lại Meta for Developers → App của bạn → Messenger → **Settings**.
2. Mục **"1. Đặt cấu hình webhook"**:
   - URL gọi lại: dán URL webhook ở Bước 4
   - Xác minh mã: dán đúng chuỗi `VERIFY_TOKEN` bạn đã đặt
3. Bấm **Xác minh và lưu**. Nếu báo lỗi, kiểm tra lại đúng URL và đúng token.
4. Sau khi verify thành công, ở mục **"2. Tạo mã truy cập"**, bấm **Thêm đăng ký**
   cho Fanpage của bạn, tick vào trường **messages** (bắt buộc).

## Bước 6: Test thử
- Ở bước này, app đang ở chế độ **Development** → bot chỉ trả lời được cho
  chính bạn và các tài khoản admin/tester của App (Meta for Developers → App roles).
- Vào Fanpage, nhắn tin thử — bot sẽ trả lời bằng AI theo nội dung bạn đã điền
  trong `SYSTEM_PROMPT` (file `api/webhook.js`).

## Bước 7: Tùy chỉnh nội dung bot
Mở file `api/webhook.js`, sửa phần `SYSTEM_PROMPT`:
- Điền tên shop, thông tin sản phẩm, bảng giá, chính sách ship/đổi trả thật.
- Càng chi tiết, bot trả lời càng chính xác.
- Sau khi sửa, chỉ cần push code mới lên GitHub — Vercel sẽ tự động deploy lại.

## Bước 8 (quan trọng): Đưa bot lên phục vụ khách hàng thật
Muốn bot trả lời **tất cả khách hàng**, không chỉ riêng bạn, Facebook bắt buộc
App phải qua **App Review** (mục "3. Hoàn tất quy trình Xét duyệt ứng dụng") để được
cấp quyền `pages_messaging`:
1. Bấm **Yêu cầu cấp quyền** cho `pages_messaging`.
2. Chuẩn bị: mô tả use case rõ ràng, video quay màn hình demo bot hoạt động,
   xác minh doanh nghiệp (Business Verification) nếu được yêu cầu.
3. Trong lúc review, Meta sẽ tự động gửi tin nhắn thử đến webhook của bạn để
   kiểm tra — đảm bảo bot vẫn đang chạy ổn định lúc nộp đơn.
4. Quá trình này thường mất vài ngày đến vài tuần, có thể bị từ chối và phải nộp lại.

## Giới hạn cần biết
- Lịch sử hội thoại lưu tạm trong bộ nhớ RAM của function — có thể bị mất nếu
  Vercel "ngủ đông" function do không có traffic. Nếu cần lưu bền, nên nối thêm
  một database nhỏ (ví dụ Vercel KV, Supabase — đều có gói miễn phí).
- Chỉ xử lý tin nhắn dạng text. Muốn xử lý ảnh, nút bấm... cần mở rộng thêm code.
- Facebook giới hạn nhắn tin chủ động ngoài 24 giờ kể từ tin cuối của khách,
  trừ khi dùng message tag được phê duyệt.
- Gemini free tier giới hạn khoảng 15 request/phút và 1.500 request/ngày — nếu
  shop có lượng khách rất lớn, cân nhắc bật billing để tăng hạn mức (vẫn rất rẻ).
