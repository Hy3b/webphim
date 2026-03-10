
# Phân tích luồng tích hợp SePay Webhook (Backend Perspective)

Tài liệu này mô tả chi tiết luồng xử lý thanh toán tự động qua SePay Webhook trong dự án `webphim`, được đúc kết dưới góc nhìn của một Backend Specialist (dựa trên tinh thần Architecture & Security).

---

## 1. Tổng quan Kiến trúc (Architecture Overview)

Luồng thanh toán hiện tại áp dụng mô hình Bất đồng bộ (Asynchronous Payment Notification). Thay vì Frontend phải thao tác liên tục với Gateway mặc định của ngân hàng, ứng dụng uỷ quyền việc xác nhận số dư cho **SePay API**.

**Các thành phần tham gia:**
1. **Frontend (Client)**: Khởi tạo render QR Code, thực hiện Polling (hỏi liên tục) xem trạng thái đơn hàng đã đổi chưa.
2. **Backend (Core API)**: Cung cấp API Polling cho Frontend, xây dựng Endpoint nhận Webhook từ SePay.
3. **Database (MySQL)**: Lưu trữ trạng thái `Order` (`pending`, `paid`, `expired`), đóng vai trò là SSOT (Single Source of Truth).
4. **SePay System**: Lắng nghe biến động số dư tài khoản ngân hàng của Merchant, đối soát và bắn Webhook (HTTP POST) về Backend khi có giao dịch.

---

## 2. Chi tiết Luồng xử lý (Data Flow)

Trình tự một giao dịch thành công diễn ra như sau:

### Phase 1: Khởi tạo giao dịch (Frontend → Backend)
- Người dùng chọn ghế và bấm thanh toán.
- Frontend không giao tiếp trực tiếp với SePay API ở bước tạo link. Thay vào đó, Frontend tự gen mã QR dựa trên thông số cấu hình tài khoản ngân hàng (lấy từ `.env` của frontend) kèm theo thông điệp chuyển khoản là `orderCode` (ví dụ: `DH25`).
- Frontend bắt đầu chu kỳ *Polling* (gọi `GET /api/payment/status/DH25` mỗi 5 giây).

### Phase 2: Thanh toán & SePay Trigger (Client → Bank → SePay)
- Người dùng quét QR và chuyển tiền thành công từ app ngân hàng.
- Tiền vào tài khoản thật của Merchant.
- SePay phát hiện biến động số dư, đối chiếu cấu hình Webhook và đóng gói cục Data JSON.

### Phase 3: Xử lý Webhook (SePay → Backend API)
SePay gọi POST tới `https://your-domain/api/payment/sepay-webhook`.
Đây là tầng bảo vệ nghiêm ngặt nhất.

1. **Security & Validation Layer (`PaymentController`)**:
   - Vượt qua `SecurityConfig`: Spring Security đã được cấu hình mở (`permitAll()`) cho endpoint này.
   - Xác thực danh tính (Authentication): Controller trích xuất Header `Authorization`, đảm bảo nó chứa chữ ký hợp lệ `SEPAY_SECRET_KEY` (lấy từ biến môi trường). Nếu sai lệch → Return `403 Forbidden` ngay lập tức để chặn khai thác.

2. **Business Logic Layer (`PaymentService.processWebhook`)**:
   - Đọc payload (`SePayWebhookRequest`).
   - Khai thác chuỗi regex để tìm kiếm `orderCode` trong phần `transferContent` (nơi khách ghi chú ghi chuyển khoản).
   - Truy vấn DB: Tìm kiếm `Order` bằng `orderCode`. Nếu không thấy → Log warning & Thoát (Tránh crash lỗi `NullPointerException`).
   - Kiểm tra trạng thái hiện tại: Nếu `Order` không phải là `pending` (ví dụ đã `expired` do lố giờ) → Log info & Thoát (Ngăn việc Double-Paid hay ghi nhận sai logic).
   - Đối soát bảo mật: So sánh `$Tiền_Gửi_Vào` (`transferAmount`) với `$Tiền_Đơn_Hàng` (`finalAmount`). Phải >= đủ số tiền quy định mới tiếp tục. Thiếu tiền → Log warning & Thoát.

3. **Data Access Layer (`OrderRepository`)**:
   - Nếu mọi thứ màu xanh (Mã chuẩn, Còn hạn, Đủ tiền), Backend cập nhật `status = paid`.
   - Lưu trữ thay đổi xuống DB (`orderRepository.save`).

4. **Response back to SePay**:
   - Controller buộc phải trả về chính xác `{"success": true}` với HTTP 200 để báo cho SePay biết xử lý đã xong, không bắt họ Retry lại (tiết kiệm băng thông hai phía).

### Phase 4: Hoàn thành (Backend → Frontend)
- Ở chu kỳ Polling tiếp theo của Frontend, `GET /api/payment/status/DH25` sẽ đọc được `status: paid` từ DB.
- Frontend dừng Polling (xoá Interval Timer), hiển thị UI thành công ("Đã thanh toán!") và chuyển hướng sang trang `/ticket`.

---

## 3. Đánh giá & Phân tích (Backend Specialist Review)

### ✅ Điểm mạnh đã đạt chuẩn 2025:
- **Tầng dịch vụ (Service Layer) độc lập**: Controller chỉ điều hướng, không chứa business logic xử lý regex hay thay đổi entity.
- **Có cơ chế Xác thực Webhook (Secret Key)**: Chống bạo lực điểm cuối (Endpoint Abuse). Không ai có thể gọi API webhook nếu không có khoá bí mật.
- **So khớp tài chính cẩn thận (`transferAmount` >= `finalAmount`)**: Chống gian lận trường hợp User sửa nội dung chuyển 1k VND thay vì 100k VND.
- **Chỉ công nhận Status Pending**: Tránh được vòng lặp logic và chống Race Condition nếu Webhook bắn về 2 lần cho cùng 1 hoá đơn.

### 🛡 Tính Mở rộng (Scalability):
Mô hình Polling (dùng Timeout 5s) hiện tại khả thi và dễ setup cho dự án vừa/nhỏ. Tuy nhiên, nếu Backend Specialist nhìn vào tương lai khi hệ thống scale lên hàng chục nghìn Booking, việc Polling liên tục vào DB rỗng sẽ gây lãng phí kết nối DB (N+1 queries cho mỗi client đang rảnh).

*Đề xuất nâng cấp sau này (Tuỳ chọn)*: Cấu trúc hạ tầng có thể đổi từ **Polling** sang **Server-Sent Events (SSE)** hoặc **WebSocket** (qua thư viện như Socket.io hay STOMP) để Real-time Push thông báo trả về Client rẻ nhất, thay vì để Client kéo (pull) mòn server. Ngay khi `PaymentService` chạy tới dòng `orderRepository.save(order);`, nó cũng emit một Event socket về tận Component UI để đổi trạng thái tức thì.

