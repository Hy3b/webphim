using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace WebPhimApi.DTOs;

// ─── Room DTOs ──────────────────────────────────────────────────────────────

/// <summary>
/// DTO trả về thông tin phòng chiếu cho Admin.
/// </summary>
public record RoomResponse(
    [property: JsonPropertyName("id")] int RoomId,
    string Name,
    int? TotalSeats,
    string Status
);

/// <summary>
/// DTO phân trang danh sách phòng.
/// </summary>
public record RoomPagedResponse(
    List<RoomResponse> Items,
    int TotalCount,
    int PageNumber,
    int PageSize,
    int TotalPages
);

/// <summary>
/// DTO dùng để tạo hoặc cập nhật phòng chiếu.
/// </summary>
public record CreateRoomRequest(
    [Required][MaxLength(50)] string Name,
    string Status = "active"
);

// ─── SeatType DTOs ──────────────────────────────────────────────────────────

/// <summary>
/// DTO trả về thông tin loại ghế.
/// </summary>
public record SeatTypeResponse(
    int SeatTypeId,
    string Name,
    decimal Surcharge
);

// ─── Seat DTOs ──────────────────────────────────────────────────────────────

/// <summary>
/// DTO trả về thông tin ghế, bao gồm loại ghế (SeatType).
/// </summary>
public record SeatResponse(
    int SeatId,
    int RoomId,
    string RowName,
    int SeatNumber,
    SeatTypeResponse SeatType
);

/// <summary>
/// Một item trong danh sách cập nhật hàng loạt.
/// </summary>
public record SeatUpdateItem(
    int SeatId,
    int SeatTypeId
);

/// <summary>
/// DTO nhận yêu cầu cập nhật sơ đồ ghế hàng loạt từ Admin.
/// </summary>
public record UpdateSeatMapRequest(
    List<SeatUpdateItem> Seats
);

/// <summary>
/// DTO nhận yêu cầu khởi tạo sơ đồ ghế trống mới tinh.
/// </summary>
public record GenerateSeatMapRequest(
    [Range(1, 26, ErrorMessage = "Số hàng phải từ 1 đến 26 (A-Z)")] int Rows,
    [Range(1, 100, ErrorMessage = "Số cột phải từ 1 đến 100")] int Columns
);
