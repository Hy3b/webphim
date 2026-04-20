# Giải thích các file Backend chính (Admin & Movie Management)

Tài liệu này giải thích vai trò và luồng hoạt động của các file C# vừa được cập nhật/bổ sung trong module quản lý Phim và Suất chiếu của hệ thống WebPhim.

## 1. Entities (`Entities/Movie.cs`)
- **Vai trò**: Là lớp đại diện cho cấu trúc bảng `movies` trong MySQL.
- **Điểm mới**:
    - `IsDeleted`: Thuộc tính hỗ trợ **Soft Delete**. Khi Admin "xóa" một bộ phim, chúng ta không xóa bản ghi đó khỏi database để tránh làm hỏng các ràng buộc dữ liệu với các vé (bookings) đã bán trong quá khứ. Thay vào đó, chúng ta đánh dấu `IsDeleted = true`.
    - `Showtimes`: Thuộc tính điều hướng (Navigation property) giúp EF Core hiểu mối quan hệ 1-N (một phim có nhiều suất chiếu).

## 2. DTOs (Data Transfer Objects)

### `DTOs/MovieDtos.cs`
- **`MovieResponse`**: Chứa thông tin phim chuẩn hóa để gửi về cho Frontend.
- **`MoviePagedResponse`**: Một object bao bọc, chứa danh sách phim (`Items`) kèm theo các thông tin phân trang (`TotalCount`, `TotalPages`,...). Đây là chuẩn để hiển thị Table có phân trang ở Admin.
- **`CreateMovieRequest`**: Dữ liệu từ form thêm/sửa phim gửi lên.

### `DTOs/ShowtimeDtos.cs`
- **`AdminShowtimeResponse`**: Chứa đầy đủ thông tin nhất về một suất chiếu, bao gồm cả `SoldSeats` và `TotalSeats`. Dữ liệu này cực kỳ quan trọng để Frontend vẽ biểu đồ **Timeline Grid** và thanh tiến độ bán vé.
- **`AutoGenerateRequest`**: Chứa các tham số cho thuật toán tự động sinh lịch: Phim nào, ở phòng nào, từ mấy giờ đến mấy giờ, và thời gian dọn dẹp (`CleaningMinutes`) là bao nhiêu.

## 3. Controllers

### `Controllers/MovieController.cs`
- **Chức năng**: Quản lý API liên quan đến phim.
- **Phân tách luồng**: 
    - `GetAll`: Trả về mảng array đơn giản cho Client (Trang chủ).
    - `GetPaged`: Yêu cầu quyền `admin`, trả về object phân trang cho Admin Table.
- **Logic quan trọng**: Phương thức `Delete` (Soft Delete) sẽ gọi qua Service để kiểm tra phim có đang "bận" suất chiếu tương lai nào không trước khi cho phép ẩn đi.

### `Controllers/AdminShowtimeController.cs`
- **Chức năng**: Toàn bộ thao tác nghiệp vụ cho Admin về lịch chiếu.
- **Bảo mật**: Sử dụng `[Authorize(Roles = "admin")]` cho toàn bộ Controller.
- **Tính năng nổi bật**: 
    - `Create/Update`: Kiểm tra trùng lịch (Overlap) qua LINQ.
    - `Delete/Cancel`: Hủy suất chiếu đồng thời xóa cache trong Redis (`DEL showtime:{id}:*`) để giải phóng ghế.
    - `AutoGenerate`: API mạnh mẽ nhất, cho phép tạo hàng loạt suất chiếu chỉ với một cú click dựa trên thuật toán tối ưu khung giờ.

---

## Tóm tắt luồng hoạt động
1. **Admin** thao tác trên UI (React).
2. **Frontend** gọi API tương ứng trong các Controller này thông qua Axios.
3. **Controller** nhận request, validate cơ bản và chuyển cho **Service** (MovieService/ShowtimeService) xử lý logic nghiệp vụ nặng.
4. **Service** tương tác với **MySQL** (qua EF Core) và **Redis** (để quản lý cache/lock ghế).
5. Kết quả được trả ngược lại Controller dưới dạng **DTO**, sau đó Controller trả về mã HTTP (200, 201, 400,...) cho Frontend.
