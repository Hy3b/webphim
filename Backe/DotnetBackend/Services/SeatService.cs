using Microsoft.EntityFrameworkCore;
using WebPhimApi.Data;
using WebPhimApi.DTOs;
using WebPhimApi.Entities;

namespace WebPhimApi.Services;

/// <summary>
/// Xử lý logic nghiệp vụ cho Ghế (Seat) trong phòng chiếu.
/// Cung cấp chức năng đọc và cập nhật sơ đồ ghế hàng loạt.
/// </summary>
public class SeatService(AppDbContext db)
{
    // ─── Queries ────────────────────────────────────────────────────────────

    /// <summary>
    /// Lấy toàn bộ danh sách ghế của một phòng, kèm thông tin SeatType.
    /// Kết quả được sắp xếp theo RowName rồi SeatNumber để hiển thị Grid.
    /// </summary>
    public async Task<List<SeatResponse>> GetByRoomIdAsync(int roomId)
    {
        var roomExists = await db.Rooms.AnyAsync(r => r.RoomId == roomId);
        if (!roomExists) return [];

        return await db.Seats
            .Where(s => s.RoomId == roomId)
            .Include(s => s.SeatType)
            .OrderBy(s => s.RowName)
            .ThenBy(s => s.SeatNumber)
            .Select(s => new SeatResponse(
                s.SeatId,
                s.RoomId,
                s.RowName,
                s.SeatNumber,
                new SeatTypeResponse(s.SeatType.SeatTypeId, s.SeatType.Name, s.SeatType.Surcharge)
            ))
            .ToListAsync();
    }

    /// <summary>
    /// Lấy toàn bộ loại ghế trong hệ thống (dùng cho dropdown trong Admin).
    /// </summary>
    public async Task<List<SeatTypeResponse>> GetAllSeatTypesAsync() =>
        await db.SeatTypes
            .OrderBy(st => st.SeatTypeId)
            .Select(st => new SeatTypeResponse(st.SeatTypeId, st.Name, st.Surcharge))
            .ToListAsync();

    // ─── Admin Mutations ────────────────────────────────────────────────────

    /// <summary>
    /// Cập nhật loại ghế hàng loạt cho sơ đồ ghế của phòng.
    /// Chỉ cập nhật các ghế thuộc đúng roomId để tránh sửa nhầm.
    /// </summary>
    public async Task<(int UpdatedCount, string? Error)> UpdateSeatMapAsync(int roomId, UpdateSeatMapRequest request)
    {
        if (request.Seats.Count == 0)
            return (0, "Danh sách ghế cần cập nhật không được rỗng.");

        var updateSeatRequests = request.Seats.Where(s => s.SeatTypeId != -1).ToList();
        var seatIdsToUpdate = updateSeatRequests.Select(s => s.SeatId).ToList();
        var typeIds = updateSeatRequests.Select(s => s.SeatTypeId).Distinct().ToList();

        // Validate: tất cả SeatTypeId phải tồn tại
        var validTypeIds = await db.SeatTypes
            .Where(st => typeIds.Contains(st.SeatTypeId))
            .Select(st => st.SeatTypeId)
            .ToListAsync();

        var invalidTypes = typeIds.Except(validTypeIds).ToList();
        if (invalidTypes.Count > 0)
            return (0, $"Loại ghế không hợp lệ: {string.Join(", ", invalidTypes)}");

        int processedCount = 0;

        // 1. Xử lý xoá ghế lẻ (SeatTypeId == -1)
        var seatIdsToDelete = request.Seats.Where(s => s.SeatTypeId == -1).Select(s => s.SeatId).ToList();
        if (seatIdsToDelete.Count > 0)
        {
            var seatsToDelete = await db.Seats
                .Where(s => s.RoomId == roomId && seatIdsToDelete.Contains(s.SeatId))
                .ToListAsync();

            if (seatsToDelete.Count > 0)
            {
                // Kiểm tra xem ghế đã có rạp booking chưa (có thể bị dính khoá ngoại constraints)
                // Phụ thuộc vào cascade delete, ở đây cứ RemoveRange
                db.Seats.RemoveRange(seatsToDelete);
                processedCount += seatsToDelete.Count;
            }
        }

        // 2. Xử lý cập nhật loại ghế
        if (seatIdsToUpdate.Count > 0)
        {
            var seatsToUpdate = await db.Seats
                .Where(s => s.RoomId == roomId && seatIdsToUpdate.Contains(s.SeatId))
                .ToListAsync();

            var updateMap = updateSeatRequests.ToDictionary(s => s.SeatId, s => s.SeatTypeId);

            foreach (var seat in seatsToUpdate)
            {
                if (updateMap.TryGetValue(seat.SeatId, out var newTypeId))
                    seat.SeatTypeId = newTypeId;
            }
            processedCount += seatsToUpdate.Count;
        }

        try {
            await db.SaveChangesAsync();
            return (processedCount, null);
        } catch (Exception ex) {
            return (0, "Không thể xoá ghế vì có dữ liệu ràng buộc (đã được đặt vé) hoặc lỗi hệ thống.");
        }
    }

    /// <summary>
    /// Khởi tạo sơ đồ ghế trống theo lưới rows x columns (Hàng A-Z).
    /// Gán mặc định loại ghế đầu tiên trong database.
    /// </summary>
    public async Task<(int CreatedCount, string? Error)> InitializeSeatMapAsync(int roomId, GenerateSeatMapRequest request)
    {
        var roomExists = await db.Rooms.AnyAsync(r => r.RoomId == roomId);
        if (!roomExists) return (0, "Phòng chiếu không tồn tại.");

        var hasSeats = await db.Seats.AnyAsync(s => s.RoomId == roomId);
        if (hasSeats) return (0, "Phòng chiếu này đã có sơ đồ ghế.");

        var defaultType = await db.SeatTypes.OrderBy(st => st.SeatTypeId).FirstOrDefaultAsync();
        if (defaultType == null) return (0, "Hệ thống chưa cấu hình loại ghế nào (SeatType).");

        var newSeats = new List<Seat>();
        // Sinh hàng A, B, C...
        for (int r = 0; r < request.Rows; r++)
        {
            var rowName = ((char)('A' + r)).ToString();
            for (int c = 1; c <= request.Columns; c++)
            {
                newSeats.Add(new Seat
                {
                    RoomId = roomId,
                    SeatTypeId = defaultType.SeatTypeId,
                    RowName = rowName,
                    SeatNumber = c
                });
            }
        }

        db.Seats.AddRange(newSeats);
        await db.SaveChangesAsync();
        return (newSeats.Count, null);
    }

    /// <summary>
    /// Xoá toàn bộ sơ đồ ghế của phòng.
    /// Cho phép admin setup lại sơ đồ gồm cấu trúc hàng / cột mới.
    /// </summary>
    public async Task<(bool Success, string? Error)> DeleteAllByRoomIdAsync(int roomId)
    {
        var roomExists = await db.Rooms.AnyAsync(r => r.RoomId == roomId);
        if (!roomExists) return (false, "Phòng chiếu không tồn tại.");

        var seats = await db.Seats.Where(s => s.RoomId == roomId).ToListAsync();
        if (seats.Count == 0) return (false, "Phòng này chưa có ghế nào.");

        try {
            db.Seats.RemoveRange(seats);
            await db.SaveChangesAsync();
            return (true, null);
        } catch {
            return (false, "Không thể xoá sơ đồ ghế do đã có dữ liệu vé đặt cho các ghế trong phòng này.");
        }
    }
}
