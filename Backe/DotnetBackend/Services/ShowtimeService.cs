using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using WebPhimApi.Data;
using WebPhimApi.DTOs;
using WebPhimApi.Entities;

namespace WebPhimApi.Services;

/// <summary>
/// Lớp dịch vụ quan trọng nhất điều phối logic Suất chiếu, Phòng chiếu và Ghế ngồi.
/// Kết nối cả MySQL (EF Core) và Redis (Cập nhật trạng thái ghế).
/// </summary>
public class ShowtimeService(AppDbContext db, IConnectionMultiplexer redis)
{
    private IDatabase Cache => redis.GetDatabase();

    // ─── Truy vấn phía Client (Client-facing queries) ────────────────────────────────────────────────

    /// <summary>
    /// Lấy danh sách tất cả suất chiếu đang hoạt động cho người dùng.
    /// </summary>
    public async Task<List<ShowtimeDetailResponse>> GetAllAsync() =>
        await db.Showtimes
            .Include(s => s.Movie)
            .Include(s => s.Room)
            .Where(s => s.Status == ShowtimeStatus.active && !s.Movie.IsDeleted)
            .Select(s => ToDetailResponse(s))
            .ToListAsync();

    /// <summary>
    /// Lấy danh sách suất chiếu của một bộ phim cụ thể.
    /// </summary>
    public async Task<List<ShowtimeDetailResponse>> GetByMovieAsync(int movieId) =>
        await db.Showtimes
            .Include(s => s.Movie)
            .Include(s => s.Room)
            .Where(s => s.MovieId == movieId && s.Status == ShowtimeStatus.active)
            .Select(s => ToDetailResponse(s))
            .ToListAsync();

    /// <summary>
    /// Lấy thông tin chi tiết của một suất chiếu kèm phim và phòng.
    /// </summary>
    public async Task<ShowtimeDetailResponse?> GetDetailAsync(int showtimeId)
    {
        var s = await db.Showtimes
            .Include(s => s.Movie)
            .Include(s => s.Room)
            .FirstOrDefaultAsync(s => s.ShowtimeId == showtimeId);

        return s is null ? null : ToDetailResponse(s);
    }

    /// <summary>
    /// Đồng bộ trạng thái ghế ngồi từ Redis và thông tin ghế từ MySQL.
    /// </summary>
    public async Task<List<SeatStatusResponse>> GetSeatStatusesAsync(int showtimeId)
    {
        // 1. Kiểm tra suất chiếu có tồn tại không
        var showtime = await db.Showtimes
            .Include(s => s.Room)
            .FirstOrDefaultAsync(s => s.ShowtimeId == showtimeId)
            ?? throw new KeyNotFoundException($"Suất chiếu {showtimeId} không tồn tại");

        // 2. Lấy sơ đồ ghế tĩnh của phòng chiếu từ Database
        var seats = await db.Seats
            .Include(s => s.SeatType)
            .Where(s => s.RoomId == showtime.Room.RoomId)
            .ToListAsync();

        var redisHashKey = $"showtime:{showtimeId}:seats";
        var responses = new List<SeatStatusResponse>();

        // 3. Với mỗi ghế, truy vấn Redis để biết trạng thái động (AVAILABLE | LOCKED | SOLD)
        foreach (var seat in seats)
        {
            var seatKey    = $"{seat.RowName}{seat.SeatNumber}";
            var redisStatus = await Cache.HashGetAsync(redisHashKey, seatKey);
            var status     = redisStatus.HasValue ? redisStatus.ToString() : "AVAILABLE";

            // Tính giá vé dự trên: Giá suất chiếu + Phụ phí loại ghế (VIP, Sweetbox...)
            var price = showtime.BasePrice + seat.SeatType.Surcharge;
            responses.Add(new SeatStatusResponse(
                seat.SeatId, seat.RowName, seat.SeatNumber,
                status, seat.SeatType.Name, price));
        }

        return responses;
    }

    // ─── Truy vấn phía Admin (Admin queries) ────────────────────────────────────────────────────────

    /// <summary>
    /// Lấy danh sách suất chiếu phục vụ cho Timeline Grid của Admin.
    /// Bao gồm thông tin chi tiết về số vé đã bán.
    /// </summary>
    public async Task<List<AdminShowtimeResponse>> GetAdminShowtimesAsync(
        DateOnly? date = null,
        int? roomId = null)
    {
        var query = db.Showtimes
            .Include(s => s.Movie)
            .Include(s => s.Room)
            .Include(s => s.Bookings)
                .ThenInclude(b => b.BookingSeats)
            .AsQueryable();

        // Lọc theo ngày
        if (date.HasValue)
        {
            var start = date.Value.ToDateTime(TimeOnly.MinValue);
            var end   = date.Value.ToDateTime(TimeOnly.MaxValue);
            query = query.Where(s => s.StartTime >= start && s.StartTime <= end);
        }

        // Lọc theo phòng
        if (roomId.HasValue)
            query = query.Where(s => s.RoomId == roomId.Value);

        var showtimes = await query.ToListAsync();

        return showtimes.Select(s =>
        {
            // Tính toán tỷ lệ lấp đầy
            var totalSeats = db.Seats.Count(seat => seat.RoomId == s.RoomId);
            var soldSeats  = s.Bookings.Sum(b => b.BookingSeats.Count);
            return ToAdminResponse(s, soldSeats, totalSeats);
        }).ToList();
    }

    // ─── Quản lý Admin (Admin CRUD) ───────────────────────────────────────────────────────────

    /// <summary>
    /// Tạo suất chiếu mới với các ràng buộc về logic (Trùng phòng, thời gian...).
    /// </summary>
    public async Task<(AdminShowtimeResponse? Showtime, string? Error)> CreateAsync(CreateShowtimeRequest req)
    {
        var movie = await db.Movies.FindAsync(req.MovieId);
        if (movie is null) return (null, "Phim không tồn tại.");

        var room = await db.Rooms.FindAsync(req.RoomId);
        if (room is null) return (null, "Phòng chiếu không tồn tại.");

        // Tính giờ kết thúc = Giờ bắt đầu + Thời lượng phim + Thời gian nghỉ/dọn dẹp
        var duration = (movie.Duration ?? 90) + req.BufferTimeMinutes;
        var endTime  = req.StartTime.AddMinutes(duration);

        // Kiểm tra xem phòng chiếu này có bị trùng (overlap) với suất khác không
        var overlapError = await CheckOverlapAsync(req.RoomId, req.StartTime, endTime, excludeId: null);
        if (overlapError is not null) return (null, overlapError);

        var showtime = new Showtime
        {
            MovieId           = req.MovieId,
            RoomId            = req.RoomId,
            StartTime         = req.StartTime,
            EndTime           = endTime,
            BasePrice         = req.BasePrice,
            BufferTimeMinutes = req.BufferTimeMinutes,
            Status            = ShowtimeStatus.draft
        };

        db.Showtimes.Add(showtime);
        await db.SaveChangesAsync();

        await db.Entry(showtime).Reference(s => s.Movie).LoadAsync();
        await db.Entry(showtime).Reference(s => s.Room).LoadAsync();

        var totalSeats = await db.Seats.CountAsync(seat => seat.RoomId == req.RoomId);
        return (ToAdminResponse(showtime, 0, totalSeats), null);
    }

    /// <summary>
    /// Cập nhật thông tin suất chiếu. Lưu ý: Khi cập nhật sẽ xóa trạng thái ghế trong Redis.
    /// </summary>
    public async Task<(AdminShowtimeResponse? Showtime, string? Error)> UpdateAsync(int id, UpdateShowtimeRequest req)
    {
        var showtime = await db.Showtimes
            .Include(s => s.Movie)
            .Include(s => s.Room)
            .FirstOrDefaultAsync(s => s.ShowtimeId == id);

        if (showtime is null) return (null, null);

        var movie = await db.Movies.FindAsync(req.MovieId);
        if (movie is null) return (null, "Phim không tồn tại.");

        var room = await db.Rooms.FindAsync(req.RoomId);
        if (room is null) return (null, "Phòng không tồn tại");

        var duration = (movie.Duration ?? 90) + req.BufferTimeMinutes;
        var endTime  = req.StartTime.AddMinutes(duration);

        var overlapError = await CheckOverlapAsync(req.RoomId, req.StartTime, endTime, excludeId: id);
        if (overlapError is not null) return (null, overlapError);

        showtime.MovieId           = req.MovieId;
        showtime.RoomId            = req.RoomId;
        showtime.StartTime         = req.StartTime;
        showtime.EndTime           = endTime;
        showtime.BasePrice         = req.BasePrice;
        showtime.BufferTimeMinutes = req.BufferTimeMinutes;

        await db.SaveChangesAsync();

        // ⭐ QUAN TRỌNG: Xóa toàn bộ key Redis của suất chiếu này để giải phóng các ghế 'LOCKED'
        await InvalidateShowtimeRedisAsync(id);

        var totalSeats = await db.Seats.CountAsync(seat => seat.RoomId == req.RoomId);
        return (ToAdminResponse(showtime, 0, totalSeats), null);
    }

    /// <summary>
    /// Hủy suất chiếu (Status = cancelled).
    /// </summary>
    public async Task<(bool Success, string? Error)> CancelAsync(int id)
    {
        var showtime = await db.Showtimes.FindAsync(id);
        if (showtime is null) return (false, null);

        showtime.Status = ShowtimeStatus.cancelled;
        await db.SaveChangesAsync();

        // Xóa thông tin ghế trong cache Redis vì suất chiếu không còn khả dụng
        await InvalidateShowtimeRedisAsync(id);

        return (true, null);
    }

    /// <summary>
    /// Xuất bản (Publish) suất chiếu từ trạng thái nháp (draft) sang hoạt động (active).
    /// Khi active, khách hàng mới nhìn thấy suất chiếu trên website.
    /// </summary>
    public async Task<(bool Success, string? Error)> PublishAsync(int id)
    {
        var showtime = await db.Showtimes.FindAsync(id);
        if (showtime is null) return (false, null);

        if (showtime.Status != ShowtimeStatus.draft)
            return (false, "Chỉ có thể xuất bản suất chiếu đang ở trạng thái nháp.");

        showtime.Status = ShowtimeStatus.active;
        await db.SaveChangesAsync();
        return (true, null);
    }

    /// <summary>
    /// Thuật toán lấp đầy lịch chiếu tự động (Auto-generate Algorithm).
    /// Chạy lặp từ giờ mở cửa đến khi không còn đủ thời gian nhét thêm một suất phim nữa.
    /// </summary>
    public async Task<(AutoGenerateResult Result, string? Error)> AutoGenerateAsync(AutoGenerateRequest req)
    {
        var movie = await db.Movies.FindAsync(req.MovieId);
        if (movie is null) return (new AutoGenerateResult(0, []), "Phim không tồn tại.");

        var movieDuration = movie.Duration ?? 90;
        var created = 0;
        var conflicts = new List<string>();

        // Sử dụng Transaction để đảm bảo tính toàn vẹn: hoặc tạo hết, hoặc không tạo cái nào nếu lỗi
        await using var tx = await db.Database.BeginTransactionAsync();
        try
        {
            foreach (var roomId in req.RoomIds)
            {
                var room = await db.Rooms.FindAsync(roomId);
                if (room is null) continue;

                var current = req.Date.ToDateTime(req.OpenTime);
                var closeTime = req.Date.ToDateTime(req.CloseTime);

                // Chạy vòng lặp đến khi vượt quá giờ đóng cửa
                while (current.AddMinutes(movieDuration) <= closeTime)
                {
                    // Thời điểm suất chiếu tiếp theo có thể kết thúc (đã cộng time dọn dẹp)
                    var endTimeWithBuffer = current.AddMinutes(movieDuration + req.CleaningMinutes);

                    // Kiểm tra xem tại phòng này, khoảng thời gian này đã có suất chiếu cố định nào chưa
                    var conflictingShowtime = await db.Showtimes
                        .Where(s => s.RoomId == roomId
                                 && (s.Status == ShowtimeStatus.active || s.Status == ShowtimeStatus.draft)
                                 && current < s.EndTime // Bắt đầu trước khi suất kia kết thúc
                                 && endTimeWithBuffer > s.StartTime) // Kết thúc sau khi suất kia bắt đầu
                        .OrderBy(s => s.StartTime)
                        .FirstOrDefaultAsync();

                    if (conflictingShowtime is not null)
                    {
                        // Nếu bị vướng lịch, nhảy sang mốc thời gian sau khi suất bị vướng kết thúc
                        var conflictEnd = conflictingShowtime.EndTime ?? conflictingShowtime.StartTime.AddMinutes(movieDuration);
                        conflicts.Add($"Phòng {room.Name}: bỏ qua {current:HH:mm} do vướng suất {conflictingShowtime.StartTime:HH:mm}.");
                        current = conflictEnd.AddMinutes(req.CleaningMinutes);
                        continue;
                    }

                    // Nếu không vướng, tạo mới
                    db.Showtimes.Add(new Showtime
                    {
                        MovieId           = req.MovieId,
                        RoomId            = roomId,
                        StartTime         = current,
                        EndTime           = current.AddMinutes(movieDuration),
                        BasePrice         = req.BasePrice,
                        BufferTimeMinutes = req.CleaningMinutes,
                        Status            = ShowtimeStatus.draft
                    });
                    created++;
                    current = endTimeWithBuffer; // Nhảy mốc thời gian tiếp theo
                }
            }

            await db.SaveChangesAsync();
            await tx.CommitAsync();
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }

        return (new AutoGenerateResult(created, conflicts), null);
    }

    // ─── Các hàm hỗ trợ (Helpers) ──────────────────────────────────────────────────────────────

    /// <summary>
    /// Kiểm tra trùng giờ (Overlap check) trên LINQ. 
    /// Phương pháp: (StartA < EndB) AND (EndA > StartB).
    /// </summary>
    private async Task<string?> CheckOverlapAsync(int roomId, DateTime start, DateTime end, int? excludeId)
    {
        var query = db.Showtimes.Where(s =>
            s.RoomId == roomId &&
            (s.Status == ShowtimeStatus.active || s.Status == ShowtimeStatus.draft) &&
            start < s.EndTime &&
            end > s.StartTime);

        if (excludeId.HasValue)
            query = query.Where(s => s.ShowtimeId != excludeId.Value);

        var conflict = await query.FirstOrDefaultAsync();
        return conflict is null
            ? null
            : $"Phòng trùng lịch với suất: {conflict.StartTime:HH:mm}-{conflict.EndTime:HH:mm}.";
    }

    /// <summary>
    /// Xóa toàn bộ key liên quan đến suất chiếu trong Redis.
    /// Dùng khi hủy suất hoặc sửa lịch để ghế ngồi quay về AVAILABLE.
    /// </summary>
    private async Task InvalidateShowtimeRedisAsync(int showtimeId)
    {
        var server = redis.GetServer(redis.GetEndPoints().First());
        var pattern = $"showtime:{showtimeId}:*";
        await foreach (var key in server.KeysAsync(pattern: pattern))
            await Cache.KeyDeleteAsync(key);
    }

    // ─── Chuyển đổi (Mapping) ──────────────────────────────────────────────────────────────

    private static ShowtimeDetailResponse ToDetailResponse(Showtime s) => new(
        s.ShowtimeId, s.MovieId, s.Movie.Title,
        s.Movie.Poster, s.Room.Name, s.StartTime,
        s.BasePrice, s.Movie.Duration, s.Movie.Genre, s.Movie.AgeRating
    );

    private static AdminShowtimeResponse ToAdminResponse(Showtime s, int soldSeats, int totalSeats) => new(
        s.ShowtimeId, s.MovieId, s.Movie.Title,
        s.Movie.Poster, s.RoomId, s.Room.Name,
        s.StartTime, s.EndTime, s.BasePrice,
        s.Status.ToString(), soldSeats, totalSeats, s.Movie.Duration
    );
}
