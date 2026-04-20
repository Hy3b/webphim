using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using StackExchange.Redis;
using WebPhimApi.Data;
using WebPhimApi.DTOs;
using WebPhimApi.Entities;
using WebPhimApi.Services;
using Order = WebPhimApi.Entities.Order;

namespace DotnetBackend.Tests;

public class BookingServiceTests : IDisposable
{
    private readonly AppDbContext _dbContext;
    private readonly Mock<IConnectionMultiplexer> _mockRedis;
    private readonly Mock<IDatabase> _mockRedisDb;
    private readonly Mock<ILogger<BookingService>> _mockLogger;
    private readonly BookingService _bookingService;

    public BookingServiceTests()
    {
        // 1. Khởi tạo In-Memory Database (EF Core) 
        // Mục đích: Chạy test độc lập trên RAM, không đụng vào Database MySQL thật.
        // Tránh làm rác dữ liệu thật và giúp tốc độ chạy test nhanh gấp chục lần.
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _dbContext = new AppDbContext(options);

        // 2. Cài đặt Mock cho Redis (StackExchange.Redis)
        // Vì Redis ở ngoài server thật, lúc test ta không có Redis. 
        // Phải dùng thư viện Moq để "đóng giả" một Redis Database.
        _mockRedis = new Mock<IConnectionMultiplexer>();
        _mockRedisDb = new Mock<IDatabase>();
        
        // Cú pháp Setup: Bất cứ khi nào Service gọi hàm GetDatabase, Moq sẽ trả về bản giả (_mockRedisDb)
        _mockRedis.Setup(r => r.GetDatabase(It.IsAny<int>(), It.IsAny<object>())).Returns(_mockRedisDb.Object);

        // 3. Logger Mock: Đóng giả ILogger để code không bị sập khi in log Info/Error
        _mockLogger = new Mock<ILogger<BookingService>>();

        // Bơm (Inject) các dependencies giả lập này vào BookingService để chuẩn bị Test
        _bookingService = new BookingService(_dbContext, _mockRedis.Object, _mockLogger.Object);
    }

    // Hàm Dọn dẹp: Đảm bảo xóa sạch RAM Database sau khi chạy xong 1 Test
    // Tránh việc lỗi cặn dữ liệu từ test trước ảnh hưởng test sau (Nguyên tắc Test Isolation)
    public void Dispose()
    {
        _dbContext.Database.EnsureDeleted();
        _dbContext.Dispose();
    }

    // Hàm khởi tạo dữ liệu mồi (Seed Data)
    // Cần phải có Suất chiếu, Phòng, Ghế, Người mua thì mới chạy logic Đặt vé được
    private async Task SeedBasicDataAsync(int showtimeId, int roomId, int userId)
    {
        var room = new Room { RoomId = roomId, Name = "Phòng chiếu Test", TotalSeats = 50, Status = RoomStatus.active };
        var showtime = new Showtime { ShowtimeId = showtimeId, RoomId = roomId, MovieId = 1, BasePrice = 50000, StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow.AddHours(2) };
        var user = new User { UserId = userId, Username = "test", Email = "test@example.com", PasswordHash = "hash" };
        var seatType = new SeatType { SeatTypeId = 1, Name = "Normal", Surcharge = 0 };
        var seatA1 = new Seat { SeatId = 1, RoomId = roomId, SeatTypeId = 1, RowName = "A", SeatNumber = 1 };
        var seatA2 = new Seat { SeatId = 2, RoomId = roomId, SeatTypeId = 1, RowName = "A", SeatNumber = 2 };

        // Lưu tất cả vào RAM DB cục bộ
        _dbContext.Rooms.Add(room);
        _dbContext.Showtimes.Add(showtime);
        _dbContext.Users.Add(user);
        _dbContext.SeatTypes.Add(seatType);
        _dbContext.Seats.AddRange(seatA1, seatA2);
        await _dbContext.SaveChangesAsync();
    }

    [Fact]
    // Tình huống 1: Người dùng thao tác đặt 2 ghế trống. Hệ thống khóa ghế trơn tru và lưu Order thành công.
    public async Task BookSeatsAsync_GhếTrống_RedisLockThànhCông_TạoBookingsVàLưuDB()
    {
        // ── 1. Chuẩn bị (Arrange) ──
        await SeedBasicDataAsync(showtimeId: 1, roomId: 10, userId: 100);
        var request = new BookingRequest(100, 1, new List<string> { "A1", "A2" });

        // Giả lập Redis: 
        // - Lệnh xin khóa (Lock): Trả về `true` = Có khóa thành công
        // - Lệnh Get trạng thái ghế: Trả về `Null` = Ghế đang trống, chưa có ai mua ("SOLD")
        _mockRedisDb.SetReturnsDefault<Task<bool>>(Task.FromResult(true));
        _mockRedisDb.SetReturnsDefault<Task<RedisValue>>(Task.FromResult(RedisValue.Null));

        // ── 2. Thực thi (Act) ──
        var result = await _bookingService.BookSeatsAsync(request);

        // ── 3. Kiểm chứng (Assert) ──
        // Kết quả API phản hồi phải là trạng thái "pending" (Chờ thanh toán)
        result.Should().NotBeNull();
        result.Status.Should().Be("pending");

        // DB Kiểm chứng 1: Đơn hàng tiền có tính chuẩn không? (50,000 * 2 ghế = 100.000)
        var savedOrder = await _dbContext.Orders.FirstOrDefaultAsync();
        savedOrder.Should().NotBeNull();
        savedOrder!.TotalAmount.Should().Be(100000); 

        // DB Kiểm chứng 2: Booking chính phải được sinh ra gắn cùng Order
        var savedBooking = await _dbContext.Bookings.FirstOrDefaultAsync();
        savedBooking.Should().NotBeNull();
        savedBooking!.OrderId.Should().Be(savedOrder.OrderId);

        // DB Kiểm chứng 3: Tổng số dòng BookingSeat trong DB phải là 2 tương ứng (A1, A2)
        var savedBookingSeats = await _dbContext.BookingSeats.ToListAsync();
        savedBookingSeats.Count.Should().Be(2);

        // Redis Verify: Xác nhận lệnh set trạng thái ghế "LOCKED" trong Redis có được gọi đúng 2 lần hay không.
        _mockRedisDb.Verify(db => db.HashSetAsync(It.IsAny<RedisKey>(), It.IsAny<RedisValue>(), "LOCKED", It.IsAny<When>(), It.IsAny<CommandFlags>()), Times.Exactly(2));
    }

    [Fact]
    // Tình huống 2: Người dùng khác nhanh tay hơn. Vừa gửi lệnh Lock thì bị Redis từ chối.
    public async Task BookSeatsAsync_GhếĐangBịGiữ_RedisLockThấtBại_TrangVềLỗiVàRollback()
    {
        // ── 1. Chuẩn bị (Arrange) ──
        await SeedBasicDataAsync(showtimeId: 2, roomId: 20, userId: 200);
        var request = new BookingRequest(200, 2, new List<string> { "A1" });

        // Giả lập Redis: Vừa vào gọi Lock (StringSetAsync) xin khóa cửa thì bị báo `false` (Có người ở trong rồi)
        _mockRedisDb.SetReturnsDefault<Task<bool>>(Task.FromResult(false));

        // ── 2. Thực thi (Act) ──
        // Vì đây là luồng ném ra lỗi (Throw Exception), ta gộp nó vào 1 function Act chờ bắn lỗi
        Func<Task> act = async () => await _bookingService.BookSeatsAsync(request);

        // ── 3. Kiểm chứng (Assert) ──
        // Hệ thống BẮT BUỘC phải ném văng ra lỗi này lập tức
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Ghế đang được người khác giữ, vui lòng thử lại");

        // Verify Rollback: Vì code ném lỗi C# ngay từ trên Redis Lock (dòng 48), bộ save DB ở tít dưới
        // không bao giờ được chạy. Nghĩa là không có Order nào sinh ra làm rác DB cả (Tương đương 1 kiểu Rollback nhẹ).
        var ordersInDb = await _dbContext.Orders.CountAsync();
        ordersInDb.Should().Be(0, "Transaction đã bị hủy/Rollback, không có record rác nào sinh ra trong DB");
    }

    [Fact]
    // Tình huống 3: Xin được Lock, nhưng tới bước kiểm tra lịch sử Redis thấy ghế đã mang tiền đi thanh toán rồi ("SOLD")
    public async Task BookSeatsAsync_ĐãLockĐược_NhưngTrạngTháiRedisLàĐãBán_TrảVềLỗi()
    {
        // ── 1. Chuẩn bị (Arrange) ──
        await SeedBasicDataAsync(showtimeId: 3, roomId: 30, userId: 300);
        var request = new BookingRequest(300, 3, new List<string> { "A2" });

        // Giả lập Redis: Vượt qua lệnh giữ Lock (Trả về True)
        _mockRedisDb.SetReturnsDefault<Task<bool>>(Task.FromResult(true));
        
        // Nhưng khi HashGet check trạng thái thực thì báo là ghế này mua mất rồi (SOLD)
        _mockRedisDb.SetReturnsDefault<Task<RedisValue>>(Task.FromResult((RedisValue)"SOLD"));


        // ── 2. Thực thi (Act) ──
        Func<Task> act = async () => await _bookingService.BookSeatsAsync(request);

        // ── 3. Kiểm chứng (Assert) ──
        // Phải ném văng ra lỗi ngay bước check trạng thái Redis Hash
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Ghế A2 đã được đặt hoặc đang bị giữ");

        // Verify khối Finally: Đây là dòng cực quan trọng. Dù chạy lỗi văng Exception,
        // thì khóa Mutex đã mượn bên trên VẪN PHẢI TRẢ LẠI (KeyDeleteAsync). Nếu quên chỗ này, 
        // ghế sẽ bị khóa chết ngắc (Deadlock).
        _mockRedisDb.Verify(db => db.KeyDeleteAsync(It.Is<RedisKey>(k => k.ToString().Contains("lock:showtime:3:seat:A2")), It.IsAny<CommandFlags>()), Times.Once);
    }

    [Fact]
    // Tình huống 4 (Function Test): Cố tình truyền vào một danh sách ghế tào lao (Ghế Z99) không có thực trong Database
    public async Task BookSeatsAsync_TruyenGheKhongTonTai_TraVeLoiValidation()
    {
        // ── 1. Chuẩn bị (Arrange) ──
        await SeedBasicDataAsync(showtimeId: 4, roomId: 40, userId: 400);
        // Đặt ghế Z99, dù trong Seed chỉ có A1, A2
        var request = new BookingRequest(400, 4, new List<string> { "Z99" });

        _mockRedisDb.SetReturnsDefault<Task<bool>>(Task.FromResult(true));
        _mockRedisDb.SetReturnsDefault<Task<RedisValue>>(Task.FromResult(RedisValue.Null));

        // ── 2. Thực thi (Act) ──
        Func<Task> act = async () => await _bookingService.BookSeatsAsync(request);

        // ── 3. Kiểm chứng (Assert) ──
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Một hoặc nhiều ghế không tồn tại trong phòng này");

        // DB không được sinh ra Order nào
        var ordersInDb = await _dbContext.Orders.CountAsync();
        ordersInDb.Should().Be(0);
    }

    [Fact]
    // Tình huống 5 (Function Test): Giới hạn số ghế hoặc Validate mảng rỗng. 
    // Ghi chú: Hiện code gốc BookingService chưa bắt chặt TH mảng SeatIds rỗng, 
    // test này mô phỏng kịch bản cần check/fail nếu frontend gửi mảng trống.
    public async Task BookSeatsAsync_KhongTruyenGheNao_NenThrowException()
    {
        // ── 1. Chuẩn bị (Arrange) ──
        await SeedBasicDataAsync(showtimeId: 5, roomId: 50, userId: 500);
        var request = new BookingRequest(500, 5, new List<string>()); // Empty seats

        // ── 2. Thực thi (Act) ──
        Func<Task> act = async () => await _bookingService.BookSeatsAsync(request);

        // ── 3. Kiểm chứng (Assert) ──
        // Test kiểm chứng rỗng: Dịch vụ BookingService.BookSeatsAsync phải quăng ra ArgumentException
        // khi đầu vào không có ghế nào được chọn.
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("Vui lòng chọn ít nhất 1 ghế");
    }
}
