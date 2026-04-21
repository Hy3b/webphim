using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using WebPhimApi.Data;
using WebPhimApi.Entities;

namespace WebPhimApi.Services;

public class BookingCleanupService(IServiceProvider services, ILogger<BookingCleanupService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("🚀 [BookingCleanup] Bản Turbo (5s) đã khởi động.");
        
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupExpiredBookingsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "❌ Lỗi khi dọn dẹp booking hết hạn");
            }

            // Bản TURBO: Nháy mắt 5 giây 1 lần để lùng sục nhả ghế
            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
    }

    private async Task CleanupExpiredBookingsAsync(CancellationToken cancellationToken)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var redis = scope.ServiceProvider.GetRequiredService<IConnectionMultiplexer>();
        var cache = redis.GetDatabase();

        var expiredOrders = await db.Orders
            .Where(o => o.Status == OrderStatus.pending && o.ExpiredAt < DateTime.Now)
            .ToListAsync(cancellationToken);

        if (expiredOrders.Count == 0) return;

        foreach (var order in expiredOrders)
        {
            order.Status = OrderStatus.cancelled;
            order.UpdatedAt = DateTime.Now;

            var bookings = await db.Bookings
                .Where(b => b.OrderId == order.OrderId)
                .ToListAsync(cancellationToken);

            foreach (var booking in bookings)
            {
                var bookingSeats = await db.BookingSeats
                    .Include(bs => bs.Seat)
                    .Where(bs => bs.BookingId == booking.BookingId)
                    .ToListAsync(cancellationToken);

                var redisHashKey = $"showtime:{booking.ShowtimeId}:seats";
                
                foreach (var bs in bookingSeats)
                {
                    var seatKey = $"{bs.Seat.RowName}{bs.Seat.SeatNumber}";
                    var seatStatus = await cache.HashGetAsync(redisHashKey, seatKey);
                    if (seatStatus == "LOCKED")
                    {
                        await cache.HashDeleteAsync(redisHashKey, seatKey);
                        logger.LogInformation("🔓 Đã nhả ghế {SeatKey} (Turbo Mode: Đơn {OrderCode} hết hạn)", seatKey, order.OrderCode);
                    }
                }

                // 🌟 QUAN TRỌNG: PHẢI XÓA DỮ LIỆU GHẾ TRONG DB KHI ĐƠN HÀNG HUỶ 🌟
                // Nếu không xóa, Unique Constraint "uq_showtime_seat" sẽ khóa ghế vĩnh viễn
                // và ném lỗi 500 Duplicate Key cho người đến sau!
                db.BookingSeats.RemoveRange(bookingSeats);
            }
        }
        
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("🧹 Bản Turbo vừa xử trảm {Count} đơn hàng chậm đóng tiền", expiredOrders.Count);
    }
}
