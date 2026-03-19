using Microsoft.EntityFrameworkCore;
using WebPhimApi.Data;
using WebPhimApi.DTOs;
using WebPhimApi.Entities;

namespace WebPhimApi.Services;

public class MovieService(AppDbContext db)
{
    public async Task<List<MovieResponse>> GetAllAsync() =>
        await db.Movies.Select(m => ToResponse(m)).ToListAsync();

    public async Task<List<MovieResponse>> GetByStatusAsync(string status) =>
        Enum.TryParse<MovieStatus>(status, out var s)
            ? await db.Movies.Where(m => m.Status == s).Select(m => ToResponse(m)).ToListAsync()
            : [];

    public async Task<MovieResponse?> GetByIdAsync(int id)
    {
        var movie = await db.Movies.FindAsync(id);
        return movie is null ? null : ToResponse(movie);
    }

    public async Task<MovieResponse> CreateAsync(CreateMovieRequest request)
    {
        var movie = new Movie
        {
            Title = request.Title,
            Description = request.Description,
            Duration = request.Duration,
            Poster = request.Poster,
            Banner = request.Banner,
            Genre = request.Genre,
            ReleaseDate = request.ReleaseDate,
            Director = request.Director,
            CastMembers = request.CastMembers,
            AgeRating = request.AgeRating,
            Status = Enum.Parse<MovieStatus>(request.Status)
        };

        db.Movies.Add(movie);
        await db.SaveChangesAsync();
        return ToResponse(movie);
    }

    public async Task<MovieResponse?> UpdateAsync(int id, CreateMovieRequest request)
    {
        var movie = await db.Movies.FindAsync(id);
        if (movie is null) return null;

        movie.Title = request.Title;
        movie.Description = request.Description;
        movie.Duration = request.Duration;
        movie.Poster = request.Poster;
        movie.Banner = request.Banner;
        movie.Genre = request.Genre;
        movie.ReleaseDate = request.ReleaseDate;
        movie.Director = request.Director;
        movie.CastMembers = request.CastMembers;
        movie.AgeRating = request.AgeRating;
        movie.Status = Enum.Parse<MovieStatus>(request.Status);

        await db.SaveChangesAsync();
        return ToResponse(movie);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var movie = await db.Movies.FindAsync(id);
        if (movie is null) return false;
        db.Movies.Remove(movie);
        await db.SaveChangesAsync();
        return true;
    }

    private static MovieResponse ToResponse(Movie m) => new(
        m.MovieId, m.Title, m.Description, m.Duration,
        m.Poster, m.Banner, m.Genre, m.ReleaseDate,
        m.Director, m.CastMembers, m.AgeRating, m.Rating, m.Status.ToString()
    );
}
