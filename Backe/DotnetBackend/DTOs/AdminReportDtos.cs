using System;
using System.Collections.Generic;

namespace WebPhimApi.DTOs;

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
    List<RevenuePointResponse> DailyRevenue,
    List<AdminInvoiceResponse> RecentInvoices,
    List<RecentCustomerResponse> RecentCustomers
);
