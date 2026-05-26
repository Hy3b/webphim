# Kế hoạch triển khai trang Hồ sơ người dùng (/profile)

Tạo trang hồ sơ cá nhân hoàn chỉnh dạng thẻ (card style) tại `/profile` cho khách hàng, bao gồm hiển thị thông tin cá nhân, cập nhật thông tin và lịch sử đặt vé (các vé đã thanh toán).

## User Review Required

> [!IMPORTANT]
> **Về thay đổi ở Backend**: 
> Để hỗ trợ cập nhật thông tin cá nhân và tải lịch sử đặt vé, chúng ta cần bổ sung 2 API endpoints ở Backend .NET:
> 1. `PUT /api/auth/update-profile`: Cho phép cập nhật `FullName` và `PhoneNumber`.
> 2. `GET /api/bookings/history`: Trả về danh sách các đơn đặt vé đã thanh toán (`OrderStatus.paid`) của người dùng hiện tại kèm thông tin chi tiết phim, phòng, suất chiếu và ghế.

## Proposed Changes

### 1. Frontend Component (React + Vite)

#### [MODIFY] [AppRoutes.jsx](file:///d:/Documents/code/webphimCS/Fronte/vite-project/src/routes/AppRoutes.jsx)
- Import và đăng ký route `/profile` dẫn tới `<ProfilePage />` trong nhóm Client Routes (nằm trong `<ClientLayout />`).

#### [MODIFY] [ProfilePage.jsx](file:///d:/Documents/code/webphimCS/Fronte/vite-project/src/modules/client/pages/Profile/ProfilePage.jsx)
- Cập nhật giao diện:
  - Chia làm 2 khu vực chính nằm trong container thẻ (Glassmorphism card):
    - **Thẻ thông tin cá nhân (Profile Card)**: Hiển thị avatar tròn (chữ cái đầu của tên), tên đăng nhập, vai trò, email, số điện thoại, họ tên. Có nút "Chỉnh sửa" mở form cập nhật.
    - **Danh sách vé đã đặt (Booking History Card)**: Hiển thị danh sách vé của phim đã đặt bao gồm: Tên phim, Rạp/Phòng chiếu, Giờ/Ngày chiếu, Danh sách ghế, Mã đơn hàng, và nút hiển thị mã QR check-in trực tiếp.
  - Sử dụng `useAuth()` từ AuthContext để đọc thông tin người dùng hiện tại thay vì giải mã thủ công JWT token như trước để đồng bộ trạng thái khi cập nhật.
  - Thêm form/modal cập nhật thông tin cá nhân trực tiếp.

#### [MODIFY] [ProfilePage.css](file:///d:/Documents/code/webphimCS/Fronte/vite-project/src/modules/client/pages/Profile/ProfilePage.css)
- Thiết kế giao diện hiện đại theo phong cách **Glassmorphism**:
  - Background tối mờ (nền gradient mượt kết hợp với blur).
  - Thẻ thông tin bo góc mượt mà, viền sáng mảnh (1px border với opacity).
  - Sử dụng bảng màu chính của rạp phim (Màu cam `#e87722` làm chủ đạo, kết hợp chữ màu trắng sáng, nền tối mờ hoặc xám đậm).
  - Micro-animations: Hiệu ứng chuyển động mượt mà khi hover vào các thẻ vé, hiệu ứng mở rộng (accordion) khi xem QR vé.

---

### 2. Backend (DotnetBackend)

#### [MODIFY] [AuthController.cs](file:///d:/Documents/code/webphimCS/Backe/DotnetBackend/Controllers/AuthController.cs)
- Thêm API `PUT api/auth/update-profile` nhận DTO cập nhật (`FullName`, `PhoneNumber`) từ payload, thực hiện lưu thay đổi vào cơ sở dữ liệu cho User hiện tại dựa trên `ClaimTypes.NameIdentifier`.

#### [MODIFY] [BookingController.cs](file:///d:/Documents/code/webphimCS/Backe/DotnetBackend/Controllers/BookingController.cs)
- Thêm API `GET api/bookings/history` (cần quyền `Authorize`). Truy vấn danh sách các `Order` có trạng thái là `paid` của `UserId` đang đăng nhập, nạp thêm các thực thể liên quan: `Bookings`, `BookingSeats`, `Showtime`, `Movie`, `Room` để trả về đầy đủ thông tin vé cho Client.

---

## Task Breakdown

### Task 1: Định cấu hình Route cho trang `/profile`
- **Agent**: `frontend-specialist`
- **Skill**: `react-best-practices`
- **INPUT**: `AppRoutes.jsx` và component `ProfilePage` sẵn có.
- **OUTPUT**: Route `/profile` hoạt động, hiển thị trang hồ sơ trống khi truy cập trực tiếp hoặc bấm vào menu header.
- **VERIFY**: Truy cập link `/profile` trên trình duyệt sau khi đăng nhập và xem trang Profile đã được render thành công.

### Task 2: Phát triển Backend API cho trang hồ sơ
- **Agent**: `backend-specialist`
- **Skill**: `api-patterns`
- **INPUT**: `AuthController.cs`, `BookingController.cs` và EF Core DbContext.
- **OUTPUT**: 
  - Endpoint `PUT /api/auth/update-profile` cập nhật thông tin thành công.
  - Endpoint `GET /api/bookings/history` trả về danh sách lịch sử đặt vé gồm mã đơn hàng, ngày đặt, phim, suất chiếu, phòng, ghế.
- **VERIFY**: Sử dụng HTTP file `.http` hoặc Postman để gọi thử nghiệm các API trên với token người dùng hợp lệ.

### Task 3: Cập nhật thông tin cá nhân và Form chỉnh sửa (Frontend)
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **INPUT**: `ProfilePage.jsx` và `AuthContext.jsx`.
- **OUTPUT**: Người dùng bấm nút "Chỉnh sửa", một biểu mẫu trực quan xuất hiện cho phép nhập thông tin mới và gửi yêu cầu lưu thành công tới API Backend.
- **VERIFY**: Tiến hành cập nhật số điện thoại và họ tên, kiểm tra xem giao diện có tự động cập nhật lại mà không cần tải lại trang hay không.

### Task 4: Hiển thị Lịch sử đặt vé & Mã QR (Frontend)
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **INPUT**: API kết nối `api.js` và `ProfilePage.jsx`.
- **OUTPUT**: Hiển thị danh sách vé dưới dạng các thẻ nhỏ tiện lợi. Nhấp vào vé sẽ hiển thị mã QR chứa mã đơn hàng (`DHxx`) và chỉ dẫn check-in tại quầy.
- **VERIFY**: Sử dụng tài khoản thử nghiệm đã mua vé thành công, xác nhận hiển thị đúng tên phim, thời gian chiếu, số ghế và mã QR khớp với thông tin đặt vé.

### Task 5: Thiết kế giao diện Glassmorphism & Tối ưu hóa CSS
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **INPUT**: `ProfilePage.css`.
- **OUTPUT**: Giao diện đạt chuẩn thiết kế cao cấp, có hiệu ứng đổ bóng mờ, viền neon nhẹ, màu cam thương hiệu của rạp phim, và hoàn toàn responsive trên di động.
- **VERIFY**: Co giãn màn hình trình duyệt để kiểm tra hiển thị trên thiết bị di động.

---

## Verification Plan

### Automated Tests
- Chạy validation linter của frontend:
  ```bash
  npm run lint
  ```
- Kiểm tra build thành công của .NET Backend và React Frontend.

### Manual Verification
1. Đăng nhập vào hệ thống từ giao diện chính.
2. Click vào menu góc phải trên Header, chọn **👤 Thông tin cá nhân**.
3. Xác nhận chuyển trang thành công tới `/profile`.
4. Nhấp vào nút thay đổi thông tin cá nhân, sửa thông tin và lưu lại. Xác nhận cập nhật thành công.
5. Kiểm tra danh sách vé đã đặt: hiển thị chính xác các vé đã thanh toán trước đó. Thử click vào một vé bất kì để hiển thị QR vé.
