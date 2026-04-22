# 🧪 Hướng dẫn Unit Testing - WebPhimApi

Thư mục `WebPhimApi.Tests` là project dùng để viết code kiểm thử tự động (Unit Test) cho hệ thống backend của WebPhimApi.

## 🛠 Các công nghệ được sử dụng

- **xUnit**: Là framework để chạy Unit Test chuẩn mực nhất trong .NET hiện nay (thay thế MSTest). Mỗi bài test (test case) được đánh dấu bằng annotation `[Fact]`.
- **FluentAssertions**: Thư viện giúp các câu lệnh kiểm tra (Assert) gần gũi với ngôn ngữ tự nhiên và dễ đọc hơn rất nhiều so với Assert mặc định. (VD: `result.Should().Be(...)` thay vì `Assert.Equal(...)`).
- **Moq**: Thư viện mô phỏng (Mocking) đối tượng dành riêng cho .NET. Giúp giả lập các service bên thứ ba, database hoặc bất kì dependency nào cần fake kết quả trả về trong code mà không phải gọi thật.
- **Entity Framework Core In-Memory**: Là một database ảo chạy trực tiếp trên RAM, được dùng để giả lập Entity Framework Database nhằm tăng tốc các đoạn mã test liên quan đến cơ sở dữ liệu thay vì khởi tạo một database thật sự.

## 📂 Cách tổ chức Code

Các bài test thường được chia thành 3 phần (Arrange - Act - Assert), theo mẫu chuẩn AAA:

1. **Arrange (Chuẩn bị dữ liệu)**: Thiết lập môi trường ảo, Insert một số bản ghi dự kiến (mock data) vào hệ thống.
2. **Act (Hành động)**: Gọi hàm service thực tế cần kiểm tra cùng với dữ liệu tạo trước.
3. **Assert (Xác nhận)**: Kiểm tra lại các dữ liệu được service trả về có đúng như logic mong muốn hay không bằng các syntax FluentAssertions.

Ví dụ test lấy danh sách phim (`GetAllAsync_ShouldReturnAllMovies`):
```csharp
[Fact]
public async Task GetAllAsync_ShouldReturnAllMovies()
{
    // Arrange: Thêm sẵn 2 database phim bằng EF Core InMemory 
    var db = GetInMemoryDbContext();
    ...

    // Act: Hỏi Service danh sách
    var service = new MovieService(db);
    var result = await service.GetAllAsync();

    // Assert: Đối chiếu số lượng và ID phim 
    result.Should().HaveCount(2);
}
```

## ⚠️ Những điểm chưa chuẩn đã được khắc phục

- Trong tệp `MovieServiceTests.cs`, ở đoạn Test `GetByIdAsync_WhenMovieExists_ShouldReturnMovie`, phần so sánh cuối cùng trước đây được viết như sau: 
  ```csharp
  result.Status.Should().Be("showing"); 
  ```
  ❌ **Chưa chuẩn**: `result.Status` là kiểu Enum `MovieStatus`, nhưng lại so sánh trực tiếp với một Test string (`"showing"`). Điều này sẽ gây lỗi biên dịch (Compilation Error).
  
  ✅ **Đã sửa**: Đã thay thế thành hằng số chuẩn từ Enum C#:
  ```csharp
  result.Status.Should().Be(MovieStatus.showing);
  ```

## 🚀 Hướng dẫn chạy Test

Bạn có thể chạy các test cùa module bằng command line .NET, gõ tại thư mục gốc backend:
```bash
dotnet test
```
hoặc bên trong thư mục `WebPhimApi.Tests`:
```bash
dotnet test
```

Visual Studio hoặc Rider cũng sẽ có các trình Test Explorer cung cấp giao diện cho bạn bấm chạy từng file bằng chuột.
