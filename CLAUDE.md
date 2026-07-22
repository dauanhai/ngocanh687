# Dự án: Hệ thống sản xuất content trang bán hàng — TPCN

> File này ghép vào (hoặc thay thế) `CLAUDE.md` ở thư mục gốc dự án của bạn.
> Sau khi đặt file này + `.mcp.json` (đi kèm) vào project, mở Claude Code trong thư mục đó là hệ thống hoạt động — không cần làm gì thêm.

## Bối cảnh sản phẩm (điền/sửa thông tin của bạn)

- **Tên thương hiệu:** [ĐIỀN TÊN]
- **Sản phẩm:** Thực phẩm chức năng — [VD: hỗ trợ tăng đề kháng / hỗ trợ tiêu hoá / hỗ trợ giấc ngủ...]
- **Khách hàng mục tiêu:** [VD: nữ 28-45 tuổi, quan tâm sức khỏe, mua online]
- **Tông giọng thương hiệu:** [VD: đáng tin cậy, khoa học nhưng gần gũi, không "thổi phồng"]
- **Kênh bán chính:** [VD: landing page + Facebook Ads / TikTok Shop]
- **Đối thủ cần theo dõi:** [VD: tên 3-5 thương hiệu TPCN cùng phân khúc]

## Bộ kỹ năng đang dùng

Dự án này dùng **affiliate-skills** (đã cài tại `~/.claude/skills/affiliate-skills`) kết hợp MCP server **hidrix-tools** để lấy dữ liệu mạng xã hội thời gian thực.

### Kỹ năng KHÔNG dùng trong dự án này
- `affiliate-program-search` — chỉ dùng cho affiliate marketer quảng bá sản phẩm người khác. **Bỏ qua**, vì đây là sản phẩm tự có.

### Kỹ năng ưu tiên, theo đúng thứ tự quy trình

1. **Research** — `trending-content-scout`, `competitor-spy`, `traffic-analyzer`
   → Luôn quét theo từ khóa ngành hàng + tên đối thủ đã liệt kê ở trên, không quét chung chung.
2. **Research Brief** — `content-research-brief`
   → Mọi công dụng sản phẩm nêu trong content phải có nguồn trích dẫn; không tự suy diễn công dụng y tế.
3. **Content** — `viral-post-writer`, `tiktok-script-writer`
   → Bám đúng tông giọng thương hiệu ở trên. Tránh ngôn từ cam kết chữa bệnh (theo quy định quảng cáo TPCN VN, không dùng từ "điều trị", "chữa khỏi").
4. **Offer & Landing Page** — `grand-slam-offer` → `bonus-stack-builder` → `guarantee-generator` → `landing-page-creator`
   → Landing page xuất ra HTML/CSS thuần, có thể chỉnh sửa được, theo khung AIDA.
5. **Distribution** — `bio-link-deployer`, `social-media-scheduler`
6. **Analytics** — `conversion-tracker`, `ab-test-generator`
   → Sau mỗi chu kỳ, quay lại bước 1 với dữ liệu chuyển đổi thật để tinh chỉnh hướng content tiếp theo.

## Quy tắc bắt buộc khi AI làm việc trong dự án này

- Luôn dùng `hidrix-tools` để lấy số liệu thật (view, like, share, traffic) trước khi khẳng định "content này đang viral" — không suy đoán.
- Mọi tuyên bố về công dụng sản phẩm phải trung thực, có căn cứ, tuân thủ quy định quảng cáo TPCN của Bộ Y tế VN (không gây hiểu nhầm là thuốc chữa bệnh).
- Trước khi viết landing page mới, luôn chạy `competitor-spy` trên ít nhất 2 đối thủ đã liệt kê để tránh trùng góc tiếp cận.
