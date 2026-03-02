# Ticket Booking Architecture Plan (Redis + JPA)

## Overview
Xây dựng cơ chế Booking (Đặt vé) an toàn, hiệu suất cực cao và giải quyết triệt để vấn đề "Tranh chấp tài nguyên" (Race Condition). Hệ thống dùng Redis chạy qua **Docker** như một lớp Locking & Caching ở giữa (Middleware) trước khi tác động vào Database MySQL. Sử dụng **Redisson** để tối ưu quản lý Distributed Lock.

## Project Type
BACKEND

## Success Criteria
- Hệ thống giải quyết 100% "Double Booking" khi có hàng trăm request cùng lúc truy cập cùng 1 ghế.
- Phản hồi nhanh nhờ lấy trạng thái từ Redis Hash thay vì SQL.
- Có cơ chế giữ ghế (Lock Seat TTL) tự động hết hạn nếu hủy/quá giờ.
- Luồng Atomic Update: Thanh toán xong, xoá tạm trong Redis và update vĩnh viễn trong MySQL an toàn (có Rollback nếu MySQL lỗi).

## Tech Stack
- **Spring Boot 3.x (Java)**
- **Spring Data JPA & Hibernate** - Quản lý Entities cơ bản.
- **Docker & docker-compose** - Khởi chạy Redis service môi trường Dev.
- **Redis (Redisson Client)** - Quản lý Hash trạng thái ghế & cơ chế Distributed Lock chống Race Condition.

## File Structure
```text
.
├── docker-compose.yml                   # [NEW] Cấu hình chạy Redis image
├── src/main/java/team/api/
│   ├── config/
│   │   └── RedisConfig.java             # [NEW] Cấu hình Redisson Client
│   ├── entity/
│   │   ├── Showtime.java                # [NEW] Entiy Suất Chiếu
│   │   ├── Seat.java                    # [NEW] Entity Ghế
│   │   ├── Booking.java                 # [NEW] Entity Phiếu Đặt/Giữ Chỗ
│   │   └── Ticket.java                  # [NEW] Entity Vé (Đã bán)
│   ├── service/
│   │   └── BookingService.java          # [NEW] Logic chính Locking + Gọi DB
│   └── controller/
│       ├── BookingController.java       # [NEW] API Đặt ghế
│       └── WebhookController.java       # [NEW] Nhận Callback Payment
└── src/main/resources/
    └── application.yaml                 # [MODIFY] Thêm cấu hình redisson
```

## Task Breakdown

### Task 1: Setup Redis via Docker & Redisson
- **Agent**: `devops-engineer` / `backend-specialist`
- **Skill**: `server-management`, `api-patterns`
- **Dependencies**: None
- **INPUT**: Root folder (`docker-compose.yml`) & `pom.xml`
- **OUTPUT**: File `docker-compose.yml` khởi chạy Redis container thành công. Dependency `redisson-spring-boot-starter` được thêm vào `pom.xml`. Lớp `RedisConfig.java` bean được tạo.
- **VERIFY**: Chạy lệnh `docker-compose up -d` thành công, app Spring Boot connect được tới Redis (không báo lỗi bean).

### Task 2: Cấu trúc Entity MySQL cơ bản (JPA)
- **Agent**: `database-architect`
- **Skill**: `database-design`
- **Dependencies**: Task 1
- **INPUT**: `Showtime`, `Seat`, `Booking`, `Ticket` entities.
- **OUTPUT**: Định nghĩa cấu trúc Schema để lưu vết lại ai đặt, suất chiếu nào, vé sinh ra khi thanh toán xong. (Trạng thái tạm thời nằm ngoài DB).
- **VERIFY**: Hibernate `ddl-auto=update/validate` chạy mượt mà, tạo bảng thành công trong MySQL.

### Task 3: API Lấy trạng thái Ghế (Redis Hash)
- **Agent**: `backend-specialist`
- **Skill**: `clean-code`
- **Dependencies**: Task 2
- **INPUT**: Lệnh GET từ FE `GET /api/showtimes/{id}/seats`
- **OUTPUT**: Service sẽ quét `Redis Hash` (`showtime:{id}:seats`) ghép với Data gốc từ DB dể trả về Map danh sách ghế (`A1`: `AVAILABLE`, `A2`: `LOCKED`, `A3`: `SOLD`). Giúp giảm 90% tải DB lúc khách xem chỗ.
- **VERIFY**: API trả về đúng JSON Schema status.

### Task 4: API Đặt/Giữ Ghế (Redisson Lock & TTL)
- **Agent**: `backend-specialist`
- **Skill**: `clean-code`, `api-patterns`
- **Dependencies**: Task 3
- **INPUT**: POST Request đặt mảng ID Ghế.
- **OUTPUT**:
    1. Cố gắng lấy khóa Redisson `seat_lock:{showtimeId}_{seatId}`.
    2. Rớt lock -> Trả về lỗi "Ghế đã có người nhanh tay hơn".
    3. Trúng lock -> Lập tức Update Redis Hash thành `LOCKED`, tạo record `Booking` (status `PENDING`) vào MySQL, trả về `bookingId`. Kèm một Redisson `RMapCache` có cấu hình tự động giải phóng lock này sau 10 phút.
- **VERIFY**: Dùng tool test concurrent (Apache JMeter, Locust), 100 User bắn vào cùng 1 dãy ghế -> Chỉ duy nhất 1 User đặt thành công, 99 người còn lại fail gracefully (400 Conflict).

### Task 5: Webhook Xác nhận Thanh toán (Atomic Update)
- **Agent**: `backend-specialist` / `security-auditor`
- **Skill**: `api-patterns`
- **Dependencies**: Task 4
- **INPUT**: Webhook/Callback Payload từ VNPay/Momo gửi về báo thanh toán `bookingId` thành công.
- **OUTPUT**:
    1. Kiểm tra chữ ký (Signature) hợp lệ.
    2. Tạo MySQL Transaction (Bắt đầu):
    3. Update `Booking` -> `COMPLETED`, Generate `Ticket` records, Seat status -> `SOLD`.
    4. Sửa Redis Hash Field thành `SOLD` vĩnh viễn, gỡ Lock TTL.
    5. Fallback: Nếu MySQL throw Exception Constraint -> Rollback toàn bộ -> Redis Hash hồi lại nguyên thuỷ (Được bảo vệ bằng Redisson Watchdog).
- **VERIFY**: Gỉa lập postman fake payload Webhook hợp lệ, Database có sinh ra Tickets.

## Verification Phase (PHASE X)
- [ ] Chạy `docker-compose up -d` container redis báo Healthy.
- [ ] Redisson Spring Boot load profile an toàn.
- [ ] Redisson Lock test chứng minh không bị Race Condition khi High Concurrency.
- [ ] Transaction Rollback test chứng minh MySQL + Redis đồng bộ khi lỗi mạng.

## ✅ PHASE X COMPLETE
- Lint: ⏳ To be verified
- Security: ⏳ To be verified
- Build: ⏳ To be verified
- Date: [Pending]
