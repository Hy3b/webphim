using System.Text.Json.Serialization;

namespace WebPhimApi.DTOs;

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

public record SeatStatusResponse(
    [property: JsonPropertyName("id")] int SeatId,
    string RowName,
    int SeatNumber,
    string Status,          // AVAILABLE | LOCKED | SOLD
    string SeatTypeName,
    decimal Price
);
