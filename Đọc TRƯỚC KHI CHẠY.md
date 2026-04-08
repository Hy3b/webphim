# WebPhim — Hướng Dẫn Cài Đặt & Chạy Dự Án

> ⚡ **Backend đã được migrate từ Java Spring Boot sang ASP.NET Core (C#)**  
> Đọc kỹ hướng dẫn này trước khi chạy dự án.

---

## 📁 Cấu Trúc Thư Mục

```
webphim-Hanh/
├── Backe/
│   └── DotnetBackend/     ← Backend C# ASP.NET Core (MỚI)
└── Fronte/
    └── vite-project/      ← Frontend React + Vite
```

---

## 🔧 Yêu Cầu Cài Đặt

Đảm bảo máy đã có các phần mềm sau:

| Phần mềm           | Phiên bản    | Tải về                                         |
| ------------------ | ------------ | ---------------------------------------------- |
| **.NET SDK**       | 9.0 trở lên  | https://dotnet.microsoft.com/download          |
| **Node.js**        | 18.0 trở lên | https://nodejs.org                             |
| **Docker Desktop** | Bất kỳ       | https://www.docker.com/products/docker-desktop |
| **MySQL**          | 8.0 trở lên  | Chạy local hoặc qua Docker                     |

Kiểm tra nhanh:

```bash
dotnet --version    # Phải >= 9.0
node --version      # Phải >= 18.0
docker --version
```

---

## ⚙️ Bước 1 — Cấu Hình File `.env`

# 1. Tạo file .env từ mẫu

cp Backe/DotnetBackend/.env.example Backe/DotnetBackend/.env

# → Điền DB_PASSWORD, JWT_SECRET vào

# 2. Khởi động Redis và MySQL
docker compose -f Backe/DotnetBackend/docker-compose.yml up -d

# 3. Tạo bảng DB

cd Backe/DotnetBackend && dotnet ef database update

# 4. Nạp data mẫu

mysql -h 127.0.0.1 -P 3307 -u root -p webphim < final-fixed-test-data.sql

# 5. Chạy dự án (2 terminal)

dotnet run # Terminal 1 - Backend :8080
cd Fronte/vite-project && npm run dev # Terminal 2 - Frontend :5173

Vào thư mục `Backe/DotnetBackend/`, tạo file `.env` từ mẫu:

```bash
cd Backe/DotnetBackend
cp .env.example .env
```

Mở file `.env` và điền thông tin thực tế:

```env
# ── Database (MySQL) ──────────────────────────────
DB_HOST=127.0.0.1
DB_PORT=3307           # Cổng 3307 nếu chạy MySQL qua Docker, 3306 nếu chạy local
DB_NAME=webphim
DB_USER=root
DB_PASSWORD=rootpassword   # Thay bằng password MySQL thực của bạn

# ── JWT (bắt buộc >= 32 ký tự) ───────────────────
JWT_SECRET=your-super-secret-key-at-least-32-characters-long

# ── Redis ─────────────────────────────────────────
REDIS_HOST=127.0.0.1
REDIS_PORT=6380
REDIS_PASSWORD=webphim-secret-redis

# ── SePay Webhook (để trống nếu chưa dùng) ────────
SEPAY_WEBHOOK_SECRET=
```

> ⚠️ **Không commit file `.env` lên Git!** File này đã có trong `.gitignore`.

---

## 🐳 Bước 2 — Khởi Động Redis bằng Docker

Dự án dùng **Redis** để quản lý trạng thái ghế theo thời gian thực.  
Chạy lệnh sau tại thư mục gốc của project:

```bash
docker compose -f Backe/DotnetBackend/docker-compose.yml up -d
```

Kiểm tra Redis đang chạy:

```bash
docker ps
# Phải thấy: webphim-redis   Up
```

---

## 🗄️ Bước 3 — Chuẩn Bị Database MySQL

### 3a. Tạo database

Đảm bảo MySQL đang chạy, sau đó tạo database:

```sql
CREATE DATABASE webphim;
```

### 3b. Chạy Migration (tạo bảng tự động)

```bash
cd Backe/DotnetBackend
dotnet ef database update
```

Lệnh này sẽ tự tạo đầy đủ các bảng: `users`, `movies`, `rooms`, `seats`, `seat_types`, `showtimes`, `orders`, `bookings`, `booking_seats`.

### 3c. Nạp dữ liệu mẫu

```bash
mysql -h 127.0.0.1 -P 3307 -u root -p webphim < final-fixed-test-data.sql
```

> File `final-fixed-test-data.sql` nằm trong thư mục `Backe/DotnetBackend/`.

**Tài khoản test mặc định (mật khẩu: `password123`):**

| Email              | Role     |
| ------------------ | -------- |
| `admin@cinema.vn`  | Admin    |
| `staff@cinema.vn`  | Staff    |
| `khach1@gmail.com` | Customer |
| `khach2@gmail.com` | Customer |

---

## 🚀 Bước 4 — Chạy Backend (C# ASP.NET Core)

```bash
cd Backe/DotnetBackend
dotnet run
```

Backend khởi động tại: **http://localhost:8080**

Kiểm tra nhanh:

```bash
curl http://localhost:8080/api/movies
# Phải thấy danh sách phim dạng JSON
```

---

## 🌐 Bước 5 — Chạy Frontend (React + Vite)

```bash
cd Fronte/vite-project
npm install      # Lần đầu chạy mới cần
npm run dev
```

Frontend khởi động tại: **http://localhost:5173** hoặc **http://localhost:5174**

---

## 📋 Tóm Tắt Lệnh Chạy Hàng Ngày

```bash
# Terminal 1: Redis và MySQL (nếu chưa chạy)
docker compose -f Backe/DotnetBackend/docker-compose.yml up -d

# Terminal 2: Backend
cd Backe/DotnetBackend && dotnet run

# Terminal 3: Frontend
cd Fronte/vite-project && npm run dev
```

---

## 🗺️ Sơ Đồ API

| Method | Endpoint                         | Mô tả                  | Auth      |
| ------ | -------------------------------- | ---------------------- | --------- |
| POST   | `/api/auth/login`                | Đăng nhập              | ❌        |
| POST   | `/api/auth/register`             | Đăng ký                | ❌        |
| GET    | `/api/auth/me`                   | Thông tin user         | 🍪 Cookie |
| POST   | `/api/auth/logout`               | Đăng xuất              | 🍪 Cookie |
| GET    | `/api/movies`                    | Danh sách phim         | ❌        |
| GET    | `/api/movies/{id}`               | Chi tiết phim          | ❌        |
| GET    | `/api/showtimes`                 | Danh sách suất chiếu   | ❌        |
| GET    | `/api/showtimes/{id}`            | Chi tiết suất chiếu    | ❌        |
| GET    | `/api/showtimes/movie/{movieId}` | Suất chiếu theo phim   | ❌        |
| GET    | `/api/showtimes/{id}/seats`      | Trạng thái ghế (Redis) | ❌        |
| POST   | `/api/bookings`                  | Đặt vé                 | 🍪 Cookie |
| POST   | `/api/payment/sepay-webhook`     | Nhận webhook SePay     | 🔑 Secret |
| GET    | `/api/payment/status/{code}`     | Kiểm tra thanh toán    | ❌        |
| POST   | `/api/admin/bookings`            | Đặt vé tại quầy        | 🍪 Admin  |
| POST   | `/api/admin/tickets/scan`        | Quét vé check-in       | 🍪 Staff  |

---

## ❓ Xử Lý Sự Cố Thường Gặp

### ❌ Lỗi `Connection refused` khi chạy backend

→ Kiểm tra MySQL đang chạy và thông tin trong `.env` đúng với port thật.

### ❌ Lỗi Redis `NOAUTH`

→ `REDIS_PASSWORD` trong `.env` phải khớp với password trong `docker-compose.yml`.

### ❌ Frontend không thấy dữ liệu

→ Kiểm tra Backend đang chạy ở đúng port `8080`.  
→ Chạy `curl http://localhost:8080/api/movies` để xác nhận.

### ❌ Đăng nhập thành công nhưng không vào được trang user

→ Đảm bảo `credentials: 'include'` có trong các `fetch()` request.  
→ Header CORS đã cho phép `localhost:5173` và `localhost:5174`.

### ❌ `dotnet ef` không tìm thấy

→ Cài EF Core Tools: `dotnet tool install --global dotnet-ef`

---

## 🛠️ Tech Stack

| Tầng             | Công nghệ                                    |
| ---------------- | -------------------------------------------- |
| **Frontend**     | React 19, Vite, React Router v7              |
| **Backend**      | ASP.NET Core (.NET 9), Entity Framework Core |
| **Database**     | MySQL 8                                      |
| **Cache / Lock** | Redis 7 (Docker)                             |
| **Auth**         | JWT (HttpOnly Cookie) + BCrypt               |
| **Payment**      | SePay Webhook                                |
