using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using WebPhimApi.Data;
using WebPhimApi.Entities;
using WebPhimApi.Services;
using Xunit;

namespace WebPhimApi.Tests;

public class MovieServiceTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        // Sử dụng Entity Framework Core In-Memory để giả lập Database
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnAllMovies()
    {
        // 1. Arrange (Chuẩn bị dữ liệu mô phỏng)
        var db = GetInMemoryDbContext();
        
        // Tạo sẵn 2 bộ phim trong Database ảo
        db.Movies.AddRange(
            new Movie { MovieId = 1, Title = "Movie 1", Status = MovieStatus.showing },
            new Movie { MovieId = 2, Title = "Movie 2", Status = MovieStatus.coming }
        );
        await db.SaveChangesAsync();

        var service = new MovieService(db);

        // 2. Act (Thực thi hành động cần test)
        var result = await service.GetAllAsync();

        // 3. Assert (Kiểm tra kết quả đúng như kỳ vọng bằng FluentAssertions)
        // Kết quả không được null
        result.Should().NotBeNull();
        // Hệ thống phải trả về chính xác 2 phim
        result.Should().HaveCount(2);
        // Có chứa bộ phim với tên tương ứng
        result.Should().Contain(m => m.Title == "Movie 1");
        result.Should().Contain(m => m.Title == "Movie 2");
    }

    [Fact]
    public async Task GetByIdAsync_WhenMovieExists_ShouldReturnMovie()
    {
        // 1. Arrange (Chuẩn bị dữ liệu mô phỏng)
        var db = GetInMemoryDbContext();
        var expectedMovie = new Movie { 
            MovieId = 1, 
            Title = "Movie 1", 
            Status = MovieStatus.showing 
        };
        db.Movies.Add(expectedMovie);
        await db.SaveChangesAsync();

        // (Ví dụ) Nếu service của bạn cần gọi một service khác, bạn sẽ dùng Moq như sau:
        // var mockOtherService = new Mock<IOtherService>();
        // mockOtherService.Setup(x => x.DoSomething()).Returns(true);
        // var service = new MovieService(db, mockOtherService.Object);
        
        var service = new MovieService(db);

        // 2. Act (Thực thi)
        var result = await service.GetByIdAsync(1);

        // 3. Assert (Kiểm tra)
        result.Should().NotBeNull();
        result!.Title.Should().Be("Movie 1");
        result.Status.Should().Be(MovieStatus.showing);
    }
}
