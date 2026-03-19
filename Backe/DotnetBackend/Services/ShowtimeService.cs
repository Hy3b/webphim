using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using WebPhimApi.Data;
using WebPhimApi.DTOs;

namespace WebPhimApi.Services;

public class ShowtimeService(AppDbContext db, IConnectionMultiplexer redis)
{
    private IDatabase Cache => redis.GetDatabase();

    public async Task<List<ShowtimeDetailResponse>> GetAllAsync() =>
        await db.Showtimes
            .Include(s => s.Movie)
            .Include(s => s.Room)
            .Select(s => ToResponse(s))
            .ToListAsync();

    public async Task<List<ShowtimeDetailResponse>> GetByMovieAsync(int movieId) =>
        await db.Showtimes
            .Include(s => s.Movie)
            .Include(s => s.Room)
            .Where(s => s.MovieId == movieId)
            .Select(s => ToResponse(s))
            .ToListAsync();

    public async Task<ShowtimeDetailResponse?> GetDetailAsync(int showtimeId)
    {
        var s = await db.Showtimes
            .Include(s => s.Movie)
            .Include(s => s.Room)
            .FirstOrDefaultAsync(s => s.ShowtimeId == showtimeId);

        return s is null ? null : ToResponse(s);
    }

    public async Task<List<SeatStatusResponse>> GetSeatStatusesAsync(int showtimeId)
    {
        var showtime = await db.Showtimes
            .Include(s => s.Room)
            .FirstOrDefaultAsync(s => s.ShowtimeId == showtimeId)
            ?? throw new KeyNotFoundException($"Showtime {showtimeId} không tồn tại");

        var seats = await db.Seats
            .Include(s => s.SeatType)
            .Where(s => s.RoomId == showtime.Room.RoomId)
            .ToListAsync();

        var redisHashKey = $"showtime:{showtimeId}:seats";
        var responses = new List<SeatStatusResponse>();

        foreach (var seat in seats)
        {
            var seatKey = $"{seat.RowName}{seat.SeatNumber}";
            var redisStatus = await Cache.HashGetAsync(redisHashKey, seatKey);
            var status = redisStatus.HasValue ? redisStatus.ToString() : "AVAILABLE";

            var price = showtime.BasePrice + seat.SeatType.Surcharge;
            responses.Add(new SeatStatusResponse(
                seat.SeatId, seat.RowName, seat.SeatNumber,
                status, seat.SeatType.Name, price
            ));
        }

        return responses;
    }

    private static ShowtimeDetailResponse ToResponse(Entities.Showtime s) => new(
        s.ShowtimeId, s.MovieId, s.Movie.Title,
        s.Movie.Poster, s.Room.Name, s.StartTime,
        s.BasePrice, s.Movie.Duration, s.Movie.Genre, s.Movie.AgeRating
    );
}
