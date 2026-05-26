# INVOICE MANAGEMENT FEATURE SPECIFICATION & CODE RECREATION RECIPE

> **MESSAGES FOR THE AI ASSISTANT:**
> You are being requested to recreate, port, or implement the Admin Invoice/Order Management feature. 
> Read this file carefully and implement the database entities, DB configurations, backend controllers, services, and frontend pages, styles, routes, and layout additions exactly as specified below.

---

## 📋 Feature Overview
This feature provides a complete Invoice/Order Management system for Admin and Staff users:
1. **Invoice List**: Retrieve and display successfully paid invoices (`Status == paid`).
2. **Search & Filters**: Search invoices by order code, customer name, or email; filter by date range (`fromDate`, `toDate`) and price range (`minAmount`, `maxAmount`).
3. **Detail Modal**: Click on an invoice to view movie title, showtime, room, seat labels, customer details, payment method, and amount.
4. **Walk-in Booking**: Support creating paid invoices directly at the counter.
5. **Ticket Scanner**: Scan and check-in tickets using the invoice code (`OrderCode`).

---

## 🗄️ 1. Database & Entities (Dotnet Backend)

### File: `Backe/DotnetBackend/Entities/Order.cs`
This entity represents the invoice in the database (`orders` table). Ensure this model exists:

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebPhimApi.Entities;

[Table("orders")]
public class Order
{
    [Key]
    [Column("order_id")]
    public int OrderId { get; set; }

    [Required]
    [MaxLength(50)]
    [Column("order_code")]
    public string OrderCode { get; set; } = null!;

    [Column("user_id")]
    public int UserId { get; set; }

    [Required]
    [Column("total_amount", TypeName = "decimal(10,2)")]
    public decimal TotalAmount { get; set; }

    [Column("discount_amount", TypeName = "decimal(10,2)")]
    public decimal DiscountAmount { get; set; } = 0;

    [Required]
    [Column("final_amount", TypeName = "decimal(10,2)")]
    public decimal FinalAmount { get; set; }

    [Column(TypeName = "enum('pending','paid','cancelled','expired','refunded')")]
    public OrderStatus Status { get; set; } = OrderStatus.pending;

    [MaxLength(50)]
    [Column("payment_method")]
    public string? PaymentMethod { get; set; }

    [Required]
    [Column("expired_at")]
    public DateTime ExpiredAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    // Navigation
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    public ICollection<Booking> Bookings { get; set; } = [];
}

public enum OrderStatus { pending, paid, cancelled, expired, refunded }
```

### DbContext Configuration (`Backe/DotnetBackend/Data/AppDbContext.cs`)
Ensure `Orders` DbContext registrations are present:

```csharp
public DbSet<Order> Orders => Set<Order>();

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    modelBuilder.Entity<Order>()
        .HasIndex(o => o.OrderCode).IsUnique();

    modelBuilder.Entity<Order>()
        .Property(o => o.Status)
        .HasConversion<string>();

    modelBuilder.Entity<Order>()
        .Property(o => o.CreatedAt)
        .ValueGeneratedOnAdd();

    modelBuilder.Entity<Order>()
        .Property(o => o.UpdatedAt)
        .ValueGeneratedOnAddOrUpdate();
}
```

---

## ⚙️ 2. Services & Controllers (Dotnet Backend)

### File: `Backe/DotnetBackend/Controllers/AdminControllers.cs`
Exposes endpoints for invoice querying, walk-in counter booking, and ticket scanning:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebPhimApi.DTOs;
using WebPhimApi.Services;

namespace WebPhimApi.Controllers;

[ApiController]
[Route("api/admin/bookings")]
[Authorize(Roles = "admin,staff")]
public class AdminBookingController(AdminBookingService adminBookingService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> BookAtCounter([FromBody] AdminBookingRequest request)
    {
        try
        {
            var response = await adminBookingService.BookTicketsAtCounterAsync(request);
            return Ok(response);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

[ApiController]
[Route("api/admin/tickets")]
[Authorize(Roles = "admin,staff")]
public class AdminTicketController(AdminTicketService adminTicketService) : ControllerBase
{
    [HttpPost("scan")]
    public async Task<IActionResult> ScanTicket([FromBody] TicketScanRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var result = await adminTicketService.ScanTicketAsync(request.OrderCode);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

[ApiController]
[Route("api/admin/invoices")]
[Authorize(Roles = "admin,staff")]
public class AdminInvoiceController(AdminReportService adminReportService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetPaidInvoices(
        [FromQuery] string? searchTerm,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] decimal? minAmount,
        [FromQuery] decimal? maxAmount)
    {
        var invoices = await adminReportService.GetPaidInvoicesAsync(fromDate, toDate, searchTerm, minAmount, maxAmount);
        return Ok(invoices);
    }
}

[ApiController]
[Route("api/admin/reports")]
[Authorize(Roles = "admin,staff")]
public class AdminReportController(AdminReportService adminReportService) : ControllerBase
{
    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var stats = await adminReportService.GetOverviewAsync(from, to);
        return Ok(stats);
    }
}
```

### File: `Backe/DotnetBackend/Services/AdminServices.cs`
Business logic implementing database queries for invoicing:

```csharp
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using WebPhimApi.Data;
using WebPhimApi.DTOs;
using WebPhimApi.Entities;
using Order = WebPhimApi.Entities.Order;

namespace WebPhimApi.Services;

public class AdminBookingService(AppDbContext db, IConnectionMultiplexer redis, ILogger<AdminBookingService> logger)
{
    private IDatabase Cache => redis.GetDatabase();

    public async Task<AdminBookingResponse> BookTicketsAtCounterAsync(AdminBookingRequest request)
    {
        var showtime = await db.Showtimes
            .Include(s => s.Room)
            .FirstOrDefaultAsync(s => s.ShowtimeId == request.ShowtimeId)
            ?? throw new KeyNotFoundException("Suất chiếu không tồn tại");

        int userId = request.UserId ?? 1;
        var roomId = showtime.Room.RoomId;
        var seatKeys = request.SeatIds;
        var redisHashKey = $"showtime:{request.ShowtimeId}:seats";

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

        foreach (var seatKey in seatKeys)
            await Cache.HashSetAsync(redisHashKey, seatKey, "SOLD");

        logger.LogInformation("Admin tạo vé tại quầy: orderCode={OrderCode}", order.OrderCode);
        return new AdminBookingResponse(booking.BookingId, order.OrderCode, order.Status.ToString(), request.PaymentMethod);
    }
}

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

        if (!alreadyCheckedIn)
        {
            foreach (var bs in allBookingSeats)
                bs.IsCheckedIn = true;
            await db.SaveChangesAsync();
            logger.LogInformation("Check-in thành công: orderCode={OrderCode}", orderCode);
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
```

---

## 💻 3. Frontend Implementation (Vite React)

### File: `Fronte/vite-project/src/modules/admin/pages/InvoiceManager/InvoiceManager.jsx`
Implement this full page component for searching, filtering, and inspecting invoices:

```jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Filter, ReceiptText, RotateCcw, Search, X } from 'lucide-react';
import api from '../../../../services/api';
import './InvoiceManager.css';

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;

const InvoiceManager = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [filters, setFilters] = useState({
        searchTerm: '',
        fromDate: '',
        toDate: '',
        minAmount: '',
        maxAmount: '',
    });

    const fetchInvoices = async (query) => {
        setLoading(true);
        try {
            const params = {};
            if (query.searchTerm.trim()) params.searchTerm = query.searchTerm.trim();
            if (query.fromDate) params.fromDate = new Date(`${query.fromDate}T00:00:00`).toISOString();
            if (query.toDate) params.toDate = new Date(`${query.toDate}T23:59:59`).toISOString();
            if (query.minAmount !== '') params.minAmount = Number(query.minAmount);
            if (query.maxAmount !== '') params.maxAmount = Number(query.maxAmount);
            const res = await api.get('/admin/invoices', { params });
            setInvoices(res.data || []);
        } catch {
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchInvoices(filters);
        }, 400);

        return () => clearTimeout(debounce);
    }, [filters]);

    const totalPaid = useMemo(
        () => invoices.reduce((sum, item) => sum + Number(item.finalAmount || 0), 0),
        [invoices]
    );

    const resetFilters = () => {
        setFilters({
            searchTerm: '',
            fromDate: '',
            toDate: '',
            minAmount: '',
            maxAmount: '',
        });
    };

    return (
        <div className="invoice-page">
            <div className="invoice-header">
                <div className="invoice-title-wrap">
                    <ReceiptText size={20} />
                    <div>
                        <h2>Quản lý hóa đơn thành công</h2>
                        <p>{invoices.length} hóa đơn paid - Tổng cộng: {formatCurrency(totalPaid)}</p>
                    </div>
                </div>
                <div className="invoice-filters">
                    <div className="filter-input-group search-group">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Tìm theo mã đơn, tên khách hoặc email..."
                            value={filters.searchTerm}
                            onChange={(e) => setFilters((p) => ({ ...p, searchTerm: e.target.value }))}
                        />
                    </div>
                    <div className="filter-input-group">
                        <Filter size={16} />
                        <input
                            type="date"
                            value={filters.fromDate}
                            onChange={(e) => setFilters((p) => ({ ...p, fromDate: e.target.value }))}
                        />
                    </div>
                    <div className="filter-input-group">
                        <Filter size={16} />
                        <input
                            type="date"
                            value={filters.toDate}
                            onChange={(e) => setFilters((p) => ({ ...p, toDate: e.target.value }))}
                        />
                    </div>
                    <div className="filter-input-group">
                        <input
                            type="number"
                            min="0"
                            placeholder="Giá từ"
                            value={filters.minAmount}
                            onChange={(e) => setFilters((p) => ({ ...p, minAmount: e.target.value }))}
                        />
                    </div>
                    <div className="filter-input-group">
                        <input
                            type="number"
                            min="0"
                            placeholder="Đến giá"
                            value={filters.maxAmount}
                            onChange={(e) => setFilters((p) => ({ ...p, maxAmount: e.target.value }))}
                        />
                    </div>
                    <button className="invoice-reset-btn" onClick={resetFilters}>
                        <RotateCcw size={14} />
                        <span>Làm mới</span>
                    </button>
                </div>
            </div>

            <div className="invoice-table-wrap">
                {loading ? (
                    <div className="invoice-empty">Đang tải danh sách hóa đơn...</div>
                ) : (
                    <table className="invoice-table">
                        <thead>
                            <tr>
                                <th>Mã ĐH</th>
                                <th>Khách hàng</th>
                                <th>Email</th>
                                <th>Tổng tiền</th>
                                <th>Ngày thanh toán</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length === 0 ? (
                                <tr>
                                    <td className="invoice-empty" colSpan={5}>Không tìm thấy hóa đơn nào.</td>
                                </tr>
                            ) : (
                                invoices.map((invoice) => (
                                    <tr key={invoice.orderCode} onClick={() => setSelectedInvoice(invoice)}>
                                        <td>{invoice.orderCode}</td>
                                        <td>{invoice.customerName || 'Khách lẻ'}</td>
                                        <td>{invoice.customerEmail || '—'}</td>
                                        <td>{formatCurrency(invoice.finalAmount)}</td>
                                        <td>{new Date(invoice.paidAt).toLocaleString('vi-VN')}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {selectedInvoice && (
                <div className="invoice-modal-overlay" onClick={() => setSelectedInvoice(null)}>
                    <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="invoice-close-btn" onClick={() => setSelectedInvoice(null)}>
                            <X size={16} />
                        </button>
                        <h3>Chi tiết hóa đơn {selectedInvoice.orderCode}</h3>
                        <p><strong>Tên phim:</strong> {selectedInvoice.movieTitle}</p>
                        <p><strong>Suất chiếu:</strong> {new Date(selectedInvoice.showtime).toLocaleString('vi-VN')}</p>
                        <p><strong>Phòng:</strong> {selectedInvoice.roomName}</p>
                        <p><strong>Ghế:</strong> {selectedInvoice.seats?.map((s) => s.seatLabel).join(', ') || '—'}</p>
                        <p><strong>Email:</strong> {selectedInvoice.customerEmail || '—'}</p>
                        <p><strong>Phương thức thanh toán:</strong> {selectedInvoice.paymentMethod || '—'}</p>
                        <p><strong>Tổng tiền:</strong> {formatCurrency(selectedInvoice.finalAmount)}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoiceManager;
```

### File: `Fronte/vite-project/src/modules/admin/pages/InvoiceManager/InvoiceManager.css`
Premium Dark Mode Styling for UI/UX matching the workspace design:

```css
.invoice-page {
    color: #e2e8f0;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.invoice-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #0f172a;
    border-radius: 10px;
    border: 1px solid #1e293b;
    padding: 14px;
    gap: 12px;
    flex-wrap: wrap;
}

.invoice-title-wrap {
    display: flex;
    gap: 10px;
    align-items: center;
}

.invoice-title-wrap h2 {
    margin: 0;
    font-size: 18px;
}

.invoice-title-wrap p {
    margin-top: 2px;
    color: #94a3b8;
    font-size: 13px;
}

.invoice-filters {
    display: flex;
    gap: 8px;
    align-items: center;
}

.filter-input-group {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #111c31;
    border: 1px solid #22314c;
    border-radius: 8px;
    padding: 8px 10px;
}

.filter-input-group svg {
    color: #94a3b8;
}

.invoice-filters input {
    background: transparent;
    color: #e2e8f0;
    border: none;
    outline: none;
}

.invoice-filters input::placeholder {
    color: #94a3b8;
}

.invoice-filters input[type='date']::-webkit-calendar-picker-indicator {
    filter: invert(1);
}

.search-group {
    min-width: 300px;
}

.search-group input {
    min-width: 260px;
}

.invoice-reset-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid #334155;
    background: #1e293b;
    color: #e2e8f0;
    cursor: pointer;
}

.invoice-reset-btn:hover {
    background: #29384f;
}

.invoice-table-wrap {
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 10px;
    overflow: hidden;
}

.invoice-table {
    width: 100%;
    border-collapse: collapse;
}

.invoice-table th,
.invoice-table td {
    text-align: left;
    padding: 12px;
    border-bottom: 1px solid #1e293b;
    font-size: 14px;
}

.invoice-table tbody tr {
    cursor: pointer;
}

.invoice-table tbody tr:hover {
    background: #1c2840;
}

.invoice-empty {
    text-align: center;
    color: #94a3b8;
    padding: 24px;
}

.invoice-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.invoice-modal {
    background: #0f172a;
    width: 92%;
    max-width: 520px;
    border-radius: 12px;
    padding: 20px;
    position: relative;
    border: 1px solid #1e293b;
}

.invoice-close-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: 1px solid #334155;
    background: #1e293b;
    color: #e2e8f0;
}

.invoice-modal h3 {
    margin-bottom: 10px;
}

.invoice-modal p {
    margin-top: 6px;
    color: #cbd5e1;
}

@media (max-width: 992px) {
    .search-group,
    .search-group input {
        min-width: 100%;
    }
}
```

### Routing Setup (`Fronte/vite-project/src/routes/AppRoutes.jsx`)
Ensure the router registers the Invoice page:

```jsx
import InvoiceManager from '../modules/admin/pages/InvoiceManager/InvoiceManager';

// inside AppRoutes:
<Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
    ...
    <Route path="invoices" element={<InvoiceManager />} />
</Route>
```

### Sidebar Menu Setup (`Fronte/vite-project/src/modules/admin/layouts/AdminLayout.jsx`)
Ensure NavLinks to `/admin/invoices` are present in the admin layout sidebar:

```jsx
import { ReceiptText } from 'lucide-react';

// Inside submenu under Movie/Showtime Management:
<li>
    <NavLink to="/admin/invoices" className={({isActive}) => isActive ? 'sub-nav-link active' : 'sub-nav-link'}>
        Quản lý hóa đơn
    </NavLink>
</li>

// And inside the main menu items list:
<li>
    <NavLink to="/admin/invoices" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
        <ReceiptText size={18} />
        <span>Hóa đơn</span>
    </NavLink>
</li>
```
