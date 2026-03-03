# 🏗️ Kiến Trúc Hệ Thống (Architecture Overview)

Tài liệu này tổng hợp toàn bộ các Cấu phần, Chức năng và API hiện đang Có Sẵn trong dự án `webphim` (Update mới nhất sau khi Merge code từ nhánh Long & Hiep).

---

## 1. 🖥️ Frontend (Vite + ReactJS)

Nằm toàn bộ tại thư mục `Fronte/vite-project`. Đây là phần giao diện người dùng, sử dụng Vite để build nhanh và React Router để điều hướng không tải lại trang.

### Cấu Trúc Thư Mục Chính

- `src/components/`: Các khối UI dùng chung tái sử dụng được (vd: `Header`, `MovieCard`).
- `src/features/client/`: Chia đồ họa theo từng trang (Page/Feature) của khách hàng. Gồm có:
  - `home/`: Giao diện Trang Chủ. Hiển thị BannerSlider, danh sách Phim Đang Chiếu.
  - `movie/`: Trang Chi Tiết Phim (`MovieDetail`), hiển thị thông tin rạp, poster, phân loại tuổi.
  - `Schedule/`: Trang Lịch Chiếu cập nhật giao diện Grid, NoteSection, có lọc ngày tháng (`DateSelector`).
  - `booking/`: Trang Đặt Ghế, kết nối luồng chọn chỗ ngồi trong phòng chiếu.
  - `payment/`: Trang Thanh Toán (`PaymentPage` mới pull từ nhánh Long).
  - `ticket/`: Trang hiển thị vé/hóa đơn.

### Trạng Thái Fetch Trực Tiếp (Kết Nối Gọi API)

- Đã cấu hình các hàm `fetch()` trực tiếp từ `localhost:8080/api/...` tại các màn `HomePage`, `MovieDetail` để đổ Mock Data.
- Đã gắn sự kiện chuyển hướng onClick để đi từ Trang Chủ sang Chi tiết Phim, sang Lịch Chiếu.

---

## 2. ⚙️ Backend API (Java Spring Boot 3.4.2)

Nằm toàn bộ tại thư mục `Backe/api`. Đóng vai trò máy chủ xử lý logic, quản lý thông tin Database và khóa ghế Redis.

### Cấu Trúc Controller (Các cổng kết nối Frontend có thể gọi)

Được định nghĩa trong `src/main/java/team/api/controller/`:

1.  **`MovieController`** (`/api/movies`):
    - `GET /`: Lấy toàn bộ danh sách phim đang có (kèm custom fields Frontend như `banner`, `genre`).
    - `GET /{id}`: Lấy thông tin chi tiết một bộ phim cụ thể qua ID.
    - `POST /`: Thêm một bộ phim mới.
2.  **`ShowtimeController`** (`/api/showtimes`):
    - `GET /{id}/seats`: Trả về danh sách ghế và trạng thái Kẹt/Trống (đã book chưa) của suất chiếu.
    - `POST /generate`: Gọi thuật toán tự động chia lịch chiếu (Auto Showtime Generator) cho hàng loạt phòng chiếu, hỗ trợ Redis Lock chống trùng lặp.
3.  **`BookingController`** (`/api/bookings`):
    - `POST /`: API cực kỳ quan trọng. Nhận `BookingRequest` chứa `userId`, `showtimeId`, `seatIds`. Thực hiện quy trình Giữ Chỗ tạm thời bằng **Redis Distributed Lock**.
4.  **`PaymentController`** (`/api/payment`):
    - Các API liên quan đến Module xử lý giao dịch.
5.  **`WebhookController`** (`/api/webhook`):
    - Tiếp nhận luồng phản hồi thanh toán tự động (VD: SePay webhook) để xác nhận hoá đơn.

### Cấu Trúc Thực Thế - Cơ Sở Dữ Liệu (MySQL Entities)

Các thực thể cấu thành 1 hệ thống quản lý rạp phim hoàn chỉnh (đã map vào Database nhờ Hibernate/JPA):

- `User`: Thông tin khách hàng (`user_id`, `username`, `email`, `role`).
- `Movie`: Dữ liệu phim (`title`, `duration_minutes`, `trailer_duration_minutes`, `poster_url`, trạng thái bản quyền).
- `Room`: Phòng chiếu (`room_id`, `name`, `total_seats`, `status` bảo trì).
- `Seat` & `SeatType`: Bản đồ ghế ngồi vật lý của các phòng (`Normal`, `VIP`, giá surcharge).
- `Showtime`: Các Suất Chiếu gán Phim vào Phòng với `start_time`, `end_time`, `buffer_time_minutes`, `batch_id` đại diện cho một phiên tạo tự động.
- `Booking` & `BookingSeat`: Đơn hàng đặt vé và chi tiết từng ghế trong đơn hàng (trạng thái `pending`, `paid`, `cancelled`).

### Hạ Tầng (Infrastructure)

- **MySQL Database**: Quản lý bằng `application.yaml` (`ddl-auto: create`). Quá trình mồi dữ liệu giả lập được làm tự động bằng file `data.sql` (chứa sẵn User, Phim, Phòng chiếu 1, Suất chiếu 1).
- **Redis Docker**: Cấu hình tại cổng `6379` (password: `webphim_redis_pass`). Được sử dụng bởi `RedissonClient` ở tầng `BookingService` để chặn hai người tranh nhau cùng 1 vé trong cùng 1 giây.
- **Lombok**: Tối ưu hóa các file Entity & DTO (`@Data`, `@Builder`, `@NoArgsConstructor`).

---

## 3. 🎯 Luồng Nghiệp Vụ Chính Hiện Tại (Flow)

### Flow 1: Khách Hàng đặt vé (Booking)

- Khách Hàng (Frontend) xem danh sách **Movies** & **Showtimes** (Lấy từ MySQL/Cache).
- Khách Hàng chọn ghế trên giao diện phòng chiếu.
- Frontend gửi yêu cầu đặt chỗ tới **`BookingController`**.
- Backend gọi **Redis** tạo một lá chắn (Lock) tạm thời ôm các chiếc ghế đi. Trả về `200 OK`.
- Nếu người thứ 2 mua trùng ghế, Redis báo khóa bị từ chối, Backend nhả về `400 Bad Request`.
- Vé được gắn mác `Pending`, chờ luồng **`PaymentController` / `Webhook`** nhận báo cáo chuyển khoản để chốt vé vĩnh viễn (hoặc nếu Redis hết Timeout 10 phút khóa, ghế sẽ tự bung ra lại thành Trống nếu chưa thanh toán).

### Flow 2: Quản trị viên xếp lịch chiếu tự động (Auto Generator)

- Admin gửi yêu cầu chia ca qua **`ShowtimeController (/generate)`** với danh sách Phim, Phòng, Ngày áp dụng và khung giờ rạp mở cửa.
- Backend sử dụng vòng lặp thuật toán Auto Generator gán lịch tính theo tổng _thời lượng phim, số phút chiếu trailer_ và _thời gian dọn phòng (buffer time)_ (Luôn tự làm tròn giờ đẹp theo bội số của 5).
- Trong suốt quá trình máy tính chia ca, **Redis Distributed Lock (Redisson)** sẽ khoá riêng Phòng Chiếu đó lại, ngăn chặn tuyệt đối trường hợp 2 Admin cùng nhấn nút Xếp lịch cho một phòng chiếu gây xung đột giao cắt.
