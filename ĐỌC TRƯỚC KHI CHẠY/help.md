# Hướng dẫn cài đặt và chạy WebPhim

Dưới đây là các bước quan trọng bạn cần thực hiện để khởi chạy dự án bao gồm cả Backend, Frontend và các dịch vụ đi kèm. **Vui lòng đọc kỹ trước khi chạy!**

---

## 1. Yêu cầu hệ thống bắt buộc (Kích hoạt Redis)

Hệ thống Backend (BookingService) có sử dụng **Redis** để quản lý trạng thái khóa ghế theo thời gian thực (giữ chỗ) và Redis Scheduler. Do đó, bạn **bắt buộc phải bật Redis Server trước** khi khởi động Backend. 

Nếu không bật Redis, Backend sẽ báo lỗi Connection Refused và không thể book vé!
Bạn có thể cài đặt Redis trên Docker hoặc chạy local (như Memurai trên Windows), hãy chắc chắn dịch vụ đã ở trạng thái `Running`.

---

## 2. Cấu hình biến môi trường (Environment Variables)

Dự án yêu cầu các file cấu hình `.env` nằm ở đúng thư mục chứa source code của Backend và Frontend. Bạn hãy copy mẫu dưới đây và tạo file `.env` nếu chưa có, hoặc chỉnh sửa file đã có sao cho khớp.

### 2.1 Cấu hình Frontend (`Fronte/vite-project/.env`)

Bạn cần cung cấp thông tin tài khoản ngân hàng nhận tiền thanh toán (SePay):

```env
VITE_SEPAY_BANK_ACCOUNT= <Điền số tài khoản ngân hàng của bạn>
VITE_SEPAY_BANK_NAME= <Điền tên viết tắt ngân hàng của bạn, ví dụ: MB, VCB>
```

### 2.2 Cấu hình Backend (`Backe/api/.env`)

Chứa các cấu hình về Database MySQL, Redis, SePay webhook và bảo mật JWT.

```env
# ====== DATABASE (MySQL) ======
DB_HOST=127.0.0.1  # của src gốc
DB_PORT=3306       # của src gốc
DB_NAME=cinema_db  # của src gốc
DB_USER= <Điền username MySQL của bạn, ví dụ: root>
DB_PASS= <Điền password MySQL của bạn>

# ====== CACHE & LOCK (Redis) ======
REDIS_HOST=127.0.0.1                     # của src gốc
REDIS_PORT=6380                          # của src gốc
REDIS_PASSWORD=webphim-secret-redis      # của src gốc

# ====== THANH TOÁN (SePay) ======
SEPAY_SECRET_KEY= <Điền Secret Key lấy từ Dashboard SePay của bạn>

# ====== AUTHENTICATION (JWT) ======
JWT_SECRET=4f4b4e4d58434a5d5a57494f4a434c444f494f574d4c4e42424b  # của src gốc
JWT_EXPIRATION=86400000                                          # của src gốc (1 ngày)
```

*(Ghi chú: Những mục ghi chú "của src gốc" bạn có thể giữ nguyên không cần đổi trừ khi kiến trúc mạng máy bạn khác biệt. Những mục `<Điền...>` thì bắt buộc bạn phải cập nhật thông tin của bạn vào).*

---

## 3. Hướng dẫn khởi động dự án

Sau khi đã bật Redis và cấu hình xong các file `.env`, thực hiện các bước sau để chạy app.

### Bước 1: Chạy Backend (Spring Boot)
1. Mở terminal, trỏ đường dẫn tới thư mục `Backe\api`.
2. Gõ lệnh:
   ```bash
   mvn clean compile spring-boot:run
   ```
   *(Hoặc chạy qua file chạy Main trong IDE IntelliJ/Eclipse)*
3. Chờ cho đến khi thấy log báo Server đã khởi động thành công (thường là port 8080).

### Bước 2: Chạy Frontend (React/Vite)
1. Mở một terminal mới, trỏ đường dẫn tới thư mục `Fronte\vite-project`.
2. Cài đặt các thư viện (nếu mới clone code về lần đầu):
   ```bash
   npm install
   ```
3. Chạy môi trường phát triển (Development server):
   ```bash
   npm run dev
   ```
4. Truy cập giao diện web đang chạy ở địa chỉ xuất hiện trên terminal (thường là http://localhost:5173).

---

## 4. Cấu hình Webhook SePay (Rất Quan Trọng)

Vì máy tính của bạn (localhost) không thể tự tiếp nhận dữ liệu từ mạng Internet bên ngoài gửi vào, nên SePay sẽ không thể gọi trực tiếp đến `http://localhost:8080/api/payment/sepay-webhook` để thông báo trạng thái đơn hàng.

Để giải quyết vấn đề này trong môi trường Code/Test, bạn **bắt buộc** phải sử dụng một công cụ tạo Tunnel (đường hầm kết nối ra Internet), ví dụ như **Ngrok** hoặc **Cloudflare Tunnel (cloudflared)**.

**Cách làm cơ bản (Ví dụ với Cloudflare Tunnel):**
1. Cài đặt **cloudflared** trên máy của bạn.
2. Chạy lệnh mở tunnel tới port backend đang chạy (ví dụ 8080):
   ```bash
   cloudflared tunnel --url http://localhost:8080
   ```
3. Cloudflare sẽ tạo cho bạn một đường dẫn (URL) public như `https://abc-xyz.trycloudflare.com`.
4. Điền URL public này gắn thêm path API vào trang Dashboard của SePay (phần cấu hình Webhook). URL điền vào SePay sẽ có dạng: 
   `https://abc-xyz.trycloudflare.com/api/payment/sepay-webhook`

*(Bạn cũng có thể làm điều tương tự siêu nhanh gọn với Ngrok: `ngrok http 8080`).*

---
**Chúc bạn trải nghiệm dự án vui vẻ!**
