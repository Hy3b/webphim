using Microsoft.EntityFrameworkCore;
using WebPhimApi.Data;
using WebPhimApi.DTOs;
using WebPhimApi.Entities;

namespace WebPhimApi.Services;

/// <summary>
/// Xử lý logic nghiệp vụ cho Phòng Chiếu (Room).
/// Cung cấp CRUD đầy đủ cho Admin.
/// </summary>
public class RoomService(AppDbContext db)
{
    // ─── Queries ────────────────────────────────────────────────────────────

    /// <summary>
    /// Lấy danh sách phòng có phân trang và tìm kiếm.
    /// </summary>
    public async Task<RoomPagedResponse> GetPagedAsync(
        int pageNumber = 1,
        int pageSize = 10,
        string? search = null)
    {
        var query = db.Rooms.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(r => r.Name.Contains(search));

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .OrderBy(r => r.RoomId)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new RoomResponse(
                r.RoomId,
                r.Name,
                r.Seats.Count,        // Đếm thực từ DB thay vì TotalSeats cached
                r.Status.ToString()
            ))
            .ToListAsync();

        return new RoomPagedResponse(items, totalCount, pageNumber, pageSize, totalPages);
    }

    /// <summary>
    /// Lấy toàn bộ danh sách phòng (không phân trang) — dùng cho dropdown.
    /// </summary>
    public async Task<List<RoomResponse>> GetAllAsync() =>
        await db.Rooms
            .OrderBy(r => r.Name)
            .Select(r => new RoomResponse(
                r.RoomId,
                r.Name,
                r.Seats.Count,
                r.Status.ToString()
            ))
            .ToListAsync();

    /// <summary>
    /// Lấy chi tiết một phòng theo ID.
    /// </summary>
    public async Task<RoomResponse?> GetByIdAsync(int roomId)
    {
        return await db.Rooms
            .Where(r => r.RoomId == roomId)
            .Select(r => new RoomResponse(
                r.RoomId,
                r.Name,
                r.Seats.Count,
                r.Status.ToString()
            ))
            .FirstOrDefaultAsync();
    }

    // ─── Admin CRUD ─────────────────────────────────────────────────────────

    /// <summary>
    /// Tạo mới phòng chiếu.
    /// Ràng buộc: Không được trùng tên phòng.
    /// </summary>
    public async Task<(RoomResponse? Room, string? Error)> CreateAsync(CreateRoomRequest request)
    {
        var nameExists = await db.Rooms.AnyAsync(r => r.Name == request.Name);
        if (nameExists)
            return (null, $"Phòng chiếu có tên '{request.Name}' đã tồn tại.");

        if (!Enum.TryParse<RoomStatus>(request.Status, out var statusEnum))
            return (null, "Trạng thái không hợp lệ. Chỉ chấp nhận 'active' hoặc 'maintenance'.");

        var room = new Room
        {
            Name   = request.Name,
            Status = statusEnum
        };

        db.Rooms.Add(room);
        await db.SaveChangesAsync();

        // Cập nhật TotalSeats (khi mới tạo = 0)
        room.TotalSeats = await db.Seats.CountAsync(s => s.RoomId == room.RoomId);
        await db.SaveChangesAsync();

        return (ToResponse(room), null);
    }

    /// <summary>
    /// Cập nhật thông tin phòng chiếu.
    /// </summary>
    public async Task<(RoomResponse? Room, string? Error)> UpdateAsync(int roomId, CreateRoomRequest request)
    {
        var room = await db.Rooms.FindAsync(roomId);
        if (room is null) return (null, null);

        var nameExists = await db.Rooms.AnyAsync(r => r.Name == request.Name && r.RoomId != roomId);
        if (nameExists)
            return (null, $"Phòng chiếu có tên '{request.Name}' đã tồn tại.");

        if (!Enum.TryParse<RoomStatus>(request.Status, out var statusEnum))
            return (null, "Trạng thái không hợp lệ. Chỉ chấp nhận 'active' hoặc 'maintenance'.");

        room.Name   = request.Name;
        room.Status = statusEnum;

        await db.SaveChangesAsync();
        return (ToResponse(room), null);
    }

    /// <summary>
    /// Xóa phòng chiếu.
    /// Ràng buộc: Không xóa nếu còn suất chiếu hoặc ghế liên kết.
    /// </summary>
    public async Task<(bool Success, string? Error)> DeleteAsync(int roomId)
    {
        var room = await db.Rooms.FindAsync(roomId);
        if (room is null) return (false, null);

        var hasShowtimes = await db.Showtimes.AnyAsync(s => s.RoomId == roomId);
        if (hasShowtimes)
            return (false, "Không thể xóa phòng vì phòng này đang có suất chiếu liên kết.");

        // Xóa ghế trong phòng trước
        var seats = db.Seats.Where(s => s.RoomId == roomId);
        db.Seats.RemoveRange(seats);

        db.Rooms.Remove(room);
        await db.SaveChangesAsync();
        return (true, null);
    }

    // ─── Mapping ────────────────────────────────────────────────────────────

    private static RoomResponse ToResponse(Room r) =>
        new(r.RoomId, r.Name, r.TotalSeats, r.Status.ToString());
}
