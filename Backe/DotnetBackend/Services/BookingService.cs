using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using WebPhimApi.Data;
using WebPhimApi.DTOs;
using WebPhimApi.Entities;
using Order = WebPhimApi.Entities.Order;

namespace WebPhimApi.Services;

public class BookingService(AppDbContext db, IConnectionMultiplexer redis, ILogger<BookingService> logger)
{
    private const int BookingTtlMinutes = 10;
    private IDatabase Cache => redis.GetDatabase();

    /// <summary>
    /// Tạo booking: lock ghế bằng Redis distributed lock, lưu DB, đánh dấu LOCKED.
    /// Tương đương BookingService.bookSeats() dùng Redisson RLock.
    /// </summary>
    public async Task<CreateBookingResponse> BookSeatsAsync(BookingRequest request)
    {
        var showtime = await db.Showtimes
            .Include(s => s.Room)
            .FirstOrDefaultAsync(s => s.ShowtimeId == request.ShowtimeId)
            ?? throw new KeyNotFoundException("Suất chiếu không tồn tại");

        var user = await db.Users.FindAsync(request.UserId)
            ?? throw new KeyNotFoundException("Người dùng không tồn tại");

        // ── 1. Parse seat keys ──────────────────────────────────────────
        var roomId = showtime.Room.RoomId;
        var seatKeys = request.SeatIds;
        var redisHashKey = $"showtime:{request.ShowtimeId}:seats";

        // ── 2. Acquire Redis locks per seat (distributed lock) ──────────
        var lockKeys = seatKeys.Select(k => $"lock:showtime:{request.ShowtimeId}:seat:{k}").ToList();
        var acquiredLocks = new List<string>();

        try
        {
            foreach (var lockKey in lockKeys)
            {
                var locked = await Cache.StringSetAsync(
                    lockKey, "1",
                    TimeSpan.FromSeconds(10),
                    When.NotExists);

                if (!locked)
                    throw new InvalidOperationException("Ghế đang được người khác giữ, vui lòng thử lại");

                acquiredLocks.Add(lockKey);
            }

            // ── 3. Check seat availability in Redis ─────────────────────
            foreach (var seatKey in seatKeys)
            {
                var status = await Cache.HashGetAsync(redisHashKey, seatKey);
                if (status.HasValue)
                    throw new InvalidOperationException($"Ghế {seatKey} đã được đặt hoặc đang bị giữ");
            }

            // ── 4. Load seats from DB ───────────────────────────────────
            var seats = await db.Seats
                .Include(s => s.SeatType)
                .Where(s => s.RoomId == roomId && seatKeys.Contains(s.RowName + s.SeatNumber.ToString()))
                .ToListAsync();

            if (seats.Count != seatKeys.Count)
                throw new InvalidOperationException("Một hoặc nhiều ghế không tồn tại trong phòng này");

            // ── 5. Calculate price ──────────────────────────────────────
            var totalAmount = seats.Sum(s => showtime.BasePrice + s.SeatType.Surcharge);
            var expiredAt = DateTime.UtcNow.AddMinutes(BookingTtlMinutes);

            // ── 6. Save Order ───────────────────────────────────────────
            var order = new Order
            {
                OrderCode = "TEMP",
                UserId = user.UserId,
                TotalAmount = totalAmount,
                FinalAmount = totalAmount,
                Status = OrderStatus.pending,
                PaymentMethod = "QR",
                ExpiredAt = expiredAt,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            db.Orders.Add(order);
            await db.SaveChangesAsync();

            // Update orderCode after getting real ID
            order.OrderCode = "DH" + order.OrderId;
            await db.SaveChangesAsync();

            // ── 7. Save Booking ─────────────────────────────────────────
            var booking = new Booking
            {
                OrderId = order.OrderId,
                ShowtimeId = showtime.ShowtimeId
            };
            db.Bookings.Add(booking);
            await db.SaveChangesAsync();

            // ── 8. Save BookingSeats ────────────────────────────────────
            var bookingSeats = seats.Select(s => new BookingSeat
            {
                BookingId = booking.BookingId,
                ShowtimeId = showtime.ShowtimeId,
                SeatId = s.SeatId,
                Price = showtime.BasePrice + s.SeatType.Surcharge
            }).ToList();

            db.BookingSeats.AddRange(bookingSeats);
            await db.SaveChangesAsync();

            // ── 9. Mark seats LOCKED in Redis ───────────────────────────
            foreach (var seatKey in seatKeys)
                await Cache.HashSetAsync(redisHashKey, seatKey, "LOCKED");

            logger.LogInformation("Booking thành công: bookingId={BookingId}, orderCode={OrderCode}",
                booking.BookingId, order.OrderCode);

            return new CreateBookingResponse(booking.BookingId, order.OrderCode, order.Status.ToString());
        }
        finally
        {
            // ── 10. Release all locks ───────────────────────────────────
            foreach (var lockKey in acquiredLocks)
                await Cache.KeyDeleteAsync(lockKey);
        }
    }
}
