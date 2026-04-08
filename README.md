<div align="center">
  <h1>🎬 WebPhim - Cinema Booking System (.NET Core + React)</h1>
  <p>Hệ thống đặt vé xem phim trực tuyến hiện đại với đầy đủ tính năng dành cho Khách hàng & Ban Quản Trị.</p>
  <p><i>(Dự án đã được di chuyển thành công từ Java Spring Boot sang ASP.NET Core)</i></p>
  <img src="https://img.shields.io/badge/.NET-9.0-purple?logo=dotnet" alt=".NET 9" />
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Database-MySQL-blue?logo=mysql" alt="MySQL" />
  <img src="https://img.shields.io/badge/Cache-Redis-red?logo=redis" alt="Redis" />
</div>

<hr/>

## 📖 Tổng quan

**WebPhim** là nền tảng quản lý rạp chiếu phim và đặt vé trực tuyến giúp Khách hàng (Client) có thể duyệt phim, xem lịch chiếu theo ngày giờ, chọn ghế **real-time** và thanh toán tự động qua **SePay Webhook**. Đối với Ban quản trị (Admin/Staff), hệ thống cung cấp Dashboard quản lý toàn diện bao gồm: thêm/sửa/xoá phim, quản lý suất chiếu, đặt vé tại quầy và quét vé check-in.

---

## 🚀 Công nghệ sử dụng (Tech Stack)

### 💅 Frontend (Client & Admin)
- **Framework:** ReactJS 19 (với Vite build tool)
- **Routing:** React Router DOM v7
- **Styling:** CSS & Tailwind CSS
- **Networking:** Axios (hỗ trợ `withCredentials` cho Cookie-based JWT)

### ⚙️ Backend (RESTful API)
- **Framework:** ASP.NET Core API (.NET 9)
- **Security:** JWT (JSON Web Token) lưu qua HttpOnly Cookie + BCrypt Password Hashing
- **ORM:** Entity Framework Core (Code-First Migration)

### 🗄️ Database, Caching & Khác
- **Database:** MySQL 8 
- **Caching & Locking:** Redis (sử dụng Distributed Lock để chống Race Condition khi đặt ghế - không cho phép double-booking)
- **Payment Gateway:** Tích hợp Webhook SePay xử lý thanh toán tự động.
- **Containerization:** Docker & Docker Compose (cung cấp MySQL, Redis)

---

## ✨ Tính năng nổi bật

1. **Authentication & Authorization:** 
   - Đăng ký, đăng nhập an toàn bằng JWT HttpOnly Cookie.
   - Phân luồng quyền: `Admin` (quản trị toàn bộ), `Staff` (đặt vé quầy, quét vé), `Customer` (đặt vé online).
2. **Khám phá Phim & Lịch chiếu:**
   - Xem phim đang chiếu / sắp chiếu.
   - Tra cứu suất chiếu được nhóm theo ngày hợp lý.
3. **Chọn ghế Real-time (Redis):**
   - Sơ đồ phòng chiếu hiển thị trạng thái từng ghế ngay lập tức.
   - Khi một khách chọn ghế và bắt đầu checkout, ghế sẽ bị **Lock qua Redis** trong thời gian cố định. Tránh Double-Booking tuyệt đối.
4. **Thanh toán tự động:**
   - Đơn hàng xuất QR code thông minh. Hệ thống tự động nhận Callback (Webhook) từ SePay để đổi trạng thái đơn và giữ nguyên ghế trên Database.
5. **Admin Dashboard:**
   - Quản lý sơ đồ phòng chiếu, ghế ngồi, suất chiếu, vé đặt.
   - Staff có khả năng dùng mã QR trên e-ticket để quét và check-in vé.
   - Cung cấp đặt chỗ trực tiếp (`Admin Booking`).

---

## 🏛️ Sơ đồ hệ thống & Luồng hoạt động chính

Được thiết kế theo chuẩn phân tách giữa Frontend SPA và Backend API.

```text
Khách hàng
    │
    ├─ Xem phim & lịch chiếu (GET /api/movies, GET /api/showtimes)
    │
    ├─ Chọn ghế (Trạng thái ghế lấy từ Redis: GET /api/showtimes/{id}/seats)
    │
    ├─ Đặt vé (POST /api/bookings)
    │       → Redis Lock để giữ ghế 
    │       → Lưu giao dịch xuống Database (Order, Booking)
    │
    └─ Thanh toán (POST /api/payment/sepay-webhook)
            → Xác thực Webhook
            → Cập nhật Order "paid"
            → Đánh dấu trạng thái ghế SOLD trên Redis và DB
```

---

## 📂 Cấu trúc thư mục

Toàn bộ dự án nằm trong monorepo với 2 thành phần chính:

```text
webphim/
├── Backe/
│   └── DotnetBackend/     ← Toàn bộ mã nguồn Backend API (C#)
│       ├── Controllers/   ← API Endpoints (Auth, Movies, Bookings...)
│       ├── Services/      ← Business logic, bảo mật & Redis locks
│       ├── Data/          ← Database Context (EF Core)
│       ├── Entities/      ← Models ánh xạ CSDL
│       ├── DTOs/          ← Data Transfer Objects
│       └── appsettings.json 
│
└── Fronte/
    └── vite-project/      ← Code Frontend (React + Vite)
        ├── src/
        │   ├── components/
        │   ├── features/  ← Logic theo màn (auth, client, admin)
        │   ├── layouts/
        │   └── routes/
        └── package.json
```

---

## 🛠️ Hướng dẫn cài đặt & Chạy dự án (Local Development)

### 1. Yêu cầu Cài đặt
- **.NET SDK >= 9.0**
- **Node.js >= 18.0**
- **Docker Desktop** (để chạy Redis và MySQL tạm thời nếu cần)
- **MySQL >= 8.0**

### 2. Thiết lập Backend (.NET)
Mở Terminal, đi vào thư mục Backend:
```bash
cd Backe/DotnetBackend
```
1. Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```
2. Điền thông tin cấu hình vào `.env` (thông tin Redis, DB password, JWT Secret...).
3. Chạy Docker để kích hoạt Redis (bắt buộc để chạy ứng dụng):
```bash
docker compose -f ../api/docker-compose.yml up -d
```
4. Cập nhật cơ sở dữ liệu (tạo cấu trúc bảng tự động qua EF Core Migration):
```bash
dotnet ef database update
```
*(Nếu muốn nạp data mẫu, bạn có thể import database bằng cách: `mysql -h 127.0.0.1 -P 3307 -u root -p webphim < final-fixed-test-data.sql`)*
5. Khởi động server API:
```bash
dotnet run
```
*Backend sẽ chạy ở địa chỉ: `http://localhost:8080`*

### 3. Thiết lập Frontend (React)
Mở một Terminal mới, đi vào thư mục Frontend:
```bash
cd Fronte/vite-project
```
1. Cài đặt các thư viện phụ thuộc:
```bash
npm install
```
2. Khởi động Development Server:
```bash
npm run dev
```
*Frontend ứng dụng rạp phim sẽ bắt đầu tại: `http://localhost:5173` hoặc thông báo trên console.*

---

## 🔐 Authentication & Phân quyền

- Hệ thống sử dụng JWT Token nhưng **không** trả về Frontend. Token được đặt bảo mật hoàn toàn trong `HttpOnly Cookie`.
- Frontend cần được config `withCredentials: true` trên Axios để có thể gửi Cookie đi.
- Hỗ trợ Role-based Access Control (RBAC): Admin, Staff, Customer.

---

## 📌 Các tính năng mở rộng có thể bổ sung (Tương lai)
- Tối ưu UI/UX, thêm nhiều hiệu ứng tương tác đẹp mắt hơn.
- Tích hợp thêm các cổng thanh toán (như VNPay, MoMo) ngoài thẻ ngân hàng/SePay.
- Thu thập nhật ký truy xuất bằng file logs, chuẩn bị cho Microservices/Cluster.
