using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using Resend;
using WebPhimApi.Configuration;
using WebPhimApi.Data;
using WebPhimApi.DTOs;
using WebPhimApi.Entities;

namespace WebPhimApi.Services;

public class AuthService(AppDbContext db, JwtService jwtService, IConnectionMultiplexer redis, IResend resend, IConfiguration configuration)
{
    private string FrontendUrl => configuration["App:FrontendUrl"] ?? "http://localhost:5173";
    private string EmailFrom => Environment.GetEnvironmentVariable("EMAIL") ?? "MYCINEMA <no-reply@webphim.dxhiep.id.vn>";

    public virtual async Task<(AuthResponse? token, string? error)> LoginAsync(LoginRequest request)
    {
        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email || u.Username == request.Email);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return (null, "Email hoặc mật khẩu không đúng");

        if (!user.IsActive)
            return (null, "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email.");

        var token = jwtService.GenerateToken(user);
        return (new AuthResponse(token), null);
    }

    public virtual async Task<(AuthResponse? token, string? message, string? error)> RegisterAsync(RegisterRequest request)
    {
        if (await db.Users.AnyAsync(u => u.Username == request.Username))
            return (null, null, "Username đã tồn tại");

        if (await db.Users.AnyAsync(u => u.Email == request.Email))
            return (null, null, "Email đã được sử dụng");

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName,
            PhoneNumber = request.PhoneNumber,
            Role = UserRole.customer,
            CreatedAt = DateTime.UtcNow,
            IsActive = false
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        // Tạo token kích hoạt
        var activationToken = Guid.NewGuid().ToString("N");
        var cache = redis.GetDatabase();
        await cache.StringSetAsync($"activation_token:{activationToken}", user.UserId.ToString(), TimeSpan.FromDays(1));

        // Gửi email qua Resend
        var message = new EmailMessage();
        message.From = EmailFrom;
        message.To.Add(user.Email);
        message.Subject = "Xác nhận kích hoạt tài khoản WebPhim";
        message.HtmlBody = $"<p>Chào {user.FullName ?? user.Username},</p><p>Vui lòng click vào link sau để kích hoạt tài khoản: <a href='{FrontendUrl}/verify-email?token={activationToken}'>Kích hoạt ngay</a></p>";
        
        try 
        {
            await resend.EmailSendAsync(message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Resend Error] Đăng ký - Gửi email thất bại: {ex.ToString()}");
        }

        return (null, "Đăng ký thành công, vui lòng kiểm tra email để kích hoạt tài khoản", null);
    }

    public virtual async Task<(AuthResponse? token, string? error)> VerifyEmailAsync(string token)
    {
        var cache = redis.GetDatabase();
        var userIdStr = await cache.StringGetAsync($"activation_token:{token}");
        if (!userIdStr.HasValue)
            return (null, "Token không hợp lệ hoặc đã hết hạn");

        if (!int.TryParse(userIdStr.ToString(), out var userId))
            return (null, "Dữ liệu token lỗi");

        var user = await db.Users.FindAsync(userId);
        if (user == null)
            return (null, "Người dùng không tồn tại");

        user.IsActive = true;
        await db.SaveChangesAsync();

        await cache.KeyDeleteAsync($"activation_token:{token}");

        var jwt = jwtService.GenerateToken(user);
        return (new AuthResponse(jwt), null);
    }

    public virtual async Task<(bool success, string? error)> ResendActivationEmailAsync(string email)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
            return (false, "Email không tồn tại");

        if (user.IsActive)
            return (false, "Tài khoản này đã được kích hoạt");

        // Tạo token kích hoạt mới đè lên cái cũ
        var activationToken = Guid.NewGuid().ToString("N");
        var cache = redis.GetDatabase();
        await cache.StringSetAsync($"activation_token:{activationToken}", user.UserId.ToString(), TimeSpan.FromDays(1));

        // Gửi email qua Resend
        var message = new EmailMessage();
        message.From = EmailFrom;
        message.To.Add(user.Email);
        message.Subject = "Gửi lại: Xác nhận kích hoạt tài khoản WebPhim";
        message.HtmlBody = $"<p>Chào {user.FullName ?? user.Username},</p><p>Bạn đã yêu cầu gửi lại email kích hoạt. Vui lòng click vào link sau: <a href='{FrontendUrl}/verify-email?token={activationToken}'>Kích hoạt ngay</a></p>";
        
        try 
        {
            await resend.EmailSendAsync(message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Resend Error] Gửi lại - Gửi email thất bại: {ex.ToString()}");
        }

        return (true, null);
    }

    public virtual async Task<UserInfoResponse?> GetMeAsync(int userId)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null) return null;

        return new UserInfoResponse(
            user.UserId, user.Username, user.Email,
            user.FullName, user.PhoneNumber, user.Role.ToString(),
            user.Points, user.AvatarUrl
        );
    }

    public virtual async Task<(bool success, string? error)> UpdateProfileAsync(int userId, UpdateProfileRequest request)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null) return (false, "Người dùng không tồn tại");

        user.FullName = request.FullName;
        user.PhoneNumber = request.PhoneNumber;
        user.AvatarUrl = Helpers.UrlHelper.MakeRelativePath(request.AvatarUrl);

        await db.SaveChangesAsync();
        return (true, null);
    }

    public virtual async Task<(bool success, string? error)> SendForgotPasswordEmailAsync(string email)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
            return (false, "Email không tồn tại trong hệ thống");

        var resetToken = Guid.NewGuid().ToString("N");
        var cache = redis.GetDatabase();
        // Lưu token với TTL 15 phút (900 giây)
        await cache.StringSetAsync($"reset_password_token:{resetToken}", user.UserId.ToString(), TimeSpan.FromMinutes(15));

        // Gửi email qua Resend
        var message = new EmailMessage();
        message.From = EmailFrom;
        message.To.Add(user.Email);
        message.Subject = "Đặt lại mật khẩu tài khoản WebPhim";
        message.HtmlBody = $"<p>Chào {user.FullName ?? user.Username},</p><p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng click vào link sau để đặt lại mật khẩu mới (Liên kết có hiệu lực trong 15 phút): <a href='{FrontendUrl}/reset-password?token={resetToken}'>Đặt lại mật khẩu ngay</a></p>";

        try
        {
            await resend.EmailSendAsync(message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Resend Error] Quên mật khẩu - Gửi email thất bại: {ex.ToString()}");
            return (false, "Không thể gửi email lúc này. Vui lòng thử lại sau.");
        }

        return (true, null);
    }

    public virtual async Task<(bool success, string? error)> ResetPasswordWithTokenAsync(string token, string newPassword)
    {
        var cache = redis.GetDatabase();
        var userIdStr = await cache.StringGetAsync($"reset_password_token:{token}");
        if (!userIdStr.HasValue)
            return (false, "Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ");

        if (!int.TryParse(userIdStr.ToString(), out var userId))
            return (false, "Dữ liệu token không hợp lệ");

        var user = await db.Users.FindAsync(userId);
        if (user == null)
            return (false, "Người dùng không tồn tại");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        await db.SaveChangesAsync();

        // Xóa token sau khi đổi thành công
        await cache.KeyDeleteAsync($"reset_password_token:{token}");

        return (true, null);
    }
}
