using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using WebPhimApi.Data;
using WebPhimApi.DTOs;
using WebPhimApi.Entities;
using System.Text.RegularExpressions;
using Order = WebPhimApi.Entities.Order;

namespace WebPhimApi.Services;

public partial class PaymentService(
    AppDbContext db,
    IConnectionMultiplexer redis,
    ILogger<PaymentService> logger)
{
    private IDatabase Cache => redis.GetDatabase();

    // Match cả "DH31" lẫn "D31" (BIDV đôi khi cắt chữ H)
    // Group 1 = toàn bộ prefix (DH hoặc D), Group 2 = số
    [GeneratedRegex(@"(?i)D[H]?(\d+)", RegexOptions.Compiled)]
    private static partial Regex OrderCodePattern();

    public virtual async Task ProcessWebhookAsync(SePayWebhookRequest request)
    {
        logger.LogInformation("=== [PaymentService] Nhận webhook: Gateway={Gateway}, Amount={Amount}, Content='{Content}', Ref='{Ref}'",
            request.Gateway, request.TransferAmount, request.Content, request.ReferenceCode);

        var order = await ResolveOrderAsync(request);
        if (order is null) 
        {
            logger.LogWarning("❌ [PaymentService] Không thể xác định Order cho webhook này.");
            return;
        }

        if (order.Status != OrderStatus.pending)
        {
            logger.LogInformation("Order '{OrderCode}' đã ở trạng thái '{Status}', bỏ qua.", order.OrderCode, order.Status);
            return;
        }

        logger.LogInformation("🔍 Đang kiểm tra số tiền: Nhận {Amount}đ vs Cần {Final}đ", request.TransferAmount, order.FinalAmount);

        if (request.TransferAmount >= order.FinalAmount)
        {
            order.Status = OrderStatus.paid;
            order.UpdatedAt = DateTime.Now;
            await db.SaveChangesAsync();

            logger.LogInformation("✅ Order '{OrderCode}' thanh toán THÀNH CÔNG.", order.OrderCode);

            await ProcessSeatsOnPaymentSuccessAsync(order);
        }
        else
        {
            logger.LogWarning("⚠️ Order '{OrderCode}' thiếu tiền. Nhận: {Amount}, Cần: {Final}",
                order.OrderCode, request.TransferAmount, order.FinalAmount);
        }
    }

    private async Task<Order?> ResolveOrderAsync(SePayWebhookRequest request)
    {
        // --- Path 1: tìm theo mã DH trong nội dung (happy path) ---
        var orderCode = ExtractOrderCode(request.Content);
        if (orderCode is not null)
        {
            logger.LogInformation("🔍 [Path 1] Trích xuất mã: '{OrderCode}' từ nội dung: '{Content}'", orderCode, request.Content);
            var order = await db.Orders.FirstOrDefaultAsync(o => o.OrderCode == orderCode);
            if (order is not null)
            {
                logger.LogInformation("✅ [Path 1] Tìm thấy order trong DB: '{OrderCode}' (ID: {OrderId})", orderCode, order.OrderId);
                return order;
            }
            logger.LogWarning("❌ [Path 1] Không tìm thấy order '{OrderCode}' trong DB dù mã hợp lệ.", orderCode);
            // Không throw để fallback sang Path 2
        }

        // --- Path 2: fallback tìm theo số tiền + trạng thái pending (trong 15 phút) ---
        logger.LogWarning("⚠️ [Path 2 - Fallback] Thử tìm theo số tiền {Amount}đ (Trạng thái PENDING)...", request.TransferAmount);

        var cutoff = DateTime.Now.AddMinutes(-15); // Tăng lên 15 phút cho an toàn
        var candidates = await db.Orders
            .Where(o => o.Status == OrderStatus.pending
                     && o.FinalAmount == request.TransferAmount
                     && o.CreatedAt >= cutoff)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        if (candidates.Count == 1)
        {
            logger.LogInformation("✅ [Path 2 - Fallback] Khớp duy nhất: order '{OrderCode}'", candidates[0].OrderCode);
            return candidates[0];
        }

        if (candidates.Count > 1)
        {
            logger.LogWarning("⚠️ [Path 2 - Fallback] Có {Count} đơn cùng tiền {Amount}đ, chọn đơn mới nhất: '{OrderCode}'",
                candidates.Count, request.TransferAmount, candidates[0].OrderCode);
            return candidates[0];
        }

        logger.LogWarning("❌ [Path 2 - Fallback] Không tìm thấy đơn pending nào khớp số tiền.");
        return null;
    }

    private async Task ProcessSeatsOnPaymentSuccessAsync(Order order)
    {
        var bookings = await db.Bookings
            .Include(b => b.Showtime)
            .Where(b => b.OrderId == order.OrderId)
            .ToListAsync();

        if (bookings.Count == 0) return;

        var showtimeId = bookings[0].ShowtimeId;
        var redisHashKey = $"showtime:{showtimeId}:seats";

        foreach (var booking in bookings)
        {
            var bookingSeats = await db.BookingSeats
                .Include(bs => bs.Seat)
                .Where(bs => bs.BookingId == booking.BookingId)
                .ToListAsync();

            foreach (var bs in bookingSeats)
            {
                var seatKey = $"{bs.Seat.RowName}{bs.Seat.SeatNumber}";
                await Cache.HashSetAsync(redisHashKey, seatKey, "SOLD");
                logger.LogInformation("✅ Ghế {SeatKey} đã SOLD vĩnh viễn (orderId={OrderId})", seatKey, order.OrderId);
            }
        }
    }

    public async Task<BookingStatusResponse> GetBookingStatusAsync(string orderCode)
    {
        logger.LogInformation("🔍 Frontend đang kiểm tra trạng thái đơn: {OrderCode}", orderCode);
        
        var order = await db.Orders
            .Include(o => o.Bookings)
            .FirstOrDefaultAsync(o => o.OrderCode == orderCode);

        if (order is null)
        {
            logger.LogWarning("❌ [StatusCheck] Không tìm thấy đơn hàng: {OrderCode}", orderCode);
            return new BookingStatusResponse(null, "not_found", false);
        }

        // Lấy BookingId đầu tiên của đơn hàng (thông thường chỉ có 1)
        int? actualBookingId = order.Bookings.FirstOrDefault()?.BookingId;

        logger.LogInformation("✅ [StatusCheck] Đơn {OrderCode}: Status={Status}, Paid={Paid}, BookingId={BId}", 
            orderCode, order.Status, order.Status == OrderStatus.paid, actualBookingId);

        return new BookingStatusResponse(
            actualBookingId,
            order.Status.ToString(),
            order.Status == OrderStatus.paid
        );
    }

    private static string? ExtractOrderCode(string content)
    {
        if (string.IsNullOrWhiteSpace(content)) return null;
        var match = OrderCodePattern().Match(content);
        if (!match.Success) return null;

        // Luôn chuẩn hóa về dạng "DH{number}" dù ngân hàng gửi "D31" hay "DH31"
        var digits = match.Groups[1].Value;
        return $"DH{digits}";
    }
}
