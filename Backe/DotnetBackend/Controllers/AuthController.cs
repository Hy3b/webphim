using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebPhimApi.DTOs;
using WebPhimApi.Services;

namespace WebPhimApi.Controllers;

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
            Secure = false,  // true trên production HTTPS
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });

        return Ok(token);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (token, error) = await authService.RegisterAsync(request);
        if (error is not null) return BadRequest(new { message = error });

        Response.Cookies.Append("jwt", token!.AccessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = false,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });

        return Ok(token);
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

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Append("jwt", "", new CookieOptions
        {
            HttpOnly = true,
            Secure = false,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(-1)
        });
        return Ok(new { message = "Đăng xuất thành công" });
    }
}
