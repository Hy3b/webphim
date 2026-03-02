# 🚀 Hướng Dẫn Sử Dụng Postman Test API Web Phim Backend (Spring Boot)

Đây là tài liệu hướng dẫn nhanh các bước kiểm tra (test) chức năng hệ thống thông qua `Postman` khi bạn vừa chạy xong Backend ở nhánh cấu hình kèm **Redis**.

---\n

## 1️⃣ API Xem Danh Sách Phim (`GET /api/movies`)

- **Chức năng:** Gọi hiển thị toàn bộ phim trong Mock Database, bao gồm cả các trường giao diện như Banner, Thể Loại.
- **Mở Tab mới** trong Postman.
- **Chuẩn bị Setup:**
  - Khung Dropdown phương thức gửi (`Method`): Chọn `GET`
  - Khung `URL` dán đường link sau: `http://localhost:8080/api/movies`
- Kéo xuống thẻ **Body**: Giữ nguyên `none`.
- Nhấn **Send (Nút xanh biển)**.
- **Kết quả dự kiến (Status 200 OK):** Nhận được 1 chuỗi mảng JSON (trong đó có `Kung Fu Panda 4` và `Dune: Part Two`).

---\n

## 2️⃣ API Xem Trạng Thái Ghế Của Suất Chiếu (`GET /api/showtimes/{id}/seats`)

- **Chức năng:** Kiểm tra tất cả các ghế của một suất chiếu nhất định có bị đặt hay bị lỗi không. Mình sẽ dùng Suất chiếu số `1`.
- **Mở Tab mới** trong Postman.
- **Chuẩn bị Setup:**
  - Khung `Method`: Chọn `GET`
  - Khung `URL`: `http://localhost:8080/api/showtimes/1/seats`
- Kéo xuống thẻ **Body**: Giữ nguyên `none`.
- Nhấn **Send**.
- **Kết quả dự kiến (Status 200 OK):** Sẽ nhận một chuỗi liệt kê Ghế số 1 đến 15 của Phòng chiếu 1. Mỗi phần tử sẽ có mục `"isBooked": false / true` (đã có người đặt chưa).

---\n

## 3️⃣ API Đặt & Khóa Ghế Tạm Bằng Redis (`POST /api/bookings`) - QUAN TRỌNG

- **Chức năng:** Tiến hành giữ ghế và test module khoá (Locking Distributed Lock bằng Redisson) không cho đặt hai lần.
- **Mở Tab mới** trong Postman.
- **BẮT BUỘC Setup Chuẩn Y Từng Bước:**
  1. Khung Dropdown phương thức gửi (`Method`): Lần đầu đổi thành `POST`
  2. Khung `URL`: `http://localhost:8080/api/bookings`
  3. Dưới chữ `POST` có hàng loạt các thẻ (Params, Authorization, Headers, **Body**, Scripts, vv...). **HÃY CLICK VÀO CHỮ `Body`**.
  4. Ở dòng bên dưới ngay chữ Body, tích chọn mục có chữ `raw`.
  5. Ở chữ `Text`, hãy xổ xuống và chọn đổi thành định dạng **`JSON`**. (Nếu đã là JSON thì giữ nguyên).
  6. Bước nhập **Payload (Dữ liệu gửi)**: Nhập vào vùng giấy trắng bên dưới cấu trúc JSON sau đây:
     ```json
     {
       "userId": 1,
       "showtimeId": 1,
       "seatIds": [1, 2]
     }
     ```
  - (Nghĩa là User id 1, muốn đặt Suất id 1, và mua 2 ghế vé là id 1 và 2).
- Nhấn **Send**.
- **Chuyện gì sẽ xảy ra?** Cửa sổ kết quả sẽ báo Status `200 OK` kèm tin nhắn thành công _"Seats successfully locked for 10 minutes"_.
- **CÁCH TEST CHỐNG TRÙNG VÉ (TRỌNG TÂM):** Ở nguyên chỗ cũ, CHƯA CHỈNH BẤT CỨ thứ gì, bạn click một phát nút **Send** lại lặp lại thao tác y chang lần nữa.
- Lần này cửa sổ dưới cùng Postman sẽ báo **`400 Bad Request`** kèm đoạn tin nhắn lỗi hiển thị màu đỏ với nội dung **"Seats are already booked or locked"**. Nếu ra dòng này chứng tỏ chức năng Redis Khoá ghế hoạt động 10/10 xuất sắc!
