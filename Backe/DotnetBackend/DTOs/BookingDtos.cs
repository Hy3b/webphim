using System.ComponentModel.DataAnnotations;

namespace WebPhimApi.DTOs;

// ── Customer ─────────────────────────────────────────────────────────────────

public record BookingRequest(
    [Required] int UserId,
    [Required] int ShowtimeId,
    [Required][MinLength(1)] List<string> SeatIds
);

public record CreateBookingResponse(
    int BookingId,
    string OrderCode,
    string Status
);

public record BookingStatusResponse(
    int? BookingId,
    string Status,
    bool Paid
);

// ── Admin / Staff ─────────────────────────────────────────────────────────────

public record AdminBookingRequest(
    int? UserId,
    [Required] int ShowtimeId,
    [Required][MinLength(1)] List<string> SeatIds,
    string PaymentMethod = "CASH"
);

public record AdminBookingResponse(
    int BookingId,
    string OrderCode,
    string Status,
    string PaymentMethod
);

public record TicketScanRequest(
    [Required] string OrderCode
);

public record ScanResultResponse(
    string OrderCode,
    string Status,
    string MovieTitle,
    DateTime Showtime,
    string Room,
    decimal TotalAmount,
    string? CustomerName,
    string? CustomerPhone,
    List<SeatInfo> Seats,
    bool IsFullyCheckedIn
);

public record SeatInfo(
    string SeatLabel,
    string SeatType,
    decimal Price,
    bool IsCheckedIn
);

public record AdminInvoiceSeatResponse(
    string SeatLabel,
    string SeatType,
    decimal Price
);

public record AdminInvoiceResponse(
    int OrderId,
    string OrderCode,
    decimal TotalAmount,
    decimal FinalAmount,
    string Status,
    string? PaymentMethod,
    DateTime PaidAt,
    string? CustomerName,
    string? CustomerEmail,
    string? CustomerPhone,
    string MovieTitle,
    DateTime Showtime,
    string RoomName,
    List<AdminInvoiceSeatResponse> Seats
);

public record RevenuePointResponse(
    DateOnly Date,
    decimal Revenue
);

public record RecentCustomerResponse(
    int UserId,
    string? FullName,
    string Email,
    DateTime? CreatedAt
);

public record AdminOverviewStatsResponse(
    decimal TotalRevenue,
    int TotalTicketsSold,
    int NewCustomersThisMonth,
    List<RevenuePointResponse> RevenueByDate,
    List<AdminInvoiceResponse> RecentInvoices,
    List<RecentCustomerResponse> RecentCustomers
);
