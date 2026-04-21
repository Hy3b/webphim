using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebPhimApi.Entities;

/// <summary>
/// Entity ánh xạ bảng 'movies' trong cơ sở dữ liệu MySQL.
/// Lưu trữ toàn bộ thông tin về phim.
/// </summary>
[Table("movies")]
public class Movie
{
    [Key]
    [Column("movie_id")]
    public int MovieId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = null!;

    [Column(TypeName = "text")]
    public string? Description { get; set; }

    public int? Duration { get; set; } // Tổng thời lượng (phút)

    [Column("trailer_duration_minutes")]
    public int TrailerDuration { get; set; } = 10;

    [MaxLength(255)]
    [Column("poster_url")]
    public string? Poster { get; set; }

    public string? Banner { get; set; }

    public string Genre { get; set; } = "Chưa cập nhật";

    [Column("release_date")]
    public string ReleaseDate { get; set; } = "Chưa cập nhật";

    public string? Director { get; set; }

    [Column("cast_members")]
    public string? CastMembers { get; set; }

    [MaxLength(10)]
    [Column("age_rating")]
    public string AgeRating { get; set; } = "P";

    public double Rating { get; set; } = 0.0;

    [Column(TypeName = "enum('draft','showing','coming')")]
    public MovieStatus Status { get; set; } = MovieStatus.draft;

    /// <summary>
    /// Đánh dấu phim đã bị xóa (Soft Delete). 
    /// Phim bị xóa sẽ không hiển thị trên Client nhưng vẫn tồn tại trong DB để đối soát vé cũ.
    /// </summary>
    [Column("is_deleted")]
    public bool IsDeleted { get; set; } = false;

    // Navigation: Một phim có nhiều suất chiếu
    public ICollection<Showtime> Showtimes { get; set; } = [];
}

/// <summary>
/// Trạng thái của phim: đang chiếu hoặc sắp chiếu.
/// </summary>
public enum MovieStatus { draft, showing, coming }
