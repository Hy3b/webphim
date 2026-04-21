using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using WebPhimApi.Configuration;
using WebPhimApi.Data;
using WebPhimApi.DTOs;
using WebPhimApi.Entities;
using WebPhimApi.Services;

namespace DotnetBackend.Tests;

public class AuthServiceTests : IDisposable
{
    private readonly AppDbContext _dbContext;
    private readonly JwtService _jwtService;
    private readonly AuthService _authService;

    public AuthServiceTests()
    {
        // Khởi tạo In-Memory Database thay vì trỏ vào DB thật (MySQL) để tests chạy độc lập, cực nhanh và không làm ảnh hưởng DB thật
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _dbContext = new AppDbContext(options);

        // Khởi tạo JWT config giả lập dùng riêng cho unit test
        var jwtSettings = new JwtSettings
        {
            Secret = "SuperSecretKeyForTestingTesting123!",
            Issuer = "TestIssuer",
            Audience = "TestAudience",
            ExpirationDays = 1
        };
        _jwtService = new JwtService(jwtSettings);

        // Inject các dependencies giả lập vào AuthService
        _authService = new AuthService(_dbContext, _jwtService);
    }

    // Đảm bảo dọn dẹp data bộ nhớ đệm sau mỗi test, tránh dữ liệu từ test này lan sang test kia (Test Isolation)
    public void Dispose()
    {
        _dbContext.Database.EnsureDeleted();
        _dbContext.Dispose();
    }

    [Fact]
    // Naming convention: TênMethod_TìnhHuống_KếtQuảSẽNhậnĐược
    public async Task LoginAsync_ValidCredentials_ReturnsTokenAndNullError()
    {
        // 1. Arrange: Chuẩn bị một tài khoản có sẵn trong Database với mật khẩu đã cấp mã băm (BCrypt)
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("validPassword123");
        var user = new User
        {
            UserId = 1,
            Username = "testuser",
            Email = "test@example.com",
            PasswordHash = passwordHash,
            Role = UserRole.customer
        };
        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        var request = new LoginRequest("test@example.com", "validPassword123");

        // 2. Act: Thực thi việc đăng nhập vào hàm LoginAsync
        var result = await _authService.LoginAsync(request);

        // 3. Assert: Việc xác nhận (Verify)
        // - Lỗi phải = null
        // - Thông tin token trả về không được rỗng và có giá trị AccessToken
        result.error.Should().BeNull();
        result.token.Should().NotBeNull();
        result.token!.AccessToken.Should().NotBeEmpty();
    }

    [Fact]
    public async Task LoginAsync_InvalidEmail_ReturnsError()
    {
        // Arrange: Email không hề tồn tại trong In-Memory Database
        var request = new LoginRequest("notfound@example.com", "anyPassword");

        // Act
        var result = await _authService.LoginAsync(request);

        // Assert: Không cấp Token, báo lỗi "Email hoặc mật khẩu không đúng" để tránh lộ thông tin (No user enumeration)
        result.token.Should().BeNull();
        result.error.Should().Be("Email hoặc mật khẩu không đúng");
    }

    [Fact]
    public async Task LoginAsync_InvalidPassword_ReturnsError()
    {
        // Arrange: Data hợp lệ nhưng lúc ACT sẽ cung cấp mật khẩu sai (khác Hash)
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("validPassword123");
        var user = new User
        {
            UserId = 2,
            Username = "wrongpassuser",
            Email = "wrong@example.com",
            PasswordHash = passwordHash,
            Role = UserRole.customer
        };
        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        // Mật khẩu gửi lên là incorrectPassword, hàm kiểm BCrypt.Verify() sẽ bắt ra
        var request = new LoginRequest("wrong@example.com", "incorrectPassword");

        // Act
        var result = await _authService.LoginAsync(request);

        // Assert: Không thể cấp Token do mật khẩu sai lầm
        result.token.Should().BeNull();
        result.error.Should().Be("Email hoặc mật khẩu không đúng");
    }

    [Theory]
    // Dùng [Theory] thay cho [Fact] để truyền tham số, cho phép kiểm thử 3 kịch bản liên tiếp chỉ trong 1 hàm
    [InlineData(UserRole.customer)]
    [InlineData(UserRole.admin)]
    [InlineData(UserRole.staff)]
    public async Task LoginAsync_TokenShouldContainCorrectRole(UserRole testRole)
    {
        // Arrange: Lần lượt tạo thử User ở cả 3 Role (khách, quản lý, nhân viên)
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("password");
        var user = new User
        {
            UserId = 3,
            Username = $"roleuser_{testRole}",
            Email = $"{testRole}@example.com",
            PasswordHash = passwordHash,
            Role = testRole
        };
        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        var request = new LoginRequest($"{testRole}@example.com", "password");

        // Act
        var result = await _authService.LoginAsync(request);

        // Assert: Dùng thư viện JwtSecurityTokenHandler bóc token ra và check Payload Claims xem Role có bị nhét sai không
        result.error.Should().BeNull();
        
        var tokenHandler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var jwtToken = tokenHandler.ReadJwtToken(result.token!.AccessToken);
        
        // Cần đảm bảo Role được gán trực tiếp vào Request Token
        var roleClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role);
        roleClaim.Should().NotBeNull();
        roleClaim!.Value.Should().Be(testRole.ToString());
    }

    [Fact]
    public async Task RegisterAsync_NewUser_ReturnsToken_AndSavesToDb()
    {
        // Arrange: Người dùng bấm Đăng Ký, submit các thông tin
        var request = new RegisterRequest(
            "newuser", 
            "new@example.com", 
            "strongPassword123",
            "New User",
            "0123456789"
        );

        // Act
        var result = await _authService.RegisterAsync(request);

        // Assert a. Response token
        result.error.Should().BeNull();
        result.token.Should().NotBeNull();

        // Assert b. Kiểm tra thực địa việc lưu xuống Database (Side-effect check)
        var dbUser = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        dbUser.Should().NotBeNull();
        dbUser!.Username.Should().Be("newuser");
        
        // Mật khẩu phải được Hash, không được lưu mộc (Plain-text)
        BCrypt.Net.BCrypt.Verify(request.Password, dbUser.PasswordHash).Should().BeTrue("Mật khẩu phải được mã hoá BCrypt an toàn");
        
        // Hệ thống phân loại Role tự động phải là Customer mặc định để tránh hacker chèn cờ leo thang quyền Admin
        dbUser.Role.Should().Be(UserRole.customer, "Mặc định user mới đăng ký phải là customer");
    }

    [Fact]
    public async Task RegisterAsync_ExistingEmail_ReturnsError()
    {
        // Arrange: Một user khác đã đăng nhập bằng Email này
        var existingUser = new User
        {
            UserId = 10,
            Username = "existing",
            Email = "exist@example.com",
            PasswordHash = "hashed",
            Role = UserRole.customer
        };
        _dbContext.Users.Add(existingUser);
        await _dbContext.SaveChangesAsync();

        // Kẻ thứ hai cố đổi Username nhưng dùng cùng 1 Email đó
        var request = new RegisterRequest(
            "different_user", 
            "exist@example.com", 
            "pw",
            "AnyName",
            null
        );

        // Act
        var result = await _authService.RegisterAsync(request);

        // Assert: Chặn đứng quá trình này
        result.token.Should().BeNull();
        result.error.Should().Be("Email đã được sử dụng");
    }
}
