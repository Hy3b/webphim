using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebPhimApi.DTOs;
using WebPhimApi.Services;

namespace WebPhimApi.Controllers;

public record VerifyEmailRequest(string Token);
public record ResendActivationRequest(string Email);

[ApiController]
[Route("api/auth")]
public class AuthController(AuthService authService) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (token, error) = await authService.LoginAsync(request);
        if (error is not null) return Unauthorized(new { message = error });

        // Set HttpOnly cookie (tương đương Spring ResponseCookie)
        Response.Cookies.Append("jwt", token!.AccessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,  // Bắt buộc = true để sử dụng SameSite = None qua chuẩn HTTPS của tunnel
            SameSite = SameSiteMode.None, // Quan trọng: Cho phép gửi cookie chéo domain (Localhost -> Cloudflare)
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });

        return Ok(token);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (token, message, error) = await authService.RegisterAsync(request);
        if (error is not null) return BadRequest(new { message = error });

        return Ok(new { message = message });
    }

    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        if (string.IsNullOrEmpty(request.Token)) return BadRequest(new { message = "Token không hợp lệ" });

        var (token, error) = await authService.VerifyEmailAsync(request.Token);
        if (error is not null) return BadRequest(new { message = error });

        Response.Cookies.Append("jwt", token!.AccessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });

        return Ok(token);
    }

    [HttpPost("resend-activation")]
    public async Task<IActionResult> ResendActivation([FromBody] ResendActivationRequest request)
    {
        if (string.IsNullOrEmpty(request.Email)) return BadRequest(new { message = "Email không hợp lệ" });

        var (success, error) = await authService.ResendActivationEmailAsync(request.Email);
        if (!success) return BadRequest(new { message = error });

        return Ok(new { message = "Email kích hoạt đã được gửi lại. Vui lòng kiểm tra hòm thư." });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMe()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var user = await authService.GetMeAsync(userId);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpPut("update-profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var (success, error) = await authService.UpdateProfileAsync(userId, request);
        if (!success) return BadRequest(new { message = error });

        return Ok(new { message = "Cập nhật thông tin thành công" });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Append("jwt", "", new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Expires = DateTimeOffset.UtcNow.AddDays(-1)
        });
        return Ok(new { message = "Đăng xuất thành công" });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (success, error) = await authService.SendForgotPasswordEmailAsync(request.Email);
        if (!success) return BadRequest(new { message = error });

        return Ok(new { message = "Liên kết đặt lại mật khẩu đã được gửi đến email của bạn." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (success, error) = await authService.ResetPasswordWithTokenAsync(request.Token, request.NewPassword);
        if (!success) return BadRequest(new { message = error });

        return Ok(new { message = "Mật khẩu của bạn đã được thay đổi thành công." });
    }
}
