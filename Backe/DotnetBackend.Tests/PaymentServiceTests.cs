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

public class PaymentServiceTests : IDisposable
{
    private readonly AppDbContext _dbContext;
    private readonly Mock<IConnectionMultiplexer> _mockRedis;
    private readonly Mock<IDatabase> _mockRedisDb;
    private readonly Mock<ILogger<PaymentService>> _mockLogger;
    private readonly PaymentService _paymentService;

    public PaymentServiceTests()
    {
        // Khởi tạo In-Memory Database (RAM DB) EF Core thay vì IOrderRepository gốc
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _dbContext = new AppDbContext(options);

        // Khởi tạo Mock khóa Redis 
        _mockRedis = new Mock<IConnectionMultiplexer>();
        _mockRedisDb = new Mock<IDatabase>();
        _mockRedis.Setup(r => r.GetDatabase(It.IsAny<int>(), It.IsAny<object>())).Returns(_mockRedisDb.Object);

        _mockLogger = new Mock<ILogger<PaymentService>>();

        // Bơm Dependencies (Cung cấp các Service ảo vào đối tượng thật để chạy Test logic bên trong)
        _paymentService = new PaymentService(_dbContext, _mockRedis.Object, _mockLogger.Object);
    }

    public void Dispose()
    {
        _dbContext.Database.EnsureDeleted();
        _dbContext.Dispose();
    }

    private async Task SeedOrderDataAsync(string orderCode, decimal amount, OrderStatus status)
    {
        var user = new User { UserId = 1, Username = "test", Email = "test@ex.com", PasswordHash = "x" };
        var order = new Order { OrderId = 1, OrderCode = orderCode, UserId = 1, FinalAmount = amount, TotalAmount = amount, Status = status };
        
        var showtime = new Showtime { ShowtimeId = 1, MovieId = 1, RoomId = 1, BasePrice = 50000, StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow.AddHours(2) };
        var booking = new Booking { BookingId = 1, OrderId = 1, ShowtimeId = 1 };
        
        // Thêm cho Order này 2 ghế đã đặt: C1 và C2
        var seat1 = new Seat { SeatId = 1, RoomId = 1, SeatTypeId = 1, RowName = "C", SeatNumber = 1 };
        var seat2 = new Seat { SeatId = 2, RoomId = 1, SeatTypeId = 1, RowName = "C", SeatNumber = 2 };
        
        var bs1 = new BookingSeat { BookingId = 1, ShowtimeId = 1, SeatId = 1, Price = 50000 };
        var bs2 = new BookingSeat { BookingId = 1, ShowtimeId = 1, SeatId = 2, Price = 50000 };

        _dbContext.Users.Add(user);
        _dbContext.Orders.Add(order);
        _dbContext.Showtimes.Add(showtime);
        _dbContext.Bookings.Add(booking);
        _dbContext.Seats.AddRange(seat1, seat2);
        _dbContext.BookingSeats.AddRange(bs1, bs2);
        await _dbContext.SaveChangesAsync();
    }

    [Fact]
    // Tình huống 4: Service Test chính - Cập nhật database Đơn hàng và quét Redis ghế khóa = SOLD
    public async Task ProcessWebhookAsync_ValidPayment_UpdatesOrderStatusAndRedisToSold()
    {
        // ── 1. Chuẩn bị (Arrange) ──
        // Database Mồi chứa 1 đơn DH123 đang chờ thanh toán với giá 100k
        await SeedOrderDataAsync("DH123", 100000, OrderStatus.pending);

        // SePay báo cáo: Gửi đủ 100k, nội dung có cụm 'DH123' (regex \bDH\d+)
        var request = new SePayWebhookRequest(1, "SEPAY", "2023", "ACC1", 100000, "CK TIEN VE DH123", "REF1");

        // ── 2. Thực thi (Act) ──
        await _paymentService.ProcessWebhookAsync(request);

        // ── 3. Kiểm chứng (Assert) ──
        // Bắt buộc Database Order phải nhảy từ [Pending] sang [Paid]
        var orderAfter = await _dbContext.Orders.FirstOrDefaultAsync(o => o.OrderCode == "DH123");
        orderAfter!.Status.Should().Be(OrderStatus.paid);

        // Bắt buộc phải thực hiện 2 lệnh gán giá trị "SOLD" cho ghế C1 và ghế C2 trong Hashset của Redis.
        _mockRedisDb.Verify(db => db.HashSetAsync(
            It.Is<RedisKey>(k => k.ToString().Contains("showtime:1:seats")), 
            "C1", 
            "SOLD", 
            It.IsAny<When>(), 
            It.IsAny<CommandFlags>()
        ), Times.Once, "Phải niêm phong ghế C1 vĩnh viễn trên Redis");

        _mockRedisDb.Verify(db => db.HashSetAsync(
            It.Is<RedisKey>(k => k.ToString().Contains("showtime:1:seats")), 
            "C2", 
            "SOLD", 
            It.IsAny<When>(), 
            It.IsAny<CommandFlags>()
        ), Times.Once, "Phải niêm phong ghế C2 vĩnh viễn trên Redis");
    }

    [Fact]
    // Tình huống 5: Khách chuyển tiền cho Đơn không tồn tại = Lỗi Service
    public async Task ProcessWebhookAsync_OrderNotFound_ThrowsKeyNotFoundException()
    {
        // ── 1. Chuẩn bị (Arrange) ──
        var request = new SePayWebhookRequest(1, "SEPAY", "2023", "ACC1", 100000, "CK DH999", "REF1");

        // ── 2. Thực thi (Act) ──
        Func<Task> act = async () => await _paymentService.ProcessWebhookAsync(request);

        // ── 3. Kiểm chứng (Assert) ──
        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("Không tìm thấy đơn hàng chứa mã DH999");
    }
}
