<div align="center">
  <h1>🎬 WebPhim - Cinema Booking System (.NET Core + React)</h1>
  <p>Hệ thống đặt vé xem phim trực tuyến hiện đại với đầy đủ tính năng dành cho Khách hàng & Ban Quản Trị.</p>
  <p><i>(Dự án đã được di chuyển thành công từ Java Spring Boot sang ASP.NET Core)</i></p>
  <img src="https://img.shields.io/badge/.NET-9.0-5C2D91?logo=dotnet" alt=".NET 9" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Database-MySQL-4479A1?logo=mysql" alt="MySQL" />
  <img src="https://img.shields.io/badge/Cache-Redis-DC382D?logo=redis" alt="Redis" />
  <img src="https://img.shields.io/badge/Frontend-DarkMode%20%2B%20Glassmorphism-0d1117" alt="Dark Mode" />
</div>

<hr/>

## 📖 Tổng quan

**WebPhim** là nền tảng quản lý rạp chiếu phim và đặt vé trực tuyến giúp Khách hàng (Client) có thể duyệt phim, xem lịch chiếu theo ngày giờ, chọn ghế **real-time** và thanh toán tự động qua **SePay Webhook**. Đối với Ban quản trị (Admin/Staff), hệ thống cung cấp Dashboard quản lý toàn diện bao gồm: thêm/sửa/xoá phim, quản lý suất chiếu theo **Timeline Grid**, tự động tạo lịch chiếu, đặt vé tại quầy và quét vé check-in.

---

## 🚀 Công nghệ sử dụng (Tech Stack)

### 💅 Frontend (Client & Admin)
- **Framework:** ReactJS 19 (với Vite 7 build tool)
- **Routing:** React Router DOM v7
- **Styling:** CSS Modules & Tailwind CSS — **Dark Mode + Glassmorphism** theme
- **Networking:** Axios (hỗ trợ `withCredentials` cho Cookie-based JWT)
- **Admin UI:** Inter font, Lucide Icons, custom Timeline Grid Component

### ⚙️ Backend (RESTful API)
- **Framework:** ASP.NET Core API (.NET 9)
- **Security:** JWT (JSON Web Token) lưu qua HttpOnly Cookie + BCrypt Password Hashing
- **ORM:** Entity Framework Core 10 (Code-First Migration)

### 🗄️ Database, Caching & Khác
- **Database:** MySQL 8
- **Caching & Locking:** Redis — Distributed Lock (chống Race Condition khi đặt ghế) + Cache Invalidation khi Admin cập nhật lịch chiếu
- **Payment Gateway:** Tích hợp Webhook SePay xử lý thanh toán tự động
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

5. **Admin — Quản lý Phim (`/admin/movies`):** *(Mới)*
   - Bảng danh sách phim với **Soft Delete** (không xóa vật lý).
   - Tìm kiếm, lọc theo trạng thái, phân trang server-side.
   - Validation: title trùng, duration hợp lệ.
   - Chặn xóa phim nếu còn suất chiếu tương lai có vé `pending/paid`.

6. **Admin — Quản lý Suất Chiếu (`/admin/showtimes`):** *(Mới)*
   - **Timeline Grid** hiển thị toàn bộ lịch chiếu theo từng phòng, trục thời gian 08:00–24:00.
   - Mỗi suất chiếu là một card Glassmorphism với **Progress Bar** bán vé gradient.
   - Kiểm tra **chồng giờ (overlap)** bằng LINQ trước khi tạo/sửa suất.
   - Khi Admin hủy/cập nhật: tự động **xóa Redis cache** (`DEL showtime:{id}:*`) để trả ghế về trạng thái trống.
   - **Auto-generate**: thuật toán tự động lấp đầy lịch chiếu, tính đến `CleaningTime` (mặc định 15 phút) giữa các suất.

---

## 🏛️ Sơ đồ hệ thống & Luồng hoạt động chính

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

Admin
    │
    ├─ Quản lý Phim (GET/POST/PUT/DELETE /api/movies/paged)
    │       → Soft Delete: check booking → set IsDeleted=true
    │
    └─ Quản lý Suất Chiếu (GET/POST/PUT/DELETE /api/admin/showtimes)
            → Overlap check (LINQ) trước khi lưu
            → Khi sửa/hủy: DEL showtime:{id}:* trên Redis
            → Auto-generate: fill lịch với CleaningTime
```

---

## 📂 Cấu trúc thư mục

```text
webphim/
├── Backe/
│   └── DotnetBackend/           ← Toàn bộ mã nguồn Backend API (C#)
│       ├── Controllers/
│       │   ├── MovieController.cs          ← CRUD phim + paged
│       │   ├── AdminShowtimeController.cs  ← Admin suất chiếu + auto-gen (Mới)
│       │   ├── ShowtimeController.cs       ← Client-facing
│       │   └── ...
│       ├── Services/
│       │   ├── MovieService.cs      ← Soft Delete, paged, validation
│       │   ├── ShowtimeService.cs   ← Overlap check, Redis DEL, auto-generate
│       │   └── ...
│       ├── DTOs/
│       │   ├── MovieDtos.cs         ← MoviePagedResponse, CreateMovieRequest
│       │   ├── ShowtimeDtos.cs      ← AdminShowtimeResponse, AutoGenerateRequest
│       │   └── ...
│       ├── Entities/
│       │   ├── Movie.cs             ← + IsDeleted (Soft Delete)
│       │   └── ...
│       └── Migrations/              ← AddMovieSoftDelete migration
│
└── Fronte/
    └── vite-project/
        └── src/
            ├── modules/
            │   └── admin/
            │       ├── layouts/AdminLayout.jsx
            │       └── pages/
            │           ├── AdminDashboard/
            │           ├── MovieManager/        ← (Mới)
            │           │   ├── MovieManager.jsx
            │           │   ├── MovieManager.css
            │           │   ├── MovieFormModal.jsx
            │           │   └── MovieFormModal.css
            │           └── ShowtimeManager/     ← (Mới)
            │               ├── ShowtimeManager.jsx
            │               ├── ShowtimeManager.css
            │               ├── ShowtimeTimelineGrid.jsx
            │               ├── ShowtimeTimelineGrid.css
            │               ├── ShowtimeFormModal.jsx
            │               ├── ShowtimeFormModal.css
            │               ├── AutoGenerateModal.jsx
            │               └── AutoGenerateModal.css
            ├── services/
            │   ├── api.js
            │   ├── adminMovieApi.js      ← (Mới)
            │   └── adminShowtimeApi.js   ← (Mới)
            └── routes/
                └── AppRoutes.jsx         ← + /admin/movies, /admin/showtimes
```

---

## 🛠️ Hướng dẫn cài đặt & Chạy dự án (Local Development)

### 1. Yêu cầu Cài đặt
- **.NET SDK >= 9.0**
- **Node.js >= 18.0**
- **Docker Desktop** (để chạy Redis và MySQL)
- **MySQL >= 8.0**

### 2. Thiết lập Backend (.NET)
```bash
cd Backe/DotnetBackend
cp .env.example .env
# Điền thông tin DB, Redis, JWT Secret vào .env

# Khởi động Redis & MySQL
docker compose up -d

# Cập nhật database (bao gồm migration IsDeleted mới)
dotnet ef database update

# Khởi động server
dotnet run
```
*Backend chạy tại: `http://localhost:8080`*

### 3. Thiết lập Frontend (React)
```bash
cd Fronte/vite-project
npm install
npm run dev
```
*Frontend chạy tại: `http://localhost:5173`*

---

## 🔐 Authentication & Phân quyền

- Hệ thống sử dụng JWT Token **lưu trong HttpOnly Cookie** (không expose ra Frontend).
- Frontend cần config `withCredentials: true` trên Axios để gửi Cookie.
- Role-based Access Control (RBAC): `Admin`, `Staff`, `Customer`.
- Tất cả endpoint `/api/admin/*` yêu cầu role `admin`.

---

## 🗃️ Changelog

### v2.0 — Admin Movie & Showtime Management *(2026-04-17)*

#### Backend
- **`Movie.cs`**: Thêm trường `is_deleted` (Soft Delete).
- **`MovieDtos.cs`**: Thêm `MoviePagedResponse` (phân trang server-side), `IsDeleted` vào `MovieResponse`.
- **`ShowtimeDtos.cs`**: Thêm `AdminShowtimeResponse`, `CreateShowtimeRequest`, `UpdateShowtimeRequest`, `AutoGenerateRequest`, `AutoGenerateResult`.
- **`MovieService.cs`**: Refactor — thêm `GetPagedAsync` (search/filter/page), `SoftDeleteAsync` (validate active bookings), validation title trùng + duration.
- **`ShowtimeService.cs`**: Thêm `GetAdminShowtimesAsync`, `CreateAsync` (overlap LINQ check), `UpdateAsync` (Redis cache invalidation), `CancelAsync`, `AutoGenerateAsync` (DB transaction + cleaning time algorithm).
- **`MovieController.cs`**: Thêm route `GET /api/movies/paged`, xử lý error 400 rõ ràng.
- **`AdminShowtimeController.cs`** *(Mới)*: CRUD suất chiếu cho Admin + `POST /auto-generate`.
- **`Migration AddMovieSoftDelete`**: Thêm cột `is_deleted` vào bảng `movies`.

#### Frontend
- **`adminMovieApi.js`** *(Mới)*: Service layer gọi API phim Admin.
- **`adminShowtimeApi.js`** *(Mới)*: Service layer gọi API suất chiếu Admin.
- **`MovieManager/`** *(Mới)*: Trang quản lý phim — Dark Mode, search/filter/pagination, form modal, confirm delete.
- **`ShowtimeManager/`** *(Mới)*: Trang quản lý lịch chiếu với **Timeline Grid** (08:00–24:00), Glassmorphism cards, gradient progress bar, auto-generate modal.
- **`AppRoutes.jsx`**: Kết nối `/admin/movies` → `MovieManager`, `/admin/showtimes` → `ShowtimeManager`.

### v1.x — Các phiên bản trước
- Hệ thống Client: xem phim, lịch chiếu, đặt ghế real-time, thanh toán SePay Webhook.
- Refactor cấu trúc Frontend từ generic sang Domain-Driven Design (features-based).
- Payment unit tests, Auth API automation tests.

---

## 📌 Tính năng dự kiến (Roadmap)
- [ ] Tối ưu UI/UX Admin với biểu đồ doanh thu thực.
- [ ] Tích hợp thêm cổng thanh toán (VNPay, MoMo).
- [ ] Hệ thống logs & monitoring (Serilog / OpenTelemetry).
- [ ] Chuẩn bị Microservices/Cluster architecture.
