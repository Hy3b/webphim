using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using WebPhimApi.Data;
using WebPhimApi.DTOs;
using WebPhimApi.Entities;
using Order = WebPhimApi.Entities.Order;

namespace WebPhimApi.Services;

/// <summary>
/// Xử lý đặt vé tại quầy cho Admin/Staff.
/// </summary>
public class AdminBookingService(AppDbContext db, IConnectionMultiplexer redis, ILogger<AdminBookingService> logger)
{
    private IDatabase Cache => redis.GetDatabase();

    public async Task<AdminBookingResponse> BookTicketsAtCounterAsync(AdminBookingRequest request)
    {
        var showtime = await db.Showtimes
            .Include(s => s.Room)
            .FirstOrDefaultAsync(s => s.ShowtimeId == request.ShowtimeId)
            ?? throw new KeyNotFoundException("Suất chiếu không tồn tại");

        // Admin có thể đặt không cần user (đặt tại quầy)
        int userId = request.UserId ?? 1;

        var roomId = showtime.Room.RoomId;
        var seatKeys = request.SeatIds;
        var redisHashKey = $"showtime:{request.ShowtimeId}:seats";

        // Check redis availability
        foreach (var seatKey in seatKeys)
        {
            var status = await Cache.HashGetAsync(redisHashKey, seatKey);
            if (status.HasValue && status != "AVAILABLE")
                throw new InvalidOperationException($"Ghế {seatKey} đã được đặt");
        }

        var seats = await db.Seats
            .Include(s => s.SeatType)
            .Where(s => s.RoomId == roomId && seatKeys.Contains(s.RowName + s.SeatNumber.ToString()))
            .ToListAsync();

        var totalAmount = seats.Sum(s => showtime.BasePrice + s.SeatType.Surcharge);

        // Đặt tại quầy → paid ngay lập tức
        var order = new Order
        {
            OrderCode = "TEMP",
            UserId = userId,
            TotalAmount = totalAmount,
            FinalAmount = totalAmount,
            Status = OrderStatus.paid,
            PaymentMethod = request.PaymentMethod,
            ExpiredAt = DateTime.UtcNow.AddMinutes(15),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Orders.Add(order);
        await db.SaveChangesAsync();
        order.OrderCode = "DH" + order.OrderId;
        await db.SaveChangesAsync();

        var booking = new Booking { OrderId = order.OrderId, ShowtimeId = showtime.ShowtimeId };
        db.Bookings.Add(booking);
        await db.SaveChangesAsync();

        var bookingSeats = seats.Select(s => new BookingSeat
        {
            BookingId = booking.BookingId,
            ShowtimeId = showtime.ShowtimeId,
            SeatId = s.SeatId,
            Price = showtime.BasePrice + s.SeatType.Surcharge
        }).ToList();

        db.BookingSeats.AddRange(bookingSeats);
        await db.SaveChangesAsync();

        // Mark SOLD immediately (cash/counter payment = instant)
        foreach (var seatKey in seatKeys)
            await Cache.HashSetAsync(redisHashKey, seatKey, "SOLD");

        logger.LogInformation("Admin tạo vé tại quầy: orderCode={OrderCode}", order.OrderCode);

        return new AdminBookingResponse(booking.BookingId, order.OrderCode, order.Status.ToString(), request.PaymentMethod);
    }
}

/// <summary>
/// Xử lý quét vé (check-in) cho Admin/Staff.
/// </summary>
public class AdminTicketService(AppDbContext db, ILogger<AdminTicketService> logger)
{
    public async Task<ScanResultResponse> ScanTicketAsync(string orderCode)
    {
        var order = await db.Orders
            .Include(o => o.User)
            .FirstOrDefaultAsync(o => o.OrderCode == orderCode)
            ?? throw new KeyNotFoundException($"Không tìm thấy đơn hàng '{orderCode}'");

        if (order.Status != OrderStatus.paid)
            throw new InvalidOperationException($"Đơn hàng chưa được thanh toán (status: {order.Status})");

        var bookings = await db.Bookings
            .Include(b => b.Showtime).ThenInclude(s => s.Movie)
            .Include(b => b.Showtime).ThenInclude(s => s.Room)
            .Where(b => b.OrderId == order.OrderId)
            .ToListAsync();

        if (bookings.Count == 0)
            throw new InvalidOperationException("Không tìm thấy booking cho đơn hàng này");

        var firstShowtime = bookings[0].Showtime;
        var seatInfos = new List<SeatInfo>();
        var allBookingSeats = new List<BookingSeat>();
        bool alreadyCheckedIn = false;

        foreach (var booking in bookings)
        {
            var seats = await db.BookingSeats
                .Include(bs => bs.Seat).ThenInclude(s => s.SeatType)
                .Where(bs => bs.BookingId == booking.BookingId)
                .ToListAsync();

            allBookingSeats.AddRange(seats);

            foreach (var bs in seats)
            {
                if (bs.IsCheckedIn) alreadyCheckedIn = true;
                seatInfos.Add(new SeatInfo(
                    $"{bs.Seat.RowName}{bs.Seat.SeatNumber}",
                    bs.Seat.SeatType.Name,
                    bs.Price,
                    bs.IsCheckedIn
                ));
            }
        }

        // Idempotent: chỉ check-in lần đầu
        if (!alreadyCheckedIn)
        {
            foreach (var bs in allBookingSeats)
                bs.IsCheckedIn = true;
            await db.SaveChangesAsync();
            logger.LogInformation("Check-in thành công: orderCode={OrderCode}", orderCode);
        }
        else
        {
            logger.LogWarning("Vé đã được check-in trước đó: orderCode={OrderCode}", orderCode);
        }

        return new ScanResultResponse(
            order.OrderCode,
            order.Status.ToString(),
            firstShowtime.Movie.Title,
            firstShowtime.StartTime,
            firstShowtime.Room.Name,
            order.FinalAmount,
            order.User?.FullName,
            order.User?.PhoneNumber,
            seatInfos,
            alreadyCheckedIn
        );
    }
}

/// <summary>
/// Tổng hợp dữ liệu hóa đơn và thống kê cho Admin Dashboard.
/// </summary>
public class AdminReportService(AppDbContext db)
{
    public async Task<List<AdminInvoiceResponse>> GetPaidInvoicesAsync(
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? searchTerm = null,
        decimal? minAmount = null,
        decimal? maxAmount = null)
    {
        var query = db.Orders
            .AsNoTracking()
            .Where(o => o.Status == OrderStatus.paid);

        if (fromDate.HasValue)
            query = query.Where(o => o.UpdatedAt >= fromDate.Value);
        if (toDate.HasValue)
            query = query.Where(o => o.UpdatedAt <= toDate.Value);
        if (minAmount.HasValue)
            query = query.Where(o => o.FinalAmount >= minAmount.Value);
        if (maxAmount.HasValue)
            query = query.Where(o => o.FinalAmount <= maxAmount.Value);

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.Trim();
            query = query.Where(o =>
                EF.Functions.Like(o.OrderCode, $"%{term}%") ||
                (o.User != null && (
                    (o.User.FullName != null && EF.Functions.Like(o.User.FullName, $"%{term}%")) ||
                    EF.Functions.Like(o.User.Email, $"%{term}%")
                )));
        }

        return await query
            .OrderByDescending(o => o.UpdatedAt)
            .Select(order => new AdminInvoiceResponse(
                order.OrderId,
                order.OrderCode,
                order.TotalAmount,
                order.FinalAmount,
                order.Status.ToString(),
                order.PaymentMethod,
                order.UpdatedAt,
                order.User != null ? order.User.FullName : null,
                order.User != null ? order.User.Email : null,
                order.User != null ? order.User.PhoneNumber : null,
                order.Bookings
                    .OrderBy(b => b.BookingId)
                    .Select(b => b.Showtime.Movie.Title)
                    .FirstOrDefault() ?? "Không xác định",
                order.Bookings
                    .OrderBy(b => b.BookingId)
                    .Select(b => (DateTime?)b.Showtime.StartTime)
                    .FirstOrDefault() ?? order.CreatedAt,
                order.Bookings
                    .OrderBy(b => b.BookingId)
                    .Select(b => b.Showtime.Room.Name)
                    .FirstOrDefault() ?? "Không xác định",
                order.Bookings
                    .SelectMany(b => b.BookingSeats)
                    .OrderBy(bs => bs.Seat.RowName)
                    .ThenBy(bs => bs.Seat.SeatNumber)
                    .Select(bs => new AdminInvoiceSeatResponse(
                        bs.Seat.RowName + bs.Seat.SeatNumber,
                        bs.Seat.SeatType.Name,
                        bs.Price
                    ))
                    .ToList()
            ))
            .ToListAsync();
    }

    public async Task<AdminOverviewStatsResponse> GetOverviewAsync(DateTime? from = null, DateTime? to = null)
    {
        var paidOrders = db.Orders.AsNoTracking().Where(o => o.Status == OrderStatus.paid);
        if (from.HasValue) paidOrders = paidOrders.Where(o => o.CreatedAt >= from.Value);
        if (to.HasValue) paidOrders = paidOrders.Where(o => o.CreatedAt <= to.Value);

        var totalRevenue = await paidOrders.SumAsync(o => (decimal?)o.FinalAmount) ?? 0;
        var totalTicketsSold = await db.BookingSeats
            .AsNoTracking()
            .CountAsync(bs => bs.Booking.Order.Status == OrderStatus.paid
                && (!from.HasValue || bs.Booking.Order.CreatedAt >= from.Value)
                && (!to.HasValue || bs.Booking.Order.CreatedAt <= to.Value));

        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1);
        var newCustomersThisMonth = await db.Users
            .AsNoTracking()
            .CountAsync(u => u.Role == UserRole.customer && u.CreatedAt.HasValue && u.CreatedAt.Value >= monthStart);

        var dailyRevenueRaw = await paidOrders
            .GroupBy(o => o.CreatedAt.Date)
            .Select(g => new { Date = g.Key, Revenue = g.Sum(x => x.FinalAmount) })
            .OrderBy(x => x.Date)
            .ToListAsync();

        var recentInvoices = await GetPaidInvoicesAsync(from, to);
        var recentCustomers = await db.Users
            .AsNoTracking()
            .Where(u => u.Role == UserRole.customer)
            .OrderByDescending(u => u.CreatedAt)
            .Take(6)
            .Select(u => new RecentCustomerResponse(u.UserId, u.FullName, u.Email, u.CreatedAt))
            .ToListAsync();

        return new AdminOverviewStatsResponse(
            totalRevenue,
            totalTicketsSold,
            newCustomersThisMonth,
            dailyRevenueRaw.Select(x => new RevenuePointResponse(DateOnly.FromDateTime(x.Date), x.Revenue)).ToList(),
            recentInvoices.Take(6).ToList(),
            recentCustomers
        );
    }
}
