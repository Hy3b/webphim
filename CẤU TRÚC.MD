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
├── App.jsx                       ← Khai báo toàn bộ Routes của ứng dụng
├── index.css                     ← CSS global (biến màu, font, reset)
│
├── context/
│   └── AuthContext.jsx           ← Global state đăng nhập: user, login(), logout()
│                                    → Gọi GET /api/auth/me để xác thực qua Cookie
│
├── layouts/
│   ├── ClientLayout.jsx          ← Layout trang khách: Header + <Outlet> + Footer
│   └── AdminLayout.jsx           ← Layout trang admin: Sidebar + <Outlet>
│
├── components/                   ← UI components dùng chung
│   ├── common/
│   │   ├── Button/               ← Nút bấm tái sử dụng
│   │   └── ShowtimeGrid/         ← Lưới hiển thị giờ chiếu
│   ├── layout/
│   │   ├── Header/               ← Header: logo, nav, nút đăng nhập/logout
│   │   └── Footer/               ← Footer trang web
│   └── movie_card/               ← Card hiển thị thông tin phim (poster, tên, rating)
│
├── features/
│   │
│   ├── auth/                     ← Xác thực người dùng
│   │   └── pages/
│   │       ├── LoginPage.jsx     ← Form đăng nhập → POST /api/auth/login
│   │       └── RegisterPage.jsx  ← Form đăng ký → POST /api/auth/register
│   │
│   ├── client/                   ← Tất cả trang của khách hàng
│   │   │
│   │   ├── home/                 ← Trang chủ
│   │   │   ├── HomePage.jsx      ← Hiển thị banner + phim đang chiếu / sắp chiếu
│   │   │   └── components/
│   │   │       └── BannerSlider/ ← Slide ảnh banner tự động
│   │   │
│   │   ├── Schedule/             ← Trang lịch chiếu
│   │   │   ├── LichChieu.jsx     ← Lấy phim (GET /api/movies) + suất (GET /api/showtimes)
│   │   │   │                       → Nhóm theo ngày, bấm vào giờ → chuyển sang Booking
│   │   │   └── components/
│   │   │       ├── DateSelector/ ← Tab chọn ngày
│   │   │       ├── MovieItem/    ← Một dòng phim trong lịch chiếu
│   │   │       └── NoteSection/  ← Ghi chú màu ghế
│   │   │
│   │   ├── movie/
│   │   │   └── MovieDetail.jsx   ← Chi tiết phim (lấy theo id) + nút "Đặt vé"
│   │   │
│   │   ├── booking/              ← Luồng đặt vé
│   │   │   ├── BookingPage/      ← Chọn ghế
│   │   │   │   └── BookingPage.jsx
│   │   │   │       ← GET /api/showtimes/{id}/seats (Redis real-time)
│   │   │   │       ← POST /api/bookings (Redis lock + DB)
│   │   │   ├── SeatMap/          ← Sơ đồ ghế 2D (render từng ghế theo trạng thái)
│   │   │   └── BookingSummary/   ← Sidebar tóm tắt: phim, ghế, giá → nút xác nhận
│   │   │
│   │   ├── payment/
│   │   │   └── PaymentPage.jsx   ← Hiển thị QR SePay + polling GET /api/payment/status
│   │   │
│   │   └── ticket/
│   │       └── TicketPage.jsx    ← Hiển thị e-ticket sau khi thanh toán thành công
│   │
│   └── admin/                    ← Trang quản trị (chỉ Admin/Staff)
│       └── dashboard/
│           └── AdminDashboard.jsx ← Dashboard quản lý (phim, phòng, vé, thống kê)
│
└── pages/
    └── ProfilePage.jsx           ← Trang thông tin cá nhân của user
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
