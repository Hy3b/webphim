using System.Text.Json.Serialization;

namespace WebPhimApi.DTOs;

/// <summary>
/// DTO chứa thông tin phim trả về cho Client/Admin.
/// </summary>
public record MovieResponse(
    [property: JsonPropertyName("id")] int MovieId,
    string Title,
    string? Description,
    int? Duration, // Thời lượng phim (phút)
    string? Poster,
    string? Banner,
    string Genre,
    string ReleaseDate,
    string? Director,
    string? CastMembers,
    string AgeRating,
    double Rating,
    string Status, // 'showing' hoặc 'coming'
    bool IsDeleted // Đánh dấu xóa mềm
);

/// <summary>
/// DTO bao bọc kết quả phân trang danh sách phim.
/// </summary>
public record MoviePagedResponse(
    List<MovieResponse> Items,
    int TotalCount,
    int PageNumber,
    int PageSize,
    int TotalPages
);

/// <summary>
/// DTO dùng để nhận dữ liệu từ Client khi tạo/cập nhật phim.
/// </summary>
public record CreateMovieRequest(
    string Title,
    string? Description,
    int? Duration,
    string? Poster,
    string? Banner,
    string Genre = "Chưa cập nhật",
    string ReleaseDate = "Chưa cập nhật",
    string? Director = null,
    string? CastMembers = null,
    string AgeRating = "P",
    string Status = "showing"
);
