using Microsoft.EntityFrameworkCore;
using WebPhimApi.Data;
using WebPhimApi.DTOs;
using WebPhimApi.Entities;

namespace WebPhimApi.Services;

/// <summary>
/// Lớp dịch vụ xử lý logic nghiệp vụ liên quan đến Phim.
/// Cung cấp các phương thức truy vấn, phân trang, và quản lý CRUD cho Admin.
/// </summary>
public class MovieService(AppDbContext db)
{
    // ─── Truy vấn dữ liệu (Queries) ────────────────────────────────────────────────────────

    /// <summary>
    /// Lấy danh sách phim có phân trang, tìm kiếm và lọc trạng thái.
    /// Thường dùng cho trang quản trị (Admin Table).
    /// </summary>
    public async Task<MoviePagedResponse> GetPagedAsync(
        int pageNumber = 1,
        int pageSize = 10,
        string? search = null,
        string? status = null)
    {
        // Khởi tạo query cơ bản, loại bỏ các phim đã bị xóa mềm
        var query = db.Movies.Where(m => !m.IsDeleted);

        // Tìm kiếm theo tên phim (nếu có)
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(m => m.Title.Contains(search));

        // Lọc theo trạng thái (showing/coming)
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<MovieStatus>(status, out var s))
            query = query.Where(m => m.Status == s);

        // Đếm tổng số bản ghi thỏa điều kiện để tính toán phân trang
        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        // Lấy dữ liệu theo trang hiện tại
        var items = await query
            .OrderByDescending(m => m.MovieId) // Phim mới nhất lên đầu
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(m => ToResponse(m))
            .ToListAsync();

        return new MoviePagedResponse(items, totalCount, pageNumber, pageSize, totalPages);
    }

    /// <summary>
    /// Lấy toàn bộ danh sách phim (không phân trang).
    /// Phù hợp cho các slider hoặc danh sách nhỏ ở trang chủ Client.
    /// </summary>
    public async Task<List<MovieResponse>> GetAllAsync() =>
        await db.Movies
            .Where(m => !m.IsDeleted && m.Status != MovieStatus.draft)
            .Select(m => ToResponse(m))
            .ToListAsync();

    /// <summary>
    /// Lấy danh sách phim theo trạng thái cụ thể.
    /// </summary>
    public async Task<List<MovieResponse>> GetByStatusAsync(string status) =>
        Enum.TryParse<MovieStatus>(status, out var s)
            ? await db.Movies.Where(m => !m.IsDeleted && m.Status == s).Select(m => ToResponse(m)).ToListAsync()
            : [];

    /// <summary>
    /// Lấy thông tin chi tiết một bộ phim theo ID.
    /// </summary>
    public async Task<MovieResponse?> GetByIdAsync(int id)
    {
        var movie = await db.Movies.FirstOrDefaultAsync(m => m.MovieId == id && !m.IsDeleted);
        return movie is null ? null : ToResponse(movie);
    }

    // ─── Thao tác quản trị (Admin CRUD) ──────────────────────────────────────────────────────────

    /// <summary>
    /// Thêm mới một bộ phim vào hệ thống.
    /// Bao gồm các bước kiểm tra dữ liệu đầu vào (Validation).
    /// </summary>
    public async Task<(MovieResponse? Movie, string? Error)> CreateAsync(CreateMovieRequest request)
    {
        // Kiểm tra thời lượng phim hợp lệ (0 = chưa nhập)
        if (request.Duration != 0 && (request.Duration < 1 || request.Duration > 500))
            return (null, "Thời lượng phim (Duration) phải nằm trong khoảng 1–500 phút.");

        // Kiểm tra trùng tên phim (tránh thêm lặp lại)
        var titleExists = await db.Movies.AnyAsync(m => m.Title == request.Title && !m.IsDeleted);
        if (titleExists)
            return (null, $"Phim có tên '{request.Title}' đã tồn tại trong hệ thống.");

        // Tự động gán trạng thái là draft (Bản nháp) khi mới tạo
        var statusEnum = MovieStatus.draft;

        var movie = new Movie
        {
            Title       = request.Title,
            Description = request.Description,
            Duration    = request.Duration,
            Poster      = request.Poster,
            Banner      = request.Banner,
            Genre       = request.Genre,
            ReleaseDate = request.ReleaseDate,
            Director    = request.Director,
            CastMembers = request.CastMembers,
            AgeRating   = request.AgeRating,
            Status      = statusEnum
        };

        db.Movies.Add(movie);
        await db.SaveChangesAsync();
        return (ToResponse(movie), null);
    }

    /// <summary>
    /// Cập nhật thông tin một bộ phim hiện có.
    /// </summary>
    public async Task<(MovieResponse? Movie, string? Error)> UpdateAsync(int id, CreateMovieRequest request)
    {
        var movie = await db.Movies.FirstOrDefaultAsync(m => m.MovieId == id && !m.IsDeleted);
        if (movie is null) return (null, null); // Trả về null/null để Controller báo NotFound

        if (request.Duration != 0 && (request.Duration < 1 || request.Duration > 500))
            return (null, "Thời lượng phải nằm trong khoảng 1–500 phút.");

        // Kiểm tra trùng tên với các phim khác (trừ chính nó)
        var titleExists = await db.Movies.AnyAsync(m => m.Title == request.Title && m.MovieId != id && !m.IsDeleted);
        if (titleExists)
            return (null, $"Phim có tên '{request.Title}' đã tồn tại.");

        if (!Enum.TryParse<MovieStatus>(request.Status, out var statusEnum))
            return (null, "Trạng thái không hợp lệ.");

        movie.Title       = request.Title;
        movie.Description = request.Description;
        movie.Duration    = request.Duration;
        movie.Poster      = request.Poster;
        movie.Banner      = request.Banner;
        movie.Genre       = request.Genre;
        movie.ReleaseDate = request.ReleaseDate;
        movie.Director    = request.Director;
        movie.CastMembers = request.CastMembers;
        movie.AgeRating   = request.AgeRating;
        movie.Status      = statusEnum;

        await db.SaveChangesAsync();
        return (ToResponse(movie), null);
    }

    /// <summary>
    /// Thực hiện xóa mềm (Soft Delete) phim.
    /// Ràng buộc: Không cho xóa nếu phim đang có suất chiếu tương lai đã có người đặt vé.
    /// </summary>
    public async Task<(bool Success, string? Error)> SoftDeleteAsync(int id)
    {
        var movie = await db.Movies.FirstOrDefaultAsync(m => m.MovieId == id && !m.IsDeleted);
        if (movie is null) return (false, null);

        // Kiểm tra xem phim có suất chiếu nào sắp tới (StartTime > Now) 
        // mà đã có vé ở trạng thái 'đang chờ' (pending) hoặc 'đã thanh toán' (paid) không.
        var hasActiveBookings = await db.Showtimes
            .Where(s => s.MovieId == id && s.StartTime > DateTime.Now && s.Status == ShowtimeStatus.active)
            .AnyAsync(s => s.Bookings.Any(b => b.Order.Status == Entities.OrderStatus.pending
                                            || b.Order.Status == Entities.OrderStatus.paid));

        if (hasActiveBookings)
            return (false, "KHÔNG THỂ XÓA: Phim vẫn còn suất chiếu trong tương lai đã phát sinh đơn hàng.");

        movie.IsDeleted = true; // Đánh dấu xóa
        await db.SaveChangesAsync();
        return (true, null);
    }

    /// <summary>
    /// Xuất bản (Publish) phim từ trạng thái nháp (draft) sang sắp chiếu (coming) hoặc đang chiếu (showing).
    /// </summary>
    public async Task<(bool Success, string? Error)> PublishAsync(int id, string targetStatus = "showing")
    {
        var movie = await db.Movies.FirstOrDefaultAsync(m => m.MovieId == id && !m.IsDeleted);
        if (movie is null) return (false, null);

        if (movie.Status != MovieStatus.draft)
            return (false, "Chỉ có thể xuất bản phim đang ở trạng thái nháp.");

        if (!Enum.TryParse<MovieStatus>(targetStatus, out var statusEnum) || statusEnum == MovieStatus.draft)
            return (false, "Trạng thái sau xuất bản phải là 'showing' hoặc 'coming'.");

        movie.Status = statusEnum;
        await db.SaveChangesAsync();
        return (true, null);
    }

    // ─── Chuyển đổi dữ liệu (Mapping) ─────────────────────────────────────────────────────────────

    /// <summary>
    /// Helper: Chuyển đổi Entity sang MovieResponse DTO.
    /// </summary>
    private static MovieResponse ToResponse(Movie m) => new(
        m.MovieId, m.Title, m.Description, m.Duration,
        m.Poster, m.Banner, m.Genre, m.ReleaseDate,
        m.Director, m.CastMembers, m.AgeRating, m.Rating,
        m.Status.ToString(), m.IsDeleted
    );
}
