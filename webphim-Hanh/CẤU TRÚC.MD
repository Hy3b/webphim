# WebPhim — Cấu Trúc Dự Án

> Backend: ASP.NET Core (C#) · Frontend: React + Vite

---

## 🗂️ Tổng Quan Thư Mục Gốc

```
webphim-Hanh/
├── Backe/
│   └── DotnetBackend/   ← Toàn bộ Backend API (C# ASP.NET Core)
├── Fronte/
│   └── vite-project/    ← Toàn bộ Frontend (React + Vite)
└── README.md
```

---

## 🔧 BACKEND — `Backe/DotnetBackend/`

```
DotnetBackend/
├── Program.cs                    ← Điểm khởi động app: đăng ký DI, CORS, JWT, Redis, DB
├── appsettings.json              ← Cấu hình server (DB, JWT, Redis, CORS origins)
├── .env                          ← Biến môi trường nhạy cảm (KHÔNG commit lên Git)
├── .env.example                  ← Mẫu .env cho team members
├── WebPhimApi.csproj             ← Khai báo package NuGet (EF Core, JWT, Redis, BCrypt...)
├── final-fixed-test-data.sql     ← Script SQL nạp dữ liệu mẫu vào DB
│
├── Configuration/
│   └── JwtService.cs             ← Tạo và xác thực JWT token (tương đương JwtUtil.java)
│
├── Data/
│   └── AppDbContext.cs           ← DbContext EF Core: khai báo bảng, constraints, enum conv
│
├── Entities/                     ← Ánh xạ bảng DB (tương đương @Entity của Java)
│   ├── User.cs                   ← Bảng users (username, email, passwordHash, role)
│   ├── Movie.cs                  ← Bảng movies (title, poster, genre, status...)
│   ├── Room.cs                   ← Bảng rooms (tên phòng, số ghế, trạng thái)
│   ├── SeatType.cs               ← Bảng seat_types (Normal / VIP / Couple + phụ thu)
│   ├── Seat.cs                   ← Bảng seats (phòng + hàng + số ghế + loại ghế)
│   ├── Showtime.cs               ← Bảng showtimes (phim + phòng + giờ chiếu + giá)
│   ├── Order.cs                  ← Bảng orders (mã đơn, tổng tiền, trạng thái thanh toán)
│   ├── Booking.cs                ← Bảng bookings (order + suất chiếu)
│   └── BookingSeat.cs            ← Bảng booking_seats (ghế cụ thể đã đặt + giá + check-in)
│
├── DTOs/                         ← Data Transfer Objects (Request/Response schemas)
│   ├── AuthDtos.cs               ← LoginRequest, RegisterRequest, AuthResponse, UserInfoResponse
│   ├── MovieDtos.cs              ← MovieResponse, CreateMovieRequest
│   ├── ShowtimeDtos.cs           ← ShowtimeDetailResponse, SeatStatusResponse
│   ├── BookingDtos.cs            ← BookingRequest, CreateBookingResponse, AdminBookingRequest...
│   └── PaymentDtos.cs            ← SePayWebhookRequest
│
├── Services/                     ← Business logic (tương đương @Service của Java)
│   ├── AuthService.cs            ← Xác thực BCrypt, tạo token, lấy thông tin user
│   ├── MovieService.cs           ← CRUD phim
│   ├── ShowtimeService.cs        ← Lấy suất chiếu + đọc trạng thái ghế từ Redis
│   ├── BookingService.cs         ← Đặt vé: Redis distributed lock → DB → đánh dấu LOCKED
│   ├── PaymentService.cs         ← Xử lý SePay webhook → cập nhật SOLD trên Redis + DB
│   └── AdminServices.cs          ← AdminBookingService (đặt quầy) + AdminTicketService (quét vé)
│
├── Controllers/                  ← API Endpoints (tương đương @RestController của Java)
│   ├── AuthController.cs         ← /api/auth/** (login, register, me, logout)
│   ├── MovieController.cs        ← /api/movies/** (GET all/by-id, POST/PUT/DELETE cho admin)
│   ├── ShowtimeController.cs     ← /api/showtimes/** (GET all/by-movie/by-id/seats)
│   ├── BookingController.cs      ← /api/bookings (POST tạo booking)
│   ├── PaymentController.cs      ← /api/payment/** (webhook SePay, check status)
│   └── AdminControllers.cs       ← /api/admin/bookings và /api/admin/tickets/scan
│
└── Migrations/                   ← EF Core migration files (tự sinh, không sửa tay)
```

---

## 🌐 FRONTEND — `Fronte/vite-project/src/`

```
src/
├── main.jsx                      ← Điểm khởi động React, bọc AuthProvider + Router
├── index.css                     ← CSS global (biến màu, font, reset)
│
├── app/
│   └── App.jsx                   ← Component gốc khai báo toàn bộ Routes của ứng dụng
│
├── routes/                       ← Cấu hình điều hướng theo role
│   ├── AdminRoute.jsx            ← Route bảo vệ dành riêng cho Admin
│   └── PrivateRoute.jsx          ← Route cần đăng nhập
│
├── context/                      ← Global Contexts (trạng thái chung)
│   └── AuthContext.jsx           ← Trạng thái Auth (đăng nhập, token, vai trò)
│
├── modules/                      ← Tính năng phân tách theo miền (Domain-Driven Design)
│   │
│   ├── admin/                    ← Miền quản trị viên
│   │   ├── components/           ← Các thành phần UI riêng cho trang admin
│   │   ├── layouts/              ← Layout bao bọc dashboard admin (Sidebar + Header Admin)
│   │   └── pages/                ← Các trang: AdminDashboard, MovieManager,...
│   │
│   ├── client/                   ← Miền khách hàng (người dùng end-user)
│   │   ├── components/           ← Header, Footer và các mục view riêng của client
│   │   ├── layouts/              ← ClientLayout bọc nội dung (Navbar + Body + Footer)
│   │   └── pages/                ← Trang: HomePage, MovieDetail, BookingPage, Schedule,...
│   │
│   └── auth/                     ← Miền xác thực người dùng
│       ├── layouts/              ← Layout trống cho form login/register
│       └── pages/                ← LoginPage, RegisterPage
│
├── shared/                       ← Chia sẻ chung giữa nhiều miền (admin, client, auth)
│   ├── components/               ← Các thành phần tĩnh/tái sử dụng nhiều nơi
│   │   ├── Button/               ← Nút bấm chung
│   │   ├── LoadingOverlay/       ← Giao diện loading xoay chuyên nghiệp
│   │   ├── movie_card/           ← Card hiển thị thông tin phim ngắn gọn
│   │   └── ShowtimeGrid/         ← Lưới giờ chiếu (chọn thời gian)
│   ├── context/                  ← React Context chung
│   ├── services/                 ← Kế nối API hoặc utils nghiệp vụ dùng chung
│   └── utils/                    ← Các hàm định dạng tĩnh (format date, price...)
│
├── styles/                       ← Khai báo style/font/màu chung
└── services/                     ← Logic/API calls gọi DB tổng quát
```

---

## 🔄 Luồng Dữ Liệu Chính

```
Khách hàng
    │
    ├─ Xem phim & lịch chiếu
    │       GET /api/movies          → MovieService → DB
    │       GET /api/showtimes       → ShowtimeService → DB
    │
    ├─ Chọn ghế
    │       GET /api/showtimes/{id}/seats  → ShowtimeService → Redis (trạng thái thực)
    │
    ├─ Đặt vé
    │       POST /api/bookings
    │           → Redis lock (tránh 2 người đặt cùng ghế)
    │           → DB: Order + Booking + BookingSeat
    │           → Redis: đánh dấu LOCKED 10 phút
    │
    └─ Thanh toán (SePay)
            POST /api/payment/sepay-webhook
                → PaymentService: xác thực → cập nhật Order "paid"
                → Redis: đánh dấu ghế SOLD vĩnh viễn
```
