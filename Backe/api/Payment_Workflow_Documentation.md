# KIẾN TRÚC & CƠ CHẾ HOẠT ĐỘNG THANH TOÁN (PAYMENT & BOOKING)

Tài liệu này tổng hợp toàn bộ luồng hoạt động của hệ thống Đặt vé và Thanh toán trong dự án hiện tại (đã được cập nhật đồng bộ với cấu trúc Database mới: `Order` -> `Booking` -> `BookingSeat`).

---

## 1. CƠ CHẾ HOẠT ĐỘNG TỔNG QUAN

Hệ thống thanh toán trong dự án này đang kết hợp 2 quy trình:
- **Tạo đơn hàng & Giữ chỗ tạm thời (Booking):** Sử dụng `Redisson Lock` để tránh xung đột thao tác trên cùng một ghế, đồng thời sử dụng cache TTL (có thời hạn 10 phút) để giải phóng ghế nếu không thanh toán.
- **Thanh toán tự động (Webhook chuyển khoản):** Sử dụng cổng trung gian **SePay** để tự động nhận diện tin nhắn biến động số dư ngân hàng và đối soát trực tiếp mà không cần làm mới trang.

### Sơ đồ Quy trình (Luồng xử lý dữ liệu):
1. **Khách hàng** bấm "Đặt vé" trên giao diện.
2. `BookingController` tạo 1 `Order` mới (mã `DH...` dạng "DH1", "DH2", v.v.) và trạng thái `pending`.
3. Hệ thống dùng `Redisson` khóa tạm kết quả chọn vé này trong thời hạn 10 phút (Tính năng giữ ghế TTL).
4. Khách hàng nhận được 1 mã QR và chuyển khoản ngân hàng tới số tài khoản cấu hình trong **SePay** cùng nội dung chuyển khoản là mã `orderCode` (Ví dụ: `Thanh toan don DH1`).
5. Khi người dùng hoàn thành chuyển khoản, **SePay** sẽ nhận diện được biến động trên tài khoản đích, nó lập tức gửi 1 HTTP yêu cầu (`POST`) về máy chủ của chúng ta (`/api/payment/sepay-webhook`).
6. `PaymentController` tiếp nhận yêu cầu đó:
   - Nó gọi vào `PaymentService` để trích xuất xem người dùng thanh toán cho đơn nào (lọc regex mẫu `DH[Số]`).
   - Nếu số tiền đủ/dư so với thuộc tính `finalAmount` của `Order`, tình trạng `Order` sẽ chuyển sang `paid`.
   - Song song vào lúc đó, ghế ngồi được xác định là của người đó (chuyển sang trạng thái `SOLD` trong hệ thống Redis để không bị giải phóng sau 10 phút).
7. Ở máy khách (Frontend), trang web liên tục ping (gọi polling) đến API `/api/payment/status/{orderCode}` mỗi 2-3s. Khi API phản hồi `paid` (đã cập nhật từ webhook), màn hình tự động hiển thị "Thành công!".

---

## 2. CÁC NƠI GỌI TỚI NÓ VÀ NÓ GỌI TỚI NƠI NÀO (INBOUND & OUTBOUND)

### A. Luồng Đặt Vé (`BookingController` -> `BookingService` -> DB & Redis)
- **Tác nhân gọi (Inbound):** Frontend (ReactJS/Vite) gọi API `POST /api/bookings`.
- **Hành động ra (Outbound):** 
  - Gọi vào MySQL: Insert `orders`, `bookings`, `booking_seats`.
  - Gọi vào Redis: Set các khóa `seat_lock:*`, gán dữ liệu `showtime:*` trạng thái ghế là `LOCKED`, set Map Cache TTL đếm ngược 10 phút.

### B. Luồng Webhook Thanh Toán (`PaymentController` -> `PaymentService` -> DB)
- **Tác nhân gọi (Inbound):** Hệ thống API của **SePay** gọi chủ động tới `POST /api/payment/sepay-webhook`.
- **Hành động ra (Outbound):**
  - Mở DB tìm `Order` bằng regex lọc được từ nội dung SePay quăng qua (Vd: "CT ĐẾN: NGUYEN VAN A THANH TOAN DH3").
  - Nếu khớp, lưu `orders` cập nhật trạng thái `paid`.
  - API trả luôn HTTP 200 `{ "success": true }` cho SePay để nó không re-try.

### C. Luồng Tra Cứu Trạng Thái (`PaymentController` -> `PaymentService`)
- **Tác nhân gọi (Inbound):** Màn hình chờ thanh toán của Frontend gọi polling liên tục vào `GET /api/payment/status/{orderCode}`.
- **Hành động ra:** Kết nối MySQL/OrderRepo để xem cột `status` đã được đổi chưa và trả về màn hình cho UI báo thành công.

---

## 3. CÁC BIẾN & CẤU HÌNH CẦN ĐẶC BIỆT CHÚ TÂM (CRITICAL)

Dưới đây là những tham số hệ thống mà nếu làm sai có thể gây thủng bảo mật hoặc mất tiền:

### 1. `sepay.secret-key` (Trong `application.yaml` / `.env`)
Được lấy ra tại `PaymentController`: 
```java
@Value("${sepay.secret-key:}")
private String sepaySecretKey;
```
- **Vai trò:** Khi SePay thiết lập gọi về Server của ta, phải thêm chuỗi Bearer Token này vào header `Authorization` để chứng minh đây chính là cổng SePay chứ không phải 1 Hacker tự post 1 API báo cáo "Đã chuyển tiền vào, hãy ghi nhận Paid đi". 
- **Lưu ý triển khai:** Hiện tại trên Code, tính năng soi Token Header này đang tạm bị comment lại bằng `//` (TODO: Bật lại khi deploy production). Chắc chắn phải thả comment bật tính năng này lên, nếu không Hacker chỉ cần lấy Postman gọi phát là "lấy vé không mất tiền".

### 2. Định dạng nội dung chuyển khoản Regex: `(?i)(DH\d+)`
Quy định trong `PaymentService`.
- **Vai trò:** Cấu hình App Frontend hiển thị mã QR Code chuyển khoản, bắt buộc phải ép khách hàng nhập nội dung là: `[Kí tự rác] DH[MãOrder] [Kí tự rác]`. 
- **Ví dụ chuẩn:** "Tra tien xem phim DH30" -> Trích được `DH30`. 
- **Lưu ý:** Nếu bạn tuỳ biến sang kiểu cấu trúc Database không dùng ID (mà dùng UUID 8-character) thì bắt buộc phải sửa Regex trong Backend đi cùng với nó.

### 3. Cấu hình Redis: Server và Redisson
- **Vai trò:** Đảm nhiệm khóa chống Race Condition (hai người book 1 ghế cùng lúcvà lưu trữ tạm TTL 10 phút khóa chỗ. 
- Ngay trong `BookingService`: `.tryLock(1, 10, TimeUnit.SECONDS)`. Bạn có thể thay đổi để bắt khách phải nhanh quyết định thanh toán hơn (VD: chỉ giữ vé 5 phút).
- Hệ thống cần một Redis Master-Slave khỏe (Vì số lượng booking của rạp cùng lúc là rất nhiều read/write Cache). URL connect cấu hình ở `RedisConfig`.

---

## 4. TỔNG KẾT & RỦI RO

- Hiện tại hệ thống đã được **Refactor thành công** theo schema database xịn của file `init.sql` (ách bạch được 1 Giỏ thanh toán là 1 bảng `Order`, nó chứa nhiều giao dịch là các `Booking`). 
- Hãy nhớ khi mang code lên Host / Server trên Internet:
  1. Yêu cầu NAT port / Reverse Proxy để URL webhook SePay có thể được access từ Public IPv4 (`https://du-an-phim.com/api/payment/sepay-webhook`). (SePay sẽ không gọi webhook về `localhost` được trừ phi bạn dùng `Ngrok`).
  2. Hãy bỏ comment những code check bảo mật SePay có ghi chú `TODO` để đảm bảo không bị spoofing payload thanh toán.
