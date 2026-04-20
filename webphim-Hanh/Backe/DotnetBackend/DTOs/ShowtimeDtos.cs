using System.Text.Json.Serialization;

namespace WebPhimApi.DTOs;

/// <summary>
/// Chi tiết suất chiếu dành cho Khách hàng xem để đặt vé.
/// </summary>
public record ShowtimeDetailResponse(
    int ShowtimeId,
    int MovieId,
    string MovieTitle,
    string? Poster,
    string RoomName,
    DateTime StartTime,
    decimal BasePrice,
    int? Duration,
    string Genre,
    string AgeRating
);

/// <summary>
/// Thông tin suất chiếu đầy đủ dành cho Admin quản lý.
/// Bao gồm thông tin về số lượng ghế đã bán để hiển thị lên Timeline Grid.
/// </summary>
public record AdminShowtimeResponse(
    int ShowtimeId,
    int MovieId,
    string MovieTitle,
    string? Poster,
    int RoomId,
    string RoomName,
    DateTime StartTime,
    DateTime? EndTime,
    decimal BasePrice,
    string Status, // 'active' hoặc 'cancelled'
    int SoldSeats,
    int TotalSeats,
    int? Duration
);

/// <summary>
/// Trạng thái từng ghế trong một suất chiếu.
/// </summary>
public record SeatStatusResponse(
    [property: JsonPropertyName("id")] int SeatId,
    string RowName,
    int SeatNumber,
    string Status,          // AVAILABLE | LOCKED | SOLD
    string SeatTypeName,
    decimal Price
);

/// <summary>
/// Yêu cầu tạo suất chiếu mới.
/// </summary>
public record CreateShowtimeRequest(
    int MovieId,
    int RoomId,
    DateTime StartTime,
    decimal BasePrice,
    int BufferTimeMinutes = 15 // Thời gian dọn dẹp sau suất chiếu
);

/// <summary>
/// Yêu cầu cập nhật suất chiếu hiện có.
/// </summary>
public record UpdateShowtimeRequest(
    int MovieId,
    int RoomId,
    DateTime StartTime,
    decimal BasePrice,
    int BufferTimeMinutes = 15
);

/// <summary>
/// Yêu cầu hệ thống tự động sinh lịch chiếu theo khung giờ.
/// </summary>
public record AutoGenerateRequest(
    int MovieId,
    List<int> RoomIds,
    DateOnly Date,
    TimeOnly OpenTime, 
    TimeOnly CloseTime,
    decimal BasePrice,
    int CleaningMinutes = 15
);

/// <summary>
/// Kết quả sau khi tự động tạo lịch chiếu.
/// </summary>
public record AutoGenerateResult(
    int CreatedCount,
    List<string> Conflicts // Danh sách các khung giờ bị trùng không thể tạo
);
