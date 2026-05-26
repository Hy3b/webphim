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
        if (request.SeatIds == null || request.SeatIds.Count == 0)
            throw new ArgumentException("Vui lòng chọn ít nhất 1 ghế");

        var showtime = await db.Showtimes
            .Include(s => s.Room)
            .FirstOrDefaultAsync(s => s.ShowtimeId == request.ShowtimeId)
            ?? throw new KeyNotFoundException("Suất chiếu không tồn tại");

        if (showtime.StartTime < DateTime.Now)
        {
            throw new ArgumentException("Suất chiếu này đã bắt đầu hoặc đã kết thúc, không thể đặt vé.");
        }

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

            // ── Calculate Points Discount ──
            int pointsToUse = request.PointsToUse;
            if (pointsToUse > 0)
            {
                if (user.Points < pointsToUse)
                    throw new InvalidOperationException("Số điểm muốn sử dụng vượt quá số dư hiện tại");

                // Giảm luôn điểm ở DB
                user.Points -= pointsToUse;
                db.Users.Update(user);
            }

            var discountAmount = pointsToUse * 1000m; // 1 điểm = 1000 VND
            var finalAmount = totalAmount - discountAmount;
            if (finalAmount < 0) finalAmount = 0;

            var expiredAt = DateTime.Now.AddMinutes(BookingTtlMinutes);

            // ── 6. Save Order ───────────────────────────────────────────
            var order = new Order
            {
                OrderCode = "TEMP",
                UserId = user.UserId,
                TotalAmount = totalAmount,
                DiscountAmount = discountAmount,
                PointsUsed = pointsToUse,
                PointsEarned = 0, // Sẽ tính sau khi thanh toán thành công
                FinalAmount = finalAmount,
                Status = OrderStatus.pending,
                PaymentMethod = "QR",
                ExpiredAt = expiredAt,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
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
    public async Task<List<BookingHistoryItemResponse>> GetBookingHistoryAsync(int userId)
    {
        var orders = await db.Orders
            .Include(o => o.Bookings).ThenInclude(b => b.Showtime).ThenInclude(s => s.Movie)
            .Include(o => o.Bookings).ThenInclude(b => b.Showtime).ThenInclude(s => s.Room)
            .Include(o => o.Bookings).ThenInclude(b => b.BookingSeats).ThenInclude(bs => bs.Seat)
            .Where(o => o.UserId == userId && o.Status == OrderStatus.paid)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        var history = new List<BookingHistoryItemResponse>();

        foreach (var order in orders)
        {
            if (order.Bookings == null || order.Bookings.Count == 0) continue;
            var booking = order.Bookings.First();
            var showtime = booking.Showtime;
            
            var seats = booking.BookingSeats?.Select(bs => $"{bs.Seat.RowName}{bs.Seat.SeatNumber}").ToList() ?? new List<string>();

            history.Add(new BookingHistoryItemResponse(
                order.OrderCode,
                order.Status.ToString(),
                showtime.Movie.Title,
                showtime.Movie.Poster ?? "",
                showtime.StartTime,
                showtime.Room.Name,
                order.FinalAmount,
                seats,
                order.CreatedAt
            ));
        }

        return history;
    }
}
